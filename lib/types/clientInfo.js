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
 * Information about a specific E3DB client, including the client's
 * public key to be used for cryptographic operations.
 *
 * @property {string}     clientId   UUID representing the client.
 * @property {PublicKey}  publicKey  Curve25519 public key for the client.
 * @property {bool}       validated  Flag whether or not the client has been validated.
 * @property {SigningKey} signingKey Ed25519 public key for the client.
 */
export default class ClientInfo {
  constructor(clientId, publicKey, validated, signingKey) {
    this.clientId = clientId
    this.publicKey = publicKey
    this.valdiated = validated

    if (signingKey === null) {
      signingKey = new SigningKey(null)
    }

    this.signingKey = signingKey
  }

  /**
   * Specify how an already unserialized JSON array should be marshaled into
   * an object representation.
   *
   * Client information contains the ID of the client, a Curve25519 public key
   * component, and a flag describing whether or not the client has been validated.
   *
   * <code>
   * info = ClientInfo::decode({
   *   client_id: '',
   *   public_key: {
   *     curve25519: ''
   *   },
   *   signing_key: {
   *     ed25519: ''
   *   },
   *   validated: true
   * })
   * <code>
   *
   * @param {object} json
   *
   * @return {Promise<ClientInfo>}
   */
  static async decode(json) {
    let publicKey = await PublicKey.decode(json.public_key)

    let signingKey = new SigningKey(null)
    if (json.hasOwnProperty('signing_key') && json.signing_key !== null) {
      signingKey = await SigningKey.decode(json.signing_key)
    }

    return Promise.resolve(
      new ClientInfo(json.client_id, publicKey, json.validated, signingKey)
    )
  }
}
