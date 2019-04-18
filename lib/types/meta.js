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

import { default as Serializable } from './serializable'

/**
 * Describe the meta information attributed to a specific encrypted record.
 *
 * @property {string} recordId     Unique ID of the record, or `null` if not yet written
 * @property {string} writerId     Unique ID of the writer of the record
 * @property {string} userId       Unique ID of the subject/user the record is about
 * @property {string} type         Free-form description of thr record content type
 * @property {object} plain        Map of String->String values describing the record's plaintext meta
 * @property {Date}   created      When this record was created, or `null` if unavailable.
 * @property {Date}   lastModified When this record last changed, or `null` if unavailable.
 * @property {string} version      Opaque version identifier created by the server on changes.
 */
export default class Meta extends Serializable {
  constructor(writerId, userId, type, plain) {
    super()

    this.recordId = null
    this.writerId = writerId
    this.userId = userId
    this.type = type
    this.plain = plain
    this.created = null
    this.lastModified = null
    this.version = null
  }

  /* eslint-disable camelcase */

  /**
   * Generate a JSON.stringify-friendly version of the object
   * automatically omitting any `null` fields.
   *
   * @returns {object}
   */
  serializable() {
    let toSerialize = {
      record_id: this.recordId,
      writer_id: this.writerId,
      user_id: this.userId,
      type: this.type,
      created: this.created,
      last_modified: this.lastModified,
      version: this.version
    }

    // Ensure that plain is always an object, even it it's set to null
    if (this.plain === null) {
      toSerialize.plain = {}
    } else {
      toSerialize.plain = this.plain
    }

    for (let key in toSerialize) {
      if (toSerialize.hasOwnProperty(key)) {
        if (toSerialize[key] === null) {
          delete toSerialize[key]
        }
      }
    }

    return toSerialize
  }

  /* eslint-enable */

  /**
   * Specify how an already unserialized JSON array should be marshaled into
   * an object representation.
   *
   * Meta objects consist of both mutable and immutable information describing
   * the record to which they're attached. Ownership, type, and datetime information
   * is fixed and only updated by the server, but the plaintext fields attributed
   * to a record can be controlled by the user. This mutable field is a map of
   * strings to strings (a JSON object) and is stored in plaintext on the
   * server. The array expected for deserializing back into an object requires:
   *
   * <code>
   * $meta = Meta::decode({
   *   'record_id'     => '',
   *   'writer_id'     => '',
   *   'user_id'       => '',
   *   'type'          => '',
   *   'plain'         => {},
   *   'created'       => ''
   *   'last_modified' => ''
   *   'version'       => ''
   * });
   * </code>
   *
   * @param {object} json
   *
   * @return {Promise<Meta>}
   */
  static decode(json) {
    let meta = new Meta(json.writer_id, json.user_id, json.type, json.plain)

    if (json.created === undefined || json.created === null) {
      meta.created = null
    } else {
      meta.created = new Date(json.created)
    }
    if (json.last_modified === undefined || json.last_modified === null) {
      meta.lastModified = null
    } else {
      meta.lastModified = new Date(json.last_modified)
    }

    meta.recordId = json.record_id || null
    meta.version = json.version || null

    return Promise.resolve(meta)
  }
}
