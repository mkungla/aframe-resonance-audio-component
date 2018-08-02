/* global suite, test, expect */
require('aframe')
require('../src/index.js')
const { sceneFactory, entityFactory, putOnPage } = require('./helpers')
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
    putOnPage(
      sceneFactory(
        entityFactory({
          geometry: {primitive: 'box', width: w, height: h, depth: d},
          [crbb]: {visualize: true}
        })
      )
    )
    document.querySelector(`[${crbb}]`).addEventListener('bounded-audioroom-loaded', evt => {
      const component = evt.target.components[cr]
      expect(component.data.width).to.equal(w)
      expect(component.data.height).to.equal(h)
      expect(component.data.depth).to.equal(d)
      expect(component.resonanceAudioScene._room.early._halfDimensions).to.include({width: w / 2, height: h / 2, depth: d / 2})
      expect(component.visualization.getAttribute('width')).to.equal(w.toString())
      expect(component.visualization.getAttribute('height')).to.equal(h.toString())
      expect(component.visualization.getAttribute('depth')).to.equal(d.toString())
      done()
    })
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
    putOnPage(
      sceneFactory(
        entityFactory({
          geometry: {primitive: 'sphere', radius: r},
          [crbb]: {visualize: true}
        })
      )
    )
    document.querySelector(`[${crbb}]`).addEventListener('bounded-audioroom-loaded', evt => {
      const component = evt.target.components[cr]
      expect(component.data.width).to.equal(r * 2)
      expect(component.data.height).to.equal(r * 2)
      expect(component.data.depth).to.equal(r * 2)
      expect(component.resonanceAudioScene._room.early._halfDimensions).to.include({width: r, height: r, depth: r})
      expect(component.visualization.getAttribute('width')).to.equal((r * 2).toString())
      expect(component.visualization.getAttribute('height')).to.equal((r * 2).toString())
      expect(component.visualization.getAttribute('depth')).to.equal((r * 2).toString())
      done()
    })
  })
})
