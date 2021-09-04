import path from 'path'
import { createRequire } from 'module'
import webpack from 'webpack'
import { fileURLToPath } from 'url'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import { CleanWebpackPlugin } from 'clean-webpack-plugin'
import TerserPlugin from 'terser-webpack-plugin'
import CopyWebpackPlugin from 'copy-webpack-plugin'

const require = createRequire(import.meta.url)
const pkgjson = require('./package.json')

const {
  name,
  title,
  description,
  version,
  readme,
  devDependencies: {
    aframe,
  },
 } = pkgjson

const pkginfo = {
  name: name,
  title: title,
  description: description,
  version: version,
  readme: readme,
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const docsmetaopts = {
  ...pkginfo,
  meta: {
    viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
    'theme-color': '#373e47',
    robots: 'index,follow',
    googlebot: 'index,follow',
    generator: `${name}-example`,
    subject: description,
    rating: 'General',
  }
}

const examples = [
  'entities.html',
  'primitives.html',
  'primitives-with-multiple-sources.html',
  'primitives-using-mediastream.html',
  'using-obj-model-as-room.html',
].map(example => {
  return new HtmlWebpackPlugin({
    inject: false,
    ...docsmetaopts,
    filename: example,
    template: path.resolve(__dirname, `./docs/examples/${example}`),
    chunks: [
      'assets/docscss',
      'assets/docsjs',
      'aframe-resonance-audio-component',
    ],
  })
})

const pkgconfig = {
  mode: 'production',
  target: ['web', 'es2020'],
  devtool: 'source-map',
  entry: {
    'aframe-resonance-audio-component': './src/index.js',
    'aframe-resonance-audio-component.min': './src/index.js',
    'assets/docsjs': './docs/docs.js',
    'assets/docscss': './docs/docs.scss',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.js'],
  },
  plugins: [
    new webpack.ProgressPlugin(),
    new CleanWebpackPlugin({
      cleanOnceBeforeBuildPatterns: [
        'dist/**',
        '!dist/assets/aframe/**',
        '!dist/assets/static/**',
      ],
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'node_modules/aframe/dist/aframe.*'),
          to: path.resolve(__dirname, 'dist/assets/aframe/[name][ext]'),
        },
        {
          context: 'docs/static/',
          from: './**',
          to: 'assets/static/',
        }
      ],
    }),
    new webpack.DefinePlugin({
      pkginfo: (() => {
        const defs = {}
        Object.keys(pkginfo).forEach(key => {
          defs[key] = JSON.stringify(pkginfo[key])
        })
        return defs
      })(),
    }),
    new HtmlWebpackPlugin({
      inject: false,
      ...docsmetaopts,
      filename: 'index.html',
      template: path.resolve(__dirname, './docs/index.html'),
      chunks: [
        'assets/docscss',
        'assets/docsjs',
      ],
    }),
    ...examples,
    new HtmlWebpackPlugin({
      inject: false,
      minify: false,
      filename: path.resolve(__dirname, './README.md'),
      template: path.resolve(__dirname, './docs/readme.tmpl.md'),
      templateParameters: {
        version: version,
        links: {},
        images: {
          'aframe-badge': `https://img.shields.io/badge/a--frame-${aframe}-FC3164.svg?style=flat-square`,
        },
      }
    })
  ],
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({
      include: /\.min\.js$/,
    })],
  },
  module: {
    rules: [
      {
        test: /\.scss$/i,
        use: [
          // Creates `style` nodes from JS strings
          "style-loader",
          // Translates CSS into CommonJS
          "css-loader",
          // Compiles Sass to CSS
          "sass-loader",
        ],
      },
    ],
  },
}

export default pkgconfig
