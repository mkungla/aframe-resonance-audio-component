/* global AFRAME AudioContext */
import {ResonanceAudio} from 'resonance-audio'

const log = AFRAME.utils.debug
const warn = log('components:resonance-audio-room:warn')

const RESONANCE_MATERIAL = Object.keys(ResonanceAudio.Utils.ROOM_MATERIAL_COEFFICIENTS)

AFRAME.registerComponent('resonance-audio-room', {
  dependencies: ['geometry', 'position'],
  // To enable multiple instancing on your component,
  // set multiple: true in the component definition:
  multiple: false,

  schema: {
    width: {type: 'number', default: ResonanceAudio.Utils.DEFAULT_ROOM_DIMENSIONS.width},
    height: {type: 'number', default: ResonanceAudio.Utils.DEFAULT_ROOM_DIMENSIONS.height},
    depth: {type: 'number', default: ResonanceAudio.Utils.DEFAULT_ROOM_DIMENSIONS.depth},
    ambisonicOrder: {type: 'int', default: ResonanceAudio.Utils.DEFAULT_AMBISONIC_ORDER, oneOf: [1, 3]},
    speedOfSound: {type: 'number', default: ResonanceAudio.Utils.DEFAULT_SPEED_OF_SOUND},
    left: {default: 'brick-bare', oneOf: RESONANCE_MATERIAL},
    right: {default: 'brick-bare', oneOf: RESONANCE_MATERIAL},
    front: {default: 'brick-bare', oneOf: RESONANCE_MATERIAL},
    back: {default: 'brick-bare', oneOf: RESONANCE_MATERIAL},
    down: {default: 'brick-bare', oneOf: RESONANCE_MATERIAL},
    up: {default: 'brick-bare', oneOf: RESONANCE_MATERIAL}
  },
  init () {
    this.hasAudio = false
    this.cameraMoved = false
    this.builtInGeometry = true
    this.cameraMatrix4 = new AFRAME.THREE.Matrix4()
    this.resonanceAudioContext = new AudioContext()
    this.resonanceAudioScene = new ResonanceAudio(this.resonanceAudioContext)
    this.resonanceAudioScene.output.connect(this.resonanceAudioContext.destination)
    // Create an AudioElement.
    this.el.audioElement = document.createElement('audio')
    this.sound = null
  },

  update (oldData) {
    this.roomSetup(oldData)
    this.acousticsSetup(oldData)
    this.setUpAudio()
  },

  tick () {
    const cameraEl = this.el.sceneEl.camera.el
    this.cameraMatrix4 = cameraEl.object3D.matrixWorld
  },

  // update resonanceAudioScene after room is tocked
  tock () {
    if (!this.hasAudio) { return }
    this.resonanceAudioScene.setListenerFromMatrix(this.cameraMatrix4)
  },

  // room setup
  roomSetup (oldData) {
    // room dimensions
    let dimensions = {
      width: this.data.width,
      height: this.data.height,
      depth: this.data.depth
    }
    if ((this.data.width + this.data.height + this.data.depth) === 0) {
      const bb = new AFRAME.THREE.Box3().setFromObject(this.el.object3D)
      dimensions.width = bb.size().x
      dimensions.height = bb.size().y
      dimensions.depth = bb.size().z
      this.builtInGeometry = false
    }
    // update geometry (only if using default geometry)
    if (this.builtInGeometry) {
      this.el.setAttribute('geometry', dimensions)
    }
    // room materials
    let materials = {
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

  setUpAudio () {
    let children = this.el.object3D.children
    // 1 = this.el
    if (children.length < 2) { return }

    children.forEach((childEl) => {
      if (!childEl.el.getAttribute('resonance-audio-src')) { return }
      if (this.hasAudio) {
        warn('supporting single resonance-audio-src under resonance-audio-room')
      }
      if (this.sound) {
        this.sound.remove()
      }
      this.hasAudio = true
      this.sound = childEl.el.components['resonance-audio-src']
    })

    // Load an audio file into the AudioElement.
    this.el.audioElement.setAttribute('src', this.sound.getSource())
    // Generate a MediaElementSource from the AudioElement.
    let audioElementSource = this.resonanceAudioContext.createMediaElementSource(this.el.audioElement)
    // Add the MediaElementSource to the scene as an audio input source.
    let source = this.resonanceAudioScene.createSource()
    audioElementSource.connect(source.input)
    // Set position
    this.el.object3D.updateMatrixWorld()
    source.setFromMatrix(this.sound.getMatrixWorld())

    // Play the audio.
    if (this.sound.data.autoplay) {
      this.el.audioElement.play()
    }

    // Looping
    this.el.audioElement.setAttribute('loop', this.sound.data.loop)
  },

  remove () {
    this.el.audioEl.pause()
    this.el.audioEl = null
  },

  pause () {
    if (this.el.audioEl) {
      this.el.audioEl.pause()
    }
  },

  play () {
    if (this.el.audioEl && this.el.audioEl.paused) {
      this.el.audioEl.play()
    }
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
    up: 'resonance-audio-room.up'
  }
})
