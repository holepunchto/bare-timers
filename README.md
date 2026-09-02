# bare-timers

Native timers for Javascript.

```
npm i bare-timers
```

## Usage

```js
const { setTimeout, clearTimeout } = require('bare-timers')
```

## API

See the [`bare-timers` reference](https://docs.pears.com/reference/bare/modules/bare-timers).

## Threat model

`bare-timers` is one of the addons Bare compiles into its binary, so it inherits [Bare's threat model](https://github.com/holepunchto/bare/blob/main/docs/threat-model.md). See [`docs/threat-model.md`](docs/threat-model.md) for where this addon sits in it.

## License

Apache-2.0
