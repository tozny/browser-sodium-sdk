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

import { default as Meta } from './meta'
import { default as RecordData } from './recordData'
import { default as Signable } from './signable'

/**
 * A E3DB record containing data and metadata. Records are
 * a key/value mapping containing data serialized
 * into strings. All records are encrypted prior to sending them
 * to the server for storage, and decrypted in the client after
 * they are read.
 *
 * @property {Meta}       meta      Meta information about the record.
 * @property {RecordData} data      Either plaintext or encrypted record fields
 * @property {string}     signature Signature over unencrypted record data
 */
export default class Record extends Signable {
  constructor(meta, data, signature = null) {
    super()

    if (meta instanceof Meta) {
      this.meta = meta
    } else {
      throw new Error('Record meta must be a Meta object!')
    }

    if (data instanceof RecordData || data === null) {
      this.data = data
    } else if (data instanceof Object) {
      this.data = new RecordData(data)
    } else {
      throw new Error('Record data must be an object!')
    }

    this.signature = signature
  }

  /* eslint-disable camelcase */

  /**
   * Generate a JSON.stringify-friendly version of the object
   * automatically omitting any `null` fields.
   *
   * @returns {object}
   */
  serializable() {
    return {
      meta: this.meta.serializable(),
      data: this.data.serializable(),
      rec_sig: this.signature
    }
  }

  /* eslint-enabled */

  /**
   * Specify how an already unserialized JSON array should be marshaled into
   * an object representation.
   *
   * Records consist of two elements, meta and data. The array we deserialize into a Record instance
   * must match this format. The meta element is itself an array representing the Meta class. The
   * data element is a simpler array mapping string keys to either encrypted or plaintext string values.
   *
   * <code>
   * record = Record::decode({
   *   meta: {
   *     record_id:     '',
   *     writer_id:     '',
   *     user_id:       '',
   *     type:          '',
   *     plain:         {},
   *     created:       '',
   *     last_modified: '',
   *     version:       ''
   *   },
   *   data: {
   *     key1: 'value',
   *     key2: 'value'
   *   },
   *   rec_sig: ''
   * })
   * </code>
   *
   * @param {array} parsed
   *
   * @return {Promise<Record>}
   */
  static async decode(json) {
    let meta = await Meta.decode(json.meta)
    let signature = json.rec_sig === undefined ? null : json.rec_sig

    return Promise.resolve(new Record(meta, json.data, signature))
  }
}
