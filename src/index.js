/* global AFRAME */

if (typeof AFRAME === 'undefined') {
  throw new Error('Component attempted to register before AFRAME was available. Did you include A-Frame?')
}

const ARACVER = require('../package.json').version

const log = AFRAME.utils.debug
// const error = log('A-Frame Resonance Audio Component:error')
const info = log('A-Frame Resonance Audio Component:info')
const warn = log('A-Frame Resonance Audio Component:warn')

if (module.hot) {
  module.hot.accept()
}

if (process.env.NODE_ENV === 'production') {
  info(`Version: ${ARACVER}`)
} else {
  warn(`Version: ${ARACVER}-dev`)
}

require('./resonance-audio-room')
require('./resonance-audio-src')
