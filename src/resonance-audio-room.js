/* global AFRAME, THREE, AudioContext */
const { ResonanceAudio } = require('resonance-audio')

const RESONANCE_MATERIAL = Object.keys(ResonanceAudio.Utils.ROOM_MATERIAL_COEFFICIENTS)

AFRAME.registerComponent('resonance-audio-room', {
  dependencies: ['position', 'rotation'],

  schema: {
    // Room dimensions. The position is the center point of this box.
    width: {type: 'number', default: ResonanceAudio.Utils.DEFAULT_ROOM_DIMENSIONS.width},
    height: {type: 'number', default: ResonanceAudio.Utils.DEFAULT_ROOM_DIMENSIONS.height},
    depth: {type: 'number', default: ResonanceAudio.Utils.DEFAULT_ROOM_DIMENSIONS.depth},

    // Resonance audio parameters.
    ambisonicOrder: {type: 'int', default: ResonanceAudio.Utils.DEFAULT_AMBISONIC_ORDER},
    speedOfSound: {type: 'number', default: ResonanceAudio.Utils.DEFAULT_SPEED_OF_SOUND},

    // Room wall materials.
    left: {default: 'brick-bare', oneOf: RESONANCE_MATERIAL},
    right: {default: 'brick-bare', oneOf: RESONANCE_MATERIAL},
    front: {default: 'brick-bare', oneOf: RESONANCE_MATERIAL},
    back: {default: 'brick-bare', oneOf: RESONANCE_MATERIAL},
    down: {default: 'brick-bare', oneOf: RESONANCE_MATERIAL},
    up: {default: 'brick-bare', oneOf: RESONANCE_MATERIAL},

    // Whether to show a visualization of the room. This shows a wireframe of the box that is considered as the room.
    visualize: {type: 'boolean', default: false}
  },

  /**
   * Initialize:
   * - the audio pipeline;
   * - the connection with the audio sources;
   * - the API; and
   * - the event listeners that handle changes.
   */
  init () {
    // Initialize the audio context and connect with Resonance.
    this.audioContext = new AudioContext()
    this.resonanceAudioScene = new ResonanceAudio(this.audioContext)
    this.resonanceAudioScene.output.connect(this.audioContext.destination)

    // Visualization entity of the room.
    this.visualization = null

    // Collection of audio sources.
    this.sources = []

    // Set up the room acoustics before the audio sources are set up.
    this.updateRoomAcoustics()
    this.setUpAudioSources()
    this.exposeAPI()

    // Propagate position and rotation updates to audio room, audio sources and the visualization.
    this.el.addEventListener('componentchanged', (e) => {
      if (e.detail.name === 'position' || e.detail.name === 'rotation') {
        this.updatePosition().updateVisualization()
        this.sources.forEach(source => source.updatePosition().updateVisualization())
      }
    })
    // Handle dynamic attachment and detachment of audio sources.
    this.el.addEventListener('child-attached', (e) => {
      const el = e.detail.el
      if (el.hasLoaded) {
        this.attachSource(el)
      } else {
        el.addEventListener('loaded', () => this.attachSource(el))
      }
    })
    this.el.addEventListener('child-detached', e => this.detachSource(e.detail.el))

    // When the scene has loaded and all world positions are calculated, place the visualization.
    this.el.sceneEl.addEventListener('loaded', () => this.updateVisualization())
  },

  /**
   * Expose two collections on the element for easy access:
   * - audioSources: the connected resonance-audio-src components.
   * - sounds: the connected HTMLMediaElement and MediaStream objects.
   */
  exposeAPI () {
    Object.defineProperties(this.el, {
      // Array of audio source components.
      audioSources: { enumerable: true, get: () => this.sources },
      // Array of audio sources (HTMLMediaElement and MediaStream objects).
      sounds: { enumerable: true, get: () => this.sources.map(source => source.sound) }
    })
  },

  update (oldData) {
    this.updateRoomAcoustics()
    this.updateVisualization(oldData)
  },

  /**
   * Update entity position and orientation (which determines the audio room position and
   * orientation) in the world. This is called after the position or rotation of the entity is
   * updated.
   * @returns {this}
   */
  updatePosition () {
    this.el.object3D.updateMatrixWorld(true)
    return this
  },

  /**
   * Update resonanceAudioScene's listener after room is tocked.
   */
  tock () {
    // Calculate camera position relative to room.
    this.resonanceAudioScene.setListenerFromMatrix(
      new THREE.Matrix4().multiplyMatrices(
        new THREE.Matrix4().getInverse(this.el.object3D.matrixWorld),
        this.el.sceneEl.camera.el.object3D.matrixWorld
      )
    )
  },

  /**
   * Update room acoustics.
   */
  updateRoomAcoustics () {
    this.resonanceAudioScene.setRoomProperties({
      width: this.data.width,
      height: this.data.height,
      depth: this.data.depth
    }, {
      left: this.data.left,
      right: this.data.right,
      front: this.data.front,
      back: this.data.back,
      down: this.data.down,
      up: this.data.up
    })
    this.resonanceAudioScene.setAmbisonicOrder(this.data.ambisonicOrder)
    this.resonanceAudioScene.setSpeedOfSound(this.data.speedOfSound)
  },

  /**
   * Update the visualization of this audio room according to the properties set.
   * @returns {this}
   */
  updateVisualization (oldData) {
    const d = this.data

    // Add or remove visualization to or from the DOM.
    // This is done to the root so it is not affected by the current entity.
    if (oldData) {
      if (!oldData.visualize && d.visualize) {
        // Create entity if it didn't exist yet.
        if (!this.visualization) {
          this.visualization = document.createElement('a-box')
          this.visualization.audioRoom = this.el
          this.visualization.setAttribute('material', 'wireframe', true)
        }
        this.el.sceneEl.appendChild(this.visualization)
      } else if (oldData.visualize && !d.visualize) {
        this.el.sceneEl.removeChild(this.visualization)
        this.visualization = null
      }
    }

    // Update the visualized entity.
    if (d.visualize) {
      this.el.sceneEl.object3D.updateMatrixWorld(true)
      const p = new THREE.Vector3()
      const q = new THREE.Quaternion()
      const s = new THREE.Vector3()
      this.el.object3D.matrixWorld.decompose(p, q, s)
      const r = new THREE.Euler().setFromQuaternion(q, 'YXZ')
      const r2d = THREE.Math.radToDeg

      this.visualization.setAttribute('position', p)
      this.visualization.setAttribute('rotation', {x: r2d(r.x), y: r2d(r.y), z: r2d(r.z)})
      this.visualization.setAttribute('width', d.width)
      this.visualization.setAttribute('height', d.height)
      this.visualization.setAttribute('depth', d.depth)
    }
    return this
  },

  /**
   * Set up audio by attaching audio sources.
   */
  setUpAudioSources () {
    this.el.querySelectorAll('[resonance-audio-src]').forEach(childEl => this.attachSource(childEl))
  },

  /**
   * Attach audio source by storing its HTMLElement reference and initializing its audio.
   * @param {HTMLElement} el
   */
  attachSource (el) {
    const source = el.components['resonance-audio-src']
    // Only consider relevant elements.
    if (!source) { return }

    this.sources.push(source)
    source.initAudioSrc(this)
  },

  /**
   * Detach audio source by disconnecting it and by removing its component reference.
   * @param {HTMLElement} el
   */
  detachSource (el) {
    const source = el.components['resonance-audio-src']
    if (!source || !this.sources.includes(source)) { return }

    this.sources.splice(this.sources.indexOf(source), 1)
    source.disconnect()
  },

  /**
   * On component removal, delete the visualization entity and detach sources.
   */
  remove () {
    [...this.sources].map(source => this.detachSource(source.el))
    if (this.visualization) {
      this.el.sceneEl.removeChild(this.visualization)
      this.visualization = null
    }
  }
})

AFRAME.registerPrimitive('a-resonance-audio-room', {
  defaultComponents: {
    'resonance-audio-room': {}
  },
  mappings: {
    width: 'resonance-audio-room.width',
    height: 'resonance-audio-room.height',
    depth: 'resonance-audio-room.depth',
    'ambisonic-order': 'resonance-audio-room.ambisonicOrder',
    'speed-of-sound': 'resonance-audio-room.speedOfSound',
    left: 'resonance-audio-room.left',
    right: 'resonance-audio-room.right',
    front: 'resonance-audio-room.front',
    back: 'resonance-audio-room.back',
    down: 'resonance-audio-room.down',
    up: 'resonance-audio-room.up',
    visualize: 'resonance-audio-room.visualize'
  }
})
