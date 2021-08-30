// Karma configuration.
module.exports = function (config) {
  config.set({
    basePath: '../',
    browserify: {
      debug: true,
      paths: ['./']
    },
    // Default use firefox only
    browsers: ['Firefox'],
    client: {
      captureConsole: true,
      mocha: { ui: 'tdd' }
    },
    envPreprocessor: ['TEST_ENV'],
    files: [
      // Define test files.
      { pattern: 'tests/**/*.test.js' },
      // Serve test assets.
      { pattern: 'tests/assets/**/*', included: false, served: true }
    ],
    frameworks: ['mocha', 'sinon-chai', 'chai-shallow-deep-equal', 'browserify'],
    preprocessors: { 'tests/**/*.js': ['browserify', 'env'] },
    reporters: ['mocha']
  })
}
