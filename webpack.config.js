const path = require('path')

module.exports = {
  entry: './lib/browser.js',
  output: {
    filename: 'browser.js',
    path: path.resolve(__dirname, 'browserfied')
  },
  mode: 'development'
}
