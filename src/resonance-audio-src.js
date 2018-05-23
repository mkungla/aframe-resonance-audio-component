/* global AFRAME */

const log = AFRAME.utils.debug
const warn = log('components:resonance-audio-src:warn')

AFRAME.registerComponent('resonance-audio-src', {
  dependencies: ['geometry', 'position'],
  // To enable multiple instancing on your component,
  // set multiple: true in the component definition:
  multiple: false,

  schema: {
    src: {type: 'string'}, // asset parsing is taken over from A-Frame.
    loop: {type: 'boolean', default: true},
    autoplay: {type: 'boolean', default: true}
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

    // A mapping of elements and stream to their source AudioNode objects.
    // We use a mapping so the created MediaElementAudioSourceNode and MediaStreamAudioSourceNode objects can be reused.
    this.mediaAudioSourceNodes = new Map()

    // Update audio source position on position component change.
    this.el.addEventListener('componentchanged', (e) => {
      if (e.detail.name === 'position') {
        this.room.updatePosition()
        this.updatePosition()
      }
    })

    this.exposeAPI()
  },

  initAudioSrc (room) {
    if (this.room) {
      throw new Error('audio src can only be initiated once')
    }
    this.room = room

    // Create Resonance source.
    this.resonanceAudioSceneSource = this.room.resonanceAudioScene.createSource()
    
    // Handle position.
    this.room.updatePosition()
    this.updatePosition()
    
    // Prepare default audio element.
    this.defaultAudioEl = document.createElement('audio')
    this.mediaAudioSourceNodes.set(this.defaultAudioEl, this.room.resonanceAudioContext.createMediaElementSource(this.defaultAudioEl))
    
    // Set the src declared in html.
    this.setMediaSrc(this.data.src)
  },
  
  update (oldData) {
    this.updatePlaybackSettings()
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

  updatePosition() {
    this.resonanceAudioSceneSource.setFromMatrix(this.el.object3D.matrixWorld)
  },

  exposeAPI () {
    // Make el.sound point to the connected sound source.
    Object.defineProperty(this.el, 'sound', { get: () => this.sound, enumerable: true })
  },

  disconnect () {
    if (this.sound) {
      this.mediaAudioSourceNodes.get(this.sound).disconnect(this.resonanceAudioSceneSource.input)
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
      this.mediaAudioSourceNodes.set(this.sound, createSourceFn.call(this.room.resonanceAudioContext, this.sound))
    }
    // Get elemenent source AudioNode.
    this.mediaAudioSourceNodes.get(this.sound).connect(this.resonanceAudioSceneSource.input)
    
    return true
  },

  connectWithElement (el) {
    this.connected.element = this._connect(el, this.room.resonanceAudioContext.createMediaElementSource)

    if (!this.connected.element) { return }
    // Apply playback settings.
    this.updatePlaybackSettings()
    // Play the audio.
    if (this.sound.getAttribute('autoplay')) {
      this.sound.play()
    }
  },

  connectWithStream (stream) {
    this.connected.stream = this._connect(stream, this.room.resonanceAudioContext.createMediaStreamSource)
    
    if (!this.connected.stream) { return }
    // Add play/pause API to sound that give a warning when accessed.
    const unavailable = () => warn("can't use play/pause on MediaStream. Manipulate the stream's source instead")
    this.sound.play = unavailable
    this.sound.pause = unavailable
  },

  setMediaSrc (src) {
    // Parse src, which can be an id string or an video or audio element.
    let el
    if (typeof src === 'string') {
      if (src.charAt(0) === '#') {
        el = document.querySelector(src)
      } else {
        el = this.defaultAudioEl
        el.setAttribute('src', src)
      }
    } else {
      el = src
    }
    if (!(el instanceof HTMLMediaElement)) {
        throw new TypeError('invalid src element. Must be video or audio element.')
    }
    // Allow either element or stream, not both.
    this.data.srcObject = null
    this.data.src = el

    this.connectWithElement(el)
  },
  
  setMediaStream (mediaStream) {
    if (!(mediaStream instanceof MediaStream) && mediaStream != null) {
      throw new TypeError('not a mediastream')
    }
    // Allow either element or stream, not both.
    this.data.src = null
    this.data.srcObject = mediaStream
    
    this.connectWithStream(mediaStream)
  },

  remove () {
    this.disconnect()
    this.defaultAudioEl.remove()
  }
})

AFRAME.registerPrimitive('a-resonance-audio-src', {
  mappings: {
    src: 'resonance-audio-src.src',
    loop: 'resonance-audio-src.loop',
    autoplay: 'resonance-audio-src.autoplay'
  }
});

// Enable setAttribute interface with monkeypatch.
(function(){
  const next = HTMLElement.prototype.setAttribute
  HTMLElement.prototype.setAttribute = function(attrName, arg1, arg2) {
    if (this.tagName === 'A-RESONANCE-AUDIO-SRC') {
      if (attrName === 'src') {
        this.components['resonance-audio-src'].setMediaSrc(arg1)
        return
      }
      if (attrName === 'srcObject') {
        this.components['resonance-audio-src'].setMediaStream(arg1)
        return
      }
    }
    next.call(this, attrName, arg1, arg2)
  }
})();