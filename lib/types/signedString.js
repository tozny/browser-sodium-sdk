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

/**
 * Represents a signed string
 *
 * @property {string} value
 */
export default class SignedString extends Signable {
  constructor(value) {
    super()

    this.value = value
  }

  /**
   * Serialize the object to JSON
   *
   * @returns {string}
   */
  stringify() {
    return this.value
  }
}
