import { Buffer } from 'safe-buffer';

export type StringOrBuffer = string | Buffer

export type MaybeNull<T> = T | null
export type MaybeString<T> = T | string
export type MaybeBuffer<T> = T | Buffer
export type MaybeId<T> = {
  [P in keyof T]?: T[P]
} & {
  _id?: string
}

export type KeyVal<K, V> = {
  key: K
  value: V
}
