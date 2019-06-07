describe('Crypto', async done => {
  beforeEach(function(done) {
    window.setTimeout(function() {
      done()
    }, 0)
  })
  beforeEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000
  })
  let Crypto = window.tozStore.sodiumCrypto
  let SignedString = window.tozStoreTypes.SignedString

  describe('Crypto', () => {
    beforeEach(function(done) {
      window.setTimeout(function() {
        done()
      }, 0)
    })
    beforeEach(() => {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000
    })
    it('properly base64 encodes', async () => {
      let expected = 'VGhpcyBpcyBhIHRlc3Qh'
      let raw = 'This is a test!'

      let encoded = await Crypto.b64encode(raw)

      expect(encoded).toBe(expected)
    }, 100000)

    it('properly base64 decodes', async () => {
      let expected = 'This is not a drill'
      let raw = 'VGhpcyBpcyBub3QgYSBkcmlsbA'

      let decoded = await Crypto.b64decode(raw)

      let encoded = Buffer.from(decoded).toString('utf8')

      expect(encoded).toBe(expected)
    }, 100000)

    it('generates disctinct random keys', () => {
      expect(Crypto.randomKey()).not.toBe(Crypto.randomKey())
    }, 100000)

    it('deterministically generates signing keys', async () => {
      let salt = window.crypto.getRandomValues(new Uint8Array(16))

      let keypair = Crypto.deriveSigningKey('thisisapassword', salt)
      let second = Crypto.deriveSigningKey('thisisapassword', salt)

      expect(keypair.publicKey).toEqual(second.publicKey)
      expect(keypair.privateKey).toEqual(second.privateKey)
    }, 100000)

    it('deterministically generates encryption keys', async () => {
      let salt = window.crypto.getRandomValues(new Uint8Array(16))
      let keypair = Crypto.deriveCryptoKey('thisisapassword', salt)
      let second = Crypto.deriveCryptoKey('thisisapassword', salt)

      expect(keypair.publicKey).toEqual(second.publicKey)
      expect(keypair.privateKey).toEqual(second.privateKey)
    }, 100000)

    it('deterministically generates symmetric keys', async () => {
      let salt = window.crypto.getRandomValues(new Uint8Array(16))

      let keypair = await Crypto.deriveSymmetricKey('thisisapassword', salt)
      let second = await Crypto.deriveSymmetricKey('thisisapassword', salt)

      expect(keypair).toEqual(second)
    }, 100000)

    it('signs and verifies with a given key', async () => {
      let salt = window.crypto.getRandomValues(new Uint8Array(16))
      let keyPair = await Crypto.deriveSigningKey('thisisapassword', salt)

      let document = new SignedString('this is a test')

      let signature = await Crypto.signDocument(document, keyPair.privateKey)
      let verified = await Crypto.verifyDocumentSignature(
        document,
        signature,
        keyPair.publicKey
      )

      expect(verified).toBe(true)
    }, 100000)
  })

  done()
}, 100000)
