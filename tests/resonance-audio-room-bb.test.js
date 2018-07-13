/* global setup, suite, test, expect */
require('aframe')
require('../src/index.js')
const { entityFactory } = require('./helpers')
const cr = 'resonance-audio-room'
const crbb = 'resonance-audio-room-bb'

suite(`component ${cr}`, () => {
  let el

  setup(() => {
    el = entityFactory()
  })

  test('box dimensions', done => {
    /*
    Structure:
      <a-scene>
        <!-- el -->
        <a-entity geometry="primitive:box; width:1; height:2; depth:3" resonance-audio-room-bb="visualize:true"></a-entity>
      </a-scene>
    */
    const [w, h, d] = [1, 2, 3]
    el.setAttribute('geometry', {primitive: 'box', width: w, height: h, depth: d})
    el.addEventListener('componentinitialized', function (evt) {
      if (evt.detail.name !== crbb) { return }
      expect(el.components[cr].data.width).to.equal(w)
      expect(el.components[cr].data.height).to.equal(h)
      expect(el.components[cr].data.depth).to.equal(d)
      expect(el.components[cr].resonanceAudioScene._room.early._halfDimensions).to.include({width: w / 2, height: h / 2, depth: d / 2})
      expect(el.components[cr].visualization.getAttribute('width')).to.equal(w.toString())
      expect(el.components[cr].visualization.getAttribute('height')).to.equal(h.toString())
      expect(el.components[cr].visualization.getAttribute('depth')).to.equal(d.toString())
      done()
    })
    el.setAttribute(crbb, {visualize: true})
  })

  test('sphere dimensions', done => {
    /*
    Structure:
      <a-scene>
        <!-- el -->
        <a-entity geometry="primitive:sphere; radius:3" resonance-audio-room-bb="visualize:true"></a-entity>
      </a-scene>
    */
    const r = 3
    el.setAttribute('geometry', {primitive: 'sphere', radius: r})
    el.addEventListener('componentinitialized', function (evt) {
      if (evt.detail.name !== crbb) { return }
      expect(el.components[cr].data.width).to.equal(r * 2)
      expect(el.components[cr].data.height).to.equal(r * 2)
      expect(el.components[cr].data.depth).to.equal(r * 2)
      expect(el.components[cr].resonanceAudioScene._room.early._halfDimensions).to.include({width: r, height: r, depth: r})
      expect(el.components[cr].visualization.getAttribute('width')).to.equal((r * 2).toString())
      expect(el.components[cr].visualization.getAttribute('height')).to.equal((r * 2).toString())
      expect(el.components[cr].visualization.getAttribute('depth')).to.equal((r * 2).toString())
      done()
    })
    el.setAttribute(crbb, {visualize: true})
  })
})
// TODO: test with models and with weirdly shaped geometries.
