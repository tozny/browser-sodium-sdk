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

const DEFAULT_API_URL = 'https://api.e3db.com'

/**
 * Configuration and credentials for E3DB.
 *
 * @property {number} version          The version number of the configuration format (currently 1)
 * @property {string} clientId         The client's unique client identifier
 * @property {string} apiKeyId         The client's non-secret API key component
 * @property {string} apiSecret        The client's confidential API key component
 * @property {string} publicKey        The client's Base64URL encoded Curve25519 public key
 * @property {string} privateKey       The client's Base64URL encoded Curve25519 private key
 * @property {string} [apiUrl]         Optional base URL for the E3DB API service
 * @property {string} [publicSignKey]  The client's Base64URL encoded Ed25519 public key
 * @property {string} [privateSignKey] The client's Base64URL encoded Ed25519 private key
 */

export default class Config {
  static fromObject(obj) {
    if (typeof obj === 'string') {
      try {
        obj = JSON.parse(obj)
      } catch (err) {
        throw new Error('Config.fromObject param JSON string could not be parsed.')
      }
    }
    const apiUrl = obj.apiUrl || obj.api_url
    const apiKeyId = obj.apiKeyId || obj.api_key_id
    const apiSecret = obj.apiSecret || obj.api_secret
    const clientId = obj.clientId || obj.client_id
    const publicKey = obj.publicKey || obj.public_key
    const privateKey = obj.privateKey || obj.private_key
    const publicSignKey = obj.publicSignKey || obj.public_sign_key
    const privateSignKey = obj.privateSignKey || obj.private_sign_key
    if (!(clientId || apiKeyId || apiSecret || publicKey || privateKey || apiUrl)) {
      throw new Error('incomplete configuration object.')
    } else if (publicSignKey === '' || privateSignKey === '') {
      return new Config(clientId, apiKeyId, apiSecret, publicKey, privateKey, apiUrl)
    } else {
      return new Config(
        clientId,
        apiKeyId,
        apiSecret,
        publicKey,
        privateKey,
        apiUrl,
        publicSignKey,
        privateSignKey
      )
    }
  }

  constructor(
    clientId,
    apiKeyId,
    apiSecret,
    publicKey,
    privateKey,
    apiUrl = DEFAULT_API_URL,
    publicSignKey = '',
    privateSignKey = ''
  ) {
    if (!clientId || !apiKeyId || !apiSecret || !publicKey || !privateKey) {
      throw new Error(
        'Necessary client credentials missing. Likely missing params or incorrect data types passed, expects strings. Did you mean to use .fromObject()?'
      )
    }
    if (publicSignKey === '' || privateSignKey === '') {
      this.version = 1
    } else {
      this.version = 2
      this.publicSignKey = publicSignKey
      this.privateSignKey = privateSignKey
    }

    this.clientId = clientId
    this.apiKeyId = apiKeyId
    this.apiSecret = apiSecret
    this.publicKey = publicKey
    this.privateKey = privateKey
    this.apiUrl = apiUrl
  }
}
