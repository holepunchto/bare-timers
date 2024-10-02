const test = require('brittle')
const timers = require('..')

test('unref and a timer stays alive', async function (t) {
  t.plan(1)

  const unreffed = timers.setTimeout(run, 10)

  function run () {
    unreffed.unref()
    timers.setTimeout(function () {
      t.pass('timer triggered')
    }, 50)
  }
})
