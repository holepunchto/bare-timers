interface Task {
  ref(): this
  unref(): this
  hasRef(): boolean
}

interface Timeout extends Task {
  refresh(): this
}

interface Immediate extends Task {}

export { Timeout, Immediate }

export function setTimeout<T extends unknown[]>(
  fn: (...args: T) => unknown,
  delay: number,
  ...args: T
): Timeout

export function clearTimeout(timer: Timeout): void

export function setInterval<T extends unknown[]>(
  fn: (...args: T) => unknown,
  delay: number,
  ...args: T
): Timeout

export function clearInterval(timer: Timeout): void

export function setImmediate<T extends unknown[]>(
  fn: (...args: T) => unknown,
  ...args: T
): Immediate

export function clearImmediate(immediate: Immediate): void
