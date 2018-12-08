import { AbstractLevelDOWN } from 'abstract-leveldown';
import { AbstractLevelDOWNTestSuite } from './abstract-leveldown-test';
import { CustomLevelDOWNTestSuite } from './custom-leveldown-test';

export function LevelDOWNTestSuite<T extends AbstractLevelDOWN<any, any>>(
  desc: string,
  LevelDOWNFactory: () => T
) {
  describe(desc, () => {
    CustomLevelDOWNTestSuite('custom', LevelDOWNFactory)
    AbstractLevelDOWNTestSuite('abstract', LevelDOWNFactory)
  })
}
