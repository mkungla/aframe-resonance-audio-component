/* global suite, test, expect */
require('aframe')
require('../src/index.js')
const { sceneFactory, entityFactory, putOnPageAndWaitForLoad } = require('./helpers')
const cr = 'resonance-audio-room'
const crbb = 'resonance-audio-room-bb'

suite(`component ${crbb}`, () => {
  test('extraction of box dimensions to audio room dimensions', done => {
    /*
    Structure:
      <a-scene>
        <a-entity
          geometry="primitive:box; width:1; height:2; depth:3"
          resonance-audio-room-bb="visualize:true"></a-entity>  <!-- el -->
      </a-scene>
    */
    const [w, h, d] = [1, 2, 3]
    putOnPageAndWaitForLoad(
      sceneFactory(
        entityFactory({
          geometry: {primitive: 'box', width: w, height: h, depth: d},
          [crbb]: {visualize: true}
        })
      ),
      () => {
        const el = document.querySelector(`[${crbb}]`)
        expect(el.components[cr].data.width).to.equal(w)
        expect(el.components[cr].data.height).to.equal(h)
        expect(el.components[cr].data.depth).to.equal(d)
        expect(el.components[cr].resonanceAudioScene._room.early._halfDimensions).to.include({width: w / 2, height: h / 2, depth: d / 2})
        expect(el.components[cr].visualization.getAttribute('width')).to.equal(w.toString())
        expect(el.components[cr].visualization.getAttribute('height')).to.equal(h.toString())
        expect(el.components[cr].visualization.getAttribute('depth')).to.equal(d.toString())
        done()
      }
    )
  })

  test('extraction of sphere dimensions to audio room dimensions', done => {
    /*
    Structure:
      <a-scene>
        <a-entity
          geometry="primitive:sphere; radius:3"
          resonance-audio-room-bb="visualize:true"></a-entity>  <!-- el -->
      </a-scene>
    */
    const r = 3
    putOnPageAndWaitForLoad(
      sceneFactory(
        entityFactory({
          geometry: {primitive: 'sphere', radius: r},
          [crbb]: {visualize: true}
        })
      ),
      () => {
        const el = document.querySelector(`[${crbb}]`)
        expect(el.components[cr].data.width).to.equal(r * 2)
        expect(el.components[cr].data.height).to.equal(r * 2)
        expect(el.components[cr].data.depth).to.equal(r * 2)
        expect(el.components[cr].resonanceAudioScene._room.early._halfDimensions).to.include({width: r, height: r, depth: r})
        expect(el.components[cr].visualization.getAttribute('width')).to.equal((r * 2).toString())
        expect(el.components[cr].visualization.getAttribute('height')).to.equal((r * 2).toString())
        expect(el.components[cr].visualization.getAttribute('depth')).to.equal((r * 2).toString())
        done()
      }
    )
  })
})
