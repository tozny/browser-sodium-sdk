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

import 'es6-promise/auto'
import sodium from 'libsodium-wrappers'
import { default as ClientInterface, types } from 'e3db-client-interface'
import base64url from 'base64url'
import md5 from 'js-md5'
const FILE_VERSION = 3
const BLOCK_SIZE = 65536
const { Crypto } = ClientInterface

export default class SodiumCrypto extends Crypto {
  /**
   * Decrypt the access key provided for a specific reader so it can be used
   * to further decrypt a protected record.
   *
   * @param {string} readerKey   Base64url-encoded private key for the reader (current client)
   * @param {EAKInfo} encryptedAk Encrypted access key
   *
   * @return {Promise<string>} Raw binary string of the access key
   */
  async decryptEak(readerKey, encryptedAk) {
    await sodium.ready
    let encodedEak = encryptedAk.eak
    let publicKey = await this.b64decode(encryptedAk.authorizerPublicKey.curve25519)
    let privateKey = await this.b64decode(readerKey)

    let [eak, nonce] = await Promise.all(
      encodedEak.split('.').map(async x => this.b64decode(x))
    )
    return sodium.crypto_box_open_easy(eak, nonce, publicKey, privateKey)
  }

  /**
   * Encrypt an access key for a given reader.
   *
   * @param {string} writerKey Base64url-encoded private key of the writer
   * @param {string} ak        Raw binary string of the access key
   * @param {string} readerKey Base64url-encoded public key of the reader
   *
   * @return {Promise<string>} Encrypted and encoded access key.
   */
  async encryptAk(writerKey, ak, readerKey) {
    await sodium.ready
    let publicKey = await this.b64decode(readerKey)
    let privateKey = await this.b64decode(writerKey)

    let nonce = window.crypto.getRandomValues(
      new Uint8Array(sodium.crypto_secretbox_NONCEBYTES)
    )
    let eak = sodium.crypto_box_easy(ak, nonce, publicKey, privateKey)

    return (await this.b64encode(eak)) + '.' + (await this.b64encode(nonce))
  }

  /**
   * Create a clone of a given record, but decrypting each field in turn based on
   * the provided access key.
   *
   * @param {Record} encrypted Record to be unwrapped
   * @param {string} accessKey Access key to use for decrypting each data key.
   *
   * @return {Promise<Record>}
   */
  async decryptRecord(encrypted, accessKey) {
    await sodium.ready
    // Clone the record meta
    let meta = new types.Meta(
      encrypted.meta.writerId,
      encrypted.meta.userId,
      encrypted.meta.type,
      encrypted.meta.plain
    )
    meta.recordId = encrypted.meta.recordId
    meta.created = encrypted.meta.created
    meta.lastModified = encrypted.meta.lastModified
    meta.version = encrypted.meta.version
    let decrypted = new types.Record(meta, {}, encrypted.signature)

    // Decrypt the record data
    for (let key in encrypted.data) {
      if (encrypted.data.hasOwnProperty(key)) {
        let components = encrypted.data[key].split('.')
        let [edk, edkN, ef, efN] = await Promise.all(
          components.map(async x => this.b64decode(x))
        )

        let dk = sodium.crypto_secretbox_open_easy(edk, edkN, accessKey)
        let field = sodium.crypto_secretbox_open_easy(ef, efN, dk)

        decrypted.data[key] = Buffer.from(field).toString('utf8')
      }
    }

    return decrypted
  }

