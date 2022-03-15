/* global  suite, test, expect */
const { aframeVersion } = require('../src/utils.js')

suite('environment', () => {
  test('A-Frame version', () => {
    // Src and room relation.
    expect(aframeVersion()).to.equal('1.3.0')
  })  
})
