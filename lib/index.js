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
 * Root types
 */
import { default as Client } from './client'
import { default as Config } from './config'
import { default as SodiumCrypto } from './SodiumCrypto'
import { default as EAKInfo } from './types/eakInfo'

const ClientInterface = {
  Client,
  Config,
  SodiumCrypto
}

// Helpers would be defined elsewhere. This essentially allows you to do things like in node have helpers that understand profiles and load up clients from our standard storage location.
const specialHelpers = {
  method1() {},
  method2() {}
}

// Must create a crypto instance.
// The node SDK configuration for crypto type might happen here.
const crypto = new SodiumCrypto()

// Export the correct stuff, with a Client object that understand crypto
module.exports = {
  /* eslint-disable new-cap */
  Client: ClientInterface.Client(crypto),
  /* eslint-enable new-cap */
  Config: ClientInterface.Config,
  crypto: crypto,
  helpers: specialHelpers,
  EAKInfo: EAKInfo
}

/**
 * Primitive types
 */
export { default as Meta } from './types/meta'
export { default as Record } from './types/record'
export { default as RecordData } from './types/recordData'
export { default as RecordInfo } from './types/recordInfo'
export { default as SignedDocument } from './types/signedDocument'
export { default as SignedString } from './types/signedString'
