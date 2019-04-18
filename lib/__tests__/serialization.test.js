import { default as Client } from '../client'
import { default as Config } from '../config'
import { default as Crypto } from '../crypto'

import { default as EAKInfo } from '../types/eakInfo'
import { default as Meta } from '../types/meta'
import { default as Record } from '../types/record'
import { default as RecordData } from '../types/recordData'
import { default as RecordInfo } from '../types/recordInfo'
import { default as SignedDocument } from '../types/signedDocument'
import { default as SignedString } from '../types/signedString'

const fs = require('fs')

function writeFile(name, data) {
  fs.writeFileSync(__dirname + '/' + name.toLowerCase() + '.json', JSON.stringify(data, null, 2))
}

function testNodeBlns() {
  let rawdata  = fs.readFileSync(__dirname + '/blns.json', 'utf8')
  let blnsJson = JSON.parse(rawdata)

  let blnsJS = []
  for (let [idx, element] of blnsJson.entries()) {
    let elementIdx = `${idx}`
    let recordData = new RecordData({[elementIdx]: element})
    let serialized = recordData.stringify()
    let b64Encoded = Buffer.from(serialized).toString('base64')
    blnsJS.push({
      index: elementIdx,
      element: element,
      serialized: serialized,
      b64Encoded: b64Encoded
    })
  }

  // write to file for posterity
  writeFile('blns-node', blnsJS)

  return blnsJS
}

function getOtherSDKBlns(sdkName) {
  let data = fs.readFileSync(__dirname + '/blns-' + sdkName.toLowerCase() + '.json', 'utf8')
  return JSON.parse(data)
}

function compareSDKs(sdk1Name, sdk1Output, sdk2Name, sdk2Output) {
  let failedTests = []
  let zipped = sdk1Output.map((n, index) => [n, sdk2Output[index]])
  for (let [sdk1Test, sdk2Test] of zipped) {
    if (sdk1Test.serialized !== sdk2Test.serialized) {
      failedTests.push({
        [sdk1Name]: sdk1Test,
        [sdk2Name]: sdk2Test
      })
    }
  }
  return failedTests
}

describe('Serialization', () => {

  it('matches serialization with Swift SDK', async () => {
    let nodeBlns    = testNodeBlns()
    let swiftBlns   = getOtherSDKBlns('Swift')
    let failedTests = compareSDKs('Node', nodeBlns, 'Swift', swiftBlns)

    // uncomment to write failures to file
    // if (failedTests.length != 0) {
    //   console.log(`failed ${failedTests.length} tests`)
    //   writeFile('node-swift-serialization-failures', failedTests)
    // }

    // known indexes for tests that fail based on known issues
    // 96 and 169 have hidden-whitespace related errors
    let knownFailures = ["96", "169"]
    let failedIndexes = failedTests.map(test => test["Node"]["index"])
    expect(failedIndexes).toEqual(knownFailures)
  })

  it('matches serialization with Java SDK', async () => {
    let nodeBlns    = testNodeBlns()
    let javaBlns    = getOtherSDKBlns('Java')
    let failedTests = compareSDKs('Node', nodeBlns, 'Java', javaBlns)

    // uncomment to write failures to file
    // if (failedTests.length != 0) {
    //   console.log(`failed ${failedTests.length} tests`)
    //   writeFile('node-java-serialization-failures', failedTests)
    // }

    // known indexes for tests that fail based on known issues
    // 92, 94, 503, 504 have unicode case-sensitivity related errors
    let knownFailures = ["92", "94", "503", "504"]
    let failedIndexes = failedTests.map(test => test["Node"]["index"])
    expect(failedIndexes).toEqual(knownFailures)
  })
})