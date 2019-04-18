
const e3db = require('../dist/index.js')
require('dotenv').config()

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
console.log(config)
let crypto = new e3db.Crypto('sodium')
console.log(crypto)
console.log(crypto.decryptEak)
  // Now create a client using that configuration
let client = new e3db.Client(config, crypto)
console.log(client)
// console.log(client.getClient)