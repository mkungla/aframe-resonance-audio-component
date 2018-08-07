/* global AFRAME */
require('./resonance-audio-room')
const { getBoundingBox } = require('./utils.js')

/**
 * Composite bounding box component. Use this one if the room should be the bounding box of the
 * entity this component is attached to.
 */
AFRAME.registerComponent('resonance-audio-room-bb', {
  dependencies: ['position', 'geometry'],
  schema: AFRAME.components['resonance-audio-room'].schema,
  init () {
    if (this.el.components['obj-model'] && !this.el.components['obj-model'].model) {
      // If bounded by a model.
      this.setRoom(this.data)
      this.el.addEventListener('model-loaded', () => {
        this.setFromBB()
        this.el.emit('bounded-audioroom-loaded', {room: this.el})
      })
    } else {
      // If bounded by a different geometry.
      this.setFromBB(this.data)
      this.el.emit('bounded-audioroom-loaded', {room: this.el})
    }
  },
  setFromBB (base = {}) {
    // TODO: make a better bounding box, taking into account the centrepoint position of the entity.
    const size = getBoundingBox(this.el.object3D).getSize()
    this.setRoom({...base, width: size.x, height: size.y, depth: size.z})
  },
  setRoom (values) {
    this.el.setAttribute('resonance-audio-room', values)
  }
})
