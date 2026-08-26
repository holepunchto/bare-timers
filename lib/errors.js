module.exports = class TimerError extends Error {
  constructor(msg, fn = TimerError, code = fn.name) {
    super(`${code}: ${msg}`)

    this.code = code

    if (Error.captureStackTrace) Error.captureStackTrace(this, fn)
  }

  get name() {
    return 'TimerError'
  }

  static INVALID_CALLBACK(msg) {
    return new TimerError(msg, TimerError.INVALID_CALLBACK)
  }
}
