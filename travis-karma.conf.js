module.exports = function(config) {
  // Browsers to run on Sauce Labs
  var customLaunchers = {
    SauceLabsChrome: {
      base: 'SauceLabs',
      browserName: 'chrome',
      version: '68.0',
      platform: 'OS X 10.12'
    },
    SauceLabsFirefox: {
      base: 'SauceLabs',
      browserName: 'firefox',
      version: '64.0',
      platform: 'Windows 10'
    }
  }

  config.set({
    // Base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // Frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],

    // List of files / patterns to load in the browser
    files: ['dist/browser/tozny-browser-sodium-sdk.min.js', 'test/*.js'],

    // Test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'saucelabs'],

    // Web server port
    port: 9876,

    colors: true,

    // Level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_WARN,

    // `tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER` and `startConnect: false` must be set to work with travis:
    // https://github.com/karma-runner/karma-sauce-launcher/issues/73
    sauceLabs: {
      testName: 'Travis Karma and Sauce Labs Test',
      tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER,
      username: process.env.SAUCE_USERNAME,
      accessKey: process.env.SAUCE_ACCESS_KEY,
      startConnect: false
    },
    captureTimeout: 120000,
    customLaunchers: customLaunchers,

    // Start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: Object.keys(customLaunchers),
    singleRun: true
  })
}
