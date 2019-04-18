import ClientInterface from "../index"
import { default as Meta } from "../types/meta"
import { default as Record } from "../types/record"
import { default as RecordData } from "../types/recordData"
import { default as RecordInfo } from "../types/recordInfo"
import { default as KeyPair } from "../types/keyPair"
import { default as ClientDetails } from "../types/clientDetails"
import { default as SignedDocument } from "../types/signedDocument"

import MockTypeCrypto from "../MockTypeCrypto"
import PublicKey from "../types/publicKey"
import SigningKey from "../types/signingKey"

// The client constructor requires a (Type)Crypto instance.
const mockCrypto = new MockTypeCrypto()
const Client = ClientInterface.Client(mockCrypto)
const Config = ClientInterface.Config

let config
let client1

const apiUrl = "https://localhost"
const apiKeyId = "thisisabogusapikeyid"
const apiSecret = "thisisabogusapisecret"
const clientId = "00000000-0000-0000-0000-000000000000"
const publicKey = "publicKey"
const privateKey = "privateKey"
const publicSignKey = "publicSignKey"
const privateSignKey = "privateSignKey"
const regToken = "exampleClientRegistrationToken"
const clientName = "exampleClientName"

/*
This inherently tests .register.  
Could explicitly test .register for v1 and v2 clients.
Could also test variations of .fromObject 
*/

beforeAll(async done => {
  // Replace with mockValues. Real ones shouldn't be needed for this.
  const clientCreds = {
    apiUrl,
    apiKeyId,
    apiSecret,
    clientId,
    publicKey,
    privateKey,
    publicSignKey,
    privateSignKey
  }
  // A Client instance requires a Config instance.
  config = Config.fromObject(clientCreds)
  client1 = new Client(config)

  done()
})

beforeEach(() => {
  fetch.resetMocks()
})

/*
    Could add explicit tests for caching of auth keys & access keys?
    Tests implicitly in method calls after first write & client backup workflow at start of share workflow.
  */

