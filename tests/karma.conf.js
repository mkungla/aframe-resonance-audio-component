const path = require('path')
// Karma configuration.
module.exports = function (config) {
  config.set({
    basePath: '../',
    // Default use firefox only
    browsers: ['ChromeHeadless'],
    singleRun: true,
    concurrency: Infinity,
    port: 9999,
    client: {
      captureConsole: true,
      mocha: { ui: 'tdd' }
    },
    exclude: [
      'node_modules'
    ],
    files: [
      { pattern: 'tests/setup.js', watched: true },
      // Serve test assets.
      { pattern: 'tests/assets/**/*', included: false, served: true }
    ],
    frameworks: ['mocha', 'sinon-chai', 'chai-shallow-deep-equal', 'webpack'],
    preprocessors: {
      'tests/setup.js': ['webpack', 'sourcemap'],
    },
    reporters: ['mocha', 'coverage'],
    webpack: {
      devtool: 'inline-source-map',
      module: {
        rules: [
          // instrument only testing sources with Istanbul
          {
            test: /\.js$/,
            use: { loader: 'istanbul-instrumenter-loader' },
            include: path.resolve('src/')
          }
        ]
      }
    },
    webpackMiddleware: {
      noInfo: true
    },
    coverageReporter: {
      type: 'text',
      dir : 'coverage/',
    },
    coverageIstanbulReporter: {
      reports: [ 'text-summary' ],
    },
  })
}
