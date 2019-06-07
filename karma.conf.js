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
    files: ['browserfied/browser.js', 'test/*.js'],

    // Test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],

    // Web server port
    port: 9876,

    colors: true,

    // Level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_DEBUG,

    sauceLabs: {
      testName: 'Karma and Sauce Labs demo'
    },
    captureTimeout: 120000,
    customLaunchers: customLaunchers,

    // Start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: Object.keys(customLaunchers),
    singleRun: true
  })
}

// Module.exports = function(config) {
//   config.set({
//     // Base path that will be used to resolve all patterns (eg. files, exclude)
//     basePath: '',

//     // Frameworks to use
//     // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
//     frameworks: ['jasmine'],

//     // List of files / patterns to load in the browser
//     files: ['browserfied/browser.js', 'test/*.js'],

//     // Test results reporter to use
//     // possible values: 'dots', 'progress'
//     // available reporters: https://npmjs.org/browse/keyword/karma-reporter
//     reporters: ['progress'],

//     // Web server port
//     port: 9876,

//     // Enable / disable colors in the output (reporters and logs)
//     colors: true,

//     // Level of logging
//     // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
//     logLevel: config.LOG_DEBUG,

//     // Enable / disable watching file and executing tests whenever any file changes
//     autoWatch: true,

//     // Start these browsers, currently available:
//     // - Chrome
//     // - ChromeCanary
//     // - Firefox
//     // - Opera
//     // - Safari (only Mac)
//     // - PhantomJS
//     // - IE (only Windows)
//     browsers: ['Chrome', 'Firefox'],

//     // Continuous Integration mode
//     // if true, Karma captures browsers, runs the tests and exits
//     singleRun: false
//   })
// }
