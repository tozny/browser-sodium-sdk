/**
 * This program provides a simple example illustrating how to programmatically
 * register a client with InnoVault and e3db. In some situations, it's preferable
 * to register a client from the server or system that will be using its
 * credentials (to ensure that all data is truly encrypted from end-to-end
 * with no possibilities of a credential leak). For more detailed information,
 * please see the documentation home page: https://tozny.com/documentation/e3db
 *
 * @author    Eric Mann <eric@tozny.com>
 * @copyright Copyright (c) 2017 Tozny, LLC
 * @license   Public Domain
*/
const innovault = require('../dist/node-sodium.js')
require('dotenv').config()


async function main() {
  /**
   * ---------------------------------------------------------
   * Initialization
   * ---------------------------------------------------------
   */

  // A registration token is required to set up a client. In this situation,
  // we assume an environment variable called REGISTRATION_TOKEN is set
  let token = process.env.REGISTRATION_TOKEN
  let apiUrl = process.env.API_URL || 'https://api.e3db.com'
  
  let crypto = innovault.crypto

  let cryptoKeys = await crypto.generateKeypair()
  let signingKeys = await crypto.generateSigningKeypair()
  let cryptoKeys2 = await crypto.generateKeypair()
  let signingKeys2 = await crypto.generateSigningKeypair()

  let cryptoKeys3 = await crypto.generateKeypair()
  let cryptoKeys4 = await crypto.generateKeypair()

  // Clients must be registered with a name unique to your account to help
  // differentiate between different sets of credentials in the Admin Console.
  // In this example, the name is set at random

  let clientName1 = 'example_client_' + Math.random().toString(36).substr(2)
  let clientName2 = 'example_client_' + Math.random().toString(36).substr(2)
  let clientName3 = 'example_client_' + Math.random().toString(36).substr(2)
  let clientName4 = 'example_client_' + Math.random().toString(36).substr(2)

  // let clientName = 'clientE02'

  // Passing all of the data above into the registration routine will create
  // a new client with the system. Remember to keep your private key private!

  // Register a v2 client without backup.
  let clientInfo1 = await innovault.Client.register(
    token, 
    clientName1, 
    cryptoKeys, 
    signingKeys, 
    false, 
    apiUrl)

  // Register a v2 client with backup.
  let clientInfo2 = await innovault.Client.register(
    token, 
    clientName2, 
    cryptoKeys2, 
    signingKeys2, 
    true, 
    apiUrl)

  // Register a v1 client without backup.  
  let clientInfo3 = await innovault.Client.register(
    token, 
    clientName3, 
    cryptoKeys3, 
    null, 
    false, 
    apiUrl)

  // Register a v1 client with backup.  
  let clientInfo4 = await innovault.Client.register(
    token, 
    clientName4, 
    cryptoKeys4, 
    null, 
    true, 
    apiUrl)

  // Optionally, you can automatically back up the credentials of the newly-created
  // client to your InnoVault account (accessible via https://console.tozny.com) by
  // passing your private key and a backup flag when registering. The private key is
  // not sent anywhere, but is used by the newly-created client to sign an encrypted
  // copy of its credentials that is itself stored in e3db for later use.
  //
  // Client credentials are not backed up by default.

  console.log('registered a v2 client without backup')
  console.log(clientInfo1)
  console.log('\n')

  console.log('registered a v2 client with backup')
  console.log(clientInfo2)
  console.log('\n')

  console.log('registered a v1 client without backup')
  console.log(clientInfo3)
  console.log('\n')

  console.log('registered a v1 client with backup')
  console.log(clientInfo4)
  console.log('\n')

  /**
   * ---------------------------------------------------------
   * Usage
   * ---------------------------------------------------------
   */

  // Once the client is registered, you can use it immediately to create the
  // configuration used to instantiate a Client that can communicate with
  // e3db directly.

  // console.log(process.env.CLIENT01_JSON)

  // Create a Config by manually entering registered client's credentials as params.

  let config1 = new innovault.Config(
      clientInfo1.clientId,
      clientInfo1.apiKeyId,
      clientInfo1.apiSecret,
      clientInfo1.publicKey,
      cryptoKeys.privateKey,
      apiUrl,
      clientInfo1.signingKey,
      signingKeys.privateKey
  )
  // Now create a client using that config.
  let client1 = new innovault.Client(config1)

  console.log('created a client with manually passed client credentials')
  console.log(client1)
  console.log('\n')
  
  // Create a Config by passing a JSON.
  let config2 = innovault.Config.fromObject(process.env.CLIENT01_JSON)

  // Now create a client using that config.
  let client2 = new innovault.Client(config2)

  console.log('created a client with json of credentials')
  console.log(client2)

  // From this point on, the new client can be used as any other client to read
  // write, delete, and query for records. See the `simple.js` documentation
  // for more complete examples ...
}

main()
