import { strict as assert } from 'assert';
import * as PouchDB from 'pouchdb-browser';
import { reversePromise } from '../../util/reverse-promise';

export function PouchDBTestSuite<T extends any>(
  desc: string,
  PouchDBFactory: () => T,
) {
  async function withEmptyStore(): Promise<T> {
    return PouchDBFactory()
  }

  async function withStore() {
    const db = await withEmptyStore()
    await db.put('a', 'b')
    return db
  }

  describe(desc, () => {
    it('can put/get/remove', async () => {
      const db = await withEmptyStore()
      await db.put({
        _id: 'a',
        val: 'b',
      })
      const doc = await db.get('a')
      assert.equal(doc.val, 'b')
      await db.remove(doc._id, doc._rev)
      await reversePromise(db.get('a'))
    })

    it('has working changes', async () => {
      const db = await withEmptyStore()
      let count = 2
      await Promise.all([
        new Promise((resolve, reject) => {
          db.changes({
            live: true,
          }).on('change', (change) => {
            if(--count === 0)
              resolve()
          })
        }),
        (async () => {
          await db.put({
            _id: 'a',
            val: 'a',
          })
          await db.put({
            _id: 'b',
            val: 'b',
          })
        })()
      ])
    })

    it('can sync', async () => {
      const db1 = await withEmptyStore()
      const db2 = await withEmptyStore()
    })
  })
}