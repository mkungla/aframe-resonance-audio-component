/* global sinon, setup, teardown */

/**
 * __init.test.js is run before every test case.
 */
window.debug = true
const AScene = require('aframe').AScene

setup(function () {
  // Suppress all the irrelevant A-Frame logging.
  if (typeof console.log === 'function') {
    console.log = function () {}
  }

  this.sinon = sinon.createSandbox()
  // Stubs to not create a WebGL context since Travis CI runs headless.
  this.sinon.stub(AScene.prototype, 'render')
  this.sinon.stub(AScene.prototype, 'resize')
  this.sinon.stub(AScene.prototype, 'setupRenderer')
})

teardown(function () {
  // Clean up any attached elements.
  const attachedEls = ['canvas', 'a-assets', 'a-scene']
  const els = document.querySelectorAll(attachedEls.join(','))
  for (let i = 0; i < els.length; i++) {
    els[i].parentNode.removeChild(els[i])
  }
  this.sinon.restore()
})
