const regToken = '92f971adf5ed04851024c6244a86b20f4578cf8a4bfbd3aaa6fa4c392455f01a'
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

  beforeAll(async function() {
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
  })

  it('can write and read a note', async function() {
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
  })
})
