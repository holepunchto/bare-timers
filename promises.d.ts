import { AbortSignal } from 'bare-abort-controller'

/** Shared options for the `bare-timers/promises` scheduling functions. */
interface TaskOptions {
  /**
   * Whether the timer keeps the event loop alive. Defaults to `true`; set to `false` to unref it.
   */
  ref?: boolean
  /** An `AbortSignal` that cancels the timer. An already-aborted signal rejects immediately. */
  signal?: AbortSignal
}

/** Options for `bare-timers/promises`' `setTimeout` and `setInterval`. */
export interface TimeoutOptions extends TaskOptions {}

/** Options for `bare-timers/promises`' `setImmediate`. */
export interface ImmediateOptions extends TaskOptions {}

/**
 * Schedule execution once after `delay` milliseconds, clamped to a minimum of 1ms.
 * @param callback - The function to run after the delay.
 * @param delay - Milliseconds to wait before running; clamped to a minimum of `1`.
 * @param args - Additional arguments passed to `callback`.
 * @param value - The value the returned promise resolves with.
 * @param options - Options; `ref` defaults to `true` (set `false` to unref), and `signal` may be an
 * `AbortSignal` that cancels the timer.
 */
export function setTimeout<T>(delay?: number, value?: T, options?: TimeoutOptions): Promise<T>

/**
 * Schedule repeated execution every `delay` milliseconds, clamped to a minimum of 1ms.
 * @param callback - The function to run on each interval.
 * @param delay - Milliseconds between runs; clamped to a minimum of `1`.
 * @param args - Additional arguments passed to `callback`.
 * @param value - The value yielded on each iteration.
 * @param options - Options; `ref` defaults to `true` (set `false` to unref), and `signal` may be an
 * `AbortSignal` that cancels the timer.
 */
export function setInterval<T>(
  delay?: number,
  value?: T,
  options?: TimeoutOptions
): AsyncGenerator<T>

/**
 * Schedule execution once at the end of the current event loop iteration.
 * @param callback - The function to run at the end of the current event loop iteration.
 * @param args - Additional arguments passed to `callback`.
 * @param value - The value the returned promise resolves with.
 * @param options - Options; `ref` defaults to `true` (set `false` to unref), and `signal` may be an
 * `AbortSignal` that cancels the timer.
 */
export function setImmediate<T>(value?: T, options?: ImmediateOptions): Promsie<T>
