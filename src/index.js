if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available. Did you include A-Frame?')
}

require('./resonance-audio-room')
require('./resonance-audio-src')
