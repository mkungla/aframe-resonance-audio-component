const tests = require.context(".", true, /\.test\.js$/)
tests.keys().forEach(tests)

const src = require.context("../src/", true, /.js$/)
src.keys().forEach(src)
