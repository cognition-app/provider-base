import { KeyVal, MaybeId } from './types'

export type IteratorOptions<K> = {
  lte?: K
  gte?: K
  limit?: number
}

export interface BaseIterator<K, V> {
  next(): Promise<KeyVal<K, V> | null>;
  prev(): Promise<KeyVal<K, V> | null>;
  done(): boolean
}

export interface BaseProviderInstance<K, V> {
  get(k: K): Promise <V>
  put(k: K, v: MaybeId<V>): Promise <V>
  del(k: K): Promise<void>

  begin(): BaseIterator<K, V>
  gt(k: K): BaseIterator<K, V>
  ge(k: K): BaseIterator<K, V>
  le(k: K): BaseIterator<K, V>
  lt(k: K): BaseIterator<K, V>
  end(): BaseIterator<K, V>
}

export interface BaseProvider<K, V, O> {
  name: string

  new(opts: O): BaseProviderInstance<K, V>
}
