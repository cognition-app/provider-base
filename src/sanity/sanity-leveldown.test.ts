import { LevelDOWNTestSuite } from '../test/leveldown';
import memdown from 'memdown'

LevelDOWNTestSuite(
  'Sanity LevelDOWN Test',
  memdown
)
