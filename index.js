/* global Bare */
const Heap = require('tiny-binary-heap')
const binding = require('./binding')

class Timer {
  constructor(list, expiry, repeat, fn, args) {
    this._list = list
    this._sync = ticks
    this._expiry = expiry
    this._repeat = repeat
    this._fn = fn
    this._args = args
    this._prev = this
    this._next = this
    this._refed = true

    incRef()
  }

  get active() {
    return (
      this._prev !== this._next ||
      (this._list !== null && this._list.tail === this)
    )
  }

  _run(now) {
    if (this._repeat === true) {
      this._expiry = now + this._list.ms
      this._list.push(this)
    } else {
      if (this._refed === true) decRef()
      this._list = null
    }
    // apply at the bottom to avoid re-entries...
    this._fn.apply(null, this._args)
  }

  _clear() {
    if (this._list === null) return
    this._list.clear(this)
    if (this._refed === true) decRef()
    this._list = null

    maybeUpdateTimer()
  }

  refresh() {
    if (this._list === null) return this
    this._list.clear(this)
    this._expiry = Date.now() + this._list.ms
    this._list.push(this)

    maybeUpdateTimer()
    return this
  }

  hasRef() {
    return this._refed
  }

  unref() {
    if (this._refed === false || this._list === null) return this
    this._refed = false
    decRef()
    return this
  }

  ref() {
    if (this._refed === true || this._list === null) return this
    this._refed = true
    incRef()
    return this
  }
}

class TimerList {
  constructor(ms) {
    this.ms = ms
    this.tail = null
    this.expiry = 0
  }

  queue(repeat, now, fn, args) {
    const expiry = now + this.ms
    const timer = new Timer(this, expiry, repeat, fn, args)
    return this.push(timer)
  }

  updateExpiry() {
    if (this.tail !== null) this.expiry = this.tail._expiry
  }

  push(timer) {
    if (this.tail === null) {
      this.tail = timer
      return timer
    }

    const head = this.tail._prev

    head._next = timer
    timer._prev = head

    timer._next = this.tail
    this.tail._prev = timer

    return timer
  }

  shift() {
    const tail = this.tail
    if (tail !== null) this.clear(tail)
    return tail
  }

  clear(timer) {
    const prev = timer._prev
    const next = timer._next

    timer._prev = timer._next = timer

    prev._next = next
    next._prev = prev

    if (timer === this.tail) {
      this.tail = next === timer ? null : next
    }
  }
}

const timers = new Map()
const queue = new Heap(cmp)
const immediates = new TimerList(0)

const handle = binding.init(ontimer, onimmediate)

Bare.on('idle', pause).on('resume', resume)

let refs = 0
let garbage = 0
let nextExpiry = 0
let ticks = 1
let triggered = 0
let paused = false

function pause() {
  if (paused) return
  binding.pause(handle)
  paused = true
}

function resume() {
  if (!paused) return
  binding.resume(handle, Math.max(nextExpiry - Date.now(), 0), refs)
  paused = false
}

function incRef() {
  if (refs++ === 0) binding.ref(handle)
}

function decRef() {
  if (--refs === 0) binding.unref(handle)
}

function tick() {
  // just a wrapping number between 0-255 for checking re-entry and if we need
  // to wakeup the timer in c
  return (ticks = (ticks + 1) & 0xff)
}

function cancelTimer() {
  if (paused || ticks === triggered) return
  binding.stop(handle)
}

function updateTimer(ms) {
  if (paused || ticks === triggered) return
  binding.start(handle, ms)
}

function ontimer() {
  const now = Date.now()

  if (now < nextExpiry) return nextExpiry - now

  let next
  let uncaughtError = null

  triggered = tick()

  while (
    (next = queue.peek()) !== undefined &&
    next.expiry <= now &&
    uncaughtError === null
  ) {
    let ran = false

    // check if the next is expiring AND that it was not added immediately (ie setImmediate loop)
    while (next.tail !== null && next.tail._expiry <= now) {
      ran = true

      try {
        next.shift()._run(now)
      } catch (err) {
        uncaughtError = err
        break
      }
    }

    if (next.tail === null) {
      if (ran === false) garbage--
      deleteTimerList(next)
      queue.shift()
      next = undefined
    } else {
      next.updateExpiry()
      queue.update()
    }
  }

  tick()

  if (garbage >= 8 && 2 * garbage >= queue.length) {
    // reset the heap if too much garbage exists...
    queue.filter(alive)
    garbage = 0
  }

  let nextDelay

  if (next !== undefined) {
    nextDelay = Math.max(next.expiry - now, 0)
    nextExpiry = next.expiry
  } else {
    nextDelay = -1
    nextExpiry = 0
  }

  if (uncaughtError !== null) {
    nextExpiry = now
    throw uncaughtError
  }

  return nextDelay
}

