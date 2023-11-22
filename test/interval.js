const test = require('brittle')
const timers = require('..')
const { isAround, sleep } = require('./helpers')

test('setInterval', async function (t) {
  t.plan(1)

  const started = Date.now()

  const id = timers.setInterval(function () {
    t.ok(isAround(Date.now() - started, 50), 'timers took ' + Math.abs(Date.now() - started) + 'ms')
    timers.clearInterval(id)
  }, 50)
})

test('setInterval multiple cycles', async function (t) {
  t.plan(3)

  let started = Date.now()
  let intervalCount = 0

  const id = timers.setInterval(function () {
    t.ok(isAround(Date.now() - started, 50), 'timers took ' + Math.abs(Date.now() - started) + 'ms')
    started = Date.now()

    if (++intervalCount === 3) {
      timers.clearInterval(id)
    }
  }, 50)
})

test('setInterval timer active', async function (t) {
  t.plan(3)

  const timer = timers.setInterval(function () {
    t.ok(timer.active)
    timers.clearInterval(timer)
    t.absent(timer.active)
  }, 50)

  t.ok(timer.active)
})

test.skip('interrupt setInterval with CPU spin', async function (t) {
  t.plan(1)

  const started = Date.now()

  const id = timers.setInterval(function () {
    t.ok(isAround(Date.now() - started, 75), 'timers took ' + Math.abs(Date.now() - started) + 'ms')
    timers.clearInterval(id)
  }, 50)

  while (Date.now() - started < 75) {} // eslint-disable-line no-empty
})

test.skip('interrupt setInterval with Atomics.wait', async function (t) {
  t.plan(1)

  const started = Date.now()

  const id = timers.setInterval(function () {
    t.ok(isAround(Date.now() - started, 75), 'timers took ' + Math.abs(Date.now() - started) + 'ms')
    timers.clearInterval(id)
  }, 50)

  sleep(75)
})

test('multiple setInterval', async function (t) {
  t.plan(4)

  const started = Date.now()

  const id1 = timers.setInterval(function () {
    t.ok(isAround(Date.now() - started, 20), '1st timer took ' + Math.abs(Date.now() - started) + 'ms')
    timers.clearInterval(id1)
  }, 20)

  const id2 = timers.setInterval(function () {
    t.ok(isAround(Date.now() - started, 50), '2nd timer took ' + Math.abs(Date.now() - started) + 'ms')
    timers.clearInterval(id2)
  }, 50)

  const id3 = timers.setInterval(function () {
    t.ok(isAround(Date.now() - started, 20), '3rd timer took ' + Math.abs(Date.now() - started) + 'ms')
    timers.clearInterval(id3)
  }, 20)

  const id4 = timers.setInterval(() => {
    t.ok(isAround(Date.now() - started, 0), '4th timer took ' + Math.abs(Date.now() - started) + 'ms')
    timers.clearInterval(id4)
  }, 1)
})

test('clearInterval', async function (t) {
  const id = timers.setInterval(() => t.fail('interval should not be called'), 20)

  timers.clearInterval(id)
})
