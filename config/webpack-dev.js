const webpack = require('webpack')
const path = require('path')
const CleanWebpackPlugin = require('clean-webpack-plugin')

var PLUGINS = [
  new CleanWebpackPlugin(['../build']),
  new webpack.HotModuleReplacementPlugin()
]

module.exports = {
  devServer: {
    allowedHosts: [
      '.github.com'
    ],
    contentBase: [path.join(__dirname, '../examples'), path.join(__dirname, '../build')],
    host: '0.0.0.0',
    port: 9000,
    hot: true,
    inline: true,
    noInfo: false
  },
  entry: './src/index.js',
  output: {
    path: path.join(__dirname, '../build'),
    filename: 'aframe-resonance-audio-component.js'
  },
  plugins: PLUGINS,
  devtool: 'inline-source-map'
}
