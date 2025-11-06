const test = require('brittle')
const timers = require('..')
const { isAround } = require('./helpers')

test('setImmediate', async function (t) {
  t.plan(1)

  const started = Date.now()

  timers.setImmediate(function () {
    t.ok(isAround(Date.now() - started, 0), 'timers took ' + Math.abs(Date.now() - started) + 'ms')
  })
})

test('clearImmediate', async function (t) {
  const id = timers.setImmediate(() => t.fail('immediate should not be called'))

  timers.clearImmediate(id)
})

test('clearImmediate afterwards', async function (t) {
  let id = null

  timers.setImmediate(() => {
    timers.clearImmediate(id)
  })

  id = timers.setImmediate(() => t.fail('timeout should not be called'))
})

test('clearImmediate twice', async function (t) {
  const id = timers.setImmediate(() => t.fail('timeout should not be called'))

  timers.clearImmediate(id)
  timers.clearImmediate(id)
})

test('clearImmediate null', async function (t) {
  timers.clearImmediate(null)
})

test('order of setImmediate', async function (t) {
  t.plan(1)

  let count = 0

  for (let i = 0; i < 1000; i++) {
    timers.setImmediate(function () {
      if (count++ !== i) {
        t.fail('order is incorrect (' + (count - 1) + '/' + i + ')')
      }

      done()
    })
  }

  function done() {
    if (count === 1000) {
      t.pass()
    }
  }
})

test('error inside of setImmediate', async function (t) {
  t.plan(6)

  const error = new Error('random')

  timers.setImmediate(function () {
    t.pass()
    throw error
  })

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

test('setImmediate following setTimeout', async function (t) {
  const timer = timers.setTimeout(() => t.fail(), 30000)

  await new Promise((resolve) => timers.setImmediate(resolve))
  t.pass('first done')

  await new Promise((resolve) => timers.setImmediate(resolve))
  t.pass('second done')

  timers.clearTimeout(timer)
})

test('setImmediate that triggers setTimeout', async function (t) {
  t.plan(2)

  timers.setImmediate(() => {
    t.pass('immediate triggered')

    timers.setTimeout(() => {
      t.pass('timeout triggered')
    }, 20)
  })
})
