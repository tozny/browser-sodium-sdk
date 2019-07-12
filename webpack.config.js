const path = require('path')

module.exports = {
  entry: './lib/browser.js',
  output: {
    filename: 'tozny-browser-sodium-sdk.min.js',
    path: path.resolve(__dirname, 'dist', 'browser')
  },
  mode: 'production'
}
