/**
 * Check if x, y and z properties are set.
 * @param {boolean}
 */
module.exports.isVec3Set = function isVec3Set (v) {
  return typeof v === 'object' &&
       typeof v.x !== 'undefined' &&
       typeof v.y !== 'undefined' &&
       typeof v.z !== 'undefined'
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
