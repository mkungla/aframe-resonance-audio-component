const webpack = require('webpack')
const path = require('path')
const CleanWebpackPlugin = require('clean-webpack-plugin')

var PLUGINS = [
  new CleanWebpackPlugin(['../build']),
  new webpack.NamedModulesPlugin(),
  new webpack.HotModuleReplacementPlugin()
]
if (process.env.NODE_ENV === 'production') {
  PLUGINS.push(new webpack.optimize.UglifyJsPlugin())
}

module.exports = {
  devServer: {
    allowedHosts: [
      '.github.com'
    ],
    contentBase: [path.join(__dirname, '../examples'), path.join(__dirname, '../build')],
    host: '0.0.0.0',
    hot: true,
    inline: true,
    noInfo: true,
    port: 9000
  },
  entry: './src/index.js',
  output: {
    path: path.join(__dirname, '../build'),
    filename: '../build/aframe-resonance-audio-component.js'
  },
  plugins: PLUGINS,
  devtool: 'inline-source-map'
}
