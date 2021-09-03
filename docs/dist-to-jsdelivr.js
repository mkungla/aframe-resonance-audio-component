#!/bin/env/node
/* global console */
const replace = require('replace-in-file')
const pkgjson = require('../package.json')

const {
  name,
  version,
} = pkgjson

try {
  const results = replace.sync({
    files: './dist/*.html',
    from: /src="aframe-resonance-audio-component.js"/g,
    to: `src="https://cdn.jsdelivr.net/npm/${name}@${version}/dist/${name}.min.js"`,
  })
  console.log('Replacement results:', results)
}
catch (error) {
  console.error('Error occurred:', error)
}