describe("Client", () => {
  // For .register method, the registration token provides the auth.  It's in the request payload.
  // For all other methods, a jwt is used for auth. This is a request header.

  it("registers a v2 client without backup", async () => {
    fetch.mockResponses([
      JSON.stringify({
        client_id: clientId,
        api_key_id: "exampleApiKeyId",
        api_secret: "exampleApiSecret",
        public_key: { curve25519: publicKey },
        name: clientName,
        signing_key: { ed25519: publicSignKey }
      })
    ])

    const client2 = await Client.register(
      regToken,
      clientName,
      { publicKey: publicKey, privateKey: privateKey },
      { publicKey: publicSignKey, privateKey: privateSignKey },
      false,
      apiUrl
    )

    const expectedClientDetails = new ClientDetails(
      clientId,
      "exampleApiKeyId",
      "exampleApiSecret",
      new PublicKey(publicKey),
      clientName,
      new SigningKey(publicSignKey)
    )

    // Calls the /clients/register endpoint
    expect(fetch.mock.calls[0][0]).toEqual(
      "https://localhost/v1/account/e3db/clients/register"
    )
    // Properly formats request body and includes public signing key (no private key or private signing key)
    expect(fetch.mock.calls[0][1].body).toEqual(
      '{"token":"exampleClientRegistrationToken","client":{"name":"exampleClientName","public_key":{"curve25519":"publicKey"},"signing_key":{"ed25519":"publicSignKey"}}}'
    )
    // Returns expected ClientDetails object derived from response
    expect(client2).toEqual(expectedClientDetails)
  })

  it("registers a v1 client without backup", async () => {
    fetch.mockResponses([
      JSON.stringify({
        client_id: clientId,
        api_key_id: "exampleApiKeyId",
        api_secret: "exampleApiSecret",
        public_key: { curve25519: publicKey },
        name: clientName
      })
    ])

    const client3 = await Client.register(
      regToken,
      clientName,
      { publicKey: publicKey, privateKey: privateKey },
      null,
      false,
      apiUrl
    )

    const expectedClientDetails2 = new ClientDetails(
      clientId,
      "exampleApiKeyId",
      "exampleApiSecret",
      new PublicKey(publicKey),
      clientName
    )

    // Calls the /clients/register endpoint
    expect(fetch.mock.calls[0][0]).toEqual(
      "https://localhost/v1/account/e3db/clients/register"
    )
    // Properly formats request body and includes public signing key (no private key or private signing key)
    expect(fetch.mock.calls[0][1].body).toEqual(
      '{"token":"exampleClientRegistrationToken","client":{"name":"exampleClientName","public_key":{"curve25519":"publicKey"}}}'
    )
    // Returns expected ClientDetails object derived from response
    expect(client3).toEqual(expectedClientDetails2)
  })

  it("registers a v2 client with backup", async () => {
    fetch.mockResponses(
      [
        JSON.stringify({
          client_id: clientId,
          api_key_id: "exampleApiKeyId",
          api_secret: "exampleApiSecret",
          public_key: { curve25519: publicKey },
          name: clientName,
          signing_key: { ed25519: publicSignKey }
        }),
        { status: 200, headers: { "X-Backup-Client": "X-Backup-Client" } }
      ],
      // write workflow
      [JSON.stringify({ access_token: "12345", expires_at: "xxxxx" })],
      [
        JSON.stringify({
          access_token: "12345",
          expires_at: "xxxxx",
          authorizer_public_key: { curve25519: "xxx" }
        })
      ],
      [
        JSON.stringify({
          meta: {
            writer_id: "responseWriterId",
            user_id: "responseUserId",
            type: "responseType",
            plain: {}
          },
          data: {}
        })
      ],
      [
        JSON.stringify({
          access_token: "12345",
          expires_at: "xxxxx",
          authorizer_public_key: { curve25519: "xxx" }
        })
      ],

      // share workflow
      [
        JSON.stringify({
          clientId: "responseClientId",
          public_key: { curve25519: "xxxx" },
          validated: true
        })
      ],
      [
        JSON.stringify({
          access_token: "putNewEAK",
          expires_at: "xxxxx",
          authorizer_public_key: { curve25519: "xxx" }
        })
      ],
      [JSON.stringify({ body: "" })],
      [JSON.stringify({ body: "" })]
    )

    const client4 = await Client.register(
      regToken,
      clientName,
      { publicKey: publicKey, privateKey: privateKey },
      { publicKey: publicSignKey, privateKey: privateSignKey },
      true,
      apiUrl
    )

    const expectedClientDetails3 = new ClientDetails(
      clientId,
      "exampleApiKeyId",
      "exampleApiSecret",
      new PublicKey(publicKey),
      clientName,
      new SigningKey(publicSignKey)
    )

    // Calls the /clients/register endpoint
    expect(fetch.mock.calls[0][0]).toEqual(
      "https://localhost/v1/account/e3db/clients/register"
    )
    // Properly formats request body and includes public signing key (no private key or private signing key)
    expect(fetch.mock.calls[0][1].body).toEqual(
      '{"token":"exampleClientRegistrationToken","client":{"name":"exampleClientName","public_key":{"curve25519":"publicKey"},"signing_key":{"ed25519":"publicSignKey"}}}'
    )
    // Returns expected ClientDetails object derived from response
    expect(client4).toEqual(expectedClientDetails3)

    // Runs the back-up workflow
    // Write workflow
    // authorization token fetch called
    expect(fetch.mock.calls[1][0]).toEqual("https://localhost/v1/auth/token")
    // access key fetched to encrypt record (successful GET, so no PUT of new eak)
    expect(fetch.mock.calls[2][0]).toEqual(
      "https://localhost/v1/storage/access_keys/00000000-0000-0000-0000-000000000000/00000000-0000-0000-0000-000000000000/00000000-0000-0000-0000-000000000000/tozny.key_backup"
    )
    // fetch call to store record in db called
    expect(fetch.mock.calls[3][0]).toEqual(
      "https://localhost/v1/storage/records"
    )
    // record data encrypted in request
    expect(JSON.parse(fetch.mock.calls[3][1].body).data).toEqual({
      recordData: "encryptedData"
    })
    // access key fetched to decrypt record
    expect(fetch.mock.calls[4][0]).toEqual(
      "https://localhost/v1/storage/access_keys/responseWriterId/responseUserId/00000000-0000-0000-0000-000000000000/responseType"
    )

    // Share workflow
    // auth token already cached
    // DOES NOT repeat the access keys call, already cached.
    // GETS from /storage/clients to get public key for the reader
    expect(fetch.mock.calls[5][0]).toEqual(
      "https://localhost/v1/storage/clients/X-Backup-Client"
    )
    // PUTs a new access key for the reader
    expect(fetch.mock.calls[6][0]).toEqual(
      "https://localhost/v1/storage/access_keys/00000000-0000-0000-0000-000000000000/00000000-0000-0000-0000-000000000000/X-Backup-Client/tozny.key_backup"
    )
    // access key in request is encrypted
    expect(JSON.parse(fetch.mock.calls[6][1].body)).toEqual({
      eak: "privateKey.EncryptedprivateKey.AccessKey.xxxx"
    })
    // PUTs a new policy for the new reader
    expect(fetch.mock.calls[7][0]).toEqual(
      "https://localhost/v1/storage/policy/00000000-0000-0000-0000-000000000000/00000000-0000-0000-0000-000000000000/X-Backup-Client/tozny.key_backup"
    )
    // POSTs to /account/backup
    expect(fetch.mock.calls[8][0]).toEqual(
      "https://localhost/v1/account/backup/exampleClientRegistrationToken/00000000-0000-0000-0000-000000000000"
    )
  })

  it("registers a v1 client with backup", async () => {
    fetch.mockResponses(
      [
        JSON.stringify({
          client_id: clientId,
          api_key_id: "exampleApiKeyId",
          api_secret: "exampleApiSecret",
          public_key: { curve25519: publicKey },
          name: clientName
        }),
        { status: 200, headers: { "X-Backup-Client": "X-Backup-Client" } }
      ],
      // write workflow
      [JSON.stringify({ access_token: "12345", expires_at: "xxxxx" })],
      [
        JSON.stringify({
          access_token: "12345",
          expires_at: "xxxxx",
          authorizer_public_key: { curve25519: "xxx" }
        })
      ],
      [
        JSON.stringify({
          meta: {
            writer_id: "responseWriterId",
            user_id: "responseUserId",
            type: "responseType",
            plain: {}
          },
          data: {}
        })
      ],
      [
        JSON.stringify({
          access_token: "12345",
          expires_at: "xxxxx",
          authorizer_public_key: { curve25519: "xxx" }
        })
      ],

      // share workflow
      [
        JSON.stringify({
          clientId: "responseClientId",
          public_key: { curve25519: "xxxx" },
          validated: true
        })
      ],
      [
        JSON.stringify({
          access_token: "putNewEAK",
          expires_at: "xxxxx",
          authorizer_public_key: { curve25519: "xxx" }
        })
      ],
      [JSON.stringify({ body: "" })],
      [JSON.stringify({ body: "" })]
    )

    const client5 = await Client.register(
      regToken,
      clientName,
      { publicKey: publicKey, privateKey: privateKey },
      null,
      true,
      apiUrl
    )

    const expectedClientDetails4 = new ClientDetails(
      clientId,
      "exampleApiKeyId",
      "exampleApiSecret",
      new PublicKey(publicKey),
      clientName
    )

    // Calls the /clients/register endpoint
    expect(fetch.mock.calls[0][0]).toEqual(
      "https://localhost/v1/account/e3db/clients/register"
    )
    // Properly formats request body and includes public signing key (no private key or private signing key)
    expect(fetch.mock.calls[0][1].body).toEqual(
      '{"token":"exampleClientRegistrationToken","client":{"name":"exampleClientName","public_key":{"curve25519":"publicKey"}}}'
    )
    // Returns expected ClientDetails object derived from response
    expect(client5).toEqual(expectedClientDetails4)

    // Runs the back-up workflow
    // Write workflow
    // authorization token fetch called
    expect(fetch.mock.calls[1][0]).toEqual("https://localhost/v1/auth/token")
    // access key fetched to encrypt record (successful GET, so no PUT of new eak)
    expect(fetch.mock.calls[2][0]).toEqual(
      "https://localhost/v1/storage/access_keys/00000000-0000-0000-0000-000000000000/00000000-0000-0000-0000-000000000000/00000000-0000-0000-0000-000000000000/tozny.key_backup"
    )
    // fetch call to store record in db called
    expect(fetch.mock.calls[3][0]).toEqual(
      "https://localhost/v1/storage/records"
    )
    // record data encrypted in request
    expect(JSON.parse(fetch.mock.calls[3][1].body).data).toEqual({
      recordData: "encryptedData"
    })
    // access key fetched to decrypt record
    expect(fetch.mock.calls[4][0]).toEqual(
      "https://localhost/v1/storage/access_keys/responseWriterId/responseUserId/00000000-0000-0000-0000-000000000000/responseType"
    )

    // Share workflow
    // auth token already cached
    // DOES NOT repeat the access keys call, already cached
    // GETS from /storage/clients to get public key for the reader
    expect(fetch.mock.calls[5][0]).toEqual(
      "https://localhost/v1/storage/clients/X-Backup-Client"
    )
    // PUTs a new access key for the reader
    expect(fetch.mock.calls[6][0]).toEqual(
      "https://localhost/v1/storage/access_keys/00000000-0000-0000-0000-000000000000/00000000-0000-0000-0000-000000000000/X-Backup-Client/tozny.key_backup"
    )
    // access key in request is encrypted
    expect(JSON.parse(fetch.mock.calls[6][1].body)).toEqual({
      eak: "privateKey.EncryptedprivateKey.AccessKey.xxxx"
    })
    // PUTs a new policy for the new reader
    expect(fetch.mock.calls[7][0]).toEqual(
      "https://localhost/v1/storage/policy/00000000-0000-0000-0000-000000000000/00000000-0000-0000-0000-000000000000/X-Backup-Client/tozny.key_backup"
    )
    // POSTs to /account/backup
    expect(fetch.mock.calls[8][0]).toEqual(
      "https://localhost/v1/account/backup/exampleClientRegistrationToken/00000000-0000-0000-0000-000000000000"
    )
  })

  it("writes encrypted data with correct API calls for existing access key", async () => {
    fetch.mockResponses(
      [
        JSON.stringify({
          access_token: "12345",
          expires_at: "01 Jan 2099 00:00:00 GMT"
        })
      ],
      [
        JSON.stringify({
          access_token: "12345",
          expires_at: "xxxxx",
          authorizer_public_key: { curve25519: "xxx" }
        })
      ],
      [
        JSON.stringify({
          meta: {
            writer_id: clientId,
            user_id: clientId,
            type: "testType",
            plain: {}
          },
          data: {}
        })
      ]
    )

    // starts with an empty local cache
    expect(client1._akCache).toEqual({})

    await client1.write("testType", { key1: "val1", key2: "val2" })

    // authorization token fetch called
    expect(fetch.mock.calls[0][0]).toEqual("https://localhost/v1/auth/token")
    // caches auth token
    expect(client1._authToken).toEqual("12345")
    // caches auth token expiration time
    expect(client1._authTokenTimeout).toEqual(4070908800000)
    // access key fetched to encrypt record (successful GET, so no PUT of new eak)
    expect(fetch.mock.calls[1][0]).toEqual(
      "https://localhost/v1/storage/access_keys/00000000-0000-0000-0000-000000000000/00000000-0000-0000-0000-000000000000/00000000-0000-0000-0000-000000000000/testType"
    )
    // adds the access key to the local cache
    expect(client1._akCache).toEqual({
      "00000000-0000-0000-0000-000000000000.00000000-0000-0000-0000-000000000000.testType":
        "privateKey.AccessKey"
    })
    // fetch call to store record in db called
    expect(fetch.mock.calls[2][0]).toEqual(
      "https://localhost/v1/storage/records"
    )
    // record data encrypted in request
    expect(JSON.parse(fetch.mock.calls[2][1].body).data).toEqual({
      recordData: "encryptedData"
    })
    // signs the record sent in request body for v2 client
    expect(JSON.parse(fetch.mock.calls[2][1].body).rec_sig).toEqual(
      "privateSignKey.signature"
    )
    // access key found in local cache
    // so DOES NOT fetch access key
  })

  it("writes encrypted data with correct API calls with new access key", async () => {
    fetch.mockResponses(
      [JSON.stringify(), { status: 404 }],
      [
        JSON.stringify({
          clientId: "responseClientId",
          public_key: { curve25519: "xxxx" },
          validated: true
        })
      ],
      [
        JSON.stringify({
          access_token: "12345",
          expires_at: "xxxxx",
          authorizer_public_key: { curve25519: "xxx" }
        })
      ],
      [
        JSON.stringify({
          meta: {
            writer_id: "responseWriterId",
            user_id: "responseUserId",
            type: "responseType",
            plain: {}
          },
          data: {}
        })
      ],
      [
        JSON.stringify({
          access_token: "12345",
          expires_at: "xxxxx",
          authorizer_public_key: { curve25519: "xxx" }
        })
      ]
    )
    await client1.write("testType2", { key1: "val1", key2: "val2" })
    // auth token already cached
    // access key fetched to encrypt record and 404 returned
    expect(fetch.mock.calls[0][0]).toEqual(
      "https://localhost/v1/storage/access_keys/00000000-0000-0000-0000-000000000000/00000000-0000-0000-0000-000000000000/00000000-0000-0000-0000-000000000000/testType2"
    )
    // fetch this client's info to get public key for ak encryption
    expect(fetch.mock.calls[1][0]).toEqual(
      "https://localhost/v1/storage/clients/00000000-0000-0000-0000-000000000000"
    )
    // put new encrypted access key
    expect(fetch.mock.calls[2][0]).toEqual(
      "https://localhost/v1/storage/access_keys/00000000-0000-0000-0000-000000000000/00000000-0000-0000-0000-000000000000/00000000-0000-0000-0000-000000000000/testType2"
    )
    // access key in put request is encrypted
    expect(JSON.parse(fetch.mock.calls[2][1].body)).toEqual({
      eak: "privateKey.EncryptedreturnedRandomKey.xxxx"
    })
    // fetch call to store record in db called
    expect(fetch.mock.calls[3][0]).toEqual(
      "https://localhost/v1/storage/records"
    )
    // record data encrypted in request
    expect(JSON.parse(fetch.mock.calls[3][1].body).data).toEqual({
      recordData: "encryptedData"
    })
    // access key already cached for decrypt
  })

  it("reads data by calling correct API endpoint and decrypting response record", async () => {
    fetch.mockResponses(
      [
        JSON.stringify({
          meta: {
            writer_id: "responseWriterId",
            user_id: "responseUserId",
            type: "responseType2",
            plain: {}
          },
          data: { key1: "va1" }
        })
      ],
      [
        JSON.stringify({
          access_token: "12345",
          expires_at: "xxxxx",
          authorizer_public_key: { curve25519: "xxx" }
        })
      ]
    )
    const recordToRead = await client1.read("bogusRecordId")

    // auth token already cached
    // encrypted record fetched
    expect(fetch.mock.calls[0][0]).toEqual(
      "https://localhost/v1/storage/records/bogusRecordId"
    )
    // fetches access key
    expect(fetch.mock.calls[1][0]).toEqual(
      "https://localhost/v1/storage/access_keys/responseWriterId/responseUserId/00000000-0000-0000-0000-000000000000/responseType2"
    )
    // decrypts the record data from the response
    expect(recordToRead.data).toEqual({ recordData: "decryptedData" })
  })

  it("updates a record by calling the correct api endpoints and sending encrypted record data", async () => {
    fetch.mockResponses(
      [
        JSON.stringify({
          access_token: "12345",
          expires_at: "xxxxx",
          authorizer_public_key: { curve25519: "xxx" }
        })
      ],
      [
        JSON.stringify({
          meta: {
            writer_id: "responseWriterId",
            user_id: "responseUserId",
            type: "recordTypeUpdated",
            plain: { updatedMeta: "updatedMeta" }
          },
          data: { updatedData: "updated" }
        })
      ],
      [
        JSON.stringify({
          access_token: "12345",
          expires_at: "xxxxx",
          authorizer_public_key: { curve25519: "xxx" }
        })
      ]
    )

    const updatedRecord = new Record(
      new Meta("exampleWriterId", "exampleUserId", "exampleType", {
        updatedmeta: "newMeta"
      }),
      new RecordData({ updatedRecordData: "newData" }),
      "exampleEncryptedSignature"
    )
    updatedRecord.meta.recordId = "recordIdToUpdate"
    updatedRecord.meta.version = 2
    const returnedRecord = await client1.update(updatedRecord)

    // auth token already cached
    // access key fetched to encrypt record (GET succeeds)
    expect(fetch.mock.calls[0][0]).toEqual(
      "https://localhost/v1/storage/access_keys/exampleWriterId/exampleUserId/00000000-0000-0000-0000-000000000000/exampleType"
    )
    // PUT request to storage/records/safe to update record in db
    expect(fetch.mock.calls[1][0]).toEqual(
      "https://localhost/v1/storage/records/safe/recordIdToUpdate/2"
    )
    // record data encrypted in request
    expect(JSON.parse(fetch.mock.calls[1][1].body).data).toEqual({
      recordData: "encryptedData"
    })
    // access key fetched to decrypt record
    expect(fetch.mock.calls[2][0]).toEqual(
      "https://localhost/v1/storage/access_keys/responseWriterId/responseUserId/00000000-0000-0000-0000-000000000000/recordTypeUpdated"
    )
    // returns decrypted data
    expect(returnedRecord.data).toEqual({ recordData: "decryptedData" })
    /*
        could test PUT eak 
        */
  })

  it("deletes a record using distinct endpoints based on version param", async () => {
    fetch.mockResponses(
      [JSON.stringify({ body: "" }), { status: 204 }],
      [JSON.stringify({ body: "" }), { status: 204 }]
    )

    const deleteResponse1 = await client1.delete(
      "recordIdToDelete",
      "versionBelievedToBeLatest"
    )
    const deleteResponse2 = await client1.delete("recordIdToDelete")

    // auth token already cached
    // with version given:  calls delete /records/safe/<recordId>/<recordVersion>
    expect(fetch.mock.calls[0][0]).toEqual(
      "https://localhost/v1/storage/records/safe/recordIdToDelete/versionBelievedToBeLatest"
    )
    // returns Promise that resolves true
    expect(deleteResponse1).toEqual(true)

    // with no version given:  calls delete /records/<recordId>
    expect(fetch.mock.calls[1][0]).toEqual(
      "https://localhost/v1/storage/records/recordIdToDelete"
    )
    // returns Promise that resolves true
    expect(deleteResponse2).toEqual(true)
  })

  it("queries records", async () => {
    fetch.mockResponses([
      JSON.stringify({
        results: [
          {
            meta: {},
            record_data: { data1: "val1", data2: "val2" },
            access_key: { authorizer_public_key: { curve25519: "xxx" } }
          },
          {
            meta: {},
            record_data: { data3: "val3", data4: "val4" },
            access_key: { authorizer_public_key: { curve25519: "xxx" } }
          },
          {
            meta: {},
            record_data: { data5: "val5", data6: "val6" },
            access_key: { authorizer_public_key: { curve25519: "xxx" } }
          }
        ]
      }),
      { status: 204 }
    ])

    const queryResult = await client1
      .query(true, "writerToQuery", "recordToQuery", "typeToQuery")
      .next()

    // auth token already cached
    // POSTs to storage/seach
    expect(fetch.mock.calls[0][0]).toEqual(
      "https://localhost/v1/storage/search"
    )
    // includes correct request body in POST
    expect(fetch.mock.calls[0][1].body).toEqual(
      '{"count":100,"include_data":true,"writer_ids":["writerToQuery"],"record_ids":["recordToQuery"],"content_types":["typeToQuery"],"after_index":0,"include_all_writers":false}'
    )
    // decrypts all the records from the response
    queryResult.map(record => {
      expect(record.data.recordData).toEqual("decryptedData")
    })
  })

  it("shares a record type", async () => {
    fetch.mockResponses(
      [
        JSON.stringify({
          access_token: "getEAK",
          expires_at: "xxxxx",
          authorizer_public_key: { curve25519: "xxx" }
        })
      ],
      [
        JSON.stringify({
          clientId: "responseClientId",
          public_key: { curve25519: "xxxx" },
          validated: true
        })
      ],
      [
        JSON.stringify({
          access_token: "putNewEAK",
          expires_at: "xxxxx",
          authorizer_public_key: { curve25519: "xxx" }
        })
      ],
      [JSON.stringify({ body: "" })]
    )

    const share = await client1.share(
      "recordTypeToShare",
      "clientIdToShareWith"
    )

    // auth token already cached
    // tries to GET access key, succeeds
    expect(fetch.mock.calls[0][0]).toEqual(
      "https://localhost/v1/storage/access_keys/00000000-0000-0000-0000-000000000000/00000000-0000-0000-0000-000000000000/00000000-0000-0000-0000-000000000000/recordTypeToShare"
    )
    // GETS from /storage/clients to get public key for the reader
    expect(fetch.mock.calls[1][0]).toEqual(
      "https://localhost/v1/storage/clients/clientIdToShareWith"
    )
    // PUTs a new access key for the reader
    expect(fetch.mock.calls[2][0]).toEqual(
      "https://localhost/v1/storage/access_keys/00000000-0000-0000-0000-000000000000/00000000-0000-0000-0000-000000000000/clientIdToShareWith/recordTypeToShare"
    )
    // access key in request is encrypted
    expect(JSON.parse(fetch.mock.calls[2][1].body)).toEqual({
      eak: "privateKey.EncryptedprivateKey.AccessKey.xxxx"
    })
    // PUTs a new policy for the new reader
    expect(fetch.mock.calls[3][0]).toEqual(
      "https://localhost/v1/storage/policy/00000000-0000-0000-0000-000000000000/00000000-0000-0000-0000-000000000000/clientIdToShareWith/recordTypeToShare"
    )
    // if response status successful, returns Promise that resolves true
    expect(share).toEqual(true)

    /*
            could test email passed as param 
        */
  })

  it("revokes (unshares) a record type", async () => {
    fetch.mockResponses(
      [JSON.stringify({ body: "" }), { status: 204 }],
      [JSON.stringify({ body: "" }), { status: 204 }]
    )

    const revoked = await client1.revoke(
      "recordTypeToRevoke",
      "clientIdToRevokeFrom"
    )

    // auth token already cached
    // PUTS policy deny to /storage/policy
    expect(fetch.mock.calls[0][0]).toEqual(
      "https://localhost/v1/storage/policy/00000000-0000-0000-0000-000000000000/00000000-0000-0000-0000-000000000000/clientIdToRevokeFrom/recordTypeToRevoke"
    )
    // DELETE request to storage/access_keys
    expect(fetch.mock.calls[1][0]).toEqual(
      "https://localhost/v1/storage/access_keys/00000000-0000-0000-0000-000000000000/00000000-0000-0000-0000-000000000000/clientIdToRevokeFrom/recordTypeToRevoke"
    )
    // returns Promise that resolves true
    expect(revoked).toEqual(true)

    /*
            could test email passed as param 
        */
  })

  it("serializes in the proper order", () => {
    let testData = {
      k1: "val1",
      k3: "val2",
      k2: "val3",
      AAA: "val4",
      k4: {
        k3: "val1",
        k2: "val2",
        "😐": "val3",
        k1: "val4"
      },
      "😐": "val5"
    }

    let data = new RecordData(testData)
    let serialized = data.stringify()

    expect(serialized).toBe(
      '{"AAA":"val4","k1":"val1","k2":"val3","k3":"val2","k4":{"k1":"val4","k2":"val2","k3":"val1","😐":"val3"},"😐":"val5"}'
    )
  })

  it("serializes RecordInfo properly", () => {
    let plain = { field: "value" }
    let meta = new Meta(null, null, null, plain)
    let data = { dataField: "value" }

    let recordInfo = new RecordInfo(meta, data)

    expect(recordInfo.stringify()).toBe(
      '{"plain":{"field":"value"},"type":null,"user_id":null,"writer_id":null}{"dataField":"value"}'
    )
  })

  it("properly marshalls signed document fields", async () => {
    let document = { field: "value" }
    let signature = "signature"

    let signedDocument = new SignedDocument(document, signature)
    let serialized = signedDocument.serializable()

    expect(serialized.doc).toBe(signedDocument.document)
    expect(serialized.sig).toBe(signedDocument.signature)

    let decoded = await SignedDocument.decode(serialized)

    expect(decoded.document).toBe(signedDocument.document)
    expect(decoded.signature).toBe(signedDocument.signature)
  })

  it("can verify a signature from another SDK", async () => {
    // e3db-java SDK produced this document.
    let document = `{"doc":{"data":{"a":"yZI0kCHXHtgN2O-9gMdH6OnJDZKn3s8dpRQrZL_NWG2gSWDt4qomAG4abyTby-or.HOBwIJHQC4fm62dRMkM3fASsgDgA8slj.bHpBXShz1xahRiWgMRo6og.YNk6zU7NdxF1nyjj2yxSqw9WLUI6oqKT"},"meta":{"plain":{"client_pub_sig_key":"DW4lugZbPA5AsXyUBWMpRW6pH4UJhi9t1RV7wDWkl4c"},"type":"3835f34f-e667-4fc6-a227-d606cdb2e0a8","user_id":"169f8c64-6f9d-4de7-9e0e-29ec6c53336f","writer_id":"169f8c64-6f9d-4de7-9e0e-29ec6c53336f"},"rec_sig":"xlaTFff9js4_TkW32j74ufXJRmF_mSq0DbrN9qdk6lTXv6yyDkz0VhRtpyyeVUJju5RJVW-EGUEn_BNAoGKUDA"},"sig":"SXQR4zNiaeItbrqIEOO8Kl1HcIFKH_pxLCTTQwyx0gvuJUS052rrLSXbGPX4wLoOeknVQrD6EJJXODv8Wt3GDA"}`

    let parsed = JSON.parse(document)
    let encrypted = await Record.decode(parsed.doc)
    let doc = new SignedDocument(encrypted, parsed.sig)
    let publicKeyJava = encrypted.meta.plain.client_pub_sig_key

    let verify = await client1.verify(doc, publicKeyJava)
    expect(verify).toBe(true)
  })

  it("encrypt locally and decrypt locally", async () => {
    const testLocalEAK = {
      signerSigningKey: { ed25519: "publicSignKey" }
    }
    const localEncRecord = await client1.localEncrypt(
      "localTestType",
      {
        localData1: "localValue1",
        localData2: "localValue2"
      },
      testLocalEAK
    )
    // encrypts the data values
    expect(localEncRecord.data.recordData).toEqual("encryptedData")
    // signs the record
    expect(localEncRecord.signature).toEqual("privateSignKey.signature")

    const localDecRecord = await client1.localDecrypt(
      localEncRecord,
      testLocalEAK
    )
    // decrypts the data values
    expect(localDecRecord.data.recordData).toEqual("decryptedData")
  })

  it("can get a writer key that already exists", async () => {
    fetch.mockResponses([
      JSON.stringify({
        access_token: "12345",
        expires_at: "xxxxx",
        authorizer_public_key: { curve25519: "xxx" }
      })
    ])

    const exampleEAK = await client1.createWriterKey("exampleType")
    expect(fetch.mock.calls[0][0]).toEqual("https://localhost/v1/storage/access_keys/00000000-0000-0000-0000-000000000000/00000000-0000-0000-0000-000000000000/00000000-0000-0000-0000-000000000000/exampleType")
    expect(exampleEAK.eak).toEqual('privateKey.EncryptedprivateKey.AccessKey.publicKey')
    expect(exampleEAK.authorizerID).toEqual('00000000-0000-0000-0000-000000000000')
    expect(exampleEAK.authorizerPublicKey.curve25519).toEqual("publicKey")
    expect(exampleEAK.signerId).toEqual('00000000-0000-0000-0000-000000000000')
    expect(exampleEAK.signerSigningKey.ed25519).toEqual('publicSignKey')
  })

    it("can create a writer key if one does not already exist", async () => {
        fetch.mockResponses(
            [JSON.stringify(), { status: 404 }],
            [
                JSON.stringify({
                    clientId: "responseClientId",
                    public_key: { curve25519: "xxxx" },
                    validated: true
                })
            ],
            [
                JSON.stringify({
                    access_token: "12345",
                    expires_at: "xxxxx",
                    authorizer_public_key: { curve25519: "xxx" }
                })
            ]
        )

        const example2EAK = await client1.createWriterKey("exampleType2")

        // attempts to GET the access key 
        expect(fetch.mock.calls[0][0]).toEqual('https://localhost/v1/storage/access_keys/00000000-0000-0000-0000-000000000000/00000000-0000-0000-0000-000000000000/00000000-0000-0000-0000-000000000000/exampleType2')
        // gets the client info to get the reader's public key  
        expect(fetch.mock.calls[1][0]).toEqual('https://localhost/v1/storage/clients/00000000-0000-0000-0000-000000000000')
        // PUTs a new eak for the reader 
        expect(fetch.mock.calls[2][0]).toEqual('https://localhost/v1/storage/access_keys/00000000-0000-0000-0000-000000000000/00000000-0000-0000-0000-000000000000/00000000-0000-0000-0000-000000000000/exampleType2')
        // the access key is encrypted in the PUT request 
        expect(JSON.parse(fetch.mock.calls[2][1].body).eak).toEqual("privateKey.EncryptedreturnedRandomKey.xxxx")

        expect(example2EAK.eak).toEqual("privateKey.EncryptedreturnedRandomKey.publicKey")
        expect(example2EAK.authorizerID).toEqual('00000000-0000-0000-0000-000000000000')
        expect(example2EAK.authorizerPublicKey.curve25519).toEqual("publicKey")
        expect(example2EAK.signerId).toEqual('00000000-0000-0000-0000-000000000000')
        expect(example2EAK.signerSigningKey.ed25519).toEqual('publicSignKey')
    })

  it('can get a reader key for this client', async () => {

    fetch.mockResponses([
        JSON.stringify({
            access_token: "12345",
            expires_at: "xxxxx",
            authorizer_public_key: { curve25519: "xxx" },
            eak: 'exampleEAK'
        })
    ])
    const exampleReaderKey = await client1.getReaderKey('exWriterId', 'exUserId', 'exType')
    // GETs the reader's public key  
    expect(fetch.mock.calls[0][0]).toEqual("https://localhost/v1/storage/access_keys/exWriterId/exUserId/00000000-0000-0000-0000-000000000000/exType")
    expect(exampleReaderKey.eak).toEqual("exampleEAK")
  })

  it ('can get a client public key', async () => {

    fetch.mockResponses(
        [
            JSON.stringify({
                clientId: "responseClientId",
                public_key: { curve25519: "xxxx" },
                validated: true
            })
        ]
    )

    const exampleClientPubKey = await client1.clientKey('testClientId')
    expect(fetch.mock.calls[0][0]).toEqual('https://localhost/v1/storage/clients/testClientId')
    expect(exampleClientPubKey.curve25519).toEqual('xxxx')
  })

  it('can get outgoingSharing', async () => {

      fetch.mockResponses([
        JSON.stringify([
            {
                reader_id: 'readerId1',
                record_type: 'recordType1',
                reader_name: 'readerName1'
            },
            {
                reader_id: 'readerId2',
                record_type: 'recordType2',
                reader_name: 'readerName2'
            },
            {
                reader_id: 'readerId3',
                record_type: 'recordType3',
                reader_name: 'readerName3'
            }
        ])
      ])

      const outShares = await client1.outgoingSharing()
      expect(outShares[0].readerId).toEqual('readerId1')
      expect(outShares[0].recordType).toEqual('recordType1')
      expect(outShares[0].readerName).toEqual('readerName1')
      expect(outShares[1].readerId).toEqual('readerId2')
      expect(outShares[1].recordType).toEqual('recordType2')
      expect(outShares[1].readerName).toEqual('readerName2')
      expect(outShares[2].readerId).toEqual('readerId3')
      expect(outShares[2].recordType).toEqual('recordType3')
      expect(outShares[2].readerName).toEqual('readerName3')
  })

it('can get outgoingSharing', async () => {

    fetch.mockResponses([
        JSON.stringify([
            {
                writer_id: 'writerId1',
                record_type: 'recordType1',
                writer_name: 'writerName1'
            },
            {
                writer_id: 'writerId2',
                record_type: 'recordType2',
                writer_name: 'writerName2'
            },
            {
                writer_id: 'writerId3',
                record_type: 'recordType3',
                writer_name: 'writerName3'
            }
        ])
    ])

    const outShares = await client1.incomingSharing()
    expect(outShares[0].writerId).toEqual('writerId1')
    expect(outShares[0].recordType).toEqual('recordType1')
    expect(outShares[0].writerName).toEqual('writerName1')
    expect(outShares[1].writerId).toEqual('writerId2')
    expect(outShares[1].recordType).toEqual('recordType2')
    expect(outShares[1].writerName).toEqual('writerName2')
    expect(outShares[2].writerId).toEqual('writerId3')
    expect(outShares[2].recordType).toEqual('recordType3')
    expect(outShares[2].writerName).toEqual('writerName3')
})

  /* Dev helpers:

    // console.log('CALLS', fetch.mock.calls)
    // for (let call in fetch.mock.calls){
    //     console.log(call + ': ', fetch.mock.calls[call])
    // }

    console.log(fetch.mock.calls[0][0])
    console.log(fetch.mock.calls[0][1])
    console.log(fetch.mock.calls[1][0])
    console.log(fetch.mock.calls[1][1])
    // console.log(JSON.parse(fetch.mock.calls[1][1]))
    console.log(JSON.parse(fetch.mock.calls[1][1].body).data)
    // console.log(fetch.mock.calls[2][0])
    // console.log(fetch.mock.calls[3][0])
    // console.log(fetch.mock.calls[3][1])
    // console.log(fetch.mock.calls[4][0])
    // console.log(fetch.mock.calls[4][1])
    // console.log(fetch.mock.calls[5][0])
    // console.log(fetch.mock.calls[5][1])
    */
})
