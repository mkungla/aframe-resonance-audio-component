/* global setup, suite, test, expect, AFRAME */
require('aframe')
require('../src/index.js')
const { ResonanceAudio } = require('resonance-audio')
const { sceneFactory, entityFactory, putOnPageAndWaitForLoad, compareMatrixtoPosAndRot } = require('./helpers')
const cs = 'resonance-audio-src'

suite(`component ${cs} default`, () => {
  let el
  let component

  setup(done => {
    /*
    HTML:
      <a-scene>
        <a-entity resonance-audio-src></a-entity> <!-- el -->
      </a-scene>
    */
    putOnPageAndWaitForLoad(
      sceneFactory(
        entityFactory({[cs]: {}})
      ),
      done
    )
    el = document.querySelector(`[${cs}]`)
    component = el.components[cs]
  })
  test('playback', () => {
    // Src and room relation.
    expect(el.getAttribute(cs).src).to.equal('')
    expect(component.sound).to.equal(null)
    expect(component.connected).to.deep.equal({element: false, stream: false})
    expect(el.getAttribute(cs).room).to.equal('')
    expect(component.room).to.equal(null)
    expect(component.resonance).to.equal(null)

    // Default members.
    expect(component.mediaAudioSourceNodes).to.be.an.instanceof(Map)
    expect(component.defaultAudioEl).to.equal(null)

    // Connected element.
    expect(el.getAttribute(cs).loop).to.equal(true)
    expect(el.getAttribute(cs).autoplay).to.equal(true)
  })
  test('custom position and orientation', () => {
    expect(el.getAttribute(cs).position).to.deep.equal({})
    expect(el.getAttribute(cs).rotation).to.deep.equal({})
  })
  test('acoustic parameters', () => {
    expect(component.resonance).to.equal(null)
    expect(el.getAttribute(cs).gain).to.equal(ResonanceAudio.Utils.DEFAULT_SOURCE_GAIN)
    expect(el.getAttribute(cs).maxDistance).to.equal(ResonanceAudio.Utils.DEFAULT_MAX_DISTANCE)
    expect(el.getAttribute(cs).minDistance).to.equal(ResonanceAudio.Utils.DEFAULT_MIN_DISTANCE)
    expect(el.getAttribute(cs).directivityPattern).to.deep.equal({x: ResonanceAudio.Utils.DEFAULT_DIRECTIVITY_ALPHA, y: ResonanceAudio.Utils.DEFAULT_DIRECTIVITY_SHARPNESS})
    expect(el.getAttribute(cs).sourceWidth).to.equal(ResonanceAudio.Utils.DEFAULT_SOURCE_WIDTH)
    expect(el.getAttribute(cs).rolloff).to.equal(ResonanceAudio.Utils.DEFAULT_ATTENUATION_ROLLOFF)
  })
  test('visualization', () => {
    expect(el.getAttribute(cs).visualize).to.equal(false)
    expect(component.visualization).to.equal(null)
  })
})

suite(`component ${cs} without entering an audio room`, () => {
  let el
  let component

  setup(done => {
    /*
    HTML:
      <a-scene>
        <a-entity position="1 1 1">
          <a-entity resonance-audio-src="..."></a-entity> <!-- el -->
        </a-entity>
      </a-scene>
    */
    putOnPageAndWaitForLoad(
      sceneFactory(
        entityFactory({position: '2 1 0'},
          entityFactory({
            position: '1 1 1',
            rotation: '0 45 0',
            [cs]: {visualize: true}
          })
        )
      ),
      done
    )
    el = document.querySelector(`[${cs}]`)
    component = el.components[cs]
  })

  test('no room', () => {
    expect(component.resonance).to.equal(null)
    expect(component.room).to.equal(null)
  })

  test('playback', () => {
    // Default members.
    expect(component.mediaAudioSourceNodes).to.be.an.instanceof(Map)

    // Connected element.
    expect(el.getAttribute(cs).loop).to.equal(true)
    expect(el.getAttribute(cs).autoplay).to.equal(true)
  })

  test('update audio src position', () => {
    el.setAttribute(cs, 'position', '4 4 4')
    document.querySelector('a-scene').object3D.updateMatrixWorld(true)
    // Audio source entity in world coordinates (unchanged).
    compareMatrixtoPosAndRot(el.object3D.matrixWorld, {x: 3, y: 2, z: 1}, {x: 0, y: 45, z: 0})
    // Resonance Source in world coordinates (changed).
    compareMatrixtoPosAndRot(component.getMatrixWorld(), {x: 6, y: 5, z: 4}, {x: 0, y: 45, z: 0})
    // Visualization in world coordinates (changed).
    compareMatrixtoPosAndRot(component.visualization.object3D.matrixWorld, {x: 6, y: 5, z: 4}, {x: 0, y: 45, z: 0})
  })
  test('update audio src rotation', () => {
    el.setAttribute(cs, 'rotation', '0 90 0')
    document.querySelector('a-scene').object3D.updateMatrixWorld(true)
    // Audio source entity in world coordinates (unchanged).
    compareMatrixtoPosAndRot(el.object3D.matrixWorld, {x: 3, y: 2, z: 1}, {x: 0, y: 45, z: 0})
    // Resonance Source in world coordinates (changed).
    compareMatrixtoPosAndRot(component.getMatrixWorld(), {x: 3, y: 2, z: 1}, {x: 0, y: 90, z: 0})
    // Visualization in world coordinates (changed).
    compareMatrixtoPosAndRot(component.visualization.object3D.matrixWorld, {x: 3, y: 2, z: 1}, {x: 0, y: 90, z: 0})
    window.i++
  })

  test('visualization', () => {
    expect(component.visualization).to.be.an.instanceof(AFRAME.AEntity)
    expect(component.visualization.audioSrc).to.equal(el)
  })
  test('remove and re-add visualization', () => {
    const v = component.visualization
    expect(v).to.be.an.instanceOf(AFRAME.AEntity)
    el.setAttribute(cs, 'visualize', false)
    expect(component.visualization).to.not.equal(v)
    expect([...el.sceneEl.children]).to.not.include(v)

    el.setAttribute(cs, 'visualize', true)
    expect(component.visualization).to.not.equal(null)
    expect([...el.sceneEl.children]).to.include(component.visualization)
  })

  test('remove component', done => {
    const v = component.visualization
    expect(v).to.be.an.instanceOf(AFRAME.AEntity)
    el.addEventListener('componentremoved', evt => {
      if (evt.detail.name !== cs) { return }
      expect(component.visualization).to.not.equal(v)
      expect([...el.sceneEl.children]).to.not.include(v)
      done()
    })
    el.removeAttribute(cs)
  })
})
