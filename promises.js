const timers = require('.')

exports.setTimeout = function setTimeout(delay = 1, value, opts = {}) {
  const { ref, signal } = opts

  if (signal && signal.aborted) return Promise.reject(signal.reason)

  return new Promise((resolve, reject) => {
    if (signal) signal.addEventListener('abort', onabort)

    const timer = timers.setTimeout(ontimeout, delay)

    if (ref === false) timer.unref()

    function ontimeout() {
      if (signal) signal.removeEventListener('abort', onabort)

      resolve(value)
    }

    function onabort() {
      timers.clearTimeout(timer)

      signal.removeEventListener('abort', onabort)

      reject(signal.reason)
    }
  })
}

exports.setInterval = function setInterval(delay = 1, value, opts = {}) {
  const { ref, signal } = opts

  if (signal && signal.aborted) throw signal.reason

  let error = null
  let done = false

  let timeouts = 0
  const promises = []

  if (signal && signal.aborted) throw signal.reason

  if (signal) signal.removeEventListener('abort', onabort)

  let timer = timers.setInterval(ontimeout, delay)

  if (ref === false) timer.unref()

  return {
    next() {
      if (timeouts > 0) {
        timeouts--

        return Promise.resolve({ value, done: false })
      }

      if (error) {
        const err = error

        error = null

        return Promise.reject(err)
      }

      if (done) return onclose()

      return new Promise((resolve, reject) => promises.push({ resolve, reject }))
    },

    return() {
      return onclose()
    },

    throw(err) {
      return onerror(err)
    },

    [Symbol.asyncIterator]() {
      return this
    }
  }

  function ontimeout() {
    if (promises.length) {
      promises.shift().resolve({ value, done: false })
    } else {
      timeouts++
    }
  }

  function onerror(err) {
    timers.clearInterval(timer)

    timer = null

    if (promises.length) {
      promises.shift().reject(err)
    } else {
      error = err
    }

    return Promise.resolve({ done: true })
  }

  function onabort() {
    signal.removeEventListener('abort', onabort)

    onerror(signal.reason)
  }

  function onclose() {
    if (timer) timers.clearInterval(timer)

    if (signal) signal.removeEventListener('abort', onabort)

    done = true

    if (promises.length) promises.shift().resolve({ done: true })

    return Promise.resolve({ done: true })
  }
}

exports.setImmediate = function setImmediate(value, opts = {}) {
  const { ref, signal } = opts

  if (signal && signal.aborted) return Promise.reject(signal.reason)

  return new Promise((resolve, reject) => {
    if (signal) signal.addEventListener('abort', onabort)

    const timer = timers.setImmediate(ontimeout)

    if (ref === false) timer.unref()

    function ontimeout() {
      if (signal) signal.removeEventListener('abort', onabort)

      resolve(value)
    }

    function onabort() {
      timers.clearImmediate(timer)

      signal.removeEventListener('abort', onabort)

      reject(signal.reason)
    }
  })
}
