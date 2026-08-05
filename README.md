# bare-timers

Native timers for Javascript.

```
npm i bare-timers
```

## Usage

```js
const { setTimeout, clearTimeout } = require('bare-timers')
```

## License

Apache-2.0

<!-- bare-refgen:api start -->

## API

### Functions

#### `setTimeout`

```ts
setTimeout<T extends unknown[]>(callback: (...args: T) => unknown, delay: number, ...args: T): Timeout
```

Schedule execution once after `delay` milliseconds, clamped to a minimum of 1ms.

**Parameters**

| Parameter  | Type                      | Default | Description                                                       |
| ---------- | ------------------------- | ------- | ----------------------------------------------------------------- |
| `callback` | `(...args: T) => unknown` | —       | The function to run after the delay.                              |
| `delay`    | `number`                  | —       | Milliseconds to wait before running; clamped to a minimum of `1`. |
| `args`     | `T`                       | —       | Additional arguments passed to `callback`.                        |

#### `clearTimeout(timer: Timeout): void`

Cancel a pending timeout, preventing it from firing.

**Parameters**

| Parameter | Type      | Default | Description                   |
| --------- | --------- | ------- | ----------------------------- |
| `timer`   | `Timeout` | —       | The timeout handle to cancel. |

#### `setInterval`

```ts
setInterval<T extends unknown[]>(callback: (...args: T) => unknown, delay: number, ...args: T): Timeout
```

Schedule repeated execution every `delay` milliseconds, clamped to a minimum of 1ms.

**Parameters**

| Parameter  | Type                      | Default | Description                                             |
| ---------- | ------------------------- | ------- | ------------------------------------------------------- |
| `callback` | `(...args: T) => unknown` | —       | The function to run on each interval.                   |
| `delay`    | `number`                  | —       | Milliseconds between runs; clamped to a minimum of `1`. |
| `args`     | `T`                       | —       | Additional arguments passed to `callback`.              |

#### `clearInterval(timer: Timeout): void`

Cancel a pending interval, preventing further firings.

**Parameters**

| Parameter | Type      | Default | Description                    |
| --------- | --------- | ------- | ------------------------------ |
| `timer`   | `Timeout` | —       | The interval handle to cancel. |

#### `setImmediate<T extends unknown[]>(callback: (...args: T) => unknown, ...args: T): Immediate`

Schedule execution once at the end of the current event loop iteration.

**Parameters**

| Parameter  | Type                      | Default | Description                                                         |
| ---------- | ------------------------- | ------- | ------------------------------------------------------------------- |
| `callback` | `(...args: T) => unknown` | —       | The function to run at the end of the current event loop iteration. |
| `args`     | `T`                       | —       | Additional arguments passed to `callback`.                          |

#### `clearImmediate(immediate: Immediate): void`

Cancel a pending immediate, preventing it from firing.

**Parameters**

| Parameter   | Type        | Default | Description                     |
| ----------- | ----------- | ------- | ------------------------------- |
| `immediate` | `Immediate` | —       | The immediate handle to cancel. |

### Types

#### `Task`

```ts
interface Task {
  ref(): this
  unref(): this
  hasRef(): boolean
}
```

The base handle shared by `Timeout` and `Immediate`, controlling whether it keeps the event loop alive.

#### `Timeout`

```ts
interface Timeout {
  refresh(): this
  ref(): this
  unref(): this
  hasRef(): boolean
}
```

The handle returned by `setTimeout` and `setInterval`.

#### `Immediate`

```ts
interface Immediate {
  ref(): this
  unref(): this
  hasRef(): boolean
}
```

The handle returned by `setImmediate`.

## `bare-timers/promises`

### Functions

#### `setTimeout<T>(delay?: number, value?: T, options?: TimeoutOptions): Promise<T>`

Schedule execution once after `delay` milliseconds, clamped to a minimum of 1ms.

**Parameters**

| Parameter  | Type             | Default | Description                                                                                                            |
| ---------- | ---------------- | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| `delay?`   | `number`         | —       | Milliseconds to wait before running; clamped to a minimum of `1`.                                                      |
| `value?`   | `T`              | —       | The value the returned promise resolves with.                                                                          |
| `options?` | `TimeoutOptions` | —       | Options; `ref` defaults to `true` (set `false` to unref), and `signal` may be an `AbortSignal` that cancels the timer. |

#### `setInterval<T>(delay?: number, value?: T, options?: TimeoutOptions): AsyncGenerator<T>`

Schedule repeated execution every `delay` milliseconds, clamped to a minimum of 1ms.

**Parameters**

| Parameter  | Type             | Default | Description                                                                                                            |
| ---------- | ---------------- | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| `delay?`   | `number`         | —       | Milliseconds between runs; clamped to a minimum of `1`.                                                                |
| `value?`   | `T`              | —       | The value yielded on each iteration.                                                                                   |
| `options?` | `TimeoutOptions` | —       | Options; `ref` defaults to `true` (set `false` to unref), and `signal` may be an `AbortSignal` that cancels the timer. |

#### `setImmediate<T>(value?: T, options?: ImmediateOptions): Promsie<T>`

Schedule execution once at the end of the current event loop iteration.

**Parameters**

| Parameter  | Type               | Default | Description                                                                                                            |
| ---------- | ------------------ | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| `value?`   | `T`                | —       | The value the returned promise resolves with.                                                                          |
| `options?` | `ImmediateOptions` | —       | Options; `ref` defaults to `true` (set `false` to unref), and `signal` may be an `AbortSignal` that cancels the timer. |

### Types

#### `TaskOptions`

```ts
interface TaskOptions {
  ref?: boolean
  signal?: AbortSignal
}
```

Shared options for the `bare-timers/promises` scheduling functions.

#### `TimeoutOptions`

```ts
interface TimeoutOptions {
  ref?: boolean
  signal?: AbortSignal
}
```

Options for `bare-timers/promises`' `setTimeout` and `setInterval`.

#### `ImmediateOptions`

```ts
interface ImmediateOptions {
  ref?: boolean
  signal?: AbortSignal
}
```

Options for `bare-timers/promises`' `setImmediate`.
<!-- bare-refgen:api end -->
