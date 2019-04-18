import SodiumCrypto from '../SodiumCrypto'
import { default as Meta } from '../types/meta'
import { default as Record } from '../types/record'
import { default as RecordData } from '../types/recordData'
import { default as EAKInfo } from '../types/eakInfo'
import { default as SignedString } from '../types/signedString'

// Hard-coded params to test crypto functions

const privateKey = '-uzVdETVhutUnWtQ83wMzUxsfxm8_u0aWNt2EXA107k'
const publicKey = 'AedqEIPg9Oqty5K9XineLH_cyUIeQ4WmtA2oVTpUBxU'
const privateKey2 = 'u7tW59KiBA-oORRh65vRMlS7HhDYgzmEu102LB6HnDg'
const publicKey2 = 'IBpAZ2bTO5WO168W-iBfR6UL-KK2Z68GLa9--N9L3RA'
const accessKey = new Uint8Array([
  3,
  158,
  121,
  124,
  46,
  118,
  33,
  208,
  92,
  69,
  63,
  83,
  182,
  100,
  141,
  167,
  28,
  133,
  231,
  186,
  196,
  152,
  86,
  136,
  27,
  36,
  219,
  176,
  174,
  249,
  237,
  233
])
const record = new Record(
  new Meta('testWriterId', 'testUserId', 'testType', { testMeta: 'testMetaValue' }),
  new RecordData({ testData: 'testDataValue' }),
  'testEncryptedSignature'
)
const base64URLRegEx = new RegExp('[A-Za-z0-9_-]')

const publicSignKey = '0ubYjE2k-8IESl0WHZCTuis2n0WLSs5-aikS4IdU-HE'
const privateSignKey =
  'Gt9PbkXP_JHmT9SHQTWGIRZyeCzvRerLTSR__LLrqxPS5tiMTaT7wgRKXRYdkJO6KzafRYtKzn5qKRLgh1T4cQ'
const badPrivateSignKey =
  'Gt9PbkXP_JHmT9SH8TWGIRZyeCzvRerLTSR__LLrqxPS5tiMTaT7wgRKXRYdkJO6KzafRYtKzn5qKRLgh1T4cQ'

const testSalt1 = new Uint8Array([
  213,
  18,
  2,
  29,
  198,
  250,
  97,
  40,
  74,
  138,
  80,
  242,
  147,
  20,
  12,
  95
])
const testSalt2 = new Uint8Array([
  185,
  245,
  108,
  20,
  67,
  64,
  122,
  26,
  151,
  19,
  155,
  191,
  7,
  167,
  112,
  251
])
const testSalt3 = new Uint8Array([
  177,
  9,
  105,
  178,
  175,
  142,
  226,
  38,
  117,
  103,
  233,
  83,
  161,
  129,
  230,
  1
])
const testSalt4 = new Uint8Array([
  73,
  204,
  27,
  112,
  7,
  187,
  74,
  117,
  29,
  83,
  19,
  56,
  34,
  177,
  146,
  83
])

const testPassword1 = 'thisisalongtestpassword'
const testPassword2 = 'thisisanotherlongtestpassword'
const testPassword3 = 'atestpassword'
const testPassword4 = 'lilpassword'

let crypto

beforeAll(async () => {
  crypto = new SodiumCrypto()
})

