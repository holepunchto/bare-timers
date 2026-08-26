declare class TimerError extends Error {
  readonly name: 'TimerError'
  readonly code: string

  static INVALID_CALLBACK(msg?: string): TimerError
}

export = TimerError