  /**
   * Create a clone of a plaintext record, encrypting each field in turn with a random
   * data key and protecting the data key with a set access key.
   *
   * @param {Record} record    Record to be encrypted.
   * @param {string} accessKey Access key to use for decrypting each data key.
   *
   * @return {Promise<Record>}
   */
  async encryptRecord(record, accessKey) {
    await sodium.ready
    // Clone the record meta
    let meta = new types.Meta(
      record.meta.writerId,
      record.meta.userId,
      record.meta.type,
      record.meta.plain
    )
    let encrypted = new types.Record(meta, {}, record.signature)

    // Encrypt the record data
    for (let key in record.data) {
      if (record.data.hasOwnProperty(key)) {
        let field = record.data[key]

        // Use window.crypto to generate an array of random bytes, length 32.
        let dk = window.crypto.getRandomValues(
          new Uint8Array(sodium.crypto_secretbox_KEYBYTES)
        )
        // Use window.crypto to generate an array of random bytes, length 24.
        let efN = window.crypto.getRandomValues(
          new Uint8Array(sodium.crypto_secretbox_NONCEBYTES)
        )

        let ef = sodium.crypto_secretbox_easy(field, efN, dk)
        let edkN = window.crypto.getRandomValues(
          new Uint8Array(sodium.crypto_secretbox_NONCEBYTES)
        )
        let edk = sodium.crypto_secretbox_easy(dk, edkN, accessKey)

        encrypted.data[key] = [
          await this.b64encode(edk),
          await this.b64encode(edkN),
          await this.b64encode(ef),
          await this.b64encode(efN)
        ].join('.')
      }
    }

    return encrypted
  }

  /**
   * Verify the signature on a given JSON document, given a specific public signing key.
   *
   * @param {Serializable} document     Document to be verified
   * @param {string}       signature    Base64URL-encoded signature
   * @param {string}       verifyingKey Base64URL-encoded signing key
   *
   * @returns {Promise<bool>}
   */
  async verifyDocumentSignature(document, signature, verifyingKey) {
    await sodium.ready
    let message = document.stringify()
    let rawSignature = await this.b64decode(signature)
    let rawKey = await this.b64decode(verifyingKey)

    return sodium.crypto_sign_verify_detached(rawSignature, message, rawKey)
  }

  /**
   * Sign a document and return the signature
   *
   * @param {Signable} document   Serializable object to be signed
   * @param {string}   signingKey Key to use to sign the document
   *
   * @returns {Promise<string>}
   */
  async signDocument(document, signingKey) {
    await sodium.ready
    let message = document.stringify()
    let rawKey = await this.b64decode(signingKey)

    let signature = sodium.crypto_sign_detached(message, rawKey)

    return this.b64encode(signature)
  }

  /**
   * Base64 encode a string in a URL safe manner with no padding
   *
   * @param {string} raw Raw data to be encoded
   *
   * @returns {string}
   */
  async b64encode(raw) {
    return base64url(raw)
  }

  /**
   * Decode a Base64URL-encoded string
   *
   * @param {string} encoded Base64URL-encoded string
   *
   * @returns {string}
   */
  async b64decode(encoded) {
    const b64Dec = base64url.toBuffer(encoded)
    const u8 = new Uint8Array(b64Dec.length)
    for (let i = 0; i < b64Dec.length; i++) {
      u8[i] = b64Dec[i]
    }
    return u8
  }

  /**
   * Generate a random key for use with Libsodium's secretbox interface
   *
   * @returns {string}
   */
  async randomKey() {
    await sodium.ready
    return window.crypto.getRandomValues(new Uint8Array(sodium.crypto_secretbox_KEYBYTES))
  }

  /**
   * Use PBKDF2 to derive a key of a given length using a specified password
   * and salt.
   *
   * @param {string} password User-specified password
   * @param {string} salt     User-specified salt (should be random)
   * @param {number} length   Length of the key to generate
   *
   * @returns {Promise<ArrayBuffer>}
   */

