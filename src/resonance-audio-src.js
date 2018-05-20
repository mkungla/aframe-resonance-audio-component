/* global AFRAME */

const log = AFRAME.utils.debug
const warn = log('components:resonance-audio-src:warn')

AFRAME.registerComponent('resonance-audio-src', {
  dependencies: ['geometry', 'position'],
  // To enable multiple instancing on your component,
  // set multiple: true in the component definition:
  multiple: false,

  schema: {
    src: {type: 'asset'},
    loop: {type: 'boolean', default: true},
    autoplay: {type: 'boolean', default: true}
  },
  
  init () {
    this.room = null
    this.connected = {
      element: false,
      stream: false
    }
    this.mediaElementAudioNode = null
    this.mediaStreamAudioNode = null
    this.data.srcObject = null
    this.exposeAPI()

    // Update on position change.
    this.el.addEventListener('componentchanged', (e) => {
      if (e.detail.name === 'position') {
        this.room.updatePosition()
        this.updatePosition()
      }
    })
  },

  initAudioSrc (room) {
    if (this.room) {
      throw new Error('audio src can only be initiated once')
    }
    this.room = room

    // Create source.
    this.resonanceAudioSceneSource = this.room.resonanceAudioScene.createSource()
    
    // Handle position.
    this.room.updatePosition()
    this.updatePosition()
    
    // Prepare audio element.
    this.el.audioEl = document.createElement('audio')
    this.mediaElementAudioNode = this.room.resonanceAudioContext.createMediaElementSource(this.el.audioEl)
    
    // Connect the src that is already set.
    this.connectWithElement(this.data.src)
  },
  
  update (oldData) {
    // If the audio src was not initialized yet, return.
    if (!this.room) { return }

    // Update loop.
    if (this.data.loop) {
      this.el.audioEl.setAttribute('loop', 'true')
    } else {
      this.el.audioEl.removeAttribute('loop')
    }
  },

  updatePosition() {
    this.resonanceAudioSceneSource.setFromMatrix(this.el.object3D.matrixWorld)
  },

  disconnect () {
    if (this.connected.element) {
      this.mediaElementAudioNode.disconnect(this.resonanceAudioSceneSource.input)
      this.connected.element = false
    }
    if (this.connected.stream) {
      this.mediaStreamAudioNode.disconnect(this.resonanceAudioSceneSource.input)
      delete this.mediaStreamAudioNode
      this.connected.stream = false
    }
  },

  connectWithElement (src) {
    this.disconnect()

    // Don't connect a new element if there is none.
    if (!src) { return }

    // Load an audio file into the audio element.
    this.el.audioEl.setAttribute('src', src)
    this.mediaElementAudioNode.connect(this.resonanceAudioSceneSource.input)
    this.connected.element = true

    // Play the audio.
    if (this.data.autoplay) {
      this.el.audioEl.play()
    }
  },

  connectWithStream (stream) {
    this.disconnect()

    // Don't connect a new stream if there is none.
    if (!stream) { return }

    // Generate a new MediaStreamSource from the stream MediaStream.
    this.mediaStreamAudioNode = this.room.resonanceAudioContext.createMediaStreamSource(stream)
    this.mediaStreamAudioNode.connect(this.resonanceAudioSceneSource.input)
    this.connected.stream = true
  },

  exposeAPI() {
    const descriptor_src = {
      set: (value) => { this.setMediaSrc(value) },
      get: ()      => this.data.src
    }
    const descriptor_srcObject = { 
      set: (value) => { this.setMediaStream(value) },
      get: ()      => this.data.srcObject
    }
    Object.defineProperty(this.el, 'src', descriptor_src)
    Object.defineProperty(this.el, 'srcObject', descriptor_srcObject)
    Object.defineProperty(this, 'src', descriptor_src)
    Object.defineProperty(this, 'srcObject', descriptor_srcObject)
    this.el.sound = {
      play:  this.playSource.bind(this),
      pause: this.pauseSource.bind(this),
      el: this.el.audioEl
    }
  },

  playSource () {
    if (this.connected.stream) {
      warn("can't play/pause stream. Go to its source.")
    }
    if (this.connected.element) {
      this.el.audioEl.play()
    }
  },

  pauseSource () {
    if (this.connected.stream) {
      warn("can't play/pause stream. Go to its source.")
    }
    if (this.connected.element) {
      this.el.audioEl.pause()
    }
  },

  setMediaSrc (src) {
    // Simplified asset parsing, similar to the one used by A-Frame.
    if (typeof src !== 'string') { throw new TypeError('invalid src') }
    if (src.charAt(0) === '#') {
      const el = document.querySelector(src)
      if (!el) { throw new Error('invalid src') }
      src = el.getAttribute('src')
    }
    // Allow either element or stream, not both.
    this.data.srcObject = null
    this.data.src = src

    this.connectWithElement(src)
  },
  
  setMediaStream (mediaStream) {
    if (!(mediaStream instanceof MediaStream) && mediaStream != null) {
      throw new TypeError('not a mediastream')
    }
    // Allow either element or stream, not both.
    this.data.src = ''
    this.data.srcObject = mediaStream
    
    this.connectWithStream(mediaStream)
  },

  remove () {
    this.disconnect()
    this.el.audioEl.remove()
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