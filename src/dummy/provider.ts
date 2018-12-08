/**
 * Note: The challenge here is that iterators need to be able to mutate--that-is
 *  if it has changed since the last time, re-calling next() should still result
 *  in the next value.
 */

import { BaseProvider, BaseProviderInstance, BaseIterator } from '../base/provider'
import { MaybeId, KeyVal } from '../base/types'

class DummyIterator implements BaseIterator<string, object> {
  _provider: DummyProviderInstance
  _i: number

  constructor(provider: DummyProviderInstance, start: number) {
    this._provider = provider
    this._i = start
  }
  async next(): Promise<KeyVal<string, object>> {
    const key = Object.keys(this._provider._store).sort()[this._i++]
    const value = await this._provider.get(key)
    return { key, value }
  }
  async prev (): Promise<KeyVal<string, object>> {
    const key = Object.keys(this._provider._store).sort()[this._i--]
    const value = await this._provider.get(key)
    return { key, value }
  }
  done (): boolean {
    return this._i < 0 || this._i >= Object.keys(this._provider._store).length
  }
}

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

  begin(): BaseIterator<string, object> {
    return new DummyIterator(
      this,
      0
    )
  }

  gt(k: string): BaseIterator<string, object> {
    const sortedKeys = Object.keys(this._store).concat(k).sort()
    let ind = sortedKeys.indexOf(k)
    ind = Math.min(
      ind + 1,
      Object.keys(this._store).length
    )

    return new DummyIterator(
      this,
      ind
    )
  }

  ge(k: string): BaseIterator<string, object> {
    const sortedKeys = Object.keys(this._store).concat(k).sort()
    let ind = sortedKeys.indexOf(k)
    return new DummyIterator(
      this,
      ind
    )
  }

  le(k: string): BaseIterator<string, object> {
    const sortedKeys = Object.keys(this._store).concat(k).sort()
    let ind = sortedKeys.indexOf(k)
    if (sortedKeys[ind + 1] !== k)
      ind = Math.max(ind - 1, 0)

    return new DummyIterator(
      this,
      ind
    )
  }

  lt(k: string): BaseIterator<string, object> {
    const sortedKeys = Object.keys(this._store).concat(k).sort()
    let ind = sortedKeys.indexOf(k)
    ind = Math.max(
      ind - 1,
      0
    )

    return new DummyIterator(
      this,
      ind
    )
  }

  end(): BaseIterator<string, object> {
    return new DummyIterator(
      this,
      Object.keys(this._store).length - 1
    )
  }
}

export const DummyProvider = DummyProviderInstance as BaseProvider<string, object, undefined>
