/* global AFRAME */

if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available. Did you include A-Frame?')
}

const ARACVER = require('./version')

const log = AFRAME.utils.debug
// const error = log('A-Frame Resonance Audio Component:error')
const info = log('A-Frame Resonance Audio Componente:info')
const warn = log('A-Frame Resonance Audio Componente:warn')

if (module.hot) {
  module.hot.accept()
  warn(`Version: ${ARACVER}-dev`)
} else {
  info(`Version: ${ARACVER}`)
}

require('./resonance-audio-room')
require('./resonance-audio-src')
