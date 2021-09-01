if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available. Did you include A-Frame?')
}

import './resonance-audio-room'
import './resonance-audio-src'
