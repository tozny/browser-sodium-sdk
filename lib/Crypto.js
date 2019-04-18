class Crypto {
  __notImplemented(name) {
    throw new Error(`The method ${name} must be implemented in a subclass.`)
  }

  constructor() {
    if (this.constructor === Crypto) {
      throw new Error(
        'The Crypto class must be extended with a specific (Type)Crypto class before use.'
      )
    }
  }

  decryptEak() {
    this.__notImplemented('decryptEak')
  }

  encryptAk() {
    this.__notImplemented('encryptAk')
  }

  decryptRecord() {
    this.__notImplemented('decryptRecord')
  }

  encryptRecord() {
    this.__notImplemented('encryptRecord')
  }

  verifyDocumentSignature() {
    this.__notImplemented('verifyDocumentSignature')
  }

  signDocument() {
    this.__notImplemented('signDocument')
  }

  b64encode() {
    this.__notImplemented('b64encode')
  }

  b64decode() {
    this.__notImplemented('b64decode')
  }

  randomKey() {
    this.__notImplemented('randomKey')
  }

  deriveKey() {
    this.__notImplemented('deriveKey')
  }

  deriveSigningKey() {
    this.__notImplemented('deriveSigningKey')
  }

  deriveCryptoKey() {
    this.__notImplemented('deriveCryptoKey')
  }

  deriveSymmetricKey() {
    this.__notImplemented('deriveSymmetricKey')
  }

  generateKeypair() {
    this.__notImplemented('generateKeypair')
  }

  generateSigningKeypair() {
    this.__notImplemented('generateSigningKeypair')
  }
}

module.exports = Crypto
