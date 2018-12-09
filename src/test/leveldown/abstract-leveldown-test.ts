import { AbstractLevelDOWN } from 'abstract-leveldown';
import * as testCommon from 'abstract-leveldown/test/common';
import tape_it from '../../util/tape_it';

export function AbstractLevelDOWNTestSuite<T extends AbstractLevelDOWN<any, any>>(
  desc: string,
  LevelDOWNFactory: () => T
) {
  describe(desc, () => {
    tape_it('open-test.args', (htest) => {
      require('abstract-leveldown/test/open-test').args(
        htest,
        testCommon({
          test: htest,
          factory: LevelDOWNFactory,
        })
      )
    })
    tape_it('open-test.open', (htest) => {
      require('abstract-leveldown/test/open-test').open(
        htest,
        testCommon({
          test: htest,
          factory: LevelDOWNFactory,
        })
      )
    })
    tape_it('del-test.all', (htest) => {
      require('abstract-leveldown/test/del-test').all(
        htest,
        testCommon({
          test: htest,
          factory: LevelDOWNFactory,
        })
      )
    })
    tape_it('get-test.all', (htest) => {
      require('abstract-leveldown/test/get-test').all(
        htest,
        testCommon({
          test: htest,
          factory: LevelDOWNFactory,
        })
      )
    })
    tape_it('put-test.all', (htest) => {
      require('abstract-leveldown/test/put-test').all(
        htest,
        testCommon({
          test: htest,
          factory: LevelDOWNFactory,
        })
      )
    })
    // tape_it('put-get-del-test.all', (htest) => {
    //   require('abstract-leveldown/test/put-get-del-test').all(
    //     htest,
    //     testCommon({
    //       test: htest,
    //       factory: LevelDOWNFactory,
    //     })
    //   )
    // })
    // tape_it('batch-test.all', (htest) => {
    //   require('abstract-leveldown/test/batch-test').all(
    //     htest,
    //     testCommon({
    //       test: htest,
    //       factory: LevelDOWNFactory,
    //     })
    //   )
    // })
    // tape_it('chained-batch-test.all', (htest) => {
    //   require('abstract-leveldown/test/chained-batch-test').all(
    //     htest,
    //     testCommon({
    //       test: htest,
    //       factory: LevelDOWNFactory,
    //     })
    //   )
    // })
    tape_it('iterator-test.all', (htest) => {
      require('abstract-leveldown/test/iterator-test').all(
        htest,
        testCommon({
          test: htest,
          factory: LevelDOWNFactory,
        })
      )
    })
    tape_it('iterator-range-test.all', (htest) => {
      require('abstract-leveldown/test/iterator-range-test').all(
        htest,
        testCommon({
          test: htest,
          factory: LevelDOWNFactory,
        })
      )
    }).timeout(5000)
  })
}
