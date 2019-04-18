/*!
 * Tozny e3db
 *
 * LICENSE
 *
 * Tozny dual licenses this product. For commercial use, please contact
 * info@tozny.com. For non-commercial use, the contents of this file are
 * subject to the TOZNY NON-COMMERCIAL LICENSE (the "License") which
 * permits use of the software only by government agencies, schools,
 * universities, non-profit organizations or individuals on projects that
 * do not receive external funding other than government research grants
 * and contracts.  Any other use requires a commercial license. You may
 * not use this file except in compliance with the License. You may obtain
 * a copy of the License at https://tozny.com/legal/non-commercial-license.
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See the
 * License for the specific language governing rights and limitations under
 * the License. Portions of the software are Copyright (c) TOZNY LLC, 2017.
 * All rights reserved.
 *
 * @copyright Copyright (c) 2017 Tozny, LLC (https://tozny.com)
 */

'use strict'

import { default as PublicKey } from './publicKey'
import { default as SigningKey } from './signingKey'

/**
 * Full information about a specific E3DB client, including the client's
 * public/private keys for cryptographic operations and API credentials.
 *
 * @property {string}     clientId   UUID representing the client.
 * @property {string}     apiKeyId   API key to be used when authenticating with e3db
 * @property {string}     apiSecret  API password to be used when authenticating with e3db
 * @property {PublicKey}  publicKey  Curve25519 public key for the client.
 * @property {string}     name       Description of the client
 * @property {SigningKey} signingKey Ed25519 public key for the client.
 */
export default class ClientDetails {
  constructor(clientId, apiKeyId, apiSecret, publicKey, name, signingKey = null) {
    this.clientId = clientId
    this.apiKeyId = apiKeyId
    this.apiSecret = apiSecret
    this.publicKey = publicKey
    this.name = name

    if (signingKey === null) {
      signingKey = new SigningKey(null)
    }

    this.signingKey = signingKey
  }

  /**
   * Specify how an already unserialized JSON array should be marshaled into
   * an object representation.
   *
   * Client information contains the ID of the client, API credentials for interacting
   * with the e3db server, a Curve25519 public key component, and a description of the
   * client as specified during creation.
   *
   * <code>
   * info = ClientDetails::decode({
   *   client_id: '',
   *   api_key_id: '',
   *   api_secret: '',
   *   public_key: {
   *     curve25519: ''
   *   },
   *   signing_key: {
   *     ed25519: ''
   *   },
   *   name: ''
   * })
   * <code>
   *
   * @param {object} json
   *
   * @return {Promise<ClientDetails>}
   */
  static async decode(json) {
    let publicKey = await PublicKey.decode(json.public_key)

    let signingKey = new SigningKey(null)
    if (json.hasOwnProperty('signing_key')) {
      signingKey = await SigningKey.decode(json.signing_key)
    }

    return Promise.resolve(
      new ClientDetails(
        json.client_id,
        json.api_key_id,
        json.api_secret,
        publicKey,
        json.name,
        signingKey
      )
    )
  }
}
