import * as PouchDBMemoryAdapter from 'pouchdb-adapter-memory';
import * as PouchDB from 'pouchdb-browser';
import { PouchDBTestSuite } from '../test/pouchdb';

PouchDBTestSuite(
  'Sanity PouchDB Test',
  () => {
    PouchDB.plugin(PouchDBMemoryAdapter as PouchDB.Plugin)
    return new PouchDB('testdb', {adapter: 'memory'})
  },
)
