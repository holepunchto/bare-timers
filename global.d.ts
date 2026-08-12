import { Timer } from '.'

declare global {
  /**
   * Schedule execution once after `delay` milliseconds, clamped to a minimum of 1ms.
   * @param callback - The function to run after the delay.
   * @param delay - Milliseconds to wait before running; clamped to a minimum of `1`.
   * @param args - Additional arguments passed to `callback`.
   * @param value - The value the returned promise resolves with.
   * @param options - Options; `ref` defaults to `true` (set `false` to unref), and `signal` may be
   * an `AbortSignal` that cancels the timer.
   */
  function setTimeout<T extends unknown[]>(
    fn: (...args: T) => unknown,
    ms: number,
    ...args: T
  ): Timer

  /**
   * Cancel a pending timeout, preventing it from firing.
   * @param timer - The timeout handle to cancel.
   */
  function clearTimeout(timer: Timer): void

  /**
   * Schedule repeated execution every `delay` milliseconds, clamped to a minimum of 1ms.
   * @param callback - The function to run on each interval.
   * @param delay - Milliseconds between runs; clamped to a minimum of `1`.
   * @param args - Additional arguments passed to `callback`.
   * @param value - The value yielded on each iteration.
   * @param options - Options; `ref` defaults to `true` (set `false` to unref), and `signal` may be
   * an `AbortSignal` that cancels the timer.
   */
  function setInterval<T extends unknown[]>(
    fn: (...args: T) => unknown,
    ms: number,
    ...args: T
  ): Timer

  /**
   * Cancel a pending interval, preventing further firings.
   * @param timer - The interval handle to cancel.
   */
  function clearInterval(timer: Timer): void

  /**
   * Schedule execution once at the end of the current event loop iteration.
   * @param callback - The function to run at the end of the current event loop iteration.
   * @param args - Additional arguments passed to `callback`.
   * @param value - The value the returned promise resolves with.
   * @param options - Options; `ref` defaults to `true` (set `false` to unref), and `signal` may be
   * an `AbortSignal` that cancels the timer.
   */
  function setImmediate<T extends unknown[]>(fn: (...args: T) => unknown, ...args: T): Timer

  /**
   * Cancel a pending immediate, preventing it from firing.
   * @param immediate - The immediate handle to cancel.
   */
  function clearImmediate(timer: Timer): void
}
