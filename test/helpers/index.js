const nil = new Int32Array(new SharedArrayBuffer(4))

exports.isAround = function isAround (actual, expected, epsilon = 10) {
  return Math.abs(actual - expected) < epsilon
}

exports.sleep = function sleep (ms) {
  Atomics.wait(nil, 0, 0, ms)
}
