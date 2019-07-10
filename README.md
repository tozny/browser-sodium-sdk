# Tozny Storage (TozStore) Browser Sodium SDK (JavaScript For The Browser)

## WARNING

This is alpha software for Tozny internal development. Tozny does not guarantee that this library is stable and does not offer support for usage at this time.  Please use our existing stable [JavaScript SDK](https://github.com/tozny/e3db-js).

The Tozny Storage platform (TozStore) is an end-to-end encrypted storage platform with powerful sharing and consent management features.

## Terms of Service

Your use of TozStore must abide by our [Terms of Service](https://github.com/tozny/e3db-java/blob/master/terms.pdf), as detailed in the linked document.

# Getting Started

To get familiar with TozStore, you can run the following code samples in a sandbox and follow the changes being made in the Tozny Dashboard.

## NPM Installation

To install with NPM add the following to your `package.json` file:

```
"dependencies": {
    "tozny-browser-sodium-sdk": "^0.0.14"
}
```

Then run `npm install`

Alternatively, run:

```
$ npm install --save tozny-browser-sodium-sdk
```

NPM will automatically amend your `package.json` file for you with the latest package version.

## Creating clients

To get started, you will need to create an account on the [Tozny Dashboard](https://dashboard.tozny.com).

TozStore understands endpoints as clients. Every TozStore client needs a unique set of client credentials that must be generated and provided securely as parameters to instantiate a client instance using an SDK. The client instance possesses read, write, share, revoke, and other methods.

A client's credentials are integrally involved when they perform cryptographic operations, prime examples being when client writes (encrypts), reads (decrypts), and shares access to data records. Because of this, compromised private keys pose a great security risk, and using TozStore properly requires strong key management.

### Create client credentials with Tozny Dashboard

The first way to generate client credentials is go to the Dashboard to the Create Clients tab and create a new client, then gather the client's credentials presented as a JSON. (The client credentials JSON can always be retrieved from the Clients section.)  In this one action,the Dashboard will generate the needed keys, register the client with TozStore, and receive the resulting TozStore client ID and credentials needed to authenticate with the Tozny API. Additionally, an encrypted back-up of the client's credentials will saved in TozStore. This same workflow can be implemented using a TozStore SDK to dynamically generate client credentials, register, and optionally back-up clients.

To instantiate a TozStore client instance and access the TozStore API with a client credentials object copied & pasted from the Dashboard:

```
const { Config, Client } = require('tozny-browser-sodium-sdk')

/*
   This example uses environment variables to provide client credentials.
   Remember that client credentials include a private key.
   Clients' private keys must be kept secret.
   The client credentials have this structure:

       {
        "version": *,
        "client_id": "**************************",
        "client_email": "********************",
        "api_url": "********************",
        "api_key_id": "****************************************************************",
        "api_secret": "****************************************************************",
        "public_key": "*******************************************",
        "private_key": "*******************************************",
        "public_signing_key":  "*******************************************",
        "private_signing_key": "**************************************************************************************"
    }
*/

const config = Config.fromObject(
    process.env.CLIENT_CREDENTIALS_JSON
)

const client = new Client(config)

console.log(client)

```

[More info](https://docs.tozny.com/#generating-client-credentials)

### Create client credentials programmatically with SDK

To create client credentials programmatically with an SDK. First, go to the Dashboard to the Registration Tokens tab and create a registration token.

#### With Backup

```

const { Config, Client } = require('tozny-browser-sodium-sdk')

const regToken = process.env.REGISTRATION_TOKEN
const apiUrl = process.env.API_URL

const createClient = async () => {
    const cryptoKeys = await Client.generateKeypair()
    const signingKeys = await Client.generateSigningKeypair()
    const clientName = 'browser-sdk-client'+ Math.random().toString(36).substr(2)

    const clientCredentials = await Client.register(
        regToken,
        clientName,
        cryptoKeys,
        signingKeys,
        true,           // determines whether client's credentials will be backed up
        apiUrl
    )

    const config = new Config(
        clientCredentials.clientId,
        clientCredentials.apiKeyId,
        clientCredentials.apiSecret,
        cryptoKeys.publicKey,
        cryptoKeys.privateKey,
        apiUrl,
        signingKeys.publicKey,
        signingKeys.privateKey
    )

    const client = new Client(config)
    return client
}

const client = createClient()
console.log(client)

```

#### Without Backup

```

const { Config, Client } = require('tozny-browser-sodium-sdk')

const regToken = process.env.REGISTRATION_TOKEN
const apiUrl = process.env.API_URL

const createClient = async () => {
    const cryptoKeys = await Client.generateKeypair()
    const signingKeys = await Client.generateSigningKeypair()
    const clientName = 'browser-sdk-client'+ Math.random().toString(36).substr(2)

    const clientCredentials = await Client.register(
        regToken,
        clientName,
        cryptoKeys,
        signingKeys,
        false,              // determines whether client's credentials will be backed up
        apiUrl
    )

    const config = new Config(
        clientCredentials.clientId,
        clientCredentials.apiKeyId,
        clientCredentials.apiSecret,
        cryptoKeys.publicKey,
        cryptoKeys.privateKey,
        apiUrl,
        signingKeys.publicKey,
        signingKeys.privateKey
    )

    const client = new Client(config)
    return client
}

const client = createClient()
console.log(client)

```

## Writing a record

To write new records to the database, call the `Client.write` method with a string describing the type of data to be written, a record data object of key value pairs (the keys be stored in plaintext and the values encrypted), and optional object of plaintext metadata. `Client.write` returns the newly created record.

```js

const write = async (client) => {
  const recordData = {
    keyA: 'valueA',
    keyB: 'valueB',
    keyC: 'valueC'
  }
  const plainMeta = {
    plain1: "val1",
    plain2: "val2",
    plain3: "val3"
  }
  const written = await client.write('test-type', recordData, plainMeta)
  return written
}

const record = write()
console.log(record)

```

## Querying records

TozStore supports many options for querying records based on the fields stored in record metadata. Refer to the API documentation for the complete set of options that can be passed to `Client.query`.

```js

let data = true
let writer = null
let record = null
let type = 'test-type'

const query = async (client) => {
  let records = await client.query(data, writer, record, type).next()
  return records
}
const records = query(client)
console.log(records)

```

In this example, the `Client.query` method returns an array that contains each record that matches the query.

## Read a record by record id

```
const read = async (client) => {

    // The Client.query method is used in this example to get a record id.

    let data = true
    let writer = null
    let record = null
    let type = 'test-type'
    let records = await client.query(data, writer, record, type).next()
    const recordId = records[0].meta.recordId

    let readRecord = await client.read(recordId)
    return readRecord
}

const readRecord = read(client)
console.log(readRecord)

```

## Share records by type

```
const share = async (client) => {

    // A second client needs to exist to share records.
    const client2 = await createClient()

    // This client needs a record type to share.
    const sharedType = 'shared-type'
    const recordData = {
        firstKey: 'firstVal',
        secondKey: 'secondVal'
    }
    const plainMeta = {
        plainOne: '1',
        plainTwo: '2'
    }
    await client2.write(sharedType, recordData, plainMeta)

    // Now this client can share with the first client.
    const shared = await client2.share(sharedType, client.config.clientId)
    console.log(shared)

    // And the first client can now read that record.
    let data = true
    let writer = client2.config.clientId
    let record = null
    const sharedRecords = await client.query(data, writer, record, sharedType).next()
    console.log(sharedRecords)
}

share(client)
```

## Revoke record share by type

```
const revoke = async (client) => {

    // A second client needs to exist to share records.
    const client2 = await createClient()

    // This client needs a record type to share.
    const sharedType = 'shared-type'
    const recordData = {
        firstKey: 'firstVal',
        secondKey: 'secondVal'
    }
    const plainMeta = {
        plainOne: '1',
        plainTwo: '2'
    }
    await client2.write(sharedType, recordData, plainMeta)

    // Now this client can share with the first client.
    const shared = await client2.share(sharedType, client.config.clientId)
    console.log(shared)

    // And the first client can now read that record.
    let data = true
    let writer = client2.config.clientId
    let record = null
    const sharedRecords = await client.query(data, writer, record, sharedType).next()
    console.log(sharedRecords)

    // But the second client can revoke the share.
    const revoke = await client2.revoke(sharedType, client.config.clientId)
    console.log(revoke)

    // The first client will no longer be able to read that type.
    const revokeOfShared = await client.query(data, writer, record, sharedType).next()
    console.log(revokeOfShared)
}

revoke(client)

```

## Write Large File

The `Client.writeLargeFile` method expects a file parameter as a JavaScript File object type along with a record type and an optional object of plaintext metadata.  This type of file can be gathered with an input.

```
  <input type="file" id="files" name="files[]" />

```

```
const writeFile = async (client) => {
    const exampleFile = new File(
        ["A first line of text.  And a second line of text.  Lastly, a third line of text."],
        "filename.txt",
        {type: "text/plain"}
    )
    const plainMeta = {
        key1: 'val1',
        key2: 'val2'
    }

    const writtenFile = await client.writeLargeFile('file-type', exampleFile, plainMeta)
    console.log(writtenFile)
}

writeFile(client)

```

The `Client.writeLargeFile` method will return a TozStore File type with information about the record including plaintext metadata and a record id that can be used to download the record.

## Read Large File

The `Client.readLargeFile` method takes a record id and a destination file name.

```
const readFile = async (client) => {
    const exampleFile = new File(
        ["Line one.  Line two. Line three"],
        "exampleFile.txt",
        {type: "text/plain"}
    )
    const plainMeta = {
        keyOne: 'valueOne',
        keyTwo: 'valueTwo'
    }

    const writtenFile = await client.writeLargeFile('file-type', exampleFile, plainMeta)
    const fileId = writtenFile.recordId

    const readFile = await client.readLargeFile(fileId, 'destination_filename')
    console.log(readFile)
    const text = await (new Response(readFile[0])).text()
    console.log(text)

}

readFile(client)
```

The `Client.readLargeFile` method returns a JavaScript Blob type object of the decrypted bytes and a TozStore File object.


## Local Encryption & Decryption

The TozStore SDK allows you to encrypt documents for local storage, which can be decrypted later, by the client that created the document or any client with which the document has been `shared`. Note that locally encrypted documents _cannot_ be written directly to TozStore -- they must be decrypted locally and written using the `write` or `update` methods.

Local encryption (and decryption) requires multiple steps:

1. Create a random access key (will be used for both encryption and decryption)
1. Encrypt the access key for the writer (for encryption)
1. Call `encrypt` to both sign and encrypt the document

Here is an example of encrypting a document locally:

```js

const localEncrypt = async (client) => {

  let document = {
    line:   "Say I'm the only bee in your bonnet",
    song:   'Birdhouse in Your Soul',
    artist: 'They Might Be Giants'
  }

  let eak = await client.createWriterKey('lyric')

  let encrypted = await client.localEncrypt('lyric', document, eak, {metaKey1: 'plainVal1'})

  console.log(encrypted)

  // Write record to storage in suitable format.

}
localEncrypt(client)

```

## Local Decryption of Shared Records

When two clients have a sharing relationship, the "reader" can locally decrypt any documents encrypted by the "writer," without using TozStore for storage.

The 'writer' must first share records with a 'reader', using the `share` method. The 'reader' can then decrypt any locally encrypted records as follows:

```js
const localDecrypt = async (client) => {

  // An encrypted record is needed to decrypt.

  let document = {
    line:   "Say I'm the only bee in your bonnet",
    song:   'Birdhouse in Your Soul',
    artist: 'They Might Be Giants'
  }

  let eak = await client.createWriterKey('lyric')

  let encrypted = await client.localEncrypt('lyric', document, eak, {metaKey1: 'plainVal1'})
  // Write record to storage in suitable format.
  let writerId = client.config.clientId

  // The client can share that record type with another client.
  const client2 = await createClient()
  const readerClientId = client2.config.clientId
  const share = await client.share('lyric', readerClientId)
  console.log(share)

  // The second client can now read the shared record type.
  let eak2 = await client2.getReaderKey(writerId, writerId, 'lyric') // Encrypted access key for the reader
  let record = await client2.localDecrypt(encrypted, eak2)
  console.log(record)
}
localDecrypt(client)

```

## Document Signing & Verification

Every TozStore client created with this SDK is capable of signing documents and verifying the signature associated with a document. (Note that TozStore records are also stored with a signature attached, but verification of that is handled internally to the SDK.) By attaching signatures to documents, clients can be confident in:

- Document integrity - the document's contents have not been altered (because the signature will not match).
- Proof-of-authorship - The author of the document held the private signing key associated with the given public key when the document was created.

To create a signature, use the `sign` method:

```js
const { Config, Client, tozStoreTypes } = require('tozny-browser-sodium-sdk')

const signDoc = async (client) => {
 let data = new tozStoreTypes.RecordData(document)
 let meta = new tozStoreTypes.Meta(client.config.clientId, client.config.clientId, 'lyric', {})

 let recordInfo = new tozStoreTypes.RecordInfo(meta, data)
 let signature = await client.sign(recordInfo)

 let signed = new tozStoreTypes.Record(meta, data, signature)
 console.log('signed', signed)
}

signDoc(client)

```

To verify a document, use the verify method. Here, we use the same object instances as above. `client.config` holds the private & public keys for the client. (Note that, in general, verify requires the public signing key of the client that wrote the record):

```js
const verify = async (client) => {
 let data = new tozStoreTypes.RecordData(document)
 let meta = new tozStoreTypes.Meta(client.config.clientId, client.config.clientId, 'lyric', {})

 let recordInfo = new tozStoreTypes.RecordInfo(meta, data)
 let signature = await client.sign(recordInfo)

 let signed = new tozStoreTypes.Record(meta, data, signature)
 console.log('signed', signed)

 let signedDocument = new tozStoreTypes.SignedDocument(recordInfo, signature)
 let verified = await client.verify(signedDocument, client.config.publicSigningKey)
 if (! verified) {
   // Document failed verification, indicate an error as appropriate
 }
 console.log(verified)
}

verify(client)
```

## Documentation

General TozStore documentation is [on our web site](https://developers.tozny.com/).
