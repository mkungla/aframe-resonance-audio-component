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
    this.mediaAudioSourceNodes = new Map()

    // Update audio source position on position component change.
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
    
    // Prepare default audio element.
    this.defaultAudioEl = document.createElement('audio')
    this.mediaAudioSourceNodes.set(this.defaultAudioEl, this.room.resonanceAudioContext.createMediaElementSource(this.defaultAudioEl))
    
    // Set the src declared in html.
    this.setMediaSrc(this.data.src)
  },
  
  update (oldData) {
    // If the audio src was not initialized yet, return.
    if (!this.room) { return }

    // Update loop.
    if (this.data.loop) {
      this.defaultAudioEl.setAttribute('loop', 'true')
    } else {
      this.defaultAudioEl.removeAttribute('loop')
    }
    // Update autoplay.
    if (this.data.autoplay) {
      this.defaultAudioEl.setAttribute('autoplay', 'true')
    } else {
      this.defaultAudioEl.removeAttribute('autoplay')
    }
  },

  updatePosition() {
    this.resonanceAudioSceneSource.setFromMatrix(this.el.object3D.matrixWorld)
  },

  disconnect () {
    if (this.sound) {
      this.mediaAudioSourceNodes.get(this.sound).disconnect(this.resonanceAudioSceneSource.input)
    }
    if (this.connected.element) {
      this.connected.element = false
    }
    if (this.connected.stream) {
      this.connected.stream = false
    }
  },

  connectWithElement (el) {
    this.disconnect()

    // Don't connect a new element if there is none.
    if (!el) { return }

    this.sound = el

    // Create new element source AudioNode if element didn't have one yet.
    if (!this.mediaAudioSourceNodes.has(this.sound)) {
      this.mediaAudioSourceNodes.set(this.sound, this.room.resonanceAudioContext.createMediaElementSource(this.sound))
    }
    // Get elemenent source AudioNode.
    this.mediaAudioSourceNodes.get(this.sound).connect(this.resonanceAudioSceneSource.input)
    this.connected.element = true

    // Play the audio.
    if (this.data.autoplay) {
      this.sound.play()
    }
  },

  connectWithStream (stream) {
    this.disconnect()

    // Don't connect a new stream if there is none.
    if (!stream) { return }

    this.sound = stream

    // Create new stream source AudioNode if the stream didn't have one yet.
    if (!this.mediaAudioSourceNodes.has(this.sound)) {
      this.mediaAudioSourceNodes.set(this.sound, this.room.resonanceAudioContext.createMediaStreamSource(this.sound))
    }
    // Get stream source AudioNode.
    this.mediaAudioSourceNodes.get(this.sound).connect(this.resonanceAudioSceneSource.input)
    this.connected.stream = true
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
    if (!(el instanceof HTMLElement) || !['VIDEO', 'AUDIO'].includes(el.tagName)) {
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