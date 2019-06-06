import { default as ClientInterface, types } from 'e3db-client-interface'
import SodiumCrypto from './SodiumCrypto'

export { default as helpers } from './helpers'

const sodiumCrypto = new SodiumCrypto()
/* eslint-disable-next-line new-cap */
const Config = ClientInterface.Config
/* eslint-disable-next-line new-cap */
const Client = ClientInterface.Client(sodiumCrypto)
const tozStoreTypes = types

const tozStore = {
  Config,
  Client,
  tozStoreTypes,
  sodiumCrypto
}

window.tozStore = tozStore
