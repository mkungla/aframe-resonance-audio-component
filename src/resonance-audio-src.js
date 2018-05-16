/* global AFRAME */

AFRAME.registerComponent('resonance-audio-src', {
  dependencies: ['geometry', 'position'],
  // To enable multiple instancing on your component,
  // set multiple: true in the component definition:
  multiple: false,

  room: null,

  schema: {
    src: {type: 'asset'},
    loop: {type: 'boolean', default: true},
    autoplay: {type: 'boolean', default: true}
  },
  init () {
    this.pos = new AFRAME.THREE.Vector3()
  },
  update (oldData) {
    if (Object.keys(oldData).length > 0 && // Skip initialization (this is done by the room).
        oldData.src != this.data.src       // Only connect if src was changed.
        ) {
      this.room.connectElementSrc(this.data.src)
    }
  }, 
  setMediaStream (mediaStream) {
    if (!(mediaStream instanceof MediaStream) && mediaStream != null) {
      throw new TypeError('not a mediastream')
    }
    this.room.connectStreamSrc(mediaStream);
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

// Allow proper interface with monkeypatch.
(function(){
  let next = HTMLElement.prototype.setAttribute
  HTMLElement.prototype.setAttribute = function(prop, value) {
    if (prop === 'srcObject' && this.tagName.toLowerCase() === 'a-resonance-audio-src') {
      this.components['resonance-audio-src'].setMediaStream(value)
      return
    } 
    return next.call(this, prop, value);
  }
})();