// eslint-disable-next-line dot-notation
const regToken = window.__env__['REGISTRATION_TOKEN']
const apiUrl = 'https://api.e3db.com'
const Client = window.tozStore.Client
const Config = window.tozStore.Config

// Test Notes Application
describe('Notes', function() {
  var cryptoKeys
  var signingKeys
  var clientCredentials
  var clientName
  var config
  var client
  var originalTimeout
  beforeAll(async function() {
    console.log('Reg token', regToken)
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 100000

    cryptoKeys = await Client.generateKeypair()
    signingKeys = await Client.generateSigningKeypair()
    clientName =
      'browser-sdk-client-test' +
      Math.random()
        .toString(36)
        .substr(2)
    clientCredentials = await Client.register(
      regToken,
      clientName,
      cryptoKeys,
      signingKeys,
      true, // Determines whether client's credentials will be backed up
      apiUrl
    )

    config = new Config(
      clientCredentials.clientId,
      clientCredentials.apiKeyId,
      clientCredentials.apiSecret,
      cryptoKeys.publicKey,
      cryptoKeys.privateKey,
      apiUrl,
      signingKeys.publicKey,
      signingKeys.privateKey
    )
    client = new Client(config)
  }, 20000)

  it('can write and read a note', async function() {
    console.log('signing key', signingKeys)
    console.log('crypto key', cryptoKeys)
    var note = await Client.writeNote(
      { secret: 'encrypted' },
      signingKeys.publicKey,
      cryptoKeys,
      signingKeys,
      {},
      apiUrl
    )

    let readNote = await client.readNote(note.noteId)
    expect(readNote.data.secret).toBe('encrypted')
    expect(readNote.writerSigningKey).toBe(signingKeys.publicKey)
    expect(readNote.recipientSigningKey).toBe(signingKeys.publicKey)
    expect(readNote.writerEncryptionKey).toBe(cryptoKeys.publicKey)
    expect(readNote.createdAt).toBeTruthy(true)
    expect(readNote.noteId).toBeTruthy(true)
  }, 20000)

  it('can write and delete a note', async function() {
    var note = await Client.writeNote(
      { secret: 'encrypted' },
      signingKeys.publicKey,
      cryptoKeys,
      signingKeys,
      {},
      apiUrl
    )
    let deletedResp = await client.deleteNote(note.noteId)
    expect(deletedResp.status).toBe(204)
  }, 20000)

  // Test is temporarily unavaiable until non-static writeNote functionality is back
  //   it('can write and read a note by name', async function() {
  //     let noteName =
  //       'randomNoteName' +
  //       Math.random()
  //         .toString(36)
  //         .substr(2)

  //     console.log('noteName', noteName)

  //     var note = await client.writeNote(
  //       { secret: 'readByName' },
  //       signingKeys.publicKey,
  //       cryptoKeys,
  //       signingKeys,
  //       { id_string: noteName },
  //       apiUrl
  //     )

  //     let readNote = await client.readNoteByName(noteName)
  //     expect(readNote.data.secret).toBe('readByName')
  //     expect(readNote.writerSigningKey).toBe(signingKeys.publicKey)
  //     expect(readNote.recipientSigningKey).toBe(signingKeys.publicKey)
  //     expect(readNote.writerEncryptionKey).toBe(cryptoKeys.publicKey)
  //     expect(readNote.createdAt).toBeTruthy(true)
  //     expect(readNote.noteId).toBeTruthy(true)
  //   })

  it('cant delete a non-existent note', async function() {
    await expectAsync(
      client.deleteNote('00000000-0o000-0000-0000-000000000000')
    ).toBeRejected()
  }, 20000)

  it('cant read guest-note twice', async function() {
    var note = await Client.writeNote(
      { secret: 'encrypted' },
      signingKeys.publicKey,
      cryptoKeys,
      signingKeys,
      {},
      apiUrl
    )
    await client.readNote(note.noteId)
    await expectAsync(client.readNote(note.noteId)).toBeRejected()
  }, 20000)

  afterAll(function() {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout
  }, 20000)
})
