import { KeyVal, MaybeId } from './types'

export type IteratorOptions<K> = {
  lte?: K
  gte?: K
  limit?: number
}

export interface BaseProviderInstance<K, V> {
  get(k: K): Promise <V>
  put(k: K, v: MaybeId<V>): Promise <V>
  del(k: K): Promise<void>

  forward(opts: {gt: K, ge: K}): Iterator<KeyVal<K, Promise<V>>>
  reverse(opts: {lt: K, le: K}): Iterator<KeyVal<K, Promise<V>>>
}

export interface BaseProvider<K, V, O> {
  name: string

  new(opts: O): BaseProviderInstance<K, V>
}
