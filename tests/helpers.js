/* global THREE, expect */

/**
 * Helper method to create a scene, create an entity, add entity to scene,
 * add scene to document.
 *
 * @returns {object} An `<a-entity>` element.
 */
module.exports.entityFactory = function (opts = {}) {
  const scene = elementFactory('a-scene')
  const assets = elementFactory('a-assets')
  const entity = elementFactory('a-entity', opts.attributes || {})
  scene.appendChild(assets)
  scene.appendChild(entity)

  if (opts.assets) {
    opts.assets.forEach(function (asset) {
      assets.appendChild(asset)
    })
  }
  document.body.appendChild(scene)
  return entity
}

/**
 * Create an element and set attributes.
 * @param {string} type - the element type
 * @param {object} attributes - the collection of attributes
 * @returns {HTMLElement}
 */
function elementFactory (type, attributes = {}) {
  const e = document.createElement(type)
  for (const attr in attributes) {
    e.setAttribute(attr, attributes[attr])
  }
  return e
}
module.exports.elementFactory = elementFactory

/**
 * Compare a Matrix4 containing position and rotation data to an expected position and rotation.
 * @param {THREE.Matrix4} m - the real matrix
 * @param {object} p - expected position x, y and z
 * @param {object} r - expected rotation x, y and z in degrees
 */
module.exports.compareMatrixtoPosAndRot = function (m, p, r) {
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
module.exports.createMatrixFromResonanceSource = function (o) {
  return new THREE.Matrix4().makeBasis(
    new THREE.Vector3().fromArray(o._right),
    new THREE.Vector3().fromArray(o._up),
    new THREE.Vector3().fromArray(o._forward)
  ).setPosition(new THREE.Vector3().fromArray(o._position))
}
