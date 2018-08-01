/* global setup, suite, test, expect, THREE, AFRAME */
require('aframe')
require('../src/index.js')
const { ResonanceAudio } = require('resonance-audio')
const { sceneFactory, entityFactory, compareMatrixtoPosAndRot, putOnPageAndWaitForLoad } = require('./helpers')
const cr = 'resonance-audio-room'

suite(`component ${cr} default`, () => {
  let roomEl

  setup(done => {
    /*
    HTML:
      <a-scene>
        <a-entity resonance-audio-room></a-entity>
      </a-scene
    */
    putOnPageAndWaitForLoad(
      sceneFactory(
        entityFactory({[cr]: {}})
      ),
      done
    )
    roomEl = document.querySelectorAll('a-entity')[0]
  })
  test('dimensions', () => {
    expect(roomEl.getAttribute(cr).width).to.equal(ResonanceAudio.Utils.DEFAULT_ROOM_DIMENSIONS.width)
    expect(roomEl.getAttribute(cr).height).to.equal(ResonanceAudio.Utils.DEFAULT_ROOM_DIMENSIONS.height)
    expect(roomEl.getAttribute(cr).depth).to.equal(ResonanceAudio.Utils.DEFAULT_ROOM_DIMENSIONS.depth)
  })
  test('materials', () => {
    const sides = [ 'left', 'right', 'front', 'back', 'down', 'up' ]
    for (const side of sides) {
      expect(roomEl.getAttribute(cr)[side]).to.equal('brick-bare')
    }
  })
  test('acoustic parameters', () => {
    expect(roomEl.getAttribute(cr).ambisonicOrder).to.equal(ResonanceAudio.Utils.DEFAULT_AMBISONIC_ORDER)
    expect(roomEl.getAttribute(cr).speedOfSound).to.equal(ResonanceAudio.Utils.DEFAULT_SPEED_OF_SOUND)
  })
  test('visualization', () => {
    expect(roomEl.getAttribute(cr).visualize).to.equal(false)
  })
})

