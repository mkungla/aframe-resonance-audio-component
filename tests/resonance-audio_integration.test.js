/* global setup, teardown, suite, test, expect, THREE, HTMLElement, HTMLMediaElement */
require('aframe')
require('../src/index.js')
const { ResonanceAudio } = require('resonance-audio')
const {
  sceneFactory,
  entityFactory,
  elementFactory,
  putOnPage,
  putOnPageAndWaitForLoad,
  compareMatrixtoPosAndRot,
  createMatrixFromResonanceSource
} = require('./helpers')
const cr = 'resonance-audio-room'
const crbb = 'resonance-audio-room-bb'
const cs = 'resonance-audio-src'

suite(`component ${cs} in a ${cr}`, function () {
  let asset
  let containerEl
  let roomEl
  let srcEl1, srcEl2
  let roomComponent
  let component1, component2

  setup(done => {
    /*
      Create this structure:
      <a-scene>
        <a-assets>
          <audio id="track" src="base/tests/assets/track.mp3" />
        </a-assets>
        <a-entity position="-1 -2 -3">                                  <!-- containerEl -->
          <a-entity
            resonance-audio-room="..."
            position="3 3 3">                                           <!-- roomEl -->
            <a-entity
              resonance-audio-src="src:#track;..."
              id="srcEl1"
              position="1 1 1"
              rotation="0 45 0"></a-entity>                             <!-- srcEl1 -->
            <a-entity
              resonance-audio-src="position:-1 -1 -1; rotation:0 -90 0;..."
              id="srcEl2"></a-entity>                                   <!-- srcEl2 -->
          </a-entity>
        </a-entity>
      </a-scene>
    roomEl position:    2  1  0
    srcEl1  position:   3  2  1
    srcEl2  position:   2  1  0
    srcEl2 cposition:   1  0 -1
    */

    putOnPageAndWaitForLoad(
      sceneFactory([
        elementFactory('a-assets', {},
          elementFactory('audio', {
            id: 'track',
            src: 'base/tests/assets/track.mp3'
          })
        ),
        entityFactory({position: '-1 -2 -3'},
          entityFactory({
            position: '3 3 3',
            [cr]: {visualize: true}
          }, [
            entityFactory({
              id: 'srcEl1',
              position: '1 1 1',
              rotation: '0 45 0',
              [cs]: {
                src: '#track',
                visualize: true,
                autoplay: true,
                gain: 1.1,
                minDistance: 0.5,
                maxDistance: 100,
                directivityPattern: {x: 0.5, y: 2},
                sourceWidth: 20,
                rolloff: 'linear'
              }
            }),
            entityFactory({
              id: 'srcEl2',
              [cs]: {
                visualize: true,
                position: '-1 -1 -1',
                rotation: '0 -90 0'
              }
            })
          ])
        )
      ]),
      done
    )

    containerEl = document.querySelectorAll('a-entity')[0]
    roomEl = document.querySelector(`[${cr}]`)
    srcEl1 = document.querySelector('#srcEl1')
    srcEl2 = document.querySelector('#srcEl2')
    asset = document.querySelector('audio')
    asset.muted = true

    roomComponent = roomEl.components[cr]
    component1 = srcEl1.components[cs]
    component2 = srcEl2.components[cs]
  })

  suite(`${cs} initialization`, () => {
    test('playback', () => {
      // Src and room relation.
      expect(srcEl1.getAttribute(cs).src).to.equal(asset)
      expect(srcEl1.getAttribute(cs).room).to.equal('')
      expect(component1.sound).to.equal(asset)
      expect(component1.connected).to.deep.equal({element: true, stream: false})
      expect(component1.room).to.equal(roomComponent)
      expect(component1.resonance).to.be.an.instanceof(ResonanceAudio.Source)
      expect(component1.room.el.sounds).to.be.an('array').and.include(asset)
      expect(component1.defaultAudioEl).to.be.instanceof(HTMLMediaElement)
    })
    test('position, orientation and visualization position and orientation', () => {
      document.querySelector('a-scene').object3D.updateMatrixWorld(true)
      // Audio source in world coordinates.
      compareMatrixtoPosAndRot(srcEl1.object3D.matrixWorld, {x: 3, y: 2, z: 1}, {x: 0, y: 45, z: 0})
      compareMatrixtoPosAndRot(srcEl2.object3D.matrixWorld, {x: 2, y: 1, z: 0}, {x: 0, y: 0, z: 0})
      // Resonance Source in world coordinates.
      compareMatrixtoPosAndRot(component1.getMatrixWorld(), {x: 3, y: 2, z: 1}, {x: 0, y: 45, z: 0})
      compareMatrixtoPosAndRot(component2.getMatrixWorld(), {x: 1, y: 0, z: -1}, {x: 0, y: -90, z: 0})
      // Resonance Source in room coordinates.
      compareMatrixtoPosAndRot(createMatrixFromResonanceSource(component1.resonance), {x: 1, y: 1, z: 1}, {x: 0, y: 45, z: 0})
      compareMatrixtoPosAndRot(createMatrixFromResonanceSource(component2.resonance), {x: -1, y: -1, z: -1}, {x: 0, y: -90, z: 0})
      // Visualization in world coordinates.
      compareMatrixtoPosAndRot(srcEl1.getObject3D('audio-src').matrixWorld, {x: 3, y: 2, z: 1}, {x: 0, y: 45, z: 0})
      compareMatrixtoPosAndRot(srcEl2.getObject3D('audio-src').matrixWorld, {x: 1, y: 0, z: -1}, {x: 0, y: -90, z: 0})
    })
    test('acoustic parameters', () => {
      expect(component1.resonance.input.gain.value).to.be.closeTo(1.1, 0.01)
      expect(component1.resonance._attenuation.minDistance).to.equal(0.5)
      expect(component1.resonance._attenuation.maxDistance).to.equal(100)
      expect(component1.resonance._attenuation._rolloff).to.equal('linear')
      expect(component1.resonance._directivity._alpha).to.equal(0.5)
      expect(component1.resonance._directivity._sharpness).to.equal(2)
      expect(component1.resonance._encoder._spreadIndex).to.equal(Math.min(359, Math.max(0, Math.round(20)))) // sourceWidth
    })
    test('visualization', () => {
      expect(srcEl1.getObject3D('audio-src').material.color.getHex()).to.equal(0xffffff)
    })
  })

  suite(`${cs} property updates`, () => {
    test('container position', () => {
      containerEl.setAttribute('position', '-10 -20 -30') // room: -7 -17 -27
      document.querySelector('a-scene').object3D.updateMatrixWorld(true)
      // Audio source in world coordinates (changed).
      compareMatrixtoPosAndRot(srcEl1.object3D.matrixWorld, {x: -6, y: -16, z: -26}, {x: 0, y: 45, z: 0})
      compareMatrixtoPosAndRot(srcEl2.object3D.matrixWorld, {x: -7, y: -17, z: -27}, {x: 0, y: 0, z: 0})
      // Resonance Source in world coordinates (changed).
      compareMatrixtoPosAndRot(component1.getMatrixWorld(), {x: -6, y: -16, z: -26}, {x: 0, y: 45, z: 0})
      compareMatrixtoPosAndRot(component2.getMatrixWorld(), {x: -8, y: -18, z: -28}, {x: 0, y: -90, z: 0})
      // Resonance Source in room coordinates (unchanged).
      compareMatrixtoPosAndRot(createMatrixFromResonanceSource(component1.resonance), {x: 1, y: 1, z: 1}, {x: 0, y: 45, z: 0})
      compareMatrixtoPosAndRot(createMatrixFromResonanceSource(component2.resonance), {x: -1, y: -1, z: -1}, {x: 0, y: -90, z: 0})
      // Visualization in world coordinates (changed).
      compareMatrixtoPosAndRot(srcEl1.getObject3D('audio-src').matrixWorld, {x: -6, y: -16, z: -26}, {x: 0, y: 45, z: 0})
      compareMatrixtoPosAndRot(srcEl2.getObject3D('audio-src').matrixWorld, {x: -8, y: -18, z: -28}, {x: 0, y: -90, z: 0})
    })
    test('container rotation', () => {
      containerEl.setAttribute('rotation', '0 -180 0')
      document.querySelector('a-scene').object3D.updateMatrixWorld(true)
      // Audio source entity in world coordinates (changed).
      compareMatrixtoPosAndRot(srcEl1.object3D.matrixWorld, {x: -5, y: 2, z: -7}, {x: 0, y: -135, z: 0})
      compareMatrixtoPosAndRot(srcEl2.object3D.matrixWorld, {x: -4, y: 1, z: -6}, {x: 0, y: -180, z: 0})
      // Resonance Source in world coordinates (changed).
      compareMatrixtoPosAndRot(component1.getMatrixWorld(), {x: -5, y: 2, z: -7}, {x: 0, y: -135, z: 0})
      compareMatrixtoPosAndRot(component2.getMatrixWorld(), {x: -3, y: 0, z: -5}, {x: 0, y: -270, z: 0})
      // Resonance Source in room coordinates (unchanged).
      compareMatrixtoPosAndRot(createMatrixFromResonanceSource(component1.resonance), {x: 1, y: 1, z: 1}, {x: 0, y: 45, z: 0})
      compareMatrixtoPosAndRot(createMatrixFromResonanceSource(component2.resonance), {x: -1, y: -1, z: -1}, {x: 0, y: -90, z: 0})
      // Visualization in world coordinates (changed).
      compareMatrixtoPosAndRot(srcEl1.getObject3D('audio-src').matrixWorld, {x: -5, y: 2, z: -7}, {x: 0, y: -135, z: 0})
      compareMatrixtoPosAndRot(srcEl2.getObject3D('audio-src').matrixWorld, {x: -3, y: 0, z: -5}, {x: 0, y: -270, z: 0})
    })
    test('audio src position', () => {
      srcEl1.setAttribute(cs, 'position', '4 4 4')
      document.querySelector('a-scene').object3D.updateMatrixWorld(true)
      // Audio source entity in world coordinates (unchanged).
      compareMatrixtoPosAndRot(srcEl1.object3D.matrixWorld, {x: 3, y: 2, z: 1}, {x: 0, y: 45, z: 0})
      // Resonance Source in world coordinates (changed).
      compareMatrixtoPosAndRot(component1.getMatrixWorld(), {x: 6, y: 5, z: 4}, {x: 0, y: 45, z: 0})
      // Resonance Source in room coordinates (changed).
      compareMatrixtoPosAndRot(createMatrixFromResonanceSource(component1.resonance), {x: 4, y: 4, z: 4}, {x: 0, y: 45, z: 0})
      // Visualization in world coordinates (changed).
      compareMatrixtoPosAndRot(srcEl1.getObject3D('audio-src').matrixWorld, {x: 6, y: 5, z: 4}, {x: 0, y: 45, z: 0})
    })
    test('audio src rotation', () => {
      srcEl1.setAttribute(cs, 'rotation', '0 90 0')
      document.querySelector('a-scene').object3D.updateMatrixWorld(true)
      // Audio source entity in world coordinates (unchanged).
      compareMatrixtoPosAndRot(srcEl1.object3D.matrixWorld, {x: 3, y: 2, z: 1}, {x: 0, y: 45, z: 0})
      // Resonance Source in world coordinates (changed).
      compareMatrixtoPosAndRot(component1.getMatrixWorld(), {x: 3, y: 2, z: 1}, {x: 0, y: 90, z: 0})
      // Resonance Source in room coordinates (changed).
      compareMatrixtoPosAndRot(createMatrixFromResonanceSource(component1.resonance), {x: 1, y: 1, z: 1}, {x: 0, y: 90, z: 0})
      // Visualization in world coordinates (changed).
      compareMatrixtoPosAndRot(srcEl1.getObject3D('audio-src').matrixWorld, {x: 3, y: 2, z: 1}, {x: 0, y: 90, z: 0})
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
        sourceWidth: 31
      })
      expect(component1.resonance.input.gain.value).to.be.closeTo(2.1, 0.01)
      expect(component1.resonance._attenuation.minDistance).to.equal(0.6)
      expect(component1.resonance._attenuation.maxDistance).to.equal(99)
      expect(component1.resonance._attenuation._rolloff).to.equal('logarithmic')
      expect(component1.resonance._directivity._alpha).to.equal(0.6)
      expect(component1.resonance._directivity._sharpness).to.equal(2.1)
      expect(component1.resonance._encoder._spreadIndex).to.equal(Math.min(359, Math.max(0, Math.round(31))))
    })
  })

  suite(`${cr} changes`, () => {
    test('position and orientation update', () => {
      roomEl.setAttribute('position', '-1 -2 2') // in world coordinates: -2 -4 -1
      roomEl.setAttribute('rotation', '0 -180 0')
      document.querySelector('a-scene').object3D.updateMatrixWorld(true)
      // Audio source in world coordinates (changed).
      compareMatrixtoPosAndRot(srcEl1.object3D.matrixWorld, {x: -3, y: -3, z: -2}, {x: 0, y: -135, z: 0})
      compareMatrixtoPosAndRot(srcEl2.object3D.matrixWorld, {x: -2, y: -4, z: -1}, {x: 0, y: -180, z: 0})
      // Resonance Source in world coordinates (changed).
      compareMatrixtoPosAndRot(component1.getMatrixWorld(), {x: -3, y: -3, z: -2}, {x: 0, y: -135, z: 0})
      compareMatrixtoPosAndRot(component2.getMatrixWorld(), {x: -1, y: -5, z: 0}, {x: 0, y: 90, z: 0})
      // Resonance Source in room coordinates (unchanged).
      compareMatrixtoPosAndRot(createMatrixFromResonanceSource(component1.resonance), {x: 1, y: 1, z: 1}, {x: 0, y: 45, z: 0})
      compareMatrixtoPosAndRot(createMatrixFromResonanceSource(component2.resonance), {x: -1, y: -1, z: -1}, {x: 0, y: -90, z: 0})
    })
  })

  suite('audio source updating', () => {
    test('disconnect', () => {
      srcEl1.setAttribute(cs, 'src', null)
      expect(component1.connected).to.deep.equal({element: false, stream: false})
      expect(component1.sound).to.equal(null)
      expect(srcEl1.getAttribute(cs).src).to.equal('')
    })
    test('connect resource', () => {
      srcEl1.setAttribute(cs, 'autoplay', false)
      srcEl1.setAttribute(cs, 'src', 'base/tests/assets/track.mp3')
      expect(component1.connected).to.deep.equal({element: true, stream: false})
      expect(component1.sound).to.equal(component1.defaultAudioEl)
      expect(srcEl1.getAttribute(cs).src).to.equal(component1.defaultAudioEl)
    })
    test('connect stream (stub)', () => {
      /**
       * I have no reliable way to mock this yet. It works in Firefox, but in Chrome it doesn't:
       * its AudioNode.prototype.createMediaStreamSource() implementation doesn't accept a MediaStream
       * without an audio track, and I haven't found a way to mock that.
       * Also, Chrome doesn't fully support captureStream() yet.
       */
      /*
      const stream = new MediaStream()
      srcEl1.setAttribute(cs, 'src', stream)
      expect(component1.connected.element).to.equal(false)
      expect(component1.connected.stream).to.equal(true)
      expect(component1.sound).to.equal(stream)
      expect(srcEl1.getAttribute(cs).src).to.equal(stream)
      */
    })
    test('connect element', () => {
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
    test('connect element id', () => {
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
    test('connect wrong src', () => {
      const fn1 = () => srcEl1.setAttribute(cs, 'src', '#unknown-identifier')
      const fn2 = () => srcEl1.setAttribute(cs, 'src', new HTMLElement())
      expect(fn1).to.throw(TypeError)
      expect(fn2).to.throw(TypeError)
    })
  })

  suite('addition and removal of source to room', () => {
    test('statically add src to room and exposeAPI', () => {
      expect(roomComponent.sources).to.be.an('array').that.includes(component1)
      expect(roomComponent.sources).to.be.an('array').that.includes(component2)
      expect(roomEl.sounds).to.be.an('array').that.includes(component1.sound)
      expect(roomEl.sounds).to.be.an('array').that.includes(component2.sound)
      expect(roomEl.audioSources).to.be.an('array').that.includes(component1)
      expect(roomEl.audioSources).to.be.an('array').that.includes(component2)
    })
    test('dynamically add src to room', done => {
      const srcEl3 = entityFactory({[cs]: {}})
      srcEl3.addEventListener('componentinitialized', evt => {
        if (evt.detail.name !== cs) { return }
        expect(roomComponent.sources).to.be.an('array').that.includes(srcEl3.components[cs])
        expect(roomEl.sounds).to.be.an('array').that.includes(srcEl3.components[cs].sound)
        expect(roomEl.audioSources).to.be.an('array').that.includes(srcEl3.components[cs])
        done()
      })
      roomEl.appendChild(srcEl3)
    })
    test('remove src from room', done => {
      expect(roomComponent.sources).to.be.an('array').that.includes(component1)
      roomEl.addEventListener('child-detached', evt => {
        if (evt.detail.el !== srcEl1) { return }
        // room has no src anymore.
        expect(roomComponent.sources).to.be.an('array').that.does.not.include(component1)
        // src has no room anymore.
        expect(component1.room).to.equal(null)
        // src has no audio source anymore (because this is connected to the room's AudioContext).
        expect(component1.connected).to.deep.equal({element: false, stream: false})
        done()
      })
      roomEl.removeChild(srcEl1)
    })
    test("src's audioroom-entered event", done => {
      const srcEl3 = entityFactory({[cs]: {}})
      srcEl3.addEventListener('audioroom-entered', evt => {
        if (evt.detail.src === srcEl3 && evt.detail.room === roomEl) {
          done()
        }
      })
      roomEl.appendChild(srcEl3)
    })
    test("src's audioroom-left event", done => {
      srcEl1.addEventListener('audioroom-left', evt => {
        if (evt.detail.src === srcEl1 && evt.detail.room === roomEl) {
          done()
        }
      })
      roomEl.removeChild(srcEl1)
    })
    test(`remove component ${cr}`, done => {
      expect(roomEl.getObject3D('audio-room')).to.be.an.instanceOf(THREE.Object3D)
      expect(roomComponent.sources).to.be.an('array').that.includes(component1)
      roomEl.addEventListener('componentremoved', evt => {
        if (evt.detail.name !== cr) { return }
        expect(roomEl.getObject3D('audio-room')).to.equal(undefined)
        expect(roomComponent.sources).to.be.an('array').that.does.not.include(component1)
        expect(component1.room).to.equal(null)
        expect(component2.room).to.equal(null)
        done()
      })
      roomEl.removeAttribute(cr)
    })
  })
})

suite(`component ${cr} and ${cs} non-hierarchically attached`, () => {
  let roomEl1, roomEl2
  let srcEl0, srcEl1, srcEl2, srcEl3
  let component0, component1, component2, component3

  setup(done => {
    /*
    HTML:
      <a-scene>
        <a-entity position="-1 -1 -1">                                            <!-- containerEl -->
          <a-entity resonance-audio-room id="roomEl1">                            <!-- roomEl1 -->
            <a-entity resonance-audio-src></a-entity>                             <!-- srcEl1 -->
            <a-entity resonance-audio-src="room:#roomEl2;..."></a-entity>    <!-- srcEl2 -->
            <a-entity>                                                            <!-- childEl -->
              <a-entity resonance-audio-src></a-entity>                           <!-- srcEl0 -->
            </a-entity>
          </a-entity>
        </a-entity>
        <a-entity resonance-audio-room id="roomEl2" position="3 3 3"></a-entity>  <!-- roomEl2 -->
        <a-entity
          resonance-audio-src="audio-room:#roomEl1; position:2 2 2"></a-entity>   <!-- srcEl3 -->
      </a-scene>
    Expected:
      roomEl1: srcEl1, srcEl3
      roomEl2: srcEl2
      no room: srcEl0
    */
    putOnPage(
      sceneFactory([
        entityFactory(
          {position: '-1 -1 -1'},
          entityFactory({
            id: 'roomEl1',
            [cr]: {}
          }, [
            entityFactory({id: 'srcEl1', [cs]: {visualize: true}}),
            entityFactory({id: 'srcEl2', [cs]: {room: '#roomEl2', visualize: true}}),
            entityFactory({},
              entityFactory({id: 'srcEl0', [cs]: {}})
            )
          ])
        ),
        entityFactory({
          id: 'roomEl2',
          position: '3 3 3',
          [cr]: {}
        }),
        entityFactory({
          id: 'srcEl3',
          [cs]: {room: '#roomEl1'},
          position: '2 2 2'
        })
      ])
    )

    roomEl1 = document.querySelector('#roomEl1')
    roomEl2 = document.querySelector('#roomEl2')
    srcEl1 = document.querySelectorAll(`[${cs}]`)[0]
    srcEl2 = document.querySelectorAll(`[${cs}]`)[1]
    srcEl0 = document.querySelectorAll(`[${cs}]`)[2]
    srcEl3 = document.querySelectorAll(`[${cs}]`)[3]
    component0 = srcEl0.components[cs]
    component1 = srcEl1.components[cs]
    component2 = srcEl2.components[cs]
    component3 = srcEl3.components[cs]
    srcEl3.addEventListener('audioroom-entered', evt => {
      done()
    })
  })

  test('nonhierarchical attachment', () => {
    // src to room.
    expect(component2.room.el).to.equal(roomEl2)
    expect(component3.room.el).to.equal(roomEl1)
    // room to src.
    expect(roomEl2.components[cr].sources).to.be.an('array').and.to.include(component2)
    expect(roomEl1.components[cr].sources).to.be.an('array').and.to.include(component3)
  })
  test('nonhierarchical attachment prioritization', () => {
    // src to room.
    expect(component1.room.el).to.equal(roomEl1)
    expect(component2.room.el).to.not.equal(roomEl1)
    expect(component0.room).to.equal(null)

    // room to src.
    expect(roomEl1.components[cr].sources).to.be.an('array').and.to.include(component1)
    expect(roomEl1.components[cr].sources).to.be.an('array').and.to.not.include(component2)
    expect(roomEl1.components[cr].sources).to.be.an('array').and.to.not.include(component0)
  })
  test('position', () => {
    document.querySelector('a-scene').object3D.updateMatrixWorld(true)
    // Audio source entity in world coordinates.
    compareMatrixtoPosAndRot(srcEl2.object3D.matrixWorld, {x: -1, y: -1, z: -1}, {x: 0, y: 0, z: 0})
    // Resonance Source in world coordinates.
    compareMatrixtoPosAndRot(component2.getMatrixWorld(), {x: -1, y: -1, z: -1}, {x: 0, y: 0, z: 0})
    // Resonance Source in room coordinates.
    compareMatrixtoPosAndRot(createMatrixFromResonanceSource(component2.resonance), {x: -4, y: -4, z: -4}, {x: 0, y: 0, z: 0})
    // Visualization in world coordinates.
    compareMatrixtoPosAndRot(srcEl2.getObject3D('audio-src').matrixWorld, {x: -1, y: -1, z: -1}, {x: 0, y: 0, z: 0})
  })

  test('switch rooms', done => {
    srcEl1.addEventListener('audioroom-entered', evt => {
      document.querySelector('a-scene').object3D.updateMatrixWorld(true)
      expect(evt.detail.room).to.equal(roomEl2)
      expect(roomEl1.audioSources).to.be.an('array').that.does.not.include(component1)
      // Audio source entity in world coordinates (unchanged).
      compareMatrixtoPosAndRot(srcEl1.object3D.matrixWorld, {x: -1, y: -1, z: -1}, {x: 0, y: 0, z: 0})
      // Resonance Source in world coordinates (unchanged).
      compareMatrixtoPosAndRot(component1.getMatrixWorld(), {x: -1, y: -1, z: -1}, {x: 0, y: 0, z: 0})
      // Resonance Source in room coordinates (changed).
      compareMatrixtoPosAndRot(createMatrixFromResonanceSource(component1.resonance), {x: -4, y: -4, z: -4}, {x: 0, y: 0, z: 0})
      // Visualization in world coordinates (unchanged).
      compareMatrixtoPosAndRot(srcEl1.getObject3D('audio-src').matrixWorld, {x: -1, y: -1, z: -1}, {x: 0, y: 0, z: 0})
      done()
    })
    srcEl1.setAttribute(cs, 'room', document.querySelector('#roomEl2'))
  })

  test('leave room', done => {
    srcEl1.addEventListener('audioroom-left', evt => {
      expect(evt.detail.room).to.equal(roomEl1)
      expect(component1.room).to.equal(null)
      expect(component1.resonance).to.equal(null)
      expect(roomEl1.audioSources).to.be.an('array').that.does.not.include(component1)
      compareMatrixtoPosAndRot(srcEl1.getObject3D('audio-src').matrixWorld, {x: -1, y: -1, z: -1}, {x: 0, y: 0, z: 0})
      expect(srcEl1.getObject3D('audio-src').material.color.getHex()).to.equal(0xff0000)
      done()
    })
    srcEl1.setAttribute(cs, 'room', '#nonexistent-room')
  })
})

suite(`component ${crbb}`, () => {
  const [w, h, d] = [4.0400071144104, 2.970021963119507, 3.7050031423568726]
  let roomComponent
  let srcEl

  setup(done => {
    /*
    Structure:
      <a-scene>
        <a-entity
          obj-model="
            obj:url(base/tests/assets/room-model.obj);
            mtl:url(base/tests/assets/room-materials.mtl)"
          resonance-audio-room-bb="visualize:true">         <!-- roomEl -->
          <a-entity resonance-audio-src></a-entity>         <!-- el -->
        </a-entity>
      </a-scene>
    */
    putOnPage(
      sceneFactory([
        elementFactory('a-assets', {}),
        entityFactory({
          'obj-model': {
            obj: 'url(base/tests/assets/room-model.obj)',
            mtl: 'url(base/tests/assets/room-materials.mtl)'
          },
          [crbb]: {visualize: true}
        }, [
          entityFactory({[cs]: {}})
        ])
      ])
    )
    document.querySelector(`[${crbb}]`).addEventListener('bounded-audioroom-loaded', evt => {
      roomComponent = evt.target.components[cr]
      srcEl = document.querySelector(`[${cs}]`)
      done()
    })
  })

  test('model loading, src entering the room, and bounded-audioroom-loaded event', () => {
    const delta = 0.000001
    expect(roomComponent.data.width).to.be.closeTo(w, delta)
    expect(roomComponent.data.height).to.be.closeTo(h, delta)
    expect(roomComponent.data.depth).to.be.closeTo(d, delta)
    expect(roomComponent.resonanceAudioScene._room.early._halfDimensions).to.deep.equal({width: w / 2, height: h / 2, depth: d / 2})
    const visualizationSize = new THREE.Box3().setFromObject(roomComponent.el.getObject3D('audio-room')).getSize()
    expect(visualizationSize.x).to.be.closeTo(w, delta)
    expect(visualizationSize.y).to.be.closeTo(h, delta)
    expect(visualizationSize.z).to.be.closeTo(d, delta)
    expect(srcEl.components[cs].room).to.equal(roomComponent)
  })

  teardown(() => {
    // This is to prevent the error "TypeError: this.el.getObject3D(...) is undefined" on this line:
    // https://github.com/aframevr/aframe/blob/master/src/components/geometry.js#L58
    roomComponent.el.removeAttribute('geometry')
  })
})
