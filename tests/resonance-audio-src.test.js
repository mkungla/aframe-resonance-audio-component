/* global setup, suite, test, expect, HTMLElement, HTMLMediaElement, AFRAME */
require('aframe')
require('../src/index.js')
const { ResonanceAudio } = require('resonance-audio')
const { entityFactory, elementFactory, compareMatrixtoPosAndRot, createMatrixFromResonanceSource } = require('./helpers')
const cr = 'resonance-audio-room'
const cs = 'resonance-audio-src'

suite(`component ${cs} default`, () => {
  let el

  setup(done => {
    let roomEl = entityFactory()
    roomEl.setAttribute(cr, {})
    el = elementFactory('a-entity')
    el.addEventListener('componentinitialized', (evt) => {
      if (evt.detail.name === cs) { done() }
    })
    el.setAttribute(cs, {})
    roomEl.appendChild(el)
  })
  test('playback', () => {
    expect(el.getAttribute(cs).src).to.equal('')
    expect(el.getAttribute(cs).loop).to.equal(true)
    expect(el.getAttribute(cs).autoplay).to.equal(true)
  })
  test('custom position and orientation', () => {
    expect(el.getAttribute(cs).position).to.deep.equal({})
    expect(el.getAttribute(cs).rotation).to.deep.equal({})
  })
  test('acoustic parameters', () => {
    expect(el.getAttribute(cs).gain).to.equal(ResonanceAudio.Utils.DEFAULT_SOURCE_GAIN)
    expect(el.getAttribute(cs).maxDistance).to.equal(ResonanceAudio.Utils.DEFAULT_MAX_DISTANCE)
    expect(el.getAttribute(cs).minDistance).to.equal(ResonanceAudio.Utils.DEFAULT_MIN_DISTANCE)
    expect(el.getAttribute(cs).directivityPattern).to.deep.equal({x: ResonanceAudio.Utils.DEFAULT_DIRECTIVITY_ALPHA, y: ResonanceAudio.Utils.DEFAULT_DIRECTIVITY_SHARPNESS})
    expect(el.getAttribute(cs).sourceWidth).to.equal(ResonanceAudio.Utils.DEFAULT_SOURCE_WIDTH)
    expect(el.getAttribute(cs).rolloff).to.equal(ResonanceAudio.Utils.DEFAULT_ATTENUATION_ROLLOFF)
  })
  test('visualization', () => {
    expect(el.getAttribute(cs).visualize).to.equal(false)
  })
})

