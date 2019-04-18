'use strict'

import 'es6-promise/auto'
import { default as Crypto } from './Crypto'
import { default as KeyPair } from './types/keyPair'
import { default as Meta } from './types/meta'
import { default as Record } from './types/record'
import { default as RecordData } from './types/recordData'

/* eslint-disable no-unused-vars */
export default class MockTypeCrypto extends Crypto {
  async decryptEak(readerKey, encryptedAk) {
    return new Promise(resolve => {
      resolve(`${readerKey}.AccessKey`)
    })
  }

  async encryptAk(writerKey, ak, readerKey) {
    return new Promise(resolve => {
      resolve(`${writerKey}.Encrypted${ak}.${readerKey}`)
    })
  }

  async decryptRecord(encrypted, accessKey) {
    return new Record(
      new Meta('bogusWriterId', 'bogusUserId', 'bogusType', { plain: 'bogus' }),
      new RecordData({ recordData: 'decryptedData' }),
      encrypted.signature
    )
  }

  async encryptRecord(record, accessKey) {
    return new Record(
      new Meta('bogusWriterId', 'bogusUserId', 'bogusType', { plain: 'bogus' }),
      new RecordData({ recordData: 'encryptedData' }),
      record.signature
    )
  }

  async verifyDocumentSignature(document, signature, verifyingKey) {
    return new Promise(resolve => {
      resolve(true)
    })
  }

  async signDocument(document, signingKey) {
    return new Promise(resolve => {
      resolve(`${signingKey}.signature`)
    })
  }

  async b64encode(raw) {
    return 'b64encodeRaw'
  }

  async b64decode(encoded) {
    return 'b64encodeEncoded'
  }

  async randomKey() {
    return 'returnedRandomKey'
  }

  async deriveKey(password, salt, length) {
    return new Promise((resolve, reject) => {
      resolve(null)
    })
  }

  async deriveSigningKey(password, salt) {
    return new KeyPair('publicSignKey', 'privateSignKey')
  }

  async deriveCryptoKey(password, salt) {
    return new KeyPair('publicKey', 'privateKey')
  }

  async deriveSymmetricKey(password, salt) {
    return `${password}.${salt}`
  }

  async generateKeypair() {
    return new KeyPair('publicKey', 'privateKey')
  }

  async generateSigningKeypair() {
    return new KeyPair('publicSignKey', 'privateSignKey')
  }
}

/* eslint-enable no-unused-vars */
