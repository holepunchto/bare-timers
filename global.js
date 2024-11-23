const timers = require('.')

global.setTimeout = timers.setTimeout
global.clearTimeout = timers.clearTimeout

global.setInterval = timers.setInterval
global.clearInterval = timers.clearInterval

global.setImmediate = timers.setImmediate
global.clearImmediate = timers.clearImmediate
