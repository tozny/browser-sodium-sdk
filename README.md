# Tozny Storage (TozStore) Browser Sodium SDK (JavaScript For The Browser)

## WARNING

This is alpha software for Tozny internal development. Tozny does not guarantee that this library is stable and does not offer support for usage at this time.  Please use our existing stable [JavaScript SDK](https://github.com/tozny/e3db-js).

The Tozny Storage platform (TozStore) is an end-to-end encrypted storage platform with powerful sharing and consent management features.

## Terms of Service

Your use of TozStore must abide by our [Terms of Service](https://github.com/tozny/e3db-java/blob/master/terms.pdf), as detailed in the linked document.

# Getting Started

## NPM Installation

To install with NPM add the following to your `package.json` file:

```
"dependencies": {
    "e3db": "^1.2"
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

E3DB supports many options for querying records based on the fields stored in record metadata. Refer to the API documentation for the complete set of options that can be passed to `Client.query`.

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

## Local Encryption & Decryption

The E3DB SDK allows you to encrypt documents for local storage, which can be decrypted later, by the client that created the document or any client with which the document has been `shared`. Note that locally encrypted documents _cannot_ be written directly to E3DB -- they must be decrypted locally and written using the `write` or `update` methods.

Local encryption (and decryption) requires multiple steps:

1. Create a random access key (will be used for both encryption and decryption)
1. Encrypt the access key for the writer (for encryption)
1. Call `encrypt` to both sign and encrypt the document

Here is an example of encrypting a document locally:

```js
const e3db = require('e3db')

let client = new e3db.Client(/* config */)

let document = {
  line:   "Say I'm the only bee in your bonnet",
  song:   'Birdhouse in Your Soul',
  artist: 'They Might Be Giants'
}

async function main() {
  let eak = await client.createWriterKey('lyric')

  let encrypted = await client.encrypt('lyric', document, eak)

  // Write record to storage in suitable format.
}
main()
```

## Local Decryption of Shared Records

When two clients have a sharing relationship, the "reader" can locally decrypt any documents encrypted by the "writer," without using E3DB for storage.

The 'writer' must first share records with a 'reader', using the `share` method. The 'reader' can then decrypt any locally encrypted records as follows:

```js
const e3db = require('e3db')

let client = new e3db.Client(/* config */)

let writerId = '' // UUID of the record creator
let encrypted = '' // read encrypted record from local storage

async function main() {
  let eak = await client.getReaderKey(writerId, writerId, 'lyric') // Encrypted access key for the reader
  
  let record = await client.decrypt(encrypted, eak)
}
main()
```

## Document Signing & Verification

Every E3DB client created with this SDK is capable of signing documents and verifying the signature associated with a document. (Note that E3DB records are also stored with a signature attached, but verification of that is handled internally to the SDK.) By attaching signatures to documents, clients can be confident in:

- Document integrity - the document's contents have not been altered (because the signature will not match).
- Proof-of-authorship - The author of the document held the private signing key associated with the given public key when the document was created.

To create a signature, use the `sign` method:

```js
const e3db = require('e3db')

let client = new e3db.Client(/* config */)

let document = {
  line:   "Say I'm the only bee in your bonnet",
  song:   'Birdhouse in Your Soul',
  artist: 'They Might Be Giants'
}

async function main() {
 let data = new RecordData(document)
 let meta = new Meta(client.config.clientId, client.config.clientId, 'lyric', {})

 let recordInfo = new RecordInfo(meta, data)
 let signature = await client.sign(recordInfo)

 let signed = new Record(meta, data, signature)
}
main()
```

To verify a document, use the verify method. Here, we use the same object instances as above. `client.config` holds the private & public keys for the client. (Note that, in general, verify requires the public signing key of the client that wrote the record):

```js
async function verify() {
  let signedDocument = new SignedDocument(recordInfo, signature)
  let verified = await client.verify(signedDocument, client.config.publicSignKey)
  if (! verified) {
    // Document failed verification, indicate an error as appropriate
  }
}
verify()
```

<!-- ## More examples

See [the simple example code](https://github.com/tozny/e3db-js/blob/master/examples/simple.js) for runnable detailed examples.

## Documentation

General E3DB documentation is [on our web site](https://tozny.com/documentation/e3db/). -->