suite(`component ${cs}`, function () {
  let asset
  let containerEl
  let el
  let srcEl1
  let srcEl2
  let component1
  let component2

  setup(done => {
    /*
      Create this structure:
      <a-scene>
        <a-assets>
          <audio id="track" src="assets/track.mp3" autoplay="false" loop="false" />
        </a-assets>
        <!-- containerEl -->
        <a-entity position="-1 -2 -3">
          <!-- el -->
          <a-entity resonance-audio-room="..." position="3 3 3">
            <!-- srcEl1 -->
            <a-entity resonance-audio-src="src:#track" id="srcEl1" position="1 1 1" rotation="0 45 0"></a-entity>
            <!-- srcEl2 -->
            <a-entity resonance-audio-src="position:-1 -1 -1; rotation:0 -90 0" id="srcEl2"></a-entity>
          </a-entity>
        </a-entity>
      </a-scene>
    */

    asset = elementFactory('audio', {id: 'track', src: 'base/tests/assets/track.mp3', loop: false})
    // asset.setAttribute('autoplay', false)
    asset.muted = true // Don't let tests play sound.

    containerEl = entityFactory({assets: [asset], attributes: {position: '-1 -2 -3'}})
    el = elementFactory('a-entity', {position: '3 3 3'})
    containerEl.appendChild(el)
    srcEl1 = elementFactory('a-entity', {
      id: 'srcEl1',
      position: '1 1 1',
      rotation: '0 45 0',
      [cs]: {
        src: '#track',
        visualize: true,
        gain: 1.1,
        minDistance: 0.5,
        maxDistance: 100,
        directivityPattern: {x: 0.5, y: 2},
        sourceWidth: 0.01,
        rolloff: 'linear'
      }
    })
    el.appendChild(srcEl1)
    srcEl2 = elementFactory('a-entity', {
      id: 'srcEl2',
      [cs]: {src: '', visualize: true, position: '-1 -1 -1', rotation: '0 -90 0'}
    })
    el.appendChild(srcEl2)

    el.addEventListener('componentinitialized', function (evt) {
      if (evt.detail.name !== cr) { return }
      component1 = srcEl1.components[cs]
      component2 = srcEl2.components[cs]
      done()
    })
    el.setAttribute(cr, {})
  })

  suite('initialization', () => {
    test('position, orientation and visualization', () => {
      // Audio source in world coordinates.
      compareMatrixtoPosAndRot(srcEl1.object3D.matrixWorld, {x: 3, y: 2, z: 1}, {x: 0, y: 45, z: 0})
      compareMatrixtoPosAndRot(srcEl2.object3D.matrixWorld, {x: 2, y: 1, z: 0}, {x: 0, y: 0, z: 0})
      // Resonance Source in world coordinates.
      compareMatrixtoPosAndRot(component1.getMatrixWorld(), {x: 3, y: 2, z: 1}, {x: 0, y: 45, z: 0})
      compareMatrixtoPosAndRot(component2.getMatrixWorld(), {x: 1, y: 0, z: -1}, {x: 0, y: -90, z: 0})
      // The Resonance Source in room coordinates.
      compareMatrixtoPosAndRot(createMatrixFromResonanceSource(component1.resonance), {x: 1, y: 1, z: 1}, {x: 0, y: 45, z: 0})
      compareMatrixtoPosAndRot(createMatrixFromResonanceSource(component2.resonance), {x: -1, y: -1, z: -1}, {x: 0, y: -90, z: 0})
      // Visualization in world coordinates.
      compareMatrixtoPosAndRot(component1.visualization.object3D.matrixWorld, {x: 3, y: 2, z: 1}, {x: 0, y: 45, z: 0})
      compareMatrixtoPosAndRot(component2.visualization.object3D.matrixWorld, {x: 1, y: 0, z: -1}, {x: 0, y: -90, z: 0})
    })
    test('playback', () => {
      expect(srcEl1.getAttribute(cs).src).to.equal(asset)
      expect(srcEl1.getAttribute(cs).autoplay).to.equal(true)
      expect(srcEl1.getAttribute(cs).loop).to.equal(true)
    })
    test('acoustic parameters', () => {
      expect(component1.resonance.input.gain.value).to.to.be.closeTo(1.1, 0.01)
      expect(component1.resonance._attenuation.minDistance).to.equal(0.5)
      expect(component1.resonance._attenuation.maxDistance).to.equal(100)
      expect(component1.resonance._attenuation._rolloff).to.equal('linear')
      expect(component1.resonance._directivity._alpha).to.equal(0.5)
      expect(component1.resonance._directivity._sharpness).to.equal(2)
      expect(component1.resonance._encoder._spreadIndex).to.equal(Math.min(359, Math.max(0, Math.round(0.01))))
    })
    test('members', () => {
      expect(component1.room).to.equal(el.components[cr])
      expect(component2.room).to.equal(el.components[cr])
      expect(component1.connected).to.deep.equal({element: true, stream: false})
      expect(component1.resonance).to.be.an.instanceof(ResonanceAudio.Source)
      expect(component1.visualization).to.be.an.instanceof(HTMLElement)
      expect(component1.visualization).to.be.an.instanceof(AFRAME.ANode)
      expect(component1.mediaAudioSourceNodes).to.be.an.instanceof(Map)
      expect(component1.defaultAudioEl).to.be.instanceof(HTMLMediaElement)
      expect(component1.room.el.sounds).to.be.an('array').and.include(asset)
    })
  })

  suite('update properties', () => {
    test('container position', () => {
      containerEl.setAttribute('position', '-10 -20 -30') // room: -7 -17 -27
      srcEl1.sceneEl.object3D.updateMatrixWorld()
      // Audio source in world coordinates (changed).
      compareMatrixtoPosAndRot(srcEl1.object3D.matrixWorld, {x: -6, y: -16, z: -26}, {x: 0, y: 45, z: 0})
      compareMatrixtoPosAndRot(srcEl2.object3D.matrixWorld, {x: -7, y: -17, z: -27}, {x: 0, y: 0, z: 0})
      // Resonance Source in world coordinates (changed).
      compareMatrixtoPosAndRot(component1.getMatrixWorld(), {x: -6, y: -16, z: -26}, {x: 0, y: 45, z: 0})
      compareMatrixtoPosAndRot(component2.getMatrixWorld(), {x: -8, y: -18, z: -28}, {x: 0, y: -90, z: 0})
      // The Resonance Source in room coordinates (unchanged).
      compareMatrixtoPosAndRot(createMatrixFromResonanceSource(component1.resonance), {x: 1, y: 1, z: 1}, {x: 0, y: 45, z: 0})
      compareMatrixtoPosAndRot(createMatrixFromResonanceSource(component2.resonance), {x: -1, y: -1, z: -1}, {x: 0, y: -90, z: 0})

      // TODO: the visualization (changed) objects in world coordinates. Should be the same as the audio sources.
    })
    test('container rotation', () => {
      containerEl.setAttribute('rotation', '0 -180 0')
      srcEl1.sceneEl.object3D.updateMatrixWorld()
      // Audio source entity in world coordinates (changed).
      compareMatrixtoPosAndRot(srcEl1.object3D.matrixWorld, {x: -5, y: 2, z: -7}, {x: 0, y: -135, z: 0})
      compareMatrixtoPosAndRot(srcEl2.object3D.matrixWorld, {x: -4, y: 1, z: -6}, {x: 0, y: -180, z: 0})
      // Resonance Source in world coordinates (changed).
      compareMatrixtoPosAndRot(component1.getMatrixWorld(), {x: -5, y: 2, z: -7}, {x: 0, y: -135, z: 0})
      compareMatrixtoPosAndRot(component2.getMatrixWorld(), {x: -3, y: 0, z: -5}, {x: 0, y: -270, z: 0})
      // The Resonance Source in room coordinates (unchanged).
      compareMatrixtoPosAndRot(createMatrixFromResonanceSource(component1.resonance), {x: 1, y: 1, z: 1}, {x: 0, y: 45, z: 0})
      compareMatrixtoPosAndRot(createMatrixFromResonanceSource(component2.resonance), {x: -1, y: -1, z: -1}, {x: 0, y: -90, z: 0})

      // TODO: the visualization (changed) objects in world coordinates. Should be the same as the audio sources.
    })
    test('audio src position', () => {
      srcEl1.setAttribute(cs, 'position', '4 4 4')
      // Audio source entity in world coordinates (unchanged).
      compareMatrixtoPosAndRot(srcEl1.object3D.matrixWorld, {x: 3, y: 2, z: 1}, {x: 0, y: 45, z: 0})
      // Resonance Source in world coordinates (changed).
      compareMatrixtoPosAndRot(component1.getMatrixWorld(), {x: 6, y: 5, z: 4}, {x: 0, y: 45, z: 0})
      // The Resonance Source in room coordinates (changed).
      compareMatrixtoPosAndRot(createMatrixFromResonanceSource(component1.resonance), {x: 4, y: 4, z: 4}, {x: 0, y: 45, z: 0})
      // Visualization in world coordinates (changed).
      compareMatrixtoPosAndRot(component1.visualization.object3D.matrixWorld, {x: 6, y: 5, z: 4}, {x: 0, y: 45, z: 0})
    })
    test('audio src rotation', () => {
      srcEl1.setAttribute(cs, 'rotation', '0 90 0')
      // Audio source entity in world coordinates (unchanged).
      compareMatrixtoPosAndRot(srcEl1.object3D.matrixWorld, {x: 3, y: 2, z: 1}, {x: 0, y: 45, z: 0})
      // Resonance Source in world coordinates (changed).
      compareMatrixtoPosAndRot(component1.getMatrixWorld(), {x: 3, y: 2, z: 1}, {x: 0, y: 90, z: 0})
      // The Resonance Source in room coordinates (changed).
      compareMatrixtoPosAndRot(createMatrixFromResonanceSource(component1.resonance), {x: 1, y: 1, z: 1}, {x: 0, y: 90, z: 0})
      // Visualization in world coordinates (changed).
      compareMatrixtoPosAndRot(component1.visualization.object3D.matrixWorld, {x: 3, y: 2, z: 1}, {x: 0, y: 90, z: 0})
    })
    test('playback', () => {
      srcEl1.setAttribute(cs, {src: '', autoplay: false, loop: false})
      expect(srcEl1.getAttribute(cs).src).to.equal('')
      expect(srcEl1.getAttribute(cs).autoplay).to.equal(false)
      expect(srcEl1.getAttribute(cs).loop).to.equal(false)
    })
    test('acoustic parameters', () => {
      srcEl1.setAttribute(cs, {
        gain: 2.1,
        minDistance: 0.6,
        maxDistance: 99,
        rolloff: 'logarithmic',
        directivityPattern: '0.6 2.1',
        sourceWidth: 0.02
      })
      expect(component1.resonance.input.gain.value).to.be.closeTo(2.1, 0.01)
      expect(component1.resonance._attenuation.minDistance).to.equal(0.6)
      expect(component1.resonance._attenuation.maxDistance).to.equal(99)
      expect(component1.resonance._attenuation._rolloff).to.equal('logarithmic')
      expect(component1.resonance._directivity._alpha).to.equal(0.6)
      expect(component1.resonance._directivity._sharpness).to.equal(2.1)
      expect(component1.resonance._encoder._spreadIndex).to.equal(Math.min(359, Math.max(0, Math.round(0.02))))
    })
    test('remove and re-add visualization', () => {
      const v = component1.visualization
      srcEl1.setAttribute(cs, 'visualize', false)
      expect([...srcEl1.sceneEl.children]).to.not.include(v)

      srcEl1.setAttribute(cs, 'visualize', true)
      expect([...srcEl1.sceneEl.children]).to.include(component1.visualization)
    })
  })

  suite('audio source updating', () => {
    test('disconnect', () => {
      srcEl1.setAttribute(cs, 'src', null)
      expect(component1.connected.element).to.equal(false)
      expect(component1.connected.stream).to.equal(false)
      expect(component1.sound).to.equal(null)
      expect(srcEl1.getAttribute(cs).src).to.equal('')
    })
    test('connect resource', () => {
      srcEl1.setAttribute(cs, 'src', 'base/tests/assets/track.mp3')
      expect(component1.connected.element).to.equal(true)
      expect(component1.connected.stream).to.equal(false)
      expect(component1.sound).to.equal(component1.defaultAudioEl)
      expect(srcEl1.getAttribute(cs).src).to.equal(component1.defaultAudioEl)
    })
    test('connect stream', () => {
      /* // I have no reliable way to mock this yet, as Chrome doesn't fully support captureStream().
      const stream = new MediaStream()
      srcEl1.setAttribute(cs, 'src', stream)
      expect(component1.connected.element).to.equal(false)
      expect(component1.connected.stream).to.equal(true)
      expect(component1.sound).to.equal(stream)
      expect(srcEl1.getAttribute(cs).src).to.equal(stream)
      */
    })
    test('element', () => {
      srcEl1.setAttribute(cs, 'src', null)
      expect(component1.connected.element).to.equal(false)
      expect(component1.sound).to.equal(null)
      expect(srcEl1.getAttribute(cs).src).to.equal('')

      srcEl1.setAttribute(cs, 'src', asset)
      expect(component1.connected.element).to.equal(true)
      expect(component1.connected.stream).to.equal(false)
      expect(component1.sound).to.equal(asset)
      expect(srcEl1.getAttribute(cs).src).to.equal(asset)
    })
    test('element id', () => {
      srcEl1.setAttribute(cs, 'src', null)
      expect(component1.connected.element).to.equal(false)
      expect(component1.sound).to.equal(null)
      expect(srcEl1.getAttribute(cs).src).to.equal('')

      srcEl1.setAttribute(cs, 'src', '#track')
      expect(component1.connected.element).to.equal(true)
      expect(component1.connected.stream).to.equal(false)
      expect(component1.sound).to.equal(asset)
      expect(srcEl1.getAttribute(cs).src).to.equal(asset)
    })
    test('wrong src', () => {
      const fn1 = () => srcEl1.setAttribute(cs, 'src', '#unknown-identifier')
      const fn2 = () => srcEl1.setAttribute(cs, 'src', new HTMLElement())
      expect(fn1).to.throw(TypeError)
      expect(fn2).to.throw(TypeError)
    })
  })
})
