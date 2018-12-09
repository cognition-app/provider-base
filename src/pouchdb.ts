import * as PouchDB from 'pouchdb-browser'
import * as PouchLevelDB from 'pouchdb-adapter-leveldb-core';
import { ProviderToLevelDOWN } from './leveldown';
import { BaseProvider } from './provider';
import { StringOrBuffer } from './types';

export function ProviderToPouchDB<
  K extends StringOrBuffer, V, O
>(
  Provider: BaseProvider<K, V, O>
) {
  const BaseLevelDOWN = ProviderToLevelDOWN<K, V, O>(Provider)
  return (options: O) => (location: string) => {
    // TODO: Note that this creates a new PouchDB adapter for every configuration option + location + provider
    //       this is the only way I can ensure options get passed properly down to the underlying Provider.
    const adapterName = Provider.name + '-' + location

    const BasePouchDBAdapter: any = Object.assign(
      function (opts, callback) {
        PouchLevelDB.call(this, {
          ...opts,
          db: BaseLevelDOWN(options),
        }, callback)
      },
      {
        use_prefix: false,
        valid: () => true,
      }
    )

    PouchDB.plugin(
      (
        (PouchDB) => PouchDB.adapter(adapterName, BasePouchDBAdapter, true)
      ) as any as PouchDB.Plugin
    )

    return new PouchDB(location, {adapter: adapterName})
  }
}
