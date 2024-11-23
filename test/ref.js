const test = require('brittle')
const timers = require('..')

test('unref and a timer stays alive', async function (t) {
  t.plan(1)

  const unreffed = timers.setTimeout(run, 10)

  function run() {
    unreffed.unref()
    timers.setTimeout(function () {
      t.pass('timer triggered')
    }, 50)
  }
})

// must be last test!
test('ref in callbacks are noops', async function (t) {
  t.plan(1)

  const timer = timers.setTimeout(run, 10)

  function run() {
    timer.ref()
    const other = timers.setTimeout(() => t.fail('should not run'), 10_000)
    other.unref()
    t.pass('timer triggered')
  }
})
