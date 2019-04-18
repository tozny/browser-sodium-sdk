/*!
 * Tozny e3db
 *
 * LICENSE
 *
 * Tozny dual licenses this product. For commercial use, please contact
 * info@tozny.com. For non-commercial use, this license permits use of the
 * software only by government agencies, schools, universities, non-profit
 * organizations or individuals on projects that do not receive external
 * funding other than government research grants and contracts. Any other use
 * requires a commercial license. For the full license, please see LICENSE.md,
 * in this source repository.
 *
 * @copyright Copyright (c) 2017 Tozny, LLC (https://tozny.com)
 */

'use strict'

import { default as Signable } from './signable'

/* eslint-disable camelcase */

/**
 * Represents a signed, encrypted documents
 *
 * @property {object} clientMeta
 * @property {object} recordData
 */
export default class RecordInfo extends Signable {
  constructor(clientMeta, recordData) {
    super()

    this.clientMeta = {
      plain: clientMeta.plain,
      type: clientMeta.type,
      user_id: clientMeta.userId,
      writer_id: clientMeta.writerId
    }
    this.recordData = recordData
  }

  /* eslint-enabled */

  /**
   * Serialize the object to JSON
   *
   * @returns {string}
   */
  stringify() {
    return JSON.stringify(this.clientMeta) + JSON.stringify(this.recordData)
  }
}
