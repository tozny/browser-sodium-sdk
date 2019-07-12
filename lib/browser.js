import * as Storage from './index'

global.Tozny = Object.assign(global.Tozny || {}, { Storage })
global.tozStore = global.Tozny.Storage
global.tozStore.sodiumCrypto = global.Tozny.Storage.Client.crypto
global.tozStore.tozStoreTypes = global.Tozny.Storage.types