suite(`component ${cr}`, () => {
  let containerEl
  let roomEl
  let component

  setup(done => {
    /*
    HTML:
      <a-scene>
        <a-entity position="-1 -2 -3">     <!-- containerEl -->
          <a-entity                        <!-- roomEl -->
            resonance-audio-room="..."
            position="3 3 3"
            rotation="0 -45 0"></a-entity>
        </a-entity>
      </a-scene>
    */
    putOnPageAndWaitForLoad(
      sceneFactory(
        entityFactory(
          {position: '-1 -2 -3'},
          entityFactory({
            position: '3 3 3',
            rotation: '0 -45 0',
            [cr]: {
              width: 1,
              height: 2,
              depth: 3,
              ambisonicOrder: 1,
              speedOfSound: 500,
              left: 'brick-bare',
              right: 'curtain-heavy',
              front: 'plywood-panel',
              back: 'glass-thin',
              down: 'parquet-on-concrete',
              up: 'acoustic-ceiling-tiles',
              visualize: true
            }
          })
        )
      ),
      done
    )
    containerEl = document.querySelectorAll('a-entity')[0]
    roomEl = document.querySelectorAll('a-entity')[1]
    component = roomEl.components[cr]
  })

  suite('initialization', () => {
    test('position and rotation', () => {
      roomEl.sceneEl.object3D.updateMatrixWorld(true)

      // Audio room in world coordinates.
      compareMatrixtoPosAndRot(roomEl.object3D.matrixWorld, {x: 2, y: 1, z: 0}, {x: 0, y: -45, z: 0})
      // Visualization in world coordinates.
      compareMatrixtoPosAndRot(component.visualization.object3D.matrixWorld, {x: 2, y: 1, z: 0}, {x: 0, y: -45, z: 0})
    })
    test('dimensions', () => {
      expect(component.resonanceAudioScene._room.early._halfDimensions).to.include({width: 0.5, height: 1, depth: 1.5})
      expect(component.visualization.getAttribute('width')).to.equal('1')
      expect(component.visualization.getAttribute('height')).to.equal('2')
      expect(component.visualization.getAttribute('depth')).to.equal('3')
    })
    test('materials', () => {
      const materials = { left: 'brick-bare', right: 'curtain-heavy', front: 'plywood-panel', back: 'glass-thin', down: 'parquet-on-concrete', up: 'acoustic-ceiling-tiles' }
      for (const side in materials) {
        expect(roomEl.getAttribute(cr)[side]).to.equal(materials[side])
      }
    })
    test('acoustic parameters', () => {
      expect(component.resonanceAudioScene._ambisonicOrder).to.equal(1)
      expect(component.resonanceAudioScene._room.speedOfSound).to.equal(500)
    })
    test('visualization', () => {
      expect(component.visualization).to.be.an.instanceOf(AFRAME.AEntity)
      expect(component.visualization.audioRoom).to.equal(roomEl)
    })
  })

  suite('update properties', () => {
    test('container position', () => {
      containerEl.setAttribute('position', '-10 -20 -30')
      roomEl.sceneEl.object3D.updateMatrixWorld(true)
      // Audio room in world coordinates (changed).
      compareMatrixtoPosAndRot(roomEl.object3D.matrixWorld, {x: -7, y: -17, z: -27}, {x: 0, y: -45, z: 0})
      // TODO: the visualization objects in world coordinates. Should be the same as the audio room.
    })
    test('container rotation', () => {
      containerEl.setAttribute('rotation', '0 -90 0')
      roomEl.sceneEl.object3D.updateMatrixWorld(true)
      // Audio room in world coordinates.
      compareMatrixtoPosAndRot(roomEl.object3D.matrixWorld, {x: -4, y: 1, z: 0}, {x: 0, y: -45 - 90, z: 0})
      // TODO: the visualization objects in world coordinates. Should be the same as the audio room.
    })
    test('room position', () => {
      roomEl.setAttribute('position', '-10 -20 -30')
      roomEl.sceneEl.object3D.updateMatrixWorld(true)
      // Audio room in world coordinates.
      compareMatrixtoPosAndRot(roomEl.object3D.matrixWorld, {x: -11, y: -22, z: -33}, {x: 0, y: -45, z: 0})
      // Visualization in world coordinates.
      compareMatrixtoPosAndRot(component.visualization.object3D.matrixWorld, {x: -11, y: -22, z: -33}, {x: 0, y: -45, z: 0})
    })
    test('room rotation', () => {
      roomEl.setAttribute('rotation', '0 -90 0')
      roomEl.sceneEl.object3D.updateMatrixWorld(true)
      // Audio room in world coordinates.
      compareMatrixtoPosAndRot(roomEl.object3D.matrixWorld, {x: 2, y: 1, z: 0}, {x: 0, y: -90, z: 0})
      // Visualization in world coordinates.
      compareMatrixtoPosAndRot(component.visualization.object3D.matrixWorld, {x: 2, y: 1, z: 0}, {x: 0, y: -90, z: 0})
    })
    test('dimensions', () => {
      roomEl.setAttribute(cr, {width: 2, height: 3, depth: 4})
      expect(component.resonanceAudioScene._room.early._halfDimensions).to.include({width: 1, height: 1.5, depth: 2})
      expect(component.visualization.getAttribute('width')).to.equal('2')
      expect(component.visualization.getAttribute('height')).to.equal('3')
      expect(component.visualization.getAttribute('depth')).to.equal('4')
    })
    test('acoustic parameters', () => {
      roomEl.setAttribute(cr, {ambisonicOrder: 3, speedOfSound: 100})
      expect(component.resonanceAudioScene._ambisonicOrder).to.equal(3)
      expect(component.resonanceAudioScene._room.speedOfSound).to.equal(100)
    })
    test('remove and re-add visualization', () => {
      const v = component.visualization
      roomEl.setAttribute(cr, 'visualize', false)
      expect([...roomEl.sceneEl.children]).to.not.include(v)

      roomEl.setAttribute(cr, 'visualize', true)
      expect([...roomEl.sceneEl.children]).to.include(component.visualization)
    })
  })

  test('remove component', done => {
    const v = component.visualization
    expect(v).to.be.an.instanceOf(AFRAME.AEntity)
    roomEl.addEventListener('componentremoved', evt => {
      if (evt.detail.name !== cr) { return }
      expect([...roomEl.sceneEl.children]).to.not.include(v)
      expect(component.visualization).to.not.equal(v)
      done()
    })
    roomEl.removeAttribute(cr)
  })

  suite('reverb', () => {
    // Reverb is tested like this because reverb doesn't work when the listener is not considered to be in the room (encountered this once).
    setup(() => {
      // Reset the room orientation.
      roomEl.setAttribute('rotation', '0 0 0')
    })
    test('listener outside room', () => {
      // Set camera to same height as room.
      roomEl.sceneEl.camera.el.setAttribute('position', '0 1 0')
      // Get camera position relative to the room.
      roomEl.sceneEl.object3D.updateMatrixWorld(true)
      const m = new THREE.Matrix4().multiplyMatrices(
        new THREE.Matrix4().getInverse(roomEl.object3D.matrixWorld),
        roomEl.sceneEl.camera.matrixWorld
      )
      // Test distance from room.
      expect(component.resonanceAudioScene._room.getDistanceOutsideRoom(m.elements[12], m.elements[13], m.elements[14])).to.equal(1.5)
    })
    test('listener on room border', () => {
      // Set camera to same height as room.
      roomEl.sceneEl.camera.el.setAttribute('position', '1.5 1 0')
      // Get camera position relative to the room.
      roomEl.sceneEl.object3D.updateMatrixWorld(true)
      const m = new THREE.Matrix4().multiplyMatrices(
        new THREE.Matrix4().getInverse(roomEl.object3D.matrixWorld),
        roomEl.sceneEl.camera.matrixWorld
      )
      // Test distance from room.
      expect(component.resonanceAudioScene._room.getDistanceOutsideRoom(m.elements[12], m.elements[13], m.elements[14])).to.equal(0)
    })
    test('listener inside room', () => {
      // Set camera to same height as room.
      roomEl.sceneEl.camera.el.setAttribute('position', '2 1 0')
      // Get camera position relative to the room.
      roomEl.sceneEl.object3D.updateMatrixWorld(true)
      const m = new THREE.Matrix4().multiplyMatrices(
        new THREE.Matrix4().getInverse(roomEl.object3D.matrixWorld),
        roomEl.sceneEl.camera.matrixWorld
      )
      // Test distance from room.
      expect(component.resonanceAudioScene._room.getDistanceOutsideRoom(m.elements[12], m.elements[13], m.elements[14])).to.equal(0)
    })
  })
})
