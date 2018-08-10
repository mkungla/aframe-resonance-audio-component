/* global THREE */
/**
 * Check if x, y and z properties are set.
 * @param {boolean}
 */
module.exports.isVec3Set = function isVec3Set (v) {
  return typeof v === 'object' &&
       !isNaN(parseFloat(v.x)) && isFinite(v.x) &&
       !isNaN(parseFloat(v.y)) && isFinite(v.y) &&
       !isNaN(parseFloat(v.z)) && isFinite(v.z)
}

/**
 * Execute when entity has loaded. If it hasn't, it waits for the loaded event, executes, and
 * removes its event listener.
 * @param {AFRAME.ANode} entity
 * @param {function} cb
 */
module.exports.onceWhenLoaded = function onceWhenLoaded (entity, cb) {
  if (entity.hasLoaded) {
    cb()
  } else {
    const fn = function (evt) {
      cb()
      evt.target.removeEventListener('loaded', fn)
    }
    entity.addEventListener('loaded', fn)
  }
}

/**
 * Get the bounds of an Object3D in local coordinates. The regular method does this in world
 * coordinates, so it ignores any applied transformations.
 * @see https://github.com/mrdoob/three.js/issues/11967
 * @param {THREE.Object3D} object3D
 * @returns {THREE.Box3}
 */
module.exports.getBoundingBox = function getBoundingBox (object3D) {
  object3D.updateMatrix()
  const oldMatrix = object3D.matrix
  const oldMatrixAutoUpdate = object3D.matrixAutoUpdate

  // Store original local matrix.
  object3D.updateMatrixWorld()
  const m = new THREE.Matrix4()
  if (object3D.parent !== null) {
    m.getInverse(object3D.parent.matrixWorld, false)
  }
  object3D.matrix = m
  // To prevent matrix being reassigned.
  object3D.matrixAutoUpdate = false
  object3D.updateMatrixWorld()

  // Get bounds.
  const bounds = new THREE.Box3()
  bounds.setFromObject(object3D)

  // Reset to old matrix.
  object3D.matrix = oldMatrix
  object3D.matrixAutoUpdate = oldMatrixAutoUpdate
  object3D.updateMatrixWorld()

  return bounds
}
