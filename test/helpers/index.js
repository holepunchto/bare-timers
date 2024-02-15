/* global Bare */

const nil = new Int32Array(new SharedArrayBuffer(4))

const isWindows = Bare.platform === 'win32'

exports.isAround = function isAround (actual, expected, epsilon = isWindows ? 50 : 25) {
  return Math.abs(actual - expected) < epsilon
}

exports.sleep = function sleep (ms) {
  Atomics.wait(nil, 0, 0, ms)
}
