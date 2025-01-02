declare class Timer {
  get active(): boolean

  refresh(): this
  ref(): this
  unref(): this

  hasRef(): boolean
}

export function setTimeout<T extends unknown[]>(
  fn: (...args: T) => unknown,
  ms: number,
  ...args: T
): Timer

export function clearTimeout(timer: Timer): void

export function setInterval<T extends unknown[]>(
  fn: (...args: T) => unknown,
  ms: number,
  ...args: T
): Timer

export function clearInterval(timer: Timer): void

export function setImmediate<T extends unknown[]>(
  fn: (...args: T) => unknown,
  ...args: T
): Timer

export function clearImmediate(timer: Timer): void
