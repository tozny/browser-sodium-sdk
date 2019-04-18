[![Build Status][travis-image]][travis-url] [![Coverage Status][coveralls-image]][coveralls-url] [![NPM version][npm-image]][npm-url] [![Dependency Status][daviddm-image]][daviddm-url]

# E3DB JavaScript SDK

The Tozny End-to-End Encrypted Database (E3DB) is a storage platform with powerful sharing and consent management features.
[Read more on our blog.](https://tozny.com/blog/announcing-project-e3db-the-end-to-end-encrypted-database/)

This repository contains a fully asynchronous SDK that can be used both for server-side applications with Node as well as in modern browsers.

## Terms of Service

Your use of E3DB must abide by our [Terms of Service](https://github.com/tozny/e3db-java/blob/master/terms.pdf), as detailed in the linked document.

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
$ npm install --save e3db
```

NPM will automatically amend your `package.json` file for you with the latest package version.

## Registering a client

Register an account with [InnoVault](https://innovault.io) to get started. From the Admin Console you can create clients directly (and grab their credentials from the console) or create registration tokens to dynamically create clients with `e3db.Client.register()`. Clients registered from within the console will automatically back their credentials up to your account. Clients created dynamically via the SDK can _optionally_ back their credentials up to your account.

For a more complete walkthrough, see [`/examples/registration.js`](https://github.com/tozny/e3db-js/blob/master/examples/registration.js).

### Without Credential Backup

ES2017 async/await
```js
const e3db = require('e3db')

let token = '...'
let clientName = '...'

async function main() {
  let cryptoKeys  = await e3db.Client.generateKeypair();
  let signingKeys = await e3db.Client.generateSigningKeypair();
  let clientInfo  = await e3db.Client.register(token, clientName, cryptoKeys, signingKeys)

  // ... Run operations with the client's details here
}
main()
```

Promises
```js
const e3db = require('e3db')

let token = '...'
let clientName = '...'

e3db.Client.generateKeypair()
  .then(cryptoKeys => {
    e3db.Client.generateSigningKeypair()
      .then(signingKeys => {
        e3db.Client.register(token, clientName, cryptoKeys, signingKeys)
          .then(clientInfo => {
            // ... Run operations with the client's details here
          })
      })
  })
```

The object returned from the server contains the client's UUID, API key, and API secret (as well as echos back the public key passed during registration). It's your responsibility to store this information locally as it _will not be recoverable_ without credential backup.

### With Credential Backup

```js
const e3db = require('e3db')

let token = '...'
let clientName = '...'

async function main() {
  let cryptoKeys  = await e3db.Client.generateKeypair();
  let signingKeys = await e3db.Client.generateSigningKeypair();
  let clientInfo  = await e3db.Client.register(token, clientName, cryptoKeys, signingKeys, true)

  // ... Run operations with the client's details here
}
main()
```

The private key must be passed to the registration handler when backing up credentials as it is used to cryptographically sign the encrypted backup file stored on the server. The private key never leaves the system, and the stored credentials will only be accessible to the newly-registered client itself or the account with which it is registered.

## Loading configuration and creating a client

Configuration is managed at runtime by instantiating an `e3db.Config` object with your client's credentials.

```js
const e3db = require('e3db')

/**
 * Assuming your credentials are stored as defined constants in the
 * application, pass them each into the configuration constructor as
 * follows:
 */
let config = new e3db.Config(
  process.env.CLIENT_ID,
  process.env.API_KEY_ID,
  process.env.API_SECRET,
  process.env.PUBLIC_KEY,
  process.env.PRIVATE_KEY,
  process.env.API_URL
)

/**
 * Pass the configuration when building a new client instance.
 */
let client = new e3db.Client(config)
```

# Usage

## Writing a record

To write new records to the database, call the `e3db.Client::write` method with a string describing the type of data to be written, along with an associative array containing the fields of the record. `e3db.Client::write` returns the newly created record.

```js
const e3db = require('e3db')

let client = new e3db.Client(/* config */)

async function main() {
  let record = await client.write('contact', {
    'first_name': 'Jon',
    'last_name': 'Snow',
    'phone': '555-555-1212',
  })

  console.log('Wrote record ' + record.meta.recordId)
}
main()
```

## Querying records

E3DB supports many options for querying records based on the fields stored in record metadata. Refer to the API documentation for the complete set of options that can be passed to `e3db.Client::query`.

For example, to list all records of type `contact` and print a simple report containing names and phone numbers:

```js
const e3db = require('e3db')

let client = new e3db.Client(/* config */)

let data = true
let writer = null
let record = null
let type = 'contact'

async function main() {
  let records = await client.query(data, writer, record, type).next()
  let fullName = record.data.first_name + ' ' + record.data.last_name
  console.log(fullName + ' --- ' + record.data.phone)
}
main()
```

In this example, the `e3db.Client::query` method returns an array that contains each record that matches the query.

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

## More examples

See [the simple example code](https://github.com/tozny/e3db-js/blob/master/examples/simple.js) for runnable detailed examples.

## Documentation

General E3DB documentation is [on our web site](https://tozny.com/documentation/e3db/).

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/tozny/e3db-js.


[npm-image]: https://badge.fury.io/js/e3db.svg
[npm-url]: https://npmjs.org/package/e3db
[travis-image]: https://travis-ci.org/tozny/e3db-js.svg?branch=master
[travis-url]: https://travis-ci.org/tozny/e3db-js
[coveralls-image]: https://coveralls.io/repos/github/tozny/e3db-js/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/tozny/e3db-js
[daviddm-image]: https://david-dm.org/tozny/e3db-js.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/tozny/e3db-js
