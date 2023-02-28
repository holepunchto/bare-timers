const timers = require('../..')

const nil = new Int32Array(new SharedArrayBuffer(4))

module.exports = { isAround, sleep, countTimers }

function countTimers () {
  let activeTimers = 0
  for (const timer of timers) { // eslint-disable-line no-unused-vars
    activeTimers++
  }
  return activeTimers
}

function isAround (actual, expected, epsilon = 10) {
  return Math.abs(actual - expected) < epsilon
}

function sleep (ms) {
  Atomics.wait(nil, 0, 0, ms)
}
