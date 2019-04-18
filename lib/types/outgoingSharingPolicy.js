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

/**
 * Information about a specific E3DB client, including the client's
 * public key to be used for cryptographic operations.
 *
 * @property {string} readerId      Unique ID of the writer that shared with this client
 * @property {string} recordType    Type of record shared with this client
 * @property {string} [readerName]  Display name of the writer, if available
 */
export default class OutgoingSharingPolicy {
  constructor(readerId, recordType, readerName = null) {
    this.readerId = readerId
    this.recordType = recordType
    this.readerName = readerName
  }

  /**
   * Specify how an already unserialized JSON array should be marshaled into
   * an object representation.
   *
   * Client information contains the ID of the client, a Curve25519 public key
   * component, and a flag describing whether or not the client has been validated.
   *
   * <code>
   * isp = OutgoingSharingPolicy::decode({
   *   reader_id: '',
   *   record_type: '',
   *   reader_name: ''
   * })
   * <code>
   *
   * @param {object} json
   *
   * @return {Promise<OutgoingSharingPolicy>}
   */
  static async decode(json) {
    return Promise.resolve(
      new OutgoingSharingPolicy(json.reader_id, json.record_type, json.reader_name)
    )
  }
}
