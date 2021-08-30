const path = require('path')
const CleanWebpackPlugin = require('clean-webpack-plugin')

var PLUGINS = [
  new CleanWebpackPlugin(['../build'])
]

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.join(__dirname, '../build'),
    filename: 'aframe-resonance-audio-component.js'
  },
  plugins: PLUGINS
}