describe('SodiumCrypto test suit', async () => {
  it('encrypts and decrypts access keys', async () => {
    const encryptedAK = await crypto.encryptAk(privateKey, accessKey, publicKey2)

    const segments = encryptedAK.split('.')
    // string contains two parts separated by .
    expect(encryptedAK.split('.').length).toEqual(2)
    // Each string for encrypted ak and nonce show traits of base64Url encoded strings
    // those strings do not match passed params base64Url encoded params (implies encrypted)
    const encodedParam1 = await crypto.b64encode(privateKey)
    const encodedParam2 = await crypto.b64encode(publicKey)
    const encodedParam3 = await crypto.b64encode(accessKey)
    segments.map(string => {
      expect(base64URLRegEx.test(string)).toEqual(true)
      expect(string).not.toBe(encodedParam1)
      expect(string).not.toBe(encodedParam2)
      expect(string).not.toBe(encodedParam3)
    })

    // Convert encrypted access key to type representation with public key of writer
    const eakInfo = new EAKInfo(
      encryptedAK,
      'testClientId',
      publicKey,
      'testSignerId',
      'testSigningKey'
    )
    // Ak decrypted with reader private key should be same as original access key
    const decryptedAk = await crypto.decryptEak(privateKey2, eakInfo)
    expect(decryptedAk).toEqual(accessKey)
  })

  it('encrypts and decrypts records', async () => {
    // Encrypt test record with access key
    const encryptedRecord = await crypto.encryptRecord(record, accessKey)
    // Isolate the encrypted portion of the resulting record
    const encryptedData = encryptedRecord.data.testData
    // separate data string into 4 segments
    const encryptedDataSegments = encryptedData.split('.')
    // Check that all strings present as base64Url encoded strings
    expect(encryptedDataSegments.length).toEqual(4)
    encryptedDataSegments.map(string => {
      expect(base64URLRegEx.test(string)).toEqual(true)
    })
    // Isolate encrypted data field portion of encrypted record
    const encryptedDataField = encryptedDataSegments[2]
    // Check to ensure this is not merely a base64Url encoded version of the data field (implies encryption)
    const param1 = await crypto.b64encode(record.data.testData)
    expect(param1).not.toEqual(encryptedDataField)

    // The encrypted record can be decrypted to result in original record passed.
    const decryptedRecord = await crypto.decryptRecord(encryptedRecord, accessKey)
    expect(decryptedRecord).toEqual(record)
  })

  it('signs a document and verifies the signature', async () => {
    const testSignature = await crypto.signDocument(record, privateSignKey)
    // Signature presents as base64Url encoded string
    expect(base64URLRegEx.test(testSignature)).toBe(true)
    // Signature does not match base64Url encoded parameters (implies crypto)
    const param1 = await crypto.b64encode(privateSignKey)
    const param2 = await crypto.b64encode(JSON.stringify(record))
    expect(param1).not.toEqual(testSignature)
    expect(param2).not.toEqual(testSignature)
    // Verification returns true.
    const testVerification = await crypto.verifyDocumentSignature(
      record,
      testSignature,
      publicSignKey
    )
    expect(testVerification).toEqual(true)

    // Verification fails when the clients private key is flawed by one digit.
    const testBadSignature = await crypto.signDocument(record, badPrivateSignKey)
    const testBadVerification = await crypto.verifyDocumentSignature(
      record,
      testBadSignature,
      publicSignKey
    )
    expect(testBadVerification).toEqual(false)
  })

  it('properly base64 encodes', async () => {
    let expected = 'VGhpcyBpcyBhIHRlc3Qh'
    let raw = 'This is a test!'

    let encoded = await crypto.b64encode(raw)

    expect(encoded).toBe(expected)
  })

  it('properly base64 decodes', async () => {
    let expected = 'This is not a drill'
    let raw = 'VGhpcyBpcyBub3QgYSBkcmlsbA'

    let decoded = await crypto.b64decode(raw)

    let encoded = Buffer.from(decoded).toString('utf8')

    expect(encoded).toBe(expected)
  })

  it('generates distinct random keys', () => {
    expect(crypto.randomKey()).not.toBe(crypto.randomKey())
    /*
            Any other qualities of random keys (access keys) that would be wise to test?
        */
  })

  it('deterministically generates signing keys', async () => {
    const keypair1 = await crypto.deriveSigningKey(testPassword1, testSalt1)
    const check1 = await crypto.deriveSigningKey(testPassword1, testSalt1)
    const pubKey1 = '3BU_dMUUnScSjZVyypEPVeu6RYUJOfMcmoQtT-ChfI4'
    const privKey1 =
      'DT09p2M6CA3XWHTMQLq1OrtuWzuLUdBpB87-9xTe0HfcFT90xRSdJxKNlXLKkQ9V67pFhQk58xyahC1P4KF8jg'

    const keypair2 = await crypto.deriveSigningKey(testPassword2, testSalt2)
    const check2 = await crypto.deriveSigningKey(testPassword2, testSalt2)
    const pubKey2 = 'so3i-xoXaFBONHysiicIyT5UYFRwLv0O3lWlBndoEqc'
    const privKey2 =
      'GEAnIAELYJ6ELFlODJsN1dcRgCAt_uWwHb3hMX5l_dqyjeL7GhdoUE40fKyKJwjJPlRgVHAu_Q7eVaUGd2gSpw'

    const keypair3 = await crypto.deriveSigningKey(testPassword3, testSalt3)
    const check3 = await crypto.deriveSigningKey(testPassword3, testSalt3)
    const pubKey3 = 'geoDfn9W7dut2Kt1GKuGFELVMPfC3d7l9HKSJcQNoV0'
    const privKey3 =
      'c_tO8kBcirF6EypC8jKaDsxv_cmVpys6RyoKrE0j1ESB6gN-f1bt263Yq3UYq4YUQtUw98Ld3uX0cpIlxA2hXQ'

    const keypair4 = await crypto.deriveSigningKey(testPassword4, testSalt4)
    const check4 = await crypto.deriveSigningKey(testPassword4, testSalt4)
    const pubKey4 = 'HV35AZmwvbscCPVRnZ660DErUaPtbfEXn_7sTPBhGlM'
    const privKey4 =
      'hL4Ak4Q-ottYx84LBiiJWmsX3hwY6KiZ5ze0srTBCrMdXfkBmbC9uxwI9VGdnrrQMStRo-1t8Ref_uxM8GEaUw'

    expect(keypair1.publicKey).toEqual(check1.publicKey)
    expect(keypair1.privateKey).toEqual(check1.privateKey)
    expect(keypair1.publicKey).toEqual(pubKey1)
    expect(keypair1.privateKey).toEqual(privKey1)

    expect(keypair2.publicKey).toEqual(check2.publicKey)
    expect(keypair2.privateKey).toEqual(check2.privateKey)
    expect(keypair2.publicKey).toEqual(pubKey2)
    expect(keypair2.privateKey).toEqual(privKey2)

    expect(keypair3.publicKey).toEqual(check3.publicKey)
    expect(keypair3.privateKey).toEqual(check3.privateKey)
    expect(keypair3.publicKey).toEqual(pubKey3)
    expect(keypair3.privateKey).toEqual(privKey3)

    expect(keypair4.publicKey).toEqual(check4.publicKey)
    expect(keypair4.privateKey).toEqual(check4.privateKey)
    expect(keypair4.publicKey).toEqual(pubKey4)
    expect(keypair4.privateKey).toEqual(privKey4)
  })

  it('deterministically generates encryption keys', async () => {
    let keypair1 = await crypto.deriveCryptoKey(testPassword1, testSalt1)
    let check1 = await crypto.deriveCryptoKey(testPassword1, testSalt1)

    const pubKey1 = 'A_OFo8C5kuFLSZ51Y9f_RupswV0viudrsAU5TMoqiXk'
    const privKey1 = 'JHK-Bh0JRc-X0eTwtKqI8E_TLKVv3XyMk7Llu-gGOiw'

    const keypair2 = await crypto.deriveCryptoKey(testPassword2, testSalt2)
    const check2 = await crypto.deriveCryptoKey(testPassword2, testSalt2)

    const pubKey2 = 'Oxw5ZDwrWrvqXvRdP6cvNbgs8eFeZVOAS-lt8TFn9Fc'
    const privKey2 = 'y87APw1zB6MdJp-gQNBaSG-OUHoHgT6MhglEdKs4tSI'

    const keypair3 = await crypto.deriveCryptoKey(testPassword3, testSalt3)
    const check3 = await crypto.deriveCryptoKey(testPassword3, testSalt3)

    const pubKey3 = 'rCpFlDPMYUaKSV0Ta6k6c0lPKBdC90qlRNSNxGBsaws'
    const privKey3 = 'hC-BVxalVHUdIycqZFJNu8NY9a4aS7mF_bv0UnUacVg'

    const keypair4 = await crypto.deriveCryptoKey(testPassword4, testSalt4)
    const check4 = await crypto.deriveCryptoKey(testPassword4, testSalt4)

    const pubKey4 = 'FGR3t3_nMMn1plH1iFTPm1uL3HM_MJ4yIf3y-55xSFU'
    const privKey4 = 'XhosSrtTMLmNwPaZpCZuqBhOWgqQ2SV5_mdxQll4xqg'

    expect(keypair1.publicKey).toEqual(check1.publicKey)
    expect(keypair1.privateKey).toEqual(check1.privateKey)
    expect(keypair1.publicKey).toEqual(pubKey1)
    expect(keypair1.privateKey).toEqual(privKey1)

    expect(keypair2.publicKey).toEqual(check2.publicKey)
    expect(keypair2.privateKey).toEqual(check2.privateKey)
    expect(keypair2.publicKey).toEqual(pubKey2)
    expect(keypair2.privateKey).toEqual(privKey2)

    expect(keypair3.publicKey).toEqual(check3.publicKey)
    expect(keypair3.privateKey).toEqual(check3.privateKey)
    expect(keypair3.publicKey).toEqual(pubKey3)
    expect(keypair3.privateKey).toEqual(privKey3)

    expect(keypair4.publicKey).toEqual(check4.publicKey)
    expect(keypair4.privateKey).toEqual(check4.privateKey)
    expect(keypair4.publicKey).toEqual(pubKey4)
    expect(keypair4.privateKey).toEqual(privKey4)
  })

  it('deterministically generates symmetric keys', async () => {
    const key1 = await crypto.deriveSymmetricKey(testPassword1, testSalt1)
    const check1 = await crypto.deriveSymmetricKey(testPassword1, testSalt1)
    const expectedKey1 = 'DT09p2M6CA3XWHTMQLq1OrtuWzuLUdBpB87-9xTe0Hc'

    const key2 = await crypto.deriveSymmetricKey(testPassword2, testSalt2)
    const check2 = await crypto.deriveSymmetricKey(testPassword2, testSalt2)
    const expectedKey2 = 'GEAnIAELYJ6ELFlODJsN1dcRgCAt_uWwHb3hMX5l_do'

    const key3 = await crypto.deriveSymmetricKey(testPassword3, testSalt3)
    const check3 = await crypto.deriveSymmetricKey(testPassword3, testSalt3)
    const expectedKey3 = 'c_tO8kBcirF6EypC8jKaDsxv_cmVpys6RyoKrE0j1EQ'

    const key4 = await crypto.deriveSymmetricKey(testPassword4, testSalt4)
    const check4 = await crypto.deriveSymmetricKey(testPassword4, testSalt4)
    const expectedKey4 = 'hL4Ak4Q-ottYx84LBiiJWmsX3hwY6KiZ5ze0srTBCrM'

    expect(key1).toEqual(check1)
    expect(key1).toEqual(expectedKey1)

    expect(key2).toEqual(check2)
    expect(key2).toEqual(expectedKey2)

    expect(key3).toEqual(check3)
    expect(key3).toEqual(expectedKey3)

    expect(key4).toEqual(check4)
    expect(key4).toEqual(expectedKey4)
  })

  it('generates a public and private keypair that present as base64Url encoded strings', async () => {
    const keypair = await crypto.generateKeypair()

    expect(base64URLRegEx.test(keypair.publicKey)).toEqual(true)
    expect(base64URLRegEx.test(keypair.privateKey)).toEqual(true)
  })

  it('generates a public and private signing keypair that present as base64Url encoded strings', async () => {
    const keypair = await crypto.generateSigningKeypair()

    expect(base64URLRegEx.test(keypair.publicKey)).toEqual(true)
    expect(base64URLRegEx.test(keypair.privateKey)).toEqual(true)
  })

  /*
        Any more specific tests for the two that return randomly generated key pairs?
            generateKeypair()
            generateSigningKeypair()
  */

 it('signs and verifies with a given key', async () => {
  let keyPair = await crypto.deriveSigningKey(testPassword1, testSalt1)
  let document = new SignedString('this is a test')

  let signature = await crypto.signDocument(document, keyPair.privateKey)
  let verified = await crypto.verifyDocumentSignature(document, signature, keyPair.publicKey)

  expect(verified).toBe(true)
})

})
