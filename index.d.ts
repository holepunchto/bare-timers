declare class Timer {
  get active(): boolean

  refresh(): this
  ref(): this
  unref(): this

  hasRef(): boolean
}

export function setTimeout(fn: Function, ms: number, ...args: any[]): Timer
export function setTimeout(fn: Function, ...args: any[]): Timer
export function clearTimeout(timer: Timer): void

export function setInterval(fn: Function, ms: number, ...args: any[]): Timer
export function setInterval(fn: Function, ...args: any[]): Timer
export function clearInterval(timer: Timer): void

export function setImmediate(fn: Function, ...args: any[]): Timer
export function clearImmediate(timer: Timer): void
