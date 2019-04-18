const innovault = require('../dist/node-sodium.js')
const primitives = require('../dist/index.js')
require('dotenv').config()

async function main () {

  // NOTES:  
  // Update requires a primitive of RecordData 
  // How should we get primitives into here?
  // What should update take ideally?  
  // Maybe a record id and a new recordData object?  

  // Assumes you have created client credentials and registered clients in Innovault.
  // Loads the credentials for two clients into .env.  

  /*
  Create client1 and client2 Client instances.
  Write 3 records (client1).
  Read one record (client1).
  Query all three records (client1).
  Update a record (client1).
  Share the record type with client2 (client1).
  Query the writer and type as client2 (client2).
  Revoke the record type (client1).
  Query the writer and record type with client2 (client2).
  Delete the three records (client1)
  Query the record type (client1).
  */

  //  Create client1 and client2 Client instances.

  let config1 = new innovault.Config(
    process.env.CLIENT_ID_E01,
    process.env.API_KEY_ID_E01,
    process.env.API_SECRET_E01,
    process.env.PUBLIC_KEY_E01,
    process.env.PRIVATE_KEY_E01,
    process.env.API_URL,
    process.env.PUBLIC_SIGN_KEY_E01,
    process.env.PRIVATE_SIGN_KEY_E01
  )
  let client1 = new innovault.Client(config1)

  let client1Id = client1.config.clientId
  console.log('\n')
  console.log('Client instance of client1 has id: ', client1Id)

  let config2 = new innovault.Config(
    process.env.CLIENT_ID_E02,
    process.env.API_KEY_ID_E02,
    process.env.API_SECRET_E02,
    process.env.PUBLIC_KEY_E02,
    process.env.PRIVATE_KEY_E02,
    process.env.API_URL,
    process.env.PUBLIC_SIGN_KEY_E02,
    process.env.PRIVATE_SIGN_KEY_E02
  )
  let client2 = new innovault.Client(config2)

  let client2Id = client2.config.clientId
  console.log('Client instance of client2 has id: ', client2Id)
  console.log('\n')

  // Write 3 records (client1).

  const recordData1 = {
    name: 'Jill Valentine',
    status: 'MIA'
  }

  const recordData2 = {
    name: "Chris Redfield",
    status: "MIA"
  }

  const recordData3 = {
    name: "Barry Whesker",
    status: "MIA"
  }

  let record1 = await client1.write('test-contact', recordData1)
  let record1Id = record1.meta.recordId
  let record1Data = record1.data
  console.log(`client1 wrote record with id ${record1Id} and
  data: ${Object.entries(record1Data).map(([k,v]) => ` ${k}: ${v}`)}`)
  console.log('\n')
  let record2 = await client1.write('test-contact', recordData2)
  let record2Id = record2.meta.recordId
  let record2Data = record2.data
  console.log(`client1 wrote record with id ${record2Id} and \n 
  data: ${Object.entries(record2Data).map(([k,v]) => ` ${k}: ${v}`)}`)
  console.log('\n')
  let record3 = await client1.write('test-contact', recordData3)
  let record3Id = record3.meta.recordId
  let record3Data = record3.data
  console.log(`client1 wrote record with id ${record3Id} and \n 
  data: ${Object.entries(record3Data).map(([k,v]) => ` ${k}: ${v}`)}`)  
  console.log('\n')

  // Read one record (client1).

  const readRecord = await client1.read(record1Id) 
  console.log(`client1 reading record id ${record1Id}`)
  console.log(readRecord)
  console.log('\n')

  // Query all three records (client1).

  const dataQ = true
  const writerQ = null
  const recordQ = null
  const typeQ = 'test-contact'

  let queryResult = await client1.query(
    dataQ, 
    writerQ, 
    recordQ, 
    typeQ).next()
  console.log('client1 queried for all three records: ')
  console.log(queryResult)
  console.log('\n')

  // Update a record (client1).

  let recordToUpdate = await client1.read(record1Id)
  console.log('client1 prior record: ')
  console.log(recordToUpdate)
  console.log('\n')
  let newRecordData = new primitives.RecordData({ name: 'Jill Valentine', status: 'Active Duty'})
  recordToUpdate.data = newRecordData
  let updatedRecord = await client1.update(recordToUpdate)
  console.log('client1 updated record: ', updatedRecord)
  console.log('\n')

  // Share the record type with client2 (client1).

  const shareSuccess = await client1.share('test-contact', client2Id)
  console.log('client1 shared with client2? ', shareSuccess)

  // Query the writer and type as client2 (client2).

  const dataQ2 = true
  const writerQ2 = client1Id
  const recordQ2 = null
  const typeQ2 = 'test-contact'

  let queryResult2 = await client2.query(
    dataQ2, 
    writerQ2, 
    recordQ2, 
    typeQ2).next()
  console.log('client2 queried for the type and writer for all 3 records: ')
  console.log(queryResult2)
  console.log('\n')

  // Revoke the record type (client1).

  const revokeSuccess= await client1.revoke('test-contact', client2Id)
  console.log('client1 revoked access from client2? ', revokeSuccess)

  // Query the revoked writer and record type with client2 (client2).

  const dataQ3 = true
  const writerQ3 = client1Id
  const recordQ3 = null
  const typeQ3 = 'test-contact'

  let queryResult3 = await client2.query(
    dataQ3, 
    writerQ3, 
    recordQ3, 
    typeQ3).next()
  console.log('client2 queried for the type and writer and found none: ')
  console.log(queryResult3)
  console.log('\n')

  // Delete the three records (client1)
  console.log('client1 deletes the three records')
  await client1.delete(record1Id)
  await client1.delete(record2Id)
  await client1.delete(record3Id)

  // Query the record type (client1).

  const dataQ4 = true
  const writerQ4 = null
  const recordQ4 = null
  const typeQ4 = 'test-contact'

  let queryResult4 = await client1.query(
    dataQ4, 
    writerQ4, 
    recordQ4, 
    typeQ4).next()
  console.log('client1 queried for the type and found none: ')
  console.log(queryResult4)
  console.log('\n')
}

main()