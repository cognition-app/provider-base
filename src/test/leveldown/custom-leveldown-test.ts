import { AbstractLevelDOWN } from 'abstract-leveldown';
import { strict as assert } from 'assert';
import levelup from 'levelup';
import { reversePromise } from '../../util/reverse-promise';
import { streamPromise } from '../../util/stream-promise';

export function CustomLevelDOWNTestSuite<T extends AbstractLevelDOWN<any, any>>(
  desc: string,
  LevelDOWNFactory: () => T
) {
  async function withEmptyStore(): Promise<any> {
    return levelup(LevelDOWNFactory())
  }

  async function withStore() {
    const db = await withEmptyStore()
    await db.put('a', 'b')
    return db
  }

  async function withBufferStore() {
    const db = await withEmptyStore()
    await db.put(Buffer.from('a'), Buffer.from('b'))
    return db
  }

  async function withDeepStore() {
    const db = await withEmptyStore()
    await db.put('a', {
      'c': 'd',
      'e': 'f'
    })
    return db
  }

  describe(desc, () => {
    it('can put', async () => {
      const db = await withEmptyStore()
      await db.put('a', 'b')
    })

    it('can put deep', async () => {
      const db = await withEmptyStore()
      await db.put('a', {
        'c': 'd',
        'e': 'f'
      })
    })

    it('can put key buffer', async () => {
      const db = await withEmptyStore()
      await db.put(Buffer.from('a'), 'b')
    })

    it('can put val buffer', async () => {
      const db = await withEmptyStore()
      await db.put('a', Buffer.from('b'))
    })

    it('can put key val buffer', async () => {
      const db = await withEmptyStore()
      await db.put(Buffer.from('a'), Buffer.from('b'))
    })

    it('can get', async () => {
      const db = await withStore()
      assert.deepEqual(
        await db.get('a', { asBuffer: false }),
        'b'
      )
    })

    it('can get deep', async () => {
      const db = await withDeepStore()
      assert.deepEqual(
        await db.get('a', { asBuffer: false }),
        {
          'c': 'd',
          'e': 'f'
        }
      )
    })

    it('can get key buffer', async () => {
      const db = await withStore()
      assert.deepEqual(
        await db.get(Buffer.from('a'), { asBuffer: false }),
        'b'
      )
    })

    it('can get val buffer', async () => {
      const db = await withStore()
      assert.deepEqual(
        await db.get('a', { asBuffer: true }),
        Buffer.from('b')
      )
    })

    it('can get key val buffer', async () => {
      const db = await withStore()
      assert.deepEqual(
        await db.get(Buffer.from('a'), { asBuffer: true }),
        Buffer.from('b')
      )
    })

    it('can get from buffer store', async () => {
      const db = await withBufferStore()
      assert.deepEqual(
        await db.get('a'),
        Buffer.from('b')
      )
    })

    it('can get key buffer from buffer store', async () => {
      const db = await withBufferStore()
      assert.deepEqual(
        await db.get(Buffer.from('a')),
        Buffer.from('b')
      )
    })

    it('can get val buffer from buffer store', async () => {
      const db = await withBufferStore()
      assert.deepEqual(
        await db.get('a', { asBuffer: true }),
        Buffer.from('b')
      )
    })

    it('can get key val buffer from buffer store', async () => {
      const db = await withBufferStore()
      assert.deepEqual(
        await db.get(Buffer.from('a'), { asBuffer: true }),
        Buffer.from('b')
      )
    })

    it("can't get non-existant", async () => {
      const db = await withEmptyStore()
      await reversePromise(db.get('a', { asBuffer: false }))
    })

    it('can del', async () => {
      const db = await withStore()
      await db.del('a')
    })

    it('can del deep', async () => {
      const db = await withDeepStore()
      await db.del('a')
    })

    it('can del buffer', async () => {
      const db = await withStore()
      await db.del(Buffer.from('a'))
    })

    it('can del from buffer store', async () => {
      const db = await withBufferStore()
      await db.del('a')
    })

    it('can del buffer', async () => {
      const db = await withBufferStore()
      await db.del(Buffer.from('a'))
    })

    it("can't del non-existant", async () => {
      const db = await withEmptyStore()
      await reversePromise(db.del('a'))
    })

    it('can batch/iterator', async () => {
      const db = await withEmptyStore()
      let validation = {
        c: 'd',
        e: 'f',
      }

      await db.batch()
        .put('a', 'b')
        .put('c', 'd')
        .del('a')
        .put('e', 'f')
        .write()

      const data = await streamPromise<{ key: string, value: string }>(
        db.createReadStream({
          keysAsBuffer: false,
          valuesAsBuffer: false,
        })
      )
      for (const d of data) {
        assert.deepEqual(
          validation[d.key.toString()],
          d.value.toString()
        )
        delete validation[d.key.toString()]
      }
      assert.deepEqual(
        validation,
        {}
      )
    })

    it('can iterate empty', async () => {
      const db = await withEmptyStore()

      const data = await streamPromise<{ key: string, value: string }>(
        db.createReadStream({
          keysAsBuffer: false,
          valuesAsBuffer: false,
        })
      )
      for (const d of data) {
        assert.fail("Got something, expected nothing")
      }
    })

    it('can iterate while mutating', async () => {
      const db = await withEmptyStore()
      await Promise.all([
        db.put('a', 'b'),
        new Promise((resolve, reject) => {
          db.createReadStream({
            keysAsBuffer: false,
            valuesAsBuffer: false,
          }).on('data', (data) => {
          }).on('end', (data) => {
            resolve()
          })
        })
      ])
    })

    it('can batch/iterator with buffers', async () => {
      const db = await withEmptyStore()
      let validation = {
        [Buffer.from('c') as any]: Buffer.from('d'),
        [Buffer.from('e') as any]: Buffer.from('f'),
      }

      await db.batch()
        .put(Buffer.from('a'), Buffer.from('b'))
        .put(Buffer.from('c'), Buffer.from('d'))
        .del(Buffer.from('a'))
        .put(Buffer.from('e'), Buffer.from('f'))
        .write()

      const data = await streamPromise<{ key: Buffer, value: Buffer }>(
        db.createReadStream({
          keysAsBuffer: true,
          valuesAsBuffer: true,
        })
      )
      for (const d of data) {
        assert.deepEqual(
          validation[d.key as any],
          Buffer.from(d.value)
        )
        delete validation[d.key as any]
      }
      assert.deepEqual(
        validation,
        {}
      )
    })

    it('can batch/iterator range', async () => {
      const db = await withEmptyStore()

      let validation = {
        'c': 'd',
        'e': 'f',
      }

      await db.batch()
        .put('a', 'b')
        .put('c', 'd')
        .put('e', 'f')
        .put('f', 'q')
        .write()

      const data = await streamPromise<{ key: string, value: string }>(
        db.createReadStream({
          keysAsBuffer: false,
          valuesAsBuffer: false,
          gte: 'c',
          lte: 'e',
        })
      )
      for (const d of data) {
        assert.deepEqual(
          validation[String(d.key)],
          String(d.value)
        )
        delete validation[d.key]
      }
      assert.deepEqual(
        validation,
        {}
      )
    })
  })
}
