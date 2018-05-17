/* global AFRAME */

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
    this.pos = new AFRAME.THREE.Vector3()
    this.room = null
    this.exposeAPI()
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
  },
  setMediaSrc (src) {
    // Simplified asset parsing, similar to the one used by A-Frame.
    if (typeof src !== 'string') { throw new TypeError('invalid src') }
    if (src.charAt(0) === '#') {
      const el = document.querySelector(src)
      if (!el) { throw new Error('invalid src') }
      src = el.getAttribute('src')
    }
    this.data.srcObject = null
    this.data.src = src
    this.room.connectElementSrc(src)
  },
  setMediaStream (mediaStream) {
    if (!(mediaStream instanceof MediaStream) && mediaStream != null) {
      throw new TypeError('not a mediastream')
    }
    this.data.src = ''
    this.data.srcObject = mediaStream
    this.room.connectStreamSrc(mediaStream)
  },
  getSource () {
    return this.data.src
  },
  getMatrixWorld () {
    return this.el.object3D.matrixWorld
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
  HTMLElement.prototype.setAttribute = function(prop, value) {
    if (this.tagName === 'A-RESONANCE-AUDIO-SRC' && prop === 'src') {
      this.components['resonance-audio-src'].setMediaSrc(value)
      return
    } 
    if (this.tagName === 'A-RESONANCE-AUDIO-SRC' && prop === 'srcObject') {
      this.components['resonance-audio-src'].setMediaStream(value)
      return
    }
    next.call(this, prop, value)
  }
})();