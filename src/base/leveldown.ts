import { AbstractGetOptions, AbstractIterator, AbstractLevelDOWN, AbstractOpenOptions, AbstractOptions, ErrorCallback, ErrorKeyValueCallback } from 'abstract-leveldown';
import * as ltgt from 'ltgt';
import { Buffer } from 'safe-buffer';
import { BaseProvider, BaseProviderInstance } from './provider';
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

    _iterator: Iterator<KeyVal<K, Promise<V>>>
    _limit: number
    _reverse: boolean
    _options: AbstractIteratorOptions
    _done: number
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
        this._lowerBound = ltgt.lowerBound(options)
        this._upperBound = ltgt.upperBound(options)

        if(Buffer.isBuffer(this._lowerBound)) {
          this._lowerBound = (<Buffer>this._lowerBound).toString() as K
        }
        if (Buffer.isBuffer(this._upperBound)) {
          this._upperBound = (<Buffer>this._upperBound).toString() as K
        }

        if (typeof this._lowerBound === 'undefined') {
          this._iterator = tree.forward()
        } else if (ltgt.lowerBoundInclusive(options)) {
          this._iterator = tree.forward({ge: this._lowerBound})
        } else {
          this._iterator = tree.forward({gt: this._lowerBound})
        }

        if (this._upperBound) {
          if (ltgt.upperBoundInclusive(options)) {
            this._test = (k: K) => ltgt.compare(k, this._upperBound) <= 0
          } else {
            this._test = (k: K) => ltgt.compare(k, this._upperBound) < 0
          }
        }
      } else {
        this._lowerBound = ltgt.upperBound(options)
        this._upperBound = ltgt.lowerBound(options)

        if (Buffer.isBuffer(this._lowerBound)) {
          this._lowerBound = (<Buffer>this._lowerBound).toString() as K
        }
        if (Buffer.isBuffer(this._upperBound)) {
          this._upperBound = (<Buffer>this._upperBound).toString() as K
        }

        if (typeof this._lowerBound === 'undefined') {
          this._iterator = tree.reverse()
        } else if (ltgt.upperBoundInclusive(options)) {
          this._iterator = tree.reverse({le: this._lowerBound})
        } else {
          this._iterator = tree.reverse({lt: this._lowerBound})
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

    async _next(callback: ErrorKeyValueCallback<K, V>): Promise<void> {
      if (this._done++ >= this._limit)
        return process.nextTick(callback)

      try {
        const kv = this._iterator.next()

        if (kv.done)
          return process.nextTick(callback)

        if (kv.value === undefined) {
            return process.nextTick(callback)
        } else {
          let { key, value }: { key: MaybeBuffer<K>, value: Promise<MaybeBuffer<V>>} = kv.value
          let resolved_value: MaybeBuffer<V> = await value

          if(!this._test(key))
            return process.nextTick(callback)

          if(this.keyAsBuffer && !Buffer.isBuffer(key))
            key = Buffer.from(key.toString()) as MaybeBuffer<K>

          if(this.valueAsBuffer && !Buffer.isBuffer(value))
            resolved_value = Buffer.from(<any>resolved_value)

          return process.nextTick(callback, null, key, resolved_value)
        }
      } catch(error) {
        return process.nextTick(callback, error)
      }
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
