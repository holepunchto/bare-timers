import TimerError from './lib/errors'

/**
 * The base handle shared by `Timeout` and `Immediate`, controlling whether it keeps the event loop
 * alive.
 */
interface Task {
  /** Ref the task, so it keeps the event loop alive while pending. Returns the task. */
  ref(): this
  /** Unref the task, so it does not keep the event loop alive while pending. Returns the task. */
  unref(): this
  /** Return whether the task is currently refed, that is keeping the event loop alive. */
  hasRef(): boolean
}

/** The handle returned by `setTimeout` and `setInterval`. */
export interface Timeout extends Task {
  /**
   * Reset the timeout's delay to start counting from now, rescheduling it without allocating a new
   * handle. Returns the timeout.
   */
  refresh(): this
}

/** The handle returned by `setImmediate`. */
export interface Immediate extends Task {}

/**
 * Schedule execution once after `delay` milliseconds, clamped to a minimum of 1ms.
 * @param callback - The function to run after the delay.
 * @param delay - Milliseconds to wait before running; clamped to a minimum of `1`.
 * @param args - Additional arguments passed to `callback`.
 * @param value - The value the returned promise resolves with.
 * @param options - Options; `ref` defaults to `true` (set `false` to unref), and `signal` may be an
 * `AbortSignal` that cancels the timer.
 */
export function setTimeout<T extends unknown[]>(
  callback: (...args: T) => unknown,
  delay: number,
  ...args: T
): Timeout

/**
 * Cancel a pending timeout, preventing it from firing.
 * @param timer - The timeout handle to cancel.
 */
export function clearTimeout(timer: Timeout): void

/**
 * Schedule repeated execution every `delay` milliseconds, clamped to a minimum of 1ms.
 * @param callback - The function to run on each interval.
 * @param delay - Milliseconds between runs; clamped to a minimum of `1`.
 * @param args - Additional arguments passed to `callback`.
 * @param value - The value yielded on each iteration.
 * @param options - Options; `ref` defaults to `true` (set `false` to unref), and `signal` may be an
 * `AbortSignal` that cancels the timer.
 */
export function setInterval<T extends unknown[]>(
  callback: (...args: T) => unknown,
  delay: number,
  ...args: T
): Timeout

/**
 * Cancel a pending interval, preventing further firings.
 * @param timer - The interval handle to cancel.
 */
export function clearInterval(timer: Timeout): void

/**
 * Schedule execution once at the end of the current event loop iteration.
 * @param callback - The function to run at the end of the current event loop iteration.
 * @param args - Additional arguments passed to `callback`.
 * @param value - The value the returned promise resolves with.
 * @param options - Options; `ref` defaults to `true` (set `false` to unref), and `signal` may be an
 * `AbortSignal` that cancels the timer.
 */
export function setImmediate<T extends unknown[]>(
  callback: (...args: T) => unknown,
  ...args: T
): Immediate

/**
 * Cancel a pending immediate, preventing it from firing.
 * @param immediate - The immediate handle to cancel.
 */
export function clearImmediate(immediate: Immediate): void

export { type TimerError, TimerError as errors }
