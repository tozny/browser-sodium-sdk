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

const DEFAULT_QUERY_COUNT = 100

/**
 * Describe a query request against the E3DB API.
 */
export default class Query extends Serializable {
  constructor(
    afterIndex = 0,
    includeData = false,
    writerIds = null,
    recordIds = null,
    contentTypes = null,
    plain = null,
    userIds = null,
    count = DEFAULT_QUERY_COUNT,
    includeAllWriters = false
  ) {
    super()

    this.afterIndex = afterIndex
    this.includeData = includeData
    this.writerIds = writerIds
    this.recordIds = recordIds
    this.contentTypes = contentTypes
    this.userIds = userIds
    this.count = count
    this.includeAllWriters = includeAllWriters

    if (writerIds instanceof Array) {
      this.writerIds = writerIds
    } else if (writerIds !== null) {
      this.writerIds = [writerIds]
    }

    if (recordIds instanceof Array) {
      this.recordIds = recordIds
    } else if (recordIds !== null) {
      this.recordIds = [recordIds]
    }

    if (contentTypes instanceof Array) {
      this.contentTypes = contentTypes
    } else if (contentTypes !== null) {
      this.contentTypes = [contentTypes]
    }

    if (userIds instanceof Array) {
      this.userIds = userIds
    } else if (userIds !== null) {
      this.userIds = [userIds]
    }

    if (typeof plain === 'object') {
      this.plain = plain
    } else {
      this.plain = null
    }
  }

  /* eslint-disable camelcase */

  /**
   * Generate a JSON.stringify-friendly version of the object
   * automatically omitting any `null` fields.
   *
   * @returns {object}
   */
  serializable() {
    let toSerialize = {}

    if (this.count !== null) {
      toSerialize.count = this.count
    }
    if (this.includeData !== null) {
      toSerialize.include_data = Boolean(this.includeData)
    }
    if (this.writerIds !== null && this.writerIds.length > 0) {
      toSerialize.writer_ids = this.writerIds
    }
    if (this.userIds !== null && this.userIds.length > 0) {
      toSerialize.user_ids = this.userIds
    }
    if (this.recordIds !== null && this.recordIds.length > 0) {
      toSerialize.record_ids = this.recordIds
    }
    if (this.contentTypes !== null && this.contentTypes.length > 0) {
      toSerialize.content_types = this.contentTypes
    }
    if (this.plain !== null) {
      toSerialize.plain = this.plain
    }
    if (this.afterIndex !== null) {
      toSerialize.after_index = this.afterIndex
    }
    if (this.includeAllWriters !== null) {
      toSerialize.include_all_writers = Boolean(this.includeAllWriters)
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
}
