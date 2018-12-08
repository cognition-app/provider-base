import { ProviderToLevelDOWN } from '../base/leveldown';
import { LevelDOWNTestSuite } from '../test/leveldown';
import { DummyProvider } from './provider';

LevelDOWNTestSuite(
  'Dummy LevelDOWN Test',
  () => ProviderToLevelDOWN(
    DummyProvider
  )(undefined)('test-db')
)
