/* global AFRAME, THREE, AudioContext */
import {ResonanceAudio} from 'resonance-audio'

const log = AFRAME.utils.debug
const warn = log('components:resonance-audio-room:warn')

const RESONANCE_MATERIAL = Object.keys(ResonanceAudio.Utils.ROOM_MATERIAL_COEFFICIENTS)

AFRAME.registerComponent('resonance-audio-room', {
  dependencies: ['position'],

  schema: {
    // Room dimensions. The position is the center point of this box.
    width: {type: 'number', default: ResonanceAudio.Utils.DEFAULT_ROOM_DIMENSIONS.width},
    height: {type: 'number', default: ResonanceAudio.Utils.DEFAULT_ROOM_DIMENSIONS.height},
    depth: {type: 'number', default: ResonanceAudio.Utils.DEFAULT_ROOM_DIMENSIONS.depth},

    // Resonance audio parameters.
    ambisonicOrder: {type: 'int', default: ResonanceAudio.Utils.DEFAULT_AMBISONIC_ORDER, oneOf: [1, 3]},
    speedOfSound: {type: 'number', default: ResonanceAudio.Utils.DEFAULT_SPEED_OF_SOUND},

    // Room wall materials.
    left: {default: 'brick-bare', oneOf: RESONANCE_MATERIAL},
    right: {default: 'brick-bare', oneOf: RESONANCE_MATERIAL},
    front: {default: 'brick-bare', oneOf: RESONANCE_MATERIAL},
    back: {default: 'brick-bare', oneOf: RESONANCE_MATERIAL},
    down: {default: 'brick-bare', oneOf: RESONANCE_MATERIAL},
    up: {default: 'brick-bare', oneOf: RESONANCE_MATERIAL},

    // Whether to add a visualization of the room. This shows a wireframe of the box that is the room.
    visualize: {type: 'boolean', default: false}
  },

  init () {
    // Initialize the audio context and connect with Resonance.
    this.resonanceAudioContext = new AudioContext()
    this.resonanceAudioScene = new ResonanceAudio(this.resonanceAudioContext)
    this.resonanceAudioScene.output.connect(this.resonanceAudioContext.destination)

    this.visualization = null
    
    this.sources = new Array()
    this.setUpAudioSources()
    this.exposeAPI()
    
    // Update audio source positions on position change.
    this.el.addEventListener('componentchanged', (e) => {
      if (e.detail.name === 'position' || e.detail.name === 'rotation') {
        this.updatePosition()
        this.updateVisualization()
        this.sources.forEach(source => source.updatePosition())
      }
    })
    // Correctly handle dynamic attachment and detachment of audio sources.
    this.el.addEventListener('child-attached', (e) => {
      const el = e.detail.el
      if (el.hasLoaded) {
        this.attachSource(el)
      } else {
        el.addEventListener('loaded', e => this.attachSource(el))
      }
    })
    this.el.addEventListener('child-detached', e => this.detachSource(e.detail.el))
  },

  exposeAPI () {
    Object.defineProperties(this.el, {
      // Array of audio source components.
      sources: { enumerable: true, get: () => this.sources },
      // Array of audio sources (HTMLMediaElement and MediaStream objects).
      sounds:  { enumerable: true, get: () => this.sources.map(source => source.el.sound) }
    })
  },

  update (oldData) {
    this.roomSetup(oldData)
    this.acousticsSetup(oldData)
    this.updateVisualization(oldData)
  },

  updatePosition () {
    this.el.object3D.updateMatrixWorld()
  },

  // update resonanceAudioScene after room is tocked
  tock () {
    this.resonanceAudioScene.setListenerFromMatrix(this.el.sceneEl.camera.el.object3D.matrixWorld)
  },

  // room setup
  roomSetup (oldData) {
    // room dimensions
    const dimensions = {
      width: this.data.width,
      height: this.data.height,
      depth: this.data.depth
    }
    // room materials
    const materials = {
      left: this.data.left,
      right: this.data.right,
      front: this.data.front,
      back: this.data.back,
      down: this.data.down,
      up: this.data.up
    }
    this.resonanceAudioScene.setRoomProperties(dimensions, materials)
  },

  // room acoustics setup
  acousticsSetup (oldData) {
    if (!this.resonanceAudioScene ||
      ((oldData.ambisonicOrder === this.data.ambisonicOrder) &&
      (oldData.speedOfSound === this.data.speedOfSound))) { return }

    this.resonanceAudioScene.setAmbisonicOrder(this.data.ambisonicOrder)
    this.resonanceAudioScene.setSpeedOfSound(this.data.speedOfSound)
  },

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
      }
    }
    
    // Update the visualized entity. 
    if (!d.visualize) { return }
    this.visualization.setAttribute('position', this.el.getAttribute('position'))
    this.visualization.setAttribute('rotation', this.el.getAttribute('rotation'))
    this.visualization.setAttribute('width', d.width)
    this.visualization.setAttribute('height', d.height)
    this.visualization.setAttribute('depth', d.depth)
  },

  /**
   * Set up audio by attaching sources.
   */
  setUpAudioSources () {
    this.el.querySelectorAll('[resonance-audio-src]').forEach(childEl => this.attachSource(childEl))
  },

  attachSource (el) {
    const source = el.components['resonance-audio-src']
    // Only consider relevant elements.
    if (!source) { return }

    this.sources.push(source)
    source.initAudioSrc(this)
  },

  detachSource (el) {
    const source = el.components['resonance-audio-src']
    if (this.sources.includes(source)) {
      this.sources.splice(this.sources.indexOf(source), 1)
    }
  },

  remove () {
    if (this.visualization) {
      this.el.sceneEl.removeChild(this.visualization)
      this.visualization = null
    }
  }
})

// Composite component.
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
    const bb = new THREE.Box3().setFromObject(this.el.object3D)
    this.data.width  = bb.getSize().x
    this.data.height = bb.getSize().y
    this.data.depth  = bb.getSize().z
    this.el.setAttribute('resonance-audio-room', this.data)
  }
})

AFRAME.registerPrimitive('a-resonance-audio-room', {
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