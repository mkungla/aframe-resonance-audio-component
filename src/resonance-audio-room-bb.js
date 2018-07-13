/* global AFRAME, THREE */
require('./resonance-audio-room')

/**
 * Composite bounding box component. Use this one if the room should be the bounding box of the
 * entity this component is attached to.
 */
AFRAME.registerComponent('resonance-audio-room-bb', {
  dependencies: ['position', 'geometry'],
  schema: AFRAME.components['resonance-audio-room'].schema,
  init () {
    if (this.el.components['obj-model'] && !this.el.components['obj-model'].model) {
      // If bounded by a loaded model.
      this.el.addEventListener('model-loaded', (e) => this.loadAudioRoom())
    } else {
      // If bounded by a different geometry.
      this.loadAudioRoom()
    }
  },
  loadAudioRoom () {
    // TODO: make a better bounding box, taking into account the centrepoint position of the entity.
    const bb = new THREE.Box3().setFromObject(this.el.object3D)
    this.data.width = bb.getSize().x
    this.data.height = bb.getSize().y
    this.data.depth = bb.getSize().z
    this.el.setAttribute('resonance-audio-room', this.data)
  }
})
