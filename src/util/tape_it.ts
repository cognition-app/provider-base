var test = require('tape')
var assert = require('assert')

/**
 * Convert tape tests into mocha assertions!
 * 
 * @example
 * tape_it('my mocha tape test assertion', function (test) {
 *   test('my tape test', function (t) {
 *     t.equal(1, 1)
 *   })
 * })
 * 
 * @param desc Description of the test (like normal `it`)
 * @param func Test function accepting test harness as parameter
 * @returns Same the resulting `it` mocha construct
 */
export default function tape_it(desc, func) {
  return it(desc, function (done) {
    var htest = test.createHarness()

    htest.createStream().on('data', function (row) {
      if (row.indexOf('ok') === 0)
        assert.ok(row)
      else if (row.indexOf('not ok') === 0)
        assert.fail(row)
    }).on('end', function () {
      done()
    })

    func(htest)
  })
}
