/**
 * This program provides a few simple examples of reading, writing, and
 * querying e3db records. For more detailed information, please see the
 * documentation home page: https://tozny.com/documentation/e3db/
 *
 * @copyright  Copyright (c) 2017 Tozny, LLC (https://tozny.com)
 * @license    MIT License
 */

const e3db = require('../dist/index.js')
require('dotenv').config()


/**
 * ---------------------------------------------------------
 * Initialization
 * ---------------------------------------------------------
 */

// Configuration values must be set in an immutable configuration object.
// You can use whatever "profiles" or client credentials you want.
let config = new e3db.Config(
  process.env.CLIENT_ID,
  process.env.API_KEY_ID,
  process.env.API_SECRET,
  process.env.PUBLIC_KEY,
  process.env.PRIVATE_KEY,
  process.env.API_URL,
  process.env.PUBLIC_SIGN_KEY,
  process.env.PRIVATE_SIGN_KEY
)

let crypto = new e3db.Crypto('sodium')
// Now create a client using that configuration

let client = new e3db.Client(config, crypto)
// console.log(client)
// console.log(client.write)

async function main() {
  /**
   * ---------------------------------------------------------
   * Writing a record
   * ---------------------------------------------------------
   */


  // Create a record by first creating a local version as an object:
  let doc = {
    name: 'Jon Snow',
    whatHeKnows: 'Nothing'
  }

  // Now encrypt the *value* part of the record, write it to the server and
  // the server returns the newly created record:

  var record = await client.write('test-contact', doc)
  console.log('simple RECORD', record)
  let recordId = record.meta.recordId
  console.log('Wrote:    ' + recordId)

  /**
   * ---------------------------------------------------------
   * Simple reading and queries
   * ---------------------------------------------------------
   */

  // Use the new record's unique ID to read the same record again from E3DB:

  // var newRecord = await client.read(record.meta.recordId)
  // console.log('Record:   ' + newRecord.data.name + ' ' + record.data.whatHeKnows)

  // Query for all records of type 'test-contact' and print out
  // a little bit of data and metadata.
  var data = true
  var writer = null
  var record = null
  var type = 'test-contact'

  let queryResult = await client.query(data, writer, record, type).next()

  for (let rec of queryResult) {
    console.log('Data:     ' + rec.data.name + ' ' + rec.data.whatHeKnows)
    console.log('Metadata: ' + rec.meta.recordId + ' ' + rec.meta.type)
  }

  /**
    * ---------------------------------------------------------
    * Simple sharing by record type
    * ---------------------------------------------------------
    */

  // Share all of the records of type 'test-contact' with Isaac's client ID:
  // let isaacClientId = 'db1744b9-3fb6-4458-a291-0bc677dba08b'
  // await client.share('test-contact', isaacClientId)

  /**
    * ---------------------------------------------------------
    * More complex queries
    * ---------------------------------------------------------
    */

  // Create some new records of the same type (note that they are also shared
  // automatically since they are a type that we have shared above. We
  // will also add some "plain" fields that are not secret but can be used
  // for efficient querying:

  let branData = { name: 'Bran', whatHeKnows: 'Crow' }
  let branPlain = { house: 'Stark', ageRange: 'child' }
  await client.write('test-contact', branData, branPlain)

  let hodorData = { name: 'Hodor', whatHeKnows: 'Hodor' }
  let hodorPlain = { house: 'Stark', ageRange: 'adult' }
  await client.write('test-contact', hodorData, hodorPlain)

  let doranData = { name: 'Doran', whatHeKnows: 'Oberyn' }
  let doranPlain = { house: 'Martell', ageRange: 'adult' }
  await client.write('test-contact', doranData, doranPlain)

  // Create a query that finds everyone from house Stark, but not others:
  let queryWesteros = { eq: { name: 'house', value: 'Stark' } }

  // Execute that query:
  data = true
  writer = null
  record = null
  type = null

  queryResult = await client.query(data, writer, record, type, queryWesteros).next()
  for (let record of queryResult) {
    console.log(record.data.name)
  }
  // Now create a  more complex query with only the adults from house Stark:
  queryWesteros = {
    and: [
      { eq: { name: 'house', value: 'Stark' } },
      { eq: { name: 'ageRange', value: 'adult' } }
    ]
  }

  // Execute that query:
  data = true
  writer = null
  record = null
  type = null

  queryResult = await client.query(data, writer, record, type, queryWesteros).next()
  for (let record of queryResult) {
    console.log(record.data.name)
  }

  /**
     * ---------------------------------------------------------
     * Learning about other clients
     * ---------------------------------------------------------
     */

  // Fetch the public key:
  let isaacPubKey = await client.clientKey(isaacClientId)
  console.log(isaacPubKey)

  /**
     * ---------------------------------------------------------
     * Clean up - Comment these out if you want to experiment
     * ---------------------------------------------------------
     */

  // Revoke the sharing created by the client.share
  await client.revoke('test-contact', isaacClientId)

  // Delete the record we created above
  await client.delete(recordId)

  // Delete all of the records of type test-contact from previous runs:
  data = false
  writer = null
  record = null
  type = 'test-contact'

  queryResult = await client.query(data, writer, record, type).next()
  for (let record of queryResult) {
    await client.delete(record.meta.recordId)
  }
}

main()
