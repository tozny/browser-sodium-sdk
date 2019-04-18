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

import { default as EAKInfo } from './eakInfo'
import { default as Meta } from './meta'
import { default as Record } from './record'

/**
 * Describe a query result returned from E3DB API.
 */
export default class QueryResult {
  constructor(client, query, crypto) {
    this.afterIndex = 0
    this.client = client
    this.query = query
    this.done = false
    this.crypto = crypto
  }

  /**
   * Get the next page of results from the current query
   *
   * @returns {Promise<array>}
   */
  async next() {
    // Finished iteration, exit early
    if (this.done) {
      return Promise.resolve([])
    }

    let query = this.query
    query.afterIndex = this.afterIndex

    let response = await this.client._query(query)
    // If we've reached the last page, keep track and exit
    if (response.results.length === 0) {
      this.done = true
      return Promise.resolve([])
    }

    /* eslint-disable */
    let records = await Promise.all(
      response.results.map(async result => {
        let meta = await Meta.decode(result.meta)
        let record = new Record(meta, result.record_data)
        if (query.includeData && result.access_key !== null) {
          let eak = await EAKInfo.decode(result.access_key)
          let ak = await this.crypto.decryptEak(
            this.client.config.privateKey,
            eak
          )
          return this.crypto.decryptEak(
            this.client.config.privateKey,
            eak
          ).then(ak => this.crypto.decryptRecord(record, ak))
        }

        return Promise.resolve(record)
      })
    )
    /* eslint-enable */

    this.afterIndex = response.last_index

    return Promise.resolve(records)
  }
}
