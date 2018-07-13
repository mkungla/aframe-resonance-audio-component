/* global AFRAME, THREE, MediaStream, HTMLMediaElement */
const { ResonanceAudio } = require('resonance-audio')

const log = AFRAME.utils.debug
const warn = log('components:resonance-audio-src:warn')

AFRAME.registerComponent('resonance-audio-src', {
  dependencies: ['position', 'rotation'],

  schema: {
    src: {type: 'string'}, // asset parsing is taken over from A-Frame.
    loop: {type: 'boolean', default: true},
    autoplay: {type: 'boolean', default: true},

    gain: {type: 'number', default: ResonanceAudio.Utils.DEFAULT_SOURCE_GAIN},
    maxDistance: {type: 'number', default: ResonanceAudio.Utils.DEFAULT_MAX_DISTANCE},
    minDistance: {type: 'number', default: ResonanceAudio.Utils.DEFAULT_MIN_DISTANCE},
    directivityPattern: {type: 'vec2', default: {x: ResonanceAudio.Utils.DEFAULT_DIRECTIVITY_ALPHA, y: ResonanceAudio.Utils.DEFAULT_DIRECTIVITY_SHARPNESS}},
    sourceWidth: {type: 'number', default: ResonanceAudio.Utils.DEFAULT_SOURCE_WIDTH},
    rolloff: {type: 'string', oneOff: ResonanceAudio.Utils.ATTENUATION_ROLLOFFS, default: ResonanceAudio.Utils.DEFAULT_ATTENUATION_ROLLOFF},

    position: {type: 'vec3', default: {}},
    rotation: {type: 'vec3', default: {}},

    // Whether to show a visualization of the audio source. This shows a sphere wireframe of the
    // source with its radius set to the minDistance.
    visualize: {type: 'boolean', default: false}
  },

  init () {
    // The room this audio source is in.
    this.room = null
    // The connection status.
    this.connected = {
      element: false,
      stream: false
    }
    // The current connected element or stream.
    this.sound = null

    // The Resonance audio source.
    this.resonance = null

    // Visualization entity of the audio source.
    this.visualization = null

    // A mapping of elements and stream to their source AudioNode objects.
    // We use a mapping so the created MediaElementAudioSourceNode and MediaStreamAudioSourceNode objects can be reused.
    this.mediaAudioSourceNodes = new Map()

    // Update audio source position and orientation on position or rotation component change.
    this.el.addEventListener('componentchanged', (e) => {
      if (e.detail.name === 'position' || e.detail.name === 'rotation') {
        this.room.updatePosition()
        this.updatePosition()
        this.updateVisualization()
      }
    })

    // When the scene has loaded and all world positions are calculated, place the visualization.
    this.el.sceneEl.addEventListener('loaded', (e) => this.updateVisualization())
  },

  initAudioSrc (room) {
    if (this.room) {
      throw new Error('audio src can only be initiated once')
    }
    this.room = room

    // Create Resonance source.
    this.resonance = this.room.resonanceAudioScene.createSource()

    // Update sound values.
    this.updateSoundSettings()

    // Handle position.
    this.room.updatePosition()
    this.updatePosition()

    // Prepare default audio element.
    this.defaultAudioEl = document.createElement('audio')
    this.mediaAudioSourceNodes.set(this.defaultAudioEl, this.room.audioContext.createMediaElementSource(this.defaultAudioEl))

    // Set the src declared in the html.
    this.setSrc(this.data.src)

    // The room is known, so also update the visualization of this audio source.
    this.updateVisualization()
  },

  update (oldData) {
    if (this.room && oldData.src !== this.data.src) {
      this.setSrc(this.data.src)
    }
    this.updateSoundSettings()
    this.updatePlaybackSettings()
    this.updatePosition()
    this.updateVisualization(oldData)
  },

  updateSoundSettings () {
    const s = this.resonance
    if (!s) { return }
    s.setGain(this.data.gain)
    s.setMinDistance(this.data.minDistance)
    s.setMaxDistance(this.data.maxDistance)
    s.setDirectivityPattern(this.data.directivityPattern.x, this.data.directivityPattern.y)
    s.setSourceWidth(this.data.sourceWidth)
    s.setRolloff(this.data.rolloff)
  },

  updatePlaybackSettings () {
    // If no element is connected, do nothing.
    if (!this.connected.element) { return }

    // Update loop.
    if (this.data.loop) {
      this.sound.setAttribute('loop', 'true')
    } else {
      this.sound.removeAttribute('loop')
    }
    // Update autoplay.
    if (this.data.autoplay) {
      this.sound.setAttribute('autoplay', 'true')
    } else {
      this.sound.removeAttribute('autoplay')
    }
  },

  /**
   * Update the position in Google Resonance of this audio source, so relative to the audio room.
   * @returns {this}
   */
  updatePosition () {
    if (!this.resonance) { return }
    this.resonance.setFromMatrix(this.getMatrixRoom())
    return this
  },

  /**
   * Get a copy of the matrixWorld of the audio source, taking into account any custom set position
   * or rotation. The matrixWorld contains the audio source's position and rotation in world
   * coordinates.
   * @return {THREE.Matrix4}
   */
  getMatrixWorld () {
    // Update all world matrices.
    this.el.sceneEl.object3D.updateMatrixWorld()

    if (!isVec3Set(this.data.position) && !isVec3Set(this.data.rotation)) {
      // No custom position or rotation was set, so simply return a copy of the matrixWorld of the
      // current entity.
      return new THREE.Matrix4().copy(this.el.object3D.matrixWorld)
    } else {
      const localPosition = isVec3Set(this.data.position)
        ? new THREE.Vector3(this.data.position.x, this.data.position.y, this.data.position.z)
        : this.el.object3D.position
      const localRotation = isVec3Set(this.data.rotation)
        ? new THREE.Euler()
          .reorder('YXZ')
          .fromArray([
            this.data.rotation.x,
            this.data.rotation.y,
            this.data.rotation.z].map(THREE.Math.degToRad)
          )
        : this.el.object3D.rotation
      // Return matirxWorld calculated by multiplying the parent's matrixWorld and the local
      // matrix, as Three.js's Object3D.updateMatrixWorld() basically does.
      return new THREE.Matrix4().multiplyMatrices(
        this.el.object3D.parent.matrixWorld,
        new THREE.Matrix4().compose(
          localPosition,
          new THREE.Quaternion().setFromEuler(localRotation),
          {x: 1, y: 1, z: 1}
        )
      )
    }
  },

  /**
   * Get a matrix of the audio source's position and rotation relative to the audio room, taking
   * into account any custom set position or rotation.
   * @return {THREE.Matrix4}
   */
  getMatrixRoom () {
    return this.getMatrixWorld().premultiply(new THREE.Matrix4().getInverse(this.room.el.object3D.matrixWorld))
  },

  /**
   * Update the visualization of this audio room according to the properties set.
   * @returns {this}
   */
  updateVisualization (oldData) {
    const d = this.data

    // Add or remove visualization to or from the DOM. This is done to the root so it is not
    // affected by the current entity.
    if (oldData) {
      if (!oldData.visualize && d.visualize) {
        // Create entity if it didn't exist yet.
        if (!this.visualization) {
          this.visualization = document.createElement('a-sphere')
          this.visualization.audioSrc = this.el
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
      const p = new THREE.Vector3()
      const q = new THREE.Quaternion()
      const s = new THREE.Vector3()
      this.getMatrixWorld().decompose(p, q, s)
      const r = new THREE.Euler().setFromQuaternion(q, 'YXZ')
      const r2d = THREE.Math.radToDeg

      this.visualization.setAttribute('position', p)
      this.visualization.setAttribute('rotation', {x: r2d(r.x), y: r2d(r.y), z: r2d(r.z)})
      this.visualization.setAttribute('radius', d.minDistance)
    }
    return this
  },

  disconnect () {
    if (this.sound) {
      this.mediaAudioSourceNodes.get(this.sound).disconnect(this.resonance.input)
      this.sound = null
    }
    this.connected.element = false
    this.connected.stream = false
  },

  _connect (source, createSourceFn) {
    this.disconnect()

    // Don't connect a new source if there is none.
    if (!source) { return false }

    this.sound = source

    // Create new source AudioNode if source object didn't have one yet.
    if (!this.mediaAudioSourceNodes.has(this.sound)) {
      this.mediaAudioSourceNodes.set(this.sound, createSourceFn.call(this.room.audioContext, this.sound))
    }
    // Get elemenent source AudioNode.
    this.mediaAudioSourceNodes.get(this.sound).connect(this.resonance.input)

    return true
  },

  connectWithElement (el) {
    this.connected.element = this._connect(el, this.room.audioContext.createMediaElementSource)

    if (!this.connected.element) { return }
    // Warn when an element with a stream was connected.
    if (this.sound.srcObject) {
      warn("can't use a HTMLMediaElement that contains a stream. Connect the stream itself.")
    }
    // Apply playback settings.
    this.updatePlaybackSettings()
    // Play the audio.
    if (this.sound.getAttribute('autoplay')) {
      this.sound.play()
    }
  },

  connectWithStream (stream) {
    this.connected.stream = this._connect(stream, this.room.audioContext.createMediaStreamSource)

    if (!this.connected.stream) { return }
    // Add play/pause API to sound that give a warning when accessed.
    const unavailable = () => warn("can't use play/pause on MediaStream. Manipulate the stream's source instead")
    this.sound.play = unavailable
    this.sound.pause = unavailable
  },

  /**
   * Set a new source.
   * @param {string|HTMLMediaElement|MediaStream|null} src
   */
  setSrc (src) {
    const errorMsg = 'invalid src value. Must be element id string, resource string, HTMLMediaElement or MediaStream'

    let el
    if (!src) {
      this.disconnect()
    } else if (src instanceof MediaStream) {
      this.connectWithStream(src)
    } else if (src instanceof HTMLMediaElement) {
      this.connectWithElement(src)
    } else if (typeof src === 'string') {
      if (src.charAt(0) === '#') {
        el = document.getElementById(src.substr(1))
      } else {
        el = this.defaultAudioEl
        el.setAttribute('src', src)
      }
      if (!el) { throw new TypeError(errorMsg) }
      this.connectWithElement(el)
    } else {
      throw new TypeError(errorMsg)
    }
    this.data.src = el || src
  },

  remove () {
    this.disconnect()
    this.defaultAudioEl.remove()
    if (this.visualization) {
      this.el.sceneEl.removeChild(this.visualization)
      this.visualization = null
    }
  }
})

AFRAME.registerPrimitive('a-resonance-audio-src', {
  defaultComponents: {
    'resonance-audio-src': {}
  },
  mappings: {
    src: 'resonance-audio-src.src',
    loop: 'resonance-audio-src.loop',
    autoplay: 'resonance-audio-src.autoplay',

    gain: 'resonance-audio-src.gain',
    'min-distance': 'resonance-audio-src.minDistance',
    'max-distance': 'resonance-audio-src.maxDistaonce',
    'directivity-pattern': 'resonance-audio-src.directivityPattern',
    'source-width': 'resonance-audio-src.sourceWidth',
    rolloff: 'resonance-audio-src.rolloff',
    // The orientation and position are set by the rotation and position components, respectively.

    visualize: 'resonance-audio-src.visualize'
  }
})

/**
 * Check if x, y and z properties are set.
 * @param {boolean}
 */
function isVec3Set (v) {
  return typeof v === 'object' &&
      typeof v.x !== 'undefined' &&
      typeof v.y !== 'undefined' &&
      typeof v.z !== 'undefined'
}
