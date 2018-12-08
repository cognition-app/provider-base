import { AbstractGetOptions, AbstractIterator, AbstractLevelDOWN, AbstractOpenOptions, AbstractOptions, ErrorCallback, ErrorKeyValueCallback } from 'abstract-leveldown';
import * as ltgt from 'ltgt';
import { Buffer } from 'safe-buffer';
import { BaseIterator, BaseProvider, BaseProviderInstance } from './provider';
import { KeyVal, MaybeString, MaybeBuffer, MaybeNull, StringOrBuffer } from './types';

enum LevelOpType {
  PUT = 'put',
  DEL = 'del'
}
type LevelOp<K, V> = {
  key: K;
  value: V;
  type: LevelOpType;
}

type AbstractIteratorOptions = {
  keyAsBuffer?: boolean
  valueAsBuffer?: boolean
  limit?: number
  reverse?: boolean
}

export function ProviderToLevelDOWN<
  K extends StringOrBuffer, V, O
>(
  Provider: BaseProvider<K, V, O>
) {
  class BaseLevelDOWNIterator<K extends StringOrBuffer, V> extends AbstractIterator<K, V> {
    // Based on https://github.com/Level/memdown/blob/master/memdown.js

    _iterator: BaseIterator<K, V>
    _limit: number
    _reverse: boolean
    _options: AbstractIteratorOptions
    _done: number
    _incr: (it: BaseIterator<K, V>) => Promise<KeyVal<K, V>>
    _lowerBound: K
    _upperBound: K
    keyAsBuffer: boolean
    valueAsBuffer: boolean

    constructor(db, options: AbstractIteratorOptions) {
      super(options)

      this.db = db
      this._limit = options.limit

      if (this._limit === -1) this._limit = Infinity

      var tree = db._provider

      this.keyAsBuffer = options.keyAsBuffer !== false
      this.valueAsBuffer = options.valueAsBuffer !== false
      this._reverse = options.reverse
      this._options = options
      this._done = 0

      if (!this._reverse) {
        this._incr = (it: BaseIterator<K, V>) => it.next()
        this._lowerBound = ltgt.lowerBound(options)
        this._upperBound = ltgt.upperBound(options)

        if (typeof this._lowerBound === 'undefined') {
          this._iterator = tree.begin()
        } else if (ltgt.lowerBoundInclusive(options)) {
          this._iterator = tree.ge(this._lowerBound)
        } else {
          this._iterator = tree.gt(this._lowerBound)
        }

        if (this._upperBound) {
          if (ltgt.upperBoundInclusive(options)) {
            this._test = (k: K) => ltgt.compare(k, this._upperBound) <= 0
          } else {
            this._test = (k: K) => ltgt.compare(k, this._upperBound) < 0
          }
        }
      } else {
        this._incr = (it: BaseIterator<K, V>) => it.prev()
        this._lowerBound = ltgt.upperBound(options)
        this._upperBound = ltgt.lowerBound(options)

        if (typeof this._lowerBound === 'undefined') {
          this._iterator = tree.end()
        } else if (ltgt.upperBoundInclusive(options)) {
          this._iterator = tree.le(this._lowerBound)
        } else {
          this._iterator = tree.lt(this._lowerBound)
        }

        if (this._upperBound) {
          if (ltgt.lowerBoundInclusive(options)) {
            this._test = (k: K) => ltgt.compare(k, this._upperBound) >= 0
          } else {
            this._test = (k: K) => ltgt.compare(k, this._upperBound) > 0
          }
        }
      }
    }

    _next(callback: ErrorKeyValueCallback<K, V>): void {
      if (this._done++ >= this._limit)
        return process.nextTick(callback)
      if (this._iterator.done())
        return process.nextTick(callback)

      this._incr(this._iterator).then((kv: MaybeNull<KeyVal<K, V>>) => {
        if(kv === undefined) {
          return process.nextTick(callback)
        } else {
          let { key, value }: { key: MaybeBuffer<K>, value: MaybeBuffer<V>} = kv

          if(!this._test(key))
            return process.nextTick(callback)

          if(this.keyAsBuffer && !Buffer.isBuffer(key))
            key = Buffer.from(key.toString()) as MaybeBuffer<K>

          if(this.valueAsBuffer && !Buffer.isBuffer(value))
            value = Buffer.from(value.toString()) as MaybeBuffer<V>

          return process.nextTick(callback, null, key, value)
        }
      }).catch((error) => {
        return process.nextTick(callback, error)
      })
    }

    _test(k: K): boolean {
      return true
    }
  }

  class BaseLevelDOWN extends AbstractLevelDOWN<K, V> {
    _provider: BaseProviderInstance<K, V>

    constructor(location: string, opts: O) {
      super(location)

      this._provider = new Provider(opts)
    }

    _open(opts: AbstractOpenOptions, callback) {
      process.nextTick(callback, null, this)
    }

    _get(k: K, opts: AbstractGetOptions, callback) {
      // TODO: handle opts
      this._provider.get(k).then((value: MaybeBuffer<V>) => {
        if(typeof value === 'undefined')
          return process.nextTick(callback, new Error('NotFound'))

        if (opts.asBuffer !== false && !Buffer.isBuffer(value)) {
          value = Buffer.from(String(value)) as MaybeBuffer<V>
        }

        return process.nextTick(callback, null, value)
      }).catch((err) => {
        process.nextTick(callback, err)
      })
    }

    _put(k: K, v: V, opts: AbstractOptions, callback) {
      // TODO: handle opts
      this._provider.put(k, v).then(() => {
        process.nextTick(callback)
      }).catch((err) => {
        process.nextTick(callback, err)
      })
    }

    _del(k: K, opts, callback) {
      // TODO: handle opts
      this._provider.del(k).then(() => {
        process.nextTick(callback)
      }).catch((err) => {
        process.nextTick(callback, err)
      })
    }

    _batch(ops: LevelOp<K, V>[], opts, callback) {
      Promise.all(
        ops.map((op) => (
          new Promise((resolve, reject) => {
            if (op.type === LevelOpType.PUT) {
              this.put(op.key, op.value, opts, ((err, res) => {
                if (err !== null) {
                  reject(err)
                } else {
                  resolve(res)
                }
              }) as ErrorCallback)
            } else {
              this.del(op.key, opts, ((err, res) => {
                if (err !== null) {
                  reject(err)
                } else {
                  resolve(res)
                }
              }) as ErrorCallback)
            }
          })
        ))
      ).then((results) => {
        process.nextTick(callback, null, results)
      }).catch((err) => {
        process.nextTick(callback, err, null)
      })
    }

    _iterator(opts: AbstractIteratorOptions) {
      return new BaseLevelDOWNIterator<K, V>(this, opts)
    }

    _serializeKey(k: K) {
      return k
    }

    _serializeValue(value?: MaybeNull<V>): MaybeString<V> {
      return value == null ? '' : value
    }
  }

  return (opts: O) => (location: string) => new BaseLevelDOWN(location, opts)
}
