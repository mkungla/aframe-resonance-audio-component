/* global sinon, setup, teardown, console, window, document */
/**
 * __init.test.js is run before every test case.
 */

// Suppress all the irrelevant A-Frame logging.
if (typeof console.log === 'function') {
  console.log = function () {}
}

window.debug = true
const aframe = require('aframe')
const AScene = aframe.AScene

AFRAME.INSPECTOR = { open: () => {}}

setup(function () {
  this.sinon = sinon.createSandbox()
  this.sinon.stub(AScene.prototype, 'render')
  this.sinon.stub(AScene.prototype, 'resize')
  this.sinon.stub(AFRAME.INSPECTOR, 'open')

  // this.sinon.stub(AScene.prototype, 'setupRenderer')
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