function onimmediate() {
  const now = Date.now()
  const timerRunning = queue.length > 0

  let uncaughtError = null

  triggered = tick()

  while (
    immediates.tail !== null &&
    immediates.tail._sync !== ticks &&
    uncaughtError === null
  ) {
    try {
      immediates.shift()._run(now)
    } catch (err) {
      uncaughtError = err
      break
    }
  }

  tick()

  // some reentry wants the timers to start but they are not, lets start them
  if (!timerRunning && queue.length > 0) {
    const l = queue.peek()
    nextExpiry = l.expiry
    updateTimer(l.ms)
  }

  if (uncaughtError !== null) {
    throw uncaughtError
  }
}

function maybeUpdateTimer() {
  if (ticks === triggered) return

  let updated = false

  while (queue.length > 0) {
    const first = queue.peek()

    if (first.tail === null) {
      updated = true
      queue.shift()
      garbage--
      deleteTimerList(first)
      continue
    }

    if (first.expiry !== first.tail._expiry) {
      updated = true
      first.updateExpiry()
      queue.update()
      continue
    }

    break
  }

  if (updated === false) return

  if (queue.length === 0) {
    nextExpiry = 0
    cancelTimer()
    return
  }

  const exp = queue.peek().expiry
  if (exp !== nextExpiry) {
    nextExpiry = exp
  }
}

function deleteTimerList(list) {
  list.expiry = 0
  timers.delete(list.ms)
}

function queueTimer(ms, repeat, fn, args) {
  if (typeof fn !== 'function')
    throw typeError('Callback must be a function', 'ERR_INVALID_CALLBACK')

  if (ms < 1 || ms > Number.MAX_SAFE_INTEGER || Number.isNaN(ms)) ms = 1

  const now = Date.now()

  let l = timers.get(ms)

  if (l) {
    if (l.tail === null) garbage--
    return l.queue(repeat, now, fn, args)
  }

  l = new TimerList(ms)
  timers.set(ms, l)

  const timer = l.queue(repeat, now, fn, args)

  l.updateExpiry()
  queue.push(l)

  if (l.expiry < nextExpiry || nextExpiry === 0) {
    nextExpiry = l.expiry
    updateTimer(l.ms)
  }

  return timer
}

function clearTimer(timer) {
  const list = timer._list
  timer._clear()
  if (list.tail !== null || list.expiry === 0) return // anything with expiry 0, is not referenced...
  garbage++
}

exports.setTimeout = function setTimeout(fn, ms, ...args) {
  return queueTimer(Math.floor(ms), false, fn, [...args])
}

exports.clearTimeout = function clearTimeout(timer) {
  if (timer && timer._list !== null) clearTimer(timer)
}

exports.setInterval = function setInterval(fn, ms, ...args) {
  return queueTimer(Math.floor(ms), true, fn, [...args])
}

exports.clearInterval = function clearInterval(timer) {
  if (timer && timer._list !== null) clearTimer(timer)
}

exports.setImmediate = function setImmediate(fn, ...args) {
  if (typeof fn !== 'function')
    throw typeError('Callback must be a function', 'ERR_INVALID_CALLBACK')

  binding.immediate(handle)

  return immediates.queue(false, Date.now(), fn, args)
}

exports.clearImmediate = function clearImmediate(timer) {
  if (timer && timer._list !== null) clearTimer(timer)
}

function cmp(a, b) {
  const diff = a.expiry - b.expiry
  return diff === 0 ? a.ms - b.ms : diff
}

function alive(list) {
  if (list.tail === null) {
    deleteTimerList(list)
    return false
  }
  return true
}

function typeError(message, code) {
  const error = new TypeError(message)
  error.code = code
  return error
}
