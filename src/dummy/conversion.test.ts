import { strict as assert } from "assert";
import levelup from 'levelup';
import { ProviderToLevelDOWN } from "../leveldown";
import { ProviderToPouchDB } from "../pouchdb";
import { DummyProvider } from "./provider";

describe('conversion test', () => {
  const store: {[k: string]: object} = {
    'a': {
      'b': 'c'
    },
    'd': {
      'e': 'f'
    }
  }

  it('can become levelDOWN', async () => {
    const DummyLevelDOWN: any = levelup(
      ProviderToLevelDOWN(DummyProvider)({
        store: store,
      })('test-db')
    )
    assert.deepEqual(
      await DummyLevelDOWN.get('a', { asBuffer: false }),
      {'b': 'c'}
    )
    assert.deepEqual(
      await DummyLevelDOWN.get('d', { asBuffer: false }),
      {'e': 'f'}
    )
  })

  it.skip('can become pouchdb', async () => {
    const DummyPouchDB = ProviderToPouchDB(
      DummyProvider
    )({
      store: store,
    })('test-db')
    assert.deepEqual(
      await DummyPouchDB.get('a'),
      {'b': 'c'}
    )
    assert.deepEqual(
      await DummyPouchDB.get('d'),
      {'e': 'f'}
    )
  })
})
