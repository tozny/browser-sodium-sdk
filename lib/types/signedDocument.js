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
 * Represents a signed document with an attached signature
 *
 * @property {Serializable} document
 * @property {string}       signature
 */
export default class SignedDocument extends Signable {
  constructor(document, signature) {
    super()

    this.document = document
    this.signature = signature
  }

  /**
   * Generate a JSON.stringify-friendly version of the object
   * automatically omitting any `null` fields.
   *
   * @returns {object}
   */
  serializable() {
    let toSerialize = {
      doc: this.document,
      sig: this.signature
    }

    return toSerialize
  }

  /**
   * Specify how an already unserialized JSON array should be marshaled into
   * an object representation.
   *
   * <code>
   * signedDocument = SignedDocument.decode({
   *   'doc': {},
   *   'sig': {}
   * })
   * </code>
   *
   * @param {object} json
   *
   * @return {Promise<SignedDocument>}
   */
  static decode(json) {
    let signedDocument = new SignedDocument(json.doc, json.sig)

    return Promise.resolve(signedDocument)
  }
}
