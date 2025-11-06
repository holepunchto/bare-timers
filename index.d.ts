interface Task {
  ref(): this
  unref(): this
  hasRef(): boolean
}

export interface Timeout extends Task {
  refresh(): this
}

export interface Immediate extends Task {}

export function setTimeout<T extends unknown[]>(
  callback: (...args: T) => unknown,
  delay: number,
  ...args: T
): Timeout

export function clearTimeout(timer: Timeout): void

export function setInterval<T extends unknown[]>(
  callback: (...args: T) => unknown,
  delay: number,
  ...args: T
): Timeout

export function clearInterval(timer: Timeout): void

export function setImmediate<T extends unknown[]>(
  callback: (...args: T) => unknown,
  ...args: T
): Immediate

export function clearImmediate(immediate: Immediate): void
