import ClientInterface from './index'
import SodiumCrypto from './SodiumCrypto'

// Helpers would be defined elsewhere. This essentially allows you to do things like in node have helpers that understand profiles and load up clients from our standard storage location.
const specialHelpers = {
  method1() {},
  method2() {}
}

// Must create a crypto instance.
// The node SDK configuration for crypto type might happen here.
const crypto = new SodiumCrypto()

// Export the correct stuff, with a Client object that understand crypto
module.exports = {
  /* eslint-disable new-cap */
  Client: ClientInterface.Client(crypto),
  /* eslint-enable new-cap */
  Config: ClientInterface.Config,
  crypto: crypto,
  helpers: specialHelpers
}
