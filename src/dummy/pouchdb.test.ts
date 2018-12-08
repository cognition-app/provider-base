import { ProviderToPouchDB } from '../base/pouchdb';
import { PouchDBTestSuite } from '../test/pouchdb';
import { DummyProvider } from './provider';

PouchDBTestSuite(
  'Dummy PouchDB Test',
  () => ProviderToPouchDB(
    DummyProvider
  )(undefined)('test-db')
)
