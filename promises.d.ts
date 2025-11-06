import { AbortSignal } from 'bare-abort-controller'

interface TaskOptions {
  ref?: boolean
  signal?: AbortSignal
}

export interface TimeoutOptions extends TaskOptions {}

export interface ImmediateOptions extends TaskOptions {}

export function setTimeout<T>(delay?: number, value?: T, options?: TimeoutOptions): Promise<T>

export function setInterval<T>(
  delay?: number,
  value?: T,
  options?: TimeoutOptions
): AsyncGenerator<T>

export function setImmediate<T>(value?: T, options?: ImmediateOptions): Promsie<T>
