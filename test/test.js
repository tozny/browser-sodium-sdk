// The browserfied files are generated with webpack and not babel.
// If the tests start failing in browsers, adding babel may fix it.

let clientId = '00000000-0000-0000-0000-000000000000'
let cryptoKeys
let signingKeys
let config

const Client = window.tozStore.Client
const Config = window.tozStore.Config
const tozStoreTypes = window.tozStore.tozStoreTypes

const EAKInfo = tozStoreTypes.EAKInfo
const Meta = tozStoreTypes.Meta
const Record = tozStoreTypes.Record
const RecordData = tozStoreTypes.RecordData
const RecordInfo = tozStoreTypes.RecordInfo
const SignedDocument = tozStoreTypes.SignedDocument
const SignedString = tozStoreTypes.SignedString

describe('before all placeholder', async done => {
  cryptoKeys = await Client.generateKeypair()
  signingKeys = await Client.generateSigningKeypair()
  config = new Config(
    clientId,
    'thisisabogusapikeyid',
    'thisisabogusapisecret',
    cryptoKeys.publicKey,
    cryptoKeys.privateKey,
    'https://localhost',
    signingKeys.publicKey,
    signingKeys.privateKey
  )

  done()
})

describe('window SubtleCrypto', function() {
  it('find window.crypto.subtle', function() {
    expect(window.crypto.subtle instanceof SubtleCrypto).toBe(true)
  }, 100000)
})

describe('TozStore exports on window object', function() {
  it('find window.tozStore', function() {
    expect(window.tozStore).toBeTruthy()
  }, 100000)
  it('find window.tozStore.Config', function() {
    expect(window.tozStore.Config).toBeTruthy()
  }, 100000)
  it('find window.tozStore.Client', function() {
    expect(window.tozStore.Client).toBeTruthy()
  }, 100000)
  it('find window.tozStore.tozStoreTypes', function() {
    expect(window.tozStore.tozStoreTypes).toBeTruthy()
  }, 100000)
  it('find window.tozStore.sodiumCrypto', function() {
    expect(window.tozStore.sodiumCrypto).toBeTruthy()
  }, 100000)
})

