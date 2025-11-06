const isWindows = Bare.platform === 'win32'

exports.isAround = function isAround(actual, expected, epsilon = isWindows ? 50 : 25) {
  return Math.abs(actual - expected) < epsilon
}

const lock = new Int32Array(new SharedArrayBuffer(4))

exports.sleep = function sleep(ms) {
  Atomics.wait(lock, 0, 0, ms)
}