  async deriveKey(password, salt, length) {
    const enc = new TextEncoder()
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    )
    const key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: enc.encode(salt),
        iterations: 1000,
        hash: 'SHA-512'
      },
      keyMaterial,
      { name: 'HMAC', hash: { name: 'SHA-1' }, length: length * 8 },
      true,
      ['sign', 'verify']
    )
    window.crypto.subtle.exportKey('raw', key)
  }

  /**
   * Derive an Ed25519 keypair from a password and a random salt
   *
   * @param {string} password User-specified password
   * @param {string} salt     User-specified salt (should be random)
   *
   * @returns {KeyPair} Object containing publicKey and privateKey fields
   */
  async deriveSigningKey(password, salt) {
    await sodium.ready
    let seed = await this.deriveKey(password, salt, sodium.crypto_sign_SEEDBYTES)

    let keypair = sodium.crypto_sign_seed_keypair(new Uint8Array(seed))

    return new types.KeyPair(
      await this.b64encode(keypair.publicKey),
      await this.b64encode(keypair.privateKey)
    )
  }

  /**
   * Derive a Curve25519 keypair from a password and a random salt
   *
   * @param {string} password User-specified password
   * @param {string} salt     User-specified salt (should be random)
   *
   * @returns {KeyPair} Object containing publicKey and privateKey fields
   */
  async deriveCryptoKey(password, salt) {
    await sodium.ready
    let seed = await this.deriveKey(password, salt, sodium.crypto_sign_SEEDBYTES)

    let keypair = sodium.crypto_box_seed_keypair(new Uint8Array(seed))

    return new types.KeyPair(
      await this.b64encode(keypair.publicKey),
      await this.b64encode(keypair.privateKey)
    )
  }

  /**
   * Derive a symmetric encryption key from a password and a random salt
   *
   * @param {string} password User-specified password
   * @param {string} salt     User-specified salt (should be random)
   *
   * @returns {string} base64Url encoded string
   */
  async deriveSymmetricKey(password, salt) {
    const buffer = await this.deriveKey(password, salt, sodium.crypto_secretbox_KEYBYTES)
    const b64String = await this.b64encode(buffer)
    return b64String
  }

  /**
   * Dynamically generate a Curve25519 keypair for use with registration and cryptographic operations
   *
   * @returns {KeyPair} Base64URL-encoded representation of the new keypair
   */
  async generateKeypair() {
    await sodium.ready
    let arr = new Uint8Array(sodium.crypto_box_SEEDBYTES)
    let seed = window.crypto.getRandomValues(arr)
    let keypair = sodium.crypto_box_seed_keypair(seed)
    const kp = new types.KeyPair(
      await this.b64encode(keypair.publicKey),
      await this.b64encode(keypair.privateKey)
    )
    return kp
  }

  /**
   * Dynamically generate an Ed25519 keypair for use with registration and signing operations
   *
   * @returns {KeyPair} Base64URL-encoded representation of the new keypair
   */
  async generateSigningKeypair() {
    await sodium.ready
    let seed = await window.crypto.getRandomValues(
      new Uint8Array(sodium.crypto_sign_SEEDBYTES)
    )
    let keypair = sodium.crypto_sign_seed_keypair(seed)

    return new types.KeyPair(
      await this.b64encode(keypair.publicKey),
      await this.b64encode(keypair.privateKey)
    )
  }

  readUploadedFileAsText(inputFile) {
    const temporaryFileReader = new FileReader()

    return new Promise((resolve, reject) => {
      temporaryFileReader.onerror = () => {
        temporaryFileReader.abort()
        reject(new DOMException('Problem parsing input file.'))
      }

      temporaryFileReader.onload = () => {
        resolve(temporaryFileReader.result)
      }
      temporaryFileReader.readAsText(inputFile)
    })
  }

  readUploadedFileAsArrayBuffer(inputFile) {
    const temporaryFileReader = new FileReader()

    return new Promise((resolve, reject) => {
      temporaryFileReader.onerror = () => {
        temporaryFileReader.abort()
        reject(new DOMException('Problem parsing input file.'))
      }

      temporaryFileReader.onload = () => {
        resolve(temporaryFileReader.result)
      }
      temporaryFileReader.readAsArrayBuffer(inputFile)
    })
  }

  appendBuffer(buffer1, buffer2) {
    var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength)
    tmp.set(new Uint8Array(buffer1), 0)
    tmp.set(new Uint8Array(buffer2), buffer1.byteLength)
    return tmp.buffer
  }

  str2ab(str) {
    var buf = new ArrayBuffer(str.length) // 2 bytes for each char
    var bufView = new Uint8Array(buf)
    for (var i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i)
    }
    return buf
  }

  ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf))
  }

  async encryptLargeFile(fileObject, ak) {
    await sodium.ready

    const plainTextArrayBuffer = await this.readUploadedFileAsArrayBuffer(fileObject)
    const plainTextUint8Array = new Uint8Array(plainTextArrayBuffer)
    const bigHash = md5.create()
    bigHash.update(plainTextUint8Array)
    const TAG_FINAL = sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL
    const TAG_MESSAGE = sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE

    const dk = window.crypto.getRandomValues(
      new Uint8Array(sodium.crypto_secretbox_KEYBYTES)
    )
    const edkN = window.crypto.getRandomValues(
      new Uint8Array(sodium.crypto_secretbox_NONCEBYTES)
    )
    const edk = sodium.crypto_secretbox_easy(dk, edkN, ak)
    // Const edkSlice = edk.slice(edkN.length)
    // New TextDecoder("utf-8").decode
    const header1 = FILE_VERSION
    const header2 = await this.b64encode(edk)
    const header3 = await this.b64encode(edkN)
    const header = `${header1}.${header2}.${header3}.`
    const headerArrayBuffer = this.str2ab(header)
    const headerUint8Array = new Uint8Array(headerArrayBuffer)
    // Place in local memory to store the encrypted version of the file.
    let encryptedFile = new Uint8Array()
    let encryptedLength = 0
    // Initialize the hash.
    let hash = md5.create()

    // TozStore header to encryptedFile and hash
    encryptedFile = this.appendBuffer(encryptedFile, headerUint8Array)
    hash.update(headerUint8Array)
    encryptedLength += headerUint8Array.length
    // Potential bug => file could have a .txt, etc and thus get .xxx.xxx
    const encryptedFileName = `e2e-${fileObject.name}.bin`

    // Init the sodium stream.
    const res = sodium.crypto_secretstream_xchacha20poly1305_init_push(dk)
    const state = res.state

    // Add the sodium header to the file and hash.
    const sodiumHeader = res.header
    hash.update(sodiumHeader)
    encryptedFile = this.appendBuffer(encryptedFile, sodiumHeader)
    encryptedLength += sodiumHeader.length

    const totalFileSize = fileObject.size

    let marker = 0
    while (marker + BLOCK_SIZE < totalFileSize) {
      const blockFile = fileObject.slice(marker, marker + BLOCK_SIZE)
      let fileBlockArrayBuffer
      try {
        fileBlockArrayBuffer = await this.readUploadedFileAsArrayBuffer(blockFile)
      } catch (e) {
        console.warn(e.message)
      }
      let fileBlockUnint8Array = new Uint8Array(fileBlockArrayBuffer)
      let encryptedFileBlockUint8Array = sodium.crypto_secretstream_xchacha20poly1305_push(
        state,
        fileBlockUnint8Array,
        null,
        TAG_MESSAGE
      )
      // Update the hash.
      hash.update(encryptedFileBlockUint8Array)
      // Append block of ciphertext to local memory.
      encryptedFile = this.appendBuffer(encryptedFile, encryptedFileBlockUint8Array)
      encryptedLength += encryptedFileBlockUint8Array.length
      marker += BLOCK_SIZE
    }
    // Process the last block of plaintext.
    const lastBlockFile = fileObject.slice(marker, fileObject.length)
    let lastFileBlockArrayBuffer
    try {
      lastFileBlockArrayBuffer = await this.readUploadedFileAsArrayBuffer(lastBlockFile)
    } catch (e) {
      console.warn(e.message)
    }
    const lastFileBlockUint8Array = new Uint8Array(lastFileBlockArrayBuffer)
    let lastEncryptedFileBlockUint8Array = sodium.crypto_secretstream_xchacha20poly1305_push(
      state,
      lastFileBlockUint8Array,
      null,
      TAG_FINAL
    )
    // Update the hash.
    hash.update(lastEncryptedFileBlockUint8Array)
    const checkSum = hash.base64('')
    // Append block of ciphertext to local memory.
    encryptedFile = this.appendBuffer(encryptedFile, lastEncryptedFileBlockUint8Array)
    encryptedLength += lastEncryptedFileBlockUint8Array.length
    const encryptedFileBlob = new Blob([new Uint8Array(encryptedFile)])
    encryptedFileBlob.lastModifiedDate = new Date()
    encryptedFileBlob.fileName = encryptedFileName
    //  Returns array of encrypted file as ArrayBuffer,
    //  md5 checksum, length in bytes of encrypted file
    return [encryptedFileBlob, checkSum, encryptedLength]
  }

  // Ak type:  Uint8Array
  // encryptedFile type: ArrayBuffer
  async decryptFile(destinationFilename, ak, encryptedFile) {
    await sodium.ready

    let fileUint8Array = new Uint8Array(encryptedFile)
    const firstBlock = fileUint8Array.slice(0, BLOCK_SIZE)
    const firstBlockString = this.ab2str(firstBlock)
    const separated = firstBlockString.split('.')
    const fileVersion = separated[0]
    const fileEdk = await this.b64decode(separated[1])
    const fileEdkN = await this.b64decode(separated[2])
    if (parseInt(fileVersion, 10) !== FILE_VERSION) {
      throw new Error(
        `File version: ${fileVersion} does not match supported version: ${FILE_VERSION}`
      )
    }

    // Get the length of the header. 3 '.' separators added after being removed by split.
    const headerLength =
      separated[0].length + separated[1].length + separated[2].length + 3
    const libsodiumHeader = fileUint8Array.slice(
      headerLength,
      headerLength + sodium.crypto_secretstream_xchacha20poly1305_HEADERBYTES
    )
    // This errors if I use the slice without the nonce like in the Python SDK.
    // Why is Ben's not erroring??
    const dk = sodium.crypto_secretbox_open_easy(fileEdk, fileEdkN, ak)
    // Remove the headers from the file to decrypt.
    const lengthBothHeaders = headerLength + libsodiumHeader.length
    fileUint8Array = fileUint8Array.slice(lengthBothHeaders)
    const stateIn = sodium.crypto_secretstream_xchacha20poly1305_init_pull(
      libsodiumHeader,
      dk
    )
    let decryptedFile = new Uint8Array()
    let marker = 0
    const ABYTES = sodium.crypto_secretstream_xchacha20poly1305_ABYTES
    const encryptedFileLength = fileUint8Array.length
    while (marker + BLOCK_SIZE + ABYTES < encryptedFileLength) {
      let encryptedBlock = fileUint8Array.slice(marker, marker + BLOCK_SIZE + ABYTES)
      let decryptedBlock = sodium.crypto_secretstream_xchacha20poly1305_pull(
        stateIn,
        encryptedBlock
      )
      decryptedFile = this.appendBuffer(decryptedFile, decryptedBlock.message)
      marker += BLOCK_SIZE + ABYTES
    }
    const lastEncryptedBlock = fileUint8Array.slice(marker, encryptedFileLength)
    let lastDecryptedBlock = sodium.crypto_secretstream_xchacha20poly1305_pull(
      stateIn,
      lastEncryptedBlock
    )
    decryptedFile = this.appendBuffer(decryptedFile, lastDecryptedBlock.message)
    const decryptedBlob = new Blob([new Uint8Array(decryptedFile)])
    decryptedBlob.lastModifiedDate = new Date()
    decryptedBlob.fileName = destinationFilename
    // Returns a File object
    return decryptedBlob
  }
}
