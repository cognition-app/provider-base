/**
 * Note: The challenge here is that iterators need to be able to mutate--that-is
 *  if it has changed since the last time, re-calling next() should still result
 *  in the next value.
 */

import { BaseProvider, BaseProviderInstance } from '../base/provider'
import { MaybeId, KeyVal } from '../base/types'

class DummyProviderInstance implements BaseProviderInstance<
  string, object
  > {
  _store: {
    [k: string]: object
  }
  _keys: string[]

  constructor(opts: undefined) {
    this._store = {}
    this._keys = []
  }

  async get(k: string): Promise<object> {
    return this._store[k]
  }

  async put(k: string, v: MaybeId<object>): Promise<object> {
    this._store[k] = v
    return this._store[k]
  }

  async del(k: string): Promise<void> {
    delete this._store[k]
  }

  *forward(opts?: {gt?: string, ge?: string}): Iterator<KeyVal<string, Promise<object>>> {
    let sortedKeys = Object.keys(this._store).sort()
    if (opts !== undefined) {
      if (opts.gt !== undefined) {
        let ind = [...sortedKeys, opts.gt].sort().indexOf(opts.gt)
        if(sortedKeys[ind] === opts.gt)
          sortedKeys = sortedKeys.slice(ind + 1)
        else
          sortedKeys = sortedKeys.slice(ind + 1)
      } else if (opts.ge !== undefined) {
        let ind = [...sortedKeys, opts.ge].sort().indexOf(opts.ge)
        if (sortedKeys[ind] === opts.ge)
          sortedKeys = sortedKeys.slice(ind)
        else
          sortedKeys = sortedKeys.slice(ind)
      }
    }

    for(const key of sortedKeys) {
      yield {key, value: this.get(key)}
    }
  }

  *reverse(opts?: { lt?: string, le?: string }): Iterator<KeyVal<string, Promise<object>>> {
    let sortedKeys = Object.keys(this._store).sort()
    if (opts !== undefined) {
      if (opts.lt !== undefined) {
        let ind = [...sortedKeys, opts.lt].sort().indexOf(opts.lt)
        if (sortedKeys[ind] === opts.lt)
          sortedKeys = sortedKeys.slice(0, ind)
        else
          sortedKeys = sortedKeys.slice(0, ind)
      } else if (opts.le !== undefined) {
        let ind = [...sortedKeys, opts.le].sort().indexOf(opts.le)
        if (sortedKeys[ind] === opts.le)
          sortedKeys = sortedKeys.slice(0, ind + 1)
        else
          sortedKeys = sortedKeys.slice(0, ind)
      }
    }
    sortedKeys = sortedKeys.reverse()

    for (const key of sortedKeys) {
      yield { key, value: this.get(key) }
    }
  }
}

export const DummyProvider = DummyProviderInstance as BaseProvider<string, object, undefined>
