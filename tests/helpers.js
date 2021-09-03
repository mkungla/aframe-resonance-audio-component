/* global THREE, expect, HTMLElement, document */

/**
 * Create a scene.
 * @param {array|HTMLElement} children
 * @returns {AFRAME.AScene}
 */
module.exports.sceneFactory = function sceneFactory (children = []) {
  return elementFactory('a-scene', undefined, children)
}

/**
 * Create an entity.
 * @param {object} attributes
 * @param {array|HTMLElement} children
 * @returns {AFRAME.AEntity}
 */
module.exports.entityFactory = function entityFactory (attributes = {}, children = []) {
  return elementFactory('a-entity', attributes, children)
}

/**
 * Create an element.
 * @param {string} type - the element type
 * @param {object} attributes
 * @param {array|HTMLElement} children
 * @returns {HTMLElement}
 */
function elementFactory (type, attributes = {}, children = []) {
  const e = document.createElement(type)
  for (const attr in attributes) {
    e.setAttribute(attr, attributes[attr])
  }
  if (children instanceof HTMLElement) {
    children = [children]
  }
  for (const child of children) {
    e.appendChild(child)
  }
  return e
}
module.exports.elementFactory = elementFactory

/**
 * Put in the body of the document.
 * @param {Element} el
 */
function putOnPage (el) {
  document.body.appendChild(el)
}
module.exports.putOnPage = putOnPage

/**
 * Put an element on the page and wait until it fires its loaded event before executing the
 * callback.
 * @param {Element} el
 * @param {function} cb
 */
module.exports.putOnPageAndWaitForLoad = function putOnPageAndWaitForLoad (el, cb) {
  putOnPage(el)
  el.addEventListener('loaded', () => cb())
}

/**
 * Compare a Matrix4 containing position and rotation data to an expected position and rotation.
 * @param {THREE.Matrix4} m - the real matrix
 * @param {object} p - expected position x, y and z
 * @param {object} r - expected rotation x, y and z in degrees
 */
module.exports.compareMatrixtoPosAndRot = function compareMatrixtoPosAndRot (m, p, r) {
  const f = THREE.Math.degToRad
  const tester = new THREE.Quaternion().setFromEuler(new THREE.Euler(f(r.x), f(r.y), f(r.z), 'YXZ'))
  const m0 = new THREE.Matrix4().compose(new THREE.Vector3(p.x, p.y, p.z), tester, new THREE.Vector3(1, 1, 1))

  for (const i in m0.elements) {
    expect(m.elements[i]).to.be.closeTo(m0.elements[i], 0.000001)
  }
}

/**
 * Create a rotation and position THREE.Matrix4 for a Resonance Source.
 * @param {ResonanceAudio.Source} o - the Google Resonance Source instance
 */
module.exports.createMatrixFromResonanceSource = function createMatrixFromResonanceSource (o) {
  return new THREE.Matrix4().makeBasis(
    new THREE.Vector3().fromArray(o._right),
    new THREE.Vector3().fromArray(o._up),
    new THREE.Vector3().fromArray(o._forward)
  ).setPosition(new THREE.Vector3().fromArray(o._position))
}
