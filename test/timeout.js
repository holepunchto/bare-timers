const test = require('brittle')
const timers = require('..')
const { isAround, sleep } = require('./helpers')

test('setTimeout', async function (t) {
  t.plan(1)

  const started = Date.now()

  timers.setTimeout(function () {
    t.ok(isAround(Date.now() - started, 50), 'timers took ' + Math.abs(Date.now() - started) + 'ms')
  }, 50)
})

test('setTimeout refresh', async function (t) {
  t.plan(2)

  const started = Date.now()

  const timer = timers.setTimeout(function () {
    t.is(ticks, 6, 'was refreshed')
    t.ok(
      isAround(Date.now() - started, 200, 100),
      'timers took ' + Math.abs(Date.now() - started) + 'ms'
    )
  }, 50)

  let ticks = 0

  const t2 = timers.setInterval(function () {
    timer.refresh()
    if (++ticks === 6) timers.clearInterval(t2)
  }, 25)
})

test.skip('interrupt setTimeout with CPU spin', async function (t) {
  t.plan(1)

  const started = Date.now()

  timers.setTimeout(function () {
    t.ok(isAround(Date.now() - started, 75), 'timers took ' + Math.abs(Date.now() - started) + 'ms')
  }, 50)

  while (Date.now() - started < 75) {} // eslint-disable-line no-empty
})

test.skip('interrupt setTimeout with Atomics.wait', async function (t) {
  t.plan(1)

  const started = Date.now()

  timers.setTimeout(function () {
    t.ok(isAround(Date.now() - started, 75), 'timers took ' + Math.abs(Date.now() - started) + 'ms')
  }, 50)

  sleep(75)
})

test('multiple setTimeout', async function (t) {
  t.plan(4)

  const started = Date.now()

  timers.setTimeout(function () {
    t.ok(
      isAround(Date.now() - started, 20),
      '1st timer took ' + Math.abs(Date.now() - started) + 'ms'
    )
  }, 20)

  timers.setTimeout(function () {
    t.ok(
      isAround(Date.now() - started, 50),
      '2nd timer took ' + Math.abs(Date.now() - started) + 'ms'
    )
  }, 50)

  timers.setTimeout(function () {
    t.ok(
      isAround(Date.now() - started, 20),
      '3rd timer took ' + Math.abs(Date.now() - started) + 'ms'
    )
  }, 20)

  timers.setTimeout(() => {
    t.ok(
      isAround(Date.now() - started, 0),
      '4th timer took ' + Math.abs(Date.now() - started) + 'ms'
    )
  }, 1)
})

test('clearTimeout', async function (t) {
  const id = timers.setTimeout(() => t.fail('timeout should not be called'), 20)

  timers.clearTimeout(id)
})

test('clearTimeout afterwards', async function (t) {
  t.plan(1)

  const id = timers.setTimeout(() => t.fail('timeout should not be called'), 20)

  timers.setTimeout(() => {
    timers.clearTimeout(id)
  }, 15)

  timers.setTimeout(() => {
    t.pass()
  }, 50)
})

test('clearTimeout twice', async function (t) {
  const id = timers.setTimeout(() => t.fail('timeout should not be called'), 20)

  timers.clearTimeout(id)
  timers.clearTimeout(id)
})

test('clearTimeout null', async function (t) {
  timers.clearTimeout(null)
})

test('lots of setTimeout + clearTimeout', async function (t) {
  t.plan(1)

  const timeouts = new Array(2000)
  let pass = 0

  for (let i = 0; i < timeouts.length; i++) {
    timeouts[i] = timers.setTimeout(ontimeout, 10)
    if (i % 2 === 0) timers.clearTimeout(timeouts[i])
  }

  function ontimeout() {
    if (++pass === timeouts.length / 2) {
      t.pass()
    }
  }
})

test('error inside of setTimeout', async function (t) {
  t.plan(6)

  const error = new Error('random')

  timers.setTimeout(function () {
    t.pass()
    throw error
  }, 5)

  timers.setTimeout(() => t.pass(), 10)
  timers.setImmediate(() => t.pass())

  Bare.once('uncaughtException', function (err) {
    t.is(err, error)

    timers.setTimeout(() => {
      t.pass()
    }, 20)

    timers.setImmediate(() => t.pass())
  })
})

test('setTimeout with zero delay', async function (t) {
  t.plan(1)

  const started = Date.now()

  timers.setTimeout(function () {
    t.ok(isAround(Date.now() - started, 0), 'timers took ' + Math.abs(Date.now() - started) + 'ms')
  }, 0)
})

test('setTimeout with negative delay', async function (t) {
  t.plan(1)

  timers.setTimeout(function () {
    t.pass()
  }, -50)
})

test('setTimeout with a string number as delay', async function (t) {
  t.plan(1)

  const started = Date.now()

  timers.setTimeout(function () {
    t.ok(isAround(Date.now() - started, 25), 'timers took ' + Math.abs(Date.now() - started) + 'ms')
  }, '25')
})

test('setTimeout with a string number plus a character as delay', async function (t) {
  t.plan(1)

  timers.setTimeout(function () {
    t.pass()
  }, '100a')
})

test('setTimeout with an invalid string as delay', async function (t) {
  t.plan(1)

  timers.setTimeout(function () {
    t.pass()
  }, 'abcd')
})
