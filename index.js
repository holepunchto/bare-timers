const Heap = require('tiny-binary-heap')
const FIFO = require('fast-fifo')
const binding = require('./binding')

const ACTIVE = 0x1
const CLEARED = 0x2
const REFED = 0x4
const REPEAT = 0x8

class Task {
  constructor(scheduler, callback, args) {
    this._state = ACTIVE | REFED
    this._scheduler = scheduler
    this._callback = callback
    this._args = args
  }

  ref() {
    this._scheduler._ref(this)
    return this
  }

  unref() {
    this._scheduler._unref(this)
    return this
  }

  hasRef() {
    return (this._state & REFED) !== 0
  }

  [Symbol.dispose]() {
    this._scheduler._clear(this)
  }
}

class Timeout extends Task {
  constructor(scheduler, delay, expiry, repeat, callback, args) {
    super(scheduler, callback, args)

    this._delay = delay
    this._expiry = expiry

    if (repeat) this._state |= REPEAT
  }

  refresh() {
    this._scheduler._refresh(this)
    return this
  }

  static _compare(a, b) {
    return a._expiry < b._expiry ? -1 : a._expiry > b._expiry ? 1 : 0
  }
}

class Immediate extends Task {}

class Scheduler {
  constructor() {
    this._refs = 0
    this._timeouts = new Heap(Timeout._compare)
    this._immediates = new FIFO()

    this._handle = binding.init(this, this._ontimeout, this._onimmediate)
  }

  _acquire() {
    if (this._refs++ === 0) binding.ref(this._handle)
  }

  _release() {
    if (--this._refs === 0) binding.unref(this._handle)
  }

  _timeout(delay, repeat, callback, args = []) {
    delay = Math.floor(delay)

    if (delay < 1 || delay > Number.MAX_SAFE_INTEGER || Number.isNaN(delay)) {
      delay = 1
    }

    const now = Date.now()

    const timeout = new Timeout(
      this,
      delay,
      now + delay,
      repeat,
      callback,
      args
    )

    this._acquire()

    const next = this._timeouts.peek()

    if (next === undefined || next._expiry > timeout._expiry) {
      binding.timeout(this._handle, Math.max(0, timeout._expiry - now))
    }

    this._timeouts.push(timeout)

    return timeout
  }

  _refresh(timeout) {
    timeout._expiry = Date.now() + timeout._delay

    if ((timeout._state & ACTIVE) !== 0) {
      if ((timeout._state & CLEARED) !== 0) {
        timeout._state &= ~CLEARED

        if ((timeout._state & REFED) !== 0) this._acquire()
      }

      this._timeouts.update()
    } else {
      timeout._state |= ACTIVE

      if ((timeout._state & REFED) !== 0) this._acquire()

      this._timeouts.push(timeout)
    }
  }

  _immediate(callback, args = []) {
    const immediate = new Immediate(this, callback, args)

    this._acquire()

    if (this._immediates.length === 0) binding.immediate(this._handle)

    this._immediates.push(immediate)

    return immediate
  }

  _clear(task) {
    if ((task._state & CLEARED) !== 0 || (task._state & ACTIVE) === 0) {
      return
    }

    task._state |= CLEARED

    if ((task._state & REFED) !== 0) this._release()
  }

  _ref(task) {
    if ((task._state & REFED) !== 0 || (task._state & ACTIVE) === 0) {
      return
    }

    task._state |= REFED

    this._acquire()
  }

  _unref(task) {
    if ((task._state & REFED) === 0 || (task._state & ACTIVE) === 0) {
      return
    }

    task._state &= ~REFED

    this._release()
  }

  _ontimeout() {
    let caught = false
    let err = null

    while (this._timeouts.length > 0) {
      const now = Date.now()

      const timeout = this._timeouts.peek()

      if ((timeout._state & CLEARED) !== 0) {
        timeout._state &= ~ACTIVE & ~CLEARED

        this._timeouts.shift()

        continue
      }

      if (caught || timeout._expiry > now) {
        binding.timeout(this._handle, Math.max(0, timeout._expiry - now))

        break
      }

      if ((timeout._state & REPEAT) !== 0) {
        timeout._expiry = now + timeout._delay

        this._timeouts.update()
      } else {
        timeout._state &= ~ACTIVE

        if ((timeout._state & REFED) !== 0) this._release()

        this._timeouts.shift()
      }

      try {
        Reflect.apply(timeout._callback, null, timeout._args)
      } catch (e) {
        caught = true
        err = e
      }
    }

    if (caught) throw err
  }

  _onimmediate() {
    let caught = false
    let err = null

    while (this._immediates.length > 0) {
      const immediate = this._immediates.peek()

      if ((immediate._state & CLEARED) !== 0) {
        immediate._state &= ~ACTIVE & ~CLEARED

        this._immediates.shift()

        continue
      }

      if (caught) {
        binding.immediate(this._handle)

        break
      }

      immediate._state &= ~ACTIVE

      if ((immediate._state & REFED) !== 0) this._release()

      this._immediates.shift()

      try {
        Reflect.apply(immediate._callback, null, immediate._args)
      } catch (e) {
        caught = true
        err = e
      }
    }

    if (caught) throw err
  }
}

const scheduler = new Scheduler()

exports.setTimeout = function setTimeout(callback, delay, ...args) {
  return scheduler._timeout(delay, false, callback, args)
}

exports.clearTimeout = function clearTimeout(timeout) {
  scheduler._clear(timeout)
}

exports.setInterval = function setInterval(callback, delay, ...args) {
  return scheduler._timeout(delay, true, callback, args)
}

exports.clearInterval = function clearInterval(timeout) {
  scheduler._clear(timeout)
}

exports.setImmediate = function setImmediate(callback, ...args) {
  return scheduler._immediate(callback, args)
}

exports.clearImmediate = function clearImmediate(immediate) {
  scheduler._clear(immediate)
}
