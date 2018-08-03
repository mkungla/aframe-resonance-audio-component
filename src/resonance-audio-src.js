/* global AFRAME, THREE, MediaStream, HTMLMediaElement */
const { ResonanceAudio } = require('resonance-audio')
const { isVec3Set, onceWhenLoaded } = require('./utils')

const warn = AFRAME.utils.debug('components:resonance-audio-src:warn')

AFRAME.registerComponent('resonance-audio-src', {
  dependencies: ['position', 'rotation'],

  schema: {
    src: {type: 'string'}, // asset parsing is taken over from A-Frame.
    room: {type: 'string'},
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

    // The default audio element used when src is set to a resource string.
    this.defaultAudioEl = null

    // A mapping of elements and stream to their source AudioNode objects.
    // We use a mapping so the created MediaElementAudioSourceNode and MediaStreamAudioSourceNode
    // objects can be reused.
    this.mediaAudioSourceNodes = new Map()

    // Update on entity change.
    this.onEntityChange = this.onEntityChange.bind(this)
    this.el.addEventListener('componentchanged', this.onEntityChange)
  },

  update (oldData) {
    if (this.room && oldData.src !== this.data.src) {
      this.connectSrc(this.data.src)
    }
    this.el.sceneEl.object3D.updateMatrixWorld(true)
    this.updateSoundSettings()
    this.updatePlaybackSettings()
    this.toggleShowVisualization(oldData.visualize, this.data.visualize)
    this.updateResonancePosition().updateVisualization()

    const roomEl = this.getRoomChoice()
    if ((roomEl && roomEl.components && roomEl.components['resonance-audio-room']) !== this.room) {
      /**
       * Yes, this looks ugly. And this approach has a reason. The audio source needs the audio
       * room's matrixWorld to calculate the audio source's position relative to the room. This
       * means scene and the audio room have to be loaded (which they havent on the initial
       * update).
       */
      onceWhenLoaded(this.el.sceneEl, () => {
        const roomLeft = this.leaveRoom()
        const roomEntered = this.enter(roomEl)
        this.connectSrc(this.data.src)
        this.updateSoundSettings()
        this.el.sceneEl.object3D.updateMatrixWorld(true)
        this.updateResonancePosition().updateVisualization()
        if (roomLeft) {
          this.el.emit('audioroom-left', {src: this.el, room: roomLeft.el})
        }
        if (roomEntered) {
          this.el.emit('audioroom-entered', {src: this.el, room: roomEntered.el})
        }
      })
    }
  },

  remove () {
    this.el.removeEventListener('componentchanged', this.onEntityChange)
    this.disconnect()
    const roomLeft = this.leaveRoom()
    this.toggleShowVisualization(this.data.visualize, false)

    if (roomLeft) {
      this.el.emit('audioroom-left', {src: this.el, room: roomLeft.el})
    }
  },

  /**
   * Update the Resonance sound settings.
   */
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

  /**
   * Update the playback settings.
   */
  updatePlaybackSettings () {
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
  updateResonancePosition () {
    if (this.resonance) {
      this.resonance.setFromMatrix(this.getMatrixRoom())
    }
    return this
  },

  /**
   * Toggle showing the visualization.
   * @param {boolean} previous - the previous setting
   * @param {boolean} current - the new setting
   */
  toggleShowVisualization (previous, current) {
    // This is done to the root so it is not affected by the current entity.
    if (!previous && current) {
      this.visualization = document.createElement('a-sphere')
      this.visualization.audioSrc = this.el
      this.visualization.setAttribute('material', 'wireframe', true)
      this.el.sceneEl.appendChild(this.visualization)
    } else if (previous && !current && this.visualization) {
      this.el.sceneEl.removeChild(this.visualization)
      this.visualization = null
    }
  },

  /**
   * Update the visualization's position, orientation and shape.
   * @returns {this}
   */
  updateVisualization () {
    const d = this.data
    if (d.visualize && this.visualization) {
      const p = new THREE.Vector3()
      const q = new THREE.Quaternion()
      const s = new THREE.Vector3()
      this.getMatrixWorld().decompose(p, q, s)
      const r = new THREE.Euler().setFromQuaternion(q, 'YXZ')
      const r2d = THREE.Math.radToDeg

      this.visualization.setAttribute('position', p)
      this.visualization.setAttribute('rotation', {x: r2d(r.x), y: r2d(r.y), z: r2d(r.z)})
      this.visualization.setAttribute('radius', d.minDistance)
      this.visualization.setAttribute('material', 'color', this.room ? '#FFF' : '#F00')
    }
    return this
  },

  /**
   * When the entity's position or rotation is changed, update the Resonance audio position and
   * visualization accordingly.
   * @param {Event} evt
   */
  onEntityChange (evt) {
    if (evt.detail.name !== 'position' && evt.detail.name !== 'rotation') { return }

    this.el.sceneEl.object3D.updateMatrixWorld(true)
    if (this.room) {
      this.room.updatePosition()
    }
    this.updateResonancePosition().updateVisualization()
  },

  /**
   * Get the choice of audio Room. Checking order of room property:
   * - value is falsey: parent node is returned. This prevents using an empty string as query selector.
   * - value is an A-Frame entity: entity is returned.
   * - value is a string: document.querySelector result is returned. This might be null.
   * - else: parent node is returned.
   * @returns {HTMLElement|null}
   */
  getRoomChoice () {
    const ar = this.data.room
    return !ar
      ? this.el.parentNode
      : ar instanceof AFRAME.AEntity
        ? ar
        : typeof ar === 'string'
          ? document.querySelector(ar)
          : this.el.parentNode
  },

  /**
   * Get a copy of the matrixWorld of the audio source, taking into account any custom set position
   * or rotation, in world coordinates.
   * @return {THREE.Matrix4}
   */
  getMatrixWorld () {
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
   * Enter an audio room. If the passed audio room has no resonance-audio-room component, show a
   * warning and return false.
   * @param {AFRAME.AEntity} roomEl - the room element
   * @returns {AFRAME.AComponent|boolean} the entered room component or false if it couldn't be
   *                                      entered
   */
  enter (roomEl) {
    if (!roomEl || !roomEl.components || !('resonance-audio-room' in roomEl.components)) {
      warn("can't enter audio room because it is no audio room")
      return false
    }

    // Store references to each other.
    this.room = roomEl.components['resonance-audio-room']
    this.room.store(this.el)

    // Create Resonance source.
    this.resonance = this.room.resonanceAudioScene.createSource()

    // Prepare default audio element.
    this.defaultAudioEl = document.createElement('audio')
    this.mediaAudioSourceNodes.set(
      this.defaultAudioEl, this.room.audioContext.createMediaElementSource(this.defaultAudioEl)
    )
    return this.room
  },

  /**
   * Leave the audio room if this audio source is in one.
   * @returns {AFRAME.AComponent|boolean} the room that was left or false if there was no room to leave
   */
  leaveRoom () {
    if (!this.room) { return false }
    const room = this.room
    this.room.forget(this.el)
    this.room = null

    this.resonance = null
    this.mediaAudioSourceNodes.delete(this.defaultAudioEl)
    this.defaultAudioEl = null

    return room
  },

  /**
   * Connect a HTMLMediaElement or MediaStream to the room's AudioContext.
   * @param {HTMLMediaElement|MediaStream} source - the audio source
   * @param {function} createSourceFn - the function that creates an AudioSourceNode based on the passed source
   * @returns {boolean} false if there was not source to connect
   */
  connect (source, createSourceFn) {
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

  /**
   * Connect a media element to this resonance-audio-src.
   * @param {HTMLMediaElement} el - the media element
   */
  connectWithElement (el) {
    this.connected.element = this.connect(el, this.room.audioContext.createMediaElementSource)

    if (!this.connected.element) { return }
    // Warn when an element with a stream was connected.
    if (this.sound.srcObject) {
      warn("can't use a HTMLMediaElement that contains a stream. Connect the stream itself.")
    }
    // Apply playback settings.
    this.updatePlaybackSettings() // TODO this shouldn't be here
    // Play the audio.
    if (this.sound.getAttribute('autoplay')) {
      this.sound.play()
    }
  },

  /**
   * Connect a stream to this resonance-audio-src.
   * @param {MediaStream} stream - the stream
   */
  connectWithStream (stream) {
    this.connected.stream = this.connect(stream, this.room.audioContext.createMediaStreamSource)

    if (!this.connected.stream) { return }
    // Add play/pause API to sound that give a warning when accessed.
    const unavailable = () => warn("can't use play/pause on MediaStream. Manipulate the stream's source instead")
    this.sound.play = unavailable
    this.sound.pause = unavailable
  },

  /**
   * Disconnect HTMLMediaElement or MediaStream from this resonance-audio-src.
   */
  disconnect () {
    if (this.sound && this.resonance) {
      this.mediaAudioSourceNodes.get(this.sound).disconnect(this.resonance.input)
      this.sound = null
    }
    this.connected.element = false
    this.connected.stream = false
  },

  /**
   * Set a new source.
   * @param {string|HTMLMediaElement|MediaStream|null} src
   */
  connectSrc (src) {
    const errorMsg = 'invalid src value. Must be element id string, resource string, HTMLMediaElement or MediaStream'

    this.disconnect()
    let el
    if (!src) {
      // Do nothing, because we've already disconnected.
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
  }
})

AFRAME.registerPrimitive('a-resonance-audio-src', {
  defaultComponents: {
    'resonance-audio-src': {}
  },
  mappings: {
    src: 'resonance-audio-src.src',
    room: 'resonance-audio-src.room',
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
