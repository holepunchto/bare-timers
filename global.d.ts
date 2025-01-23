import { Timer } from '.'

declare global {
  function setTimeout<T extends unknown[]>(
    fn: (...args: T) => unknown,
    ms: number,
    ...args: T
  ): Timer

  function clearTimeout(timer: Timer): void

  function setInterval<T extends unknown[]>(
    fn: (...args: T) => unknown,
    ms: number,
    ...args: T
  ): Timer

  function clearInterval(timer: Timer): void

  function setImmediate<T extends unknown[]>(
    fn: (...args: T) => unknown,
    ...args: T
  ): Timer

  function clearImmediate(timer: Timer): void
}
