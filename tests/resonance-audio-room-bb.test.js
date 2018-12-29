/* global suite, test, expect, THREE */
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
          geometry: { primitive: 'box', width: w, height: h, depth: d },
          [crbb]: { visualize: true }
        })
      )
    )
    document.querySelector(`[${crbb}]`).addEventListener('bounded-audioroom-loaded', evt => {
      const component = evt.target.components[cr]
      expect(component.data.width).to.equal(w)
      expect(component.data.height).to.equal(h)
      expect(component.data.depth).to.equal(d)
      expect(component.resonanceAudioScene._room.early._halfDimensions).to.include({ width: w / 2, height: h / 2, depth: d / 2 })
      const visualizationSize = new THREE.Box3().setFromObject(component.el.getObject3D('audio-room')).getSize()
      expect(visualizationSize.x).to.equal(w)
      expect(visualizationSize.y).to.equal(h)
      expect(visualizationSize.z).to.equal(d)
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
          geometry: { primitive: 'sphere', radius: r },
          [crbb]: { visualize: true }
        })
      )
    )
    document.querySelector(`[${crbb}]`).addEventListener('bounded-audioroom-loaded', evt => {
      const component = evt.target.components[cr]
      expect(component.data.width).to.equal(r * 2)
      expect(component.data.height).to.equal(r * 2)
      expect(component.data.depth).to.equal(r * 2)
      expect(component.resonanceAudioScene._room.early._halfDimensions).to.include({ width: r, height: r, depth: r })
      const visualizationSize = new THREE.Box3().setFromObject(component.el.getObject3D('audio-room')).getSize()
      expect(visualizationSize.x).to.equal(r * 2)
      expect(visualizationSize.y).to.equal(r * 2)
      expect(visualizationSize.z).to.equal(r * 2)
      done()
    })
  })
})