describe('Client', () => {
  it('can encrypt and decrypt a record', async () => {
    let ak = await Crypto.randomKey()
    let encryptedAk = await Crypto.encryptAk(
      cryptoKeys.privateKey,
      ak,
      cryptoKeys.publicKey
    )
    let eak = new EAKInfo(
      encryptedAk,
      clientId,
      cryptoKeys.publicKey,
      clientId,
      signingKeys.publicKey
    )

    let client = new Client(config)
    let encrypted = await client.encrypt(
      'type',
      { field1: 'this is a test', field2: 'another' },
      eak
    )

    let decrypted = await client.decrypt(encrypted, eak)

    expect(decrypted.meta.writerId).toBe(clientId)
    expect(decrypted.meta.userId).toBe(clientId)
    expect(decrypted.data.field1).toBe('this is a test')
    expect(decrypted.data.field2).toBe('another')
  }, 100000)

  it('signs a document while encrypting', async () => {
    let ak = await Crypto.randomKey()
    let encryptedAk = await Crypto.encryptAk(
      cryptoKeys.privateKey,
      ak,
      cryptoKeys.publicKey
    )
    let eak = new EAKInfo(
      encryptedAk,
      clientId,
      cryptoKeys.publicKey,
      clientId,
      signingKeys.publicKey
    )

    let client = new Client(config)
    let data = new RecordData({ field1: 'this is a test', field2: 'another' })
    let encrypted = await client.encrypt('type', data, eak)

    let signed = new RecordInfo(encrypted.meta, data)
    let verify = await client.verify(
      new SignedDocument(signed, encrypted.signature),
      client.config.publicSignKey
    )

    expect(verify).toBe(true)
  }, 100000)

  it('errs when attempting to sign without a signature', async () => {
    expect.assertions(1)
    let data = new RecordData({ test: 'field' })

    let bogusConfig = new Config(
      clientId,
      'thisisabogusapikeyid',
      'thisisabogusapisecret',
      cryptoKeys.publicKey,
      cryptoKeys.privateKey,
      'https://localhost'
    )
    let client = new Client(bogusConfig)

    try {
      await client.sign(data)
    } catch (e) {
      expect(e.message).toMatch('Cannot sign documents without a signing key!')
    }
  }, 100000)

  it('can verify a signature', async () => {
    let document = `{"doc":{"data":{"test_field":"QWfE7PpAjTgih1E9jyqSGex32ouzu1iF3la8fWNO5wPp48U2F5Q6kK41_8hgymWn.HW-dBzttfU6Xui-o01lOdVqchXJXqfqQ.eo8zE8peRC9qSt2ZOE8_54kOF0bWBEovuZ4.zO56Or0Pu2IFSzQZRpuXLeinTHQl7g9-"},"meta":{"plain":{"client_pub_sig_key":"fcyEKo6HSZo9iebWAQnEemVfqpTUzzR0VNBqgJJG-LY","server_sig_of_client_sig_key":"ZtmkUb6MJ-1LqpIbJadYl_PPH5JjHXKrBspprhzaD8rKM4ejGD8cJsSFO1DlR-r7u-DKsLUk82EJF65RnTmMDQ"},"type":"ticket","user_id":"d405a1ce-e528-4946-8682-4c2369a26604","writer_id":"d405a1ce-e528-4946-8682-4c2369a26604"},"rec_sig":"YsNbSXy0mVqsvgArmdESe6SkTAWFui8_NBn8ZRyxBfQHmJt7kwDU6szEqiRIaoZGrHsqgwS3uduLo_kzG6UeCA"},"sig":"iYc7G6ersNurZRr7_lWqoilr8Ve1d6HPZPPyC4YMXSvg7QvpUAHvjv4LsdMMDthk7vsVpoR0LYPC_SkIip7XCw"}`
    let serverPublicKey = 'xVXHN2hZT2eQ0d45yM2o89Ms2gMRTFhL5KaGu9sbJXY'

    let client = new Client(config)
    let parsed = JSON.parse(document)
    let encrypted = await Record.decode(parsed.doc)
    let doc = new SignedDocument(encrypted, parsed.sig)
    let publicKey = encrypted.meta.plain.client_pub_sig_key

    // Validate the server signature on the public key
    let signedKey = new SignedDocument(
      new SignedString(publicKey),
      encrypted.meta.plain.server_sig_of_client_sig_key
    )

    let keyVerify = await client.verify(signedKey, serverPublicKey)
    expect(keyVerify).toBe(true)

    let verify = await client.verify(doc, publicKey)
    expect(verify).toBe(true)
  }, 100000)

  it('can verify a signature from another SDK', async () => {
    // E3db-java SDK produced this document.
    let document = `{"doc":{"data":{"a":"yZI0kCHXHtgN2O-9gMdH6OnJDZKn3s8dpRQrZL_NWG2gSWDt4qomAG4abyTby-or.HOBwIJHQC4fm62dRMkM3fASsgDgA8slj.bHpBXShz1xahRiWgMRo6og.YNk6zU7NdxF1nyjj2yxSqw9WLUI6oqKT"},"meta":{"plain":{"client_pub_sig_key":"DW4lugZbPA5AsXyUBWMpRW6pH4UJhi9t1RV7wDWkl4c"},"type":"3835f34f-e667-4fc6-a227-d606cdb2e0a8","user_id":"169f8c64-6f9d-4de7-9e0e-29ec6c53336f","writer_id":"169f8c64-6f9d-4de7-9e0e-29ec6c53336f"},"rec_sig":"xlaTFff9js4_TkW32j74ufXJRmF_mSq0DbrN9qdk6lTXv6yyDkz0VhRtpyyeVUJju5RJVW-EGUEn_BNAoGKUDA"},"sig":"SXQR4zNiaeItbrqIEOO8Kl1HcIFKH_pxLCTTQwyx0gvuJUS052rrLSXbGPX4wLoOeknVQrD6EJJXODv8Wt3GDA"}`

    let client = new Client(config)
    let parsed = JSON.parse(document)
    let encrypted = await Record.decode(parsed.doc)
    let doc = new SignedDocument(encrypted, parsed.sig)
    let publicKey = encrypted.meta.plain.client_pub_sig_key

    let verify = await client.verify(doc, publicKey)
    expect(verify).toBe(true)
  }, 100000)

  it('rejects invalid signatures', async () => {
    let serverPublicKey = 'dGhpc2lzbm90YXJlYWxwdWJsaWNrZXkxMjM0NTc4OTA' // Thisisnotarealpublickey123457890

    let client = new Client(config)
    let publicKey = 'fcyEKo6HSZo9iebWAQnEemVfqpTUzzR0VNBqgJJG-LY'

    // Validate the server signature on the public key
    let signedKey = new SignedDocument(
      new SignedString(publicKey),
      'ZtmkUb6MJ-1LqpIbJadYl_PPH5JjHXKrBspprhzaD8rKM4ejGD8cJsSFO1DlR-r7u-DKsLUk82EJF65RnTmMDQ'
    )

    let keyVerify = await client.verify(signedKey, serverPublicKey)
    expect(keyVerify).toBe(false)
  }, 100000)

  it('signs both plaintext fields and meta', async () => {
    let ak = await Crypto.randomKey()
    let encryptedAk = await Crypto.encryptAk(
      cryptoKeys.privateKey,
      ak,
      cryptoKeys.publicKey
    )
    let eak = new EAKInfo(
      encryptedAk,
      clientId,
      cryptoKeys.publicKey,
      clientId,
      signingKeys.publicKey
    )

    let client = new Client(config)
    let data = new RecordData({ field1: 'this is a test', field2: 'another' })
    let encrypted = await client.encrypt('type', data, eak)

    let secondData = new RecordData({
      field1: 'this is a test',
      field2: 'different'
    })
    let secondEnc = await client.encrypt('type', secondData, eak)

    expect(secondEnc.signature).not.toBe(encrypted.signature)

    let thirdEnc = await client.encrypt('type', data, eak, { key: 'value' })

    expect(thirdEnc.signature).not.toBe(encrypted.signature)

    // Modify the meta
    thirdEnc.meta.writerId = 'blah'

    let signed = new SignedDocument(
      new RecordInfo(thirdEnc.meta, data),
      thirdEnc.signature
    )
    let verify = await client.verify(signed, client.config.publicSignKey)

    expect(verify).toBe(false)
  }, 100000)

  it('serializes in the proper order', () => {
    let testData = {
      k1: 'val1',
      k3: 'val2',
      k2: 'val3',
      AAA: 'val4',
      k4: {
        k3: 'val1',
        k2: 'val2',
        '😐': 'val3',
        k1: 'val4'
      },
      '😐': 'val5'
    }

    let data = new RecordData(testData)
    let serialized = data.stringify()

    expect(serialized).toBe(
      '{"AAA":"val4","k1":"val1","k2":"val3","k3":"val2","k4":{"k1":"val4","k2":"val2","k3":"val1","😐":"val3"},"😐":"val5"}'
    )
  }, 100000)

  it('serializes RecordInfo properly', () => {
    let plain = { field: 'value' }
    let meta = new Meta(null, null, null, plain)
    let data = { dataField: 'value' }

    let recordInfo = new RecordInfo(meta, data)

    expect(recordInfo.stringify()).toBe(
      '{"plain":{"field":"value"},"type":null,"user_id":null,"writer_id":null}{"dataField":"value"}'
    )
  }, 100000)

  it('properly marshalls signed document fields', async () => {
    let document = { field: 'value' }
    let signature = 'signature'

    let signedDocument = new SignedDocument(document, signature)
    let serialized = signedDocument.serializable()

    expect(serialized.doc).toBe(signedDocument.document)
    expect(serialized.sig).toBe(signedDocument.signature)

    let decoded = await SignedDocument.decode(serialized)

    expect(decoded.document).toBe(signedDocument.document)
    expect(decoded.signature).toBe(signedDocument.signature)
  }, 100000)

  it('encrypts individual fields', async () => {
    let ak = await Crypto.randomKey()
    let encryptedAk = await Crypto.encryptAk(
      cryptoKeys.privateKey,
      ak,
      cryptoKeys.publicKey
    )
    let eak = new EAKInfo(
      encryptedAk,
      clientId,
      cryptoKeys.publicKey,
      clientId,
      signingKeys.publicKey
    )

    let ticketInfo = {
      accountBalance: '50.25',
      nonce: '123456abcdef',
      otherInfo: 'none'
    }

    let client = new Client(config)

    // Build up the encrypted document
    let encrypted = await client.encrypt('ticket', ticketInfo, eak)

    // We know what the fields were, so let's verify the signature
    let signed = new RecordInfo(encrypted.meta, new RecordData(ticketInfo))
    let signedData = new SignedDocument(signed, encrypted.signature)
    let verify = await client.verify(signedData, config.publicSignKey)
    expect(verify).toBe(true)
  }, 100000)
})
