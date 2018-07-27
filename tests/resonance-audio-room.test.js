/* global setup, suite, test, expect, THREE */
require('aframe')
require('../src/index.js')
const { ResonanceAudio } = require('resonance-audio')
const { entityFactory, elementFactory, compareMatrixtoPosAndRot } = require('./helpers')
const cr = 'resonance-audio-room'
const cs = 'resonance-audio-src'

suite(`component ${cr} default`, () => {
  let el

  setup(done => {
    el = entityFactory()
    el.addEventListener('componentinitialized', (evt) => {
      if (evt.detail.name === cr) { done() }
    })
    el.setAttribute(cr, {})
  })
  test('dimensions', () => {
    expect(el.getAttribute(cr).width).to.equal(ResonanceAudio.Utils.DEFAULT_ROOM_DIMENSIONS.width)
    expect(el.getAttribute(cr).height).to.equal(ResonanceAudio.Utils.DEFAULT_ROOM_DIMENSIONS.height)
    expect(el.getAttribute(cr).depth).to.equal(ResonanceAudio.Utils.DEFAULT_ROOM_DIMENSIONS.depth)
  })
  test('materials', () => {
    const sides = [ 'left', 'right', 'front', 'back', 'down', 'up' ]
    for (const side of sides) {
      expect(el.getAttribute(cr)[side]).to.equal('brick-bare')
    }
  })
  test('acoustic parameters', () => {
    expect(el.getAttribute(cr).ambisonicOrder).to.equal(ResonanceAudio.Utils.DEFAULT_AMBISONIC_ORDER)
    expect(el.getAttribute(cr).speedOfSound).to.equal(ResonanceAudio.Utils.DEFAULT_SPEED_OF_SOUND)
  })
  test('visualization', () => {
    expect(el.getAttribute(cr).visualize).to.equal(false)
  })
})

suite(`component ${cr}`, () => {
  let containerEl
  let el
  let childEl
  let srcEl1
  let srcEl2
  let component

  setup(done => {
    /*
    Create this structure:
      <a-scene>
       <!-- containerEl -->
        <a-entity position="-1 -2 -3">
          <!-- el -->
          <a-entity resonance-audio-room="..." position="3 3 3" rotation="0 -45 0">
            <!-- srcEl1 -->
            <a-entity resonance-audio-src id="srcEl1"></a-entity>
            <!-- childEl -->
            <a-entity>
              <!-- srcEl2 -->
              <a-entity resonance-audio-src id="srcEl2"></a-entity>
            </a-entity>
          </a-entity>
        </a-entity>
      </a-scene>
    */

    containerEl = entityFactory({attributes: {'position': '-1 -2 -3'}})
    el = elementFactory('a-entity', {position: '3 3 3', rotation: '0 -45 0'})
    containerEl.appendChild(el)
    childEl = elementFactory('a-entity')
    el.appendChild(childEl)
    srcEl1 = elementFactory('a-entity', {id: 'srcEl1', [cs]: {}})
    el.appendChild(srcEl1)
    srcEl2 = elementFactory('a-entity', {id: 'srcEl2', [cs]: {}})
    childEl.appendChild(srcEl2)

    el.addEventListener('componentinitialized', function (evt) {
      if (evt.detail.name !== cr) { return }
      component = el.components[cr]
      done()
    })
    el.setAttribute(cr, {
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
    })
  })

  suite('initialization', () => {
    test('position and rotation', () => {
      el.sceneEl.object3D.updateMatrixWorld()
      // Audio room in world coordinates.
      compareMatrixtoPosAndRot(el.object3D.matrixWorld, {x: 2, y: 1, z: 0}, {x: 0, y: -45, z: 0})
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
        expect(el.getAttribute(cr)[side]).to.equal(materials[side])
      }
    })
    test('acoustic parameters', () => {
      expect(component.resonanceAudioScene._ambisonicOrder).to.equal(1)
      expect(component.resonanceAudioScene._room.speedOfSound).to.equal(500)
    })
  })

  suite('update properties', () => {
    test('container position', () => {
      containerEl.setAttribute('position', '-10 -20 -30')
      el.sceneEl.object3D.updateMatrixWorld()
      // Audio room in world coordinates (changed).
      compareMatrixtoPosAndRot(el.object3D.matrixWorld, {x: -7, y: -17, z: -27}, {x: 0, y: -45, z: 0})
      // TODO: the visualization objects in world coordinates. Should be the same as the audio room.
    })
    test('container rotation', () => {
      containerEl.setAttribute('rotation', '0 -90 0')
      el.sceneEl.object3D.updateMatrixWorld()
      // Audio room in world coordinates.
      compareMatrixtoPosAndRot(el.object3D.matrixWorld, {x: -4, y: 1, z: 0}, {x: 0, y: -45 - 90, z: 0})
      // TODO: the visualization objects in world coordinates. Should be the same as the audio room.
    })
    test('room position', () => {
      el.setAttribute('position', '-10 -20 -30')
      el.sceneEl.object3D.updateMatrixWorld()
      // Audio room in world coordinates.
      compareMatrixtoPosAndRot(el.object3D.matrixWorld, {x: -11, y: -22, z: -33}, {x: 0, y: -45, z: 0})
      // Visualization in world coordinates.
      compareMatrixtoPosAndRot(component.visualization.object3D.matrixWorld, {x: -11, y: -22, z: -33}, {x: 0, y: -45, z: 0})
    })
    test('room rotation', () => {
      el.setAttribute('rotation', '0 -90 0')
      el.sceneEl.object3D.updateMatrixWorld()
      // Audio room in world coordinates.
      compareMatrixtoPosAndRot(el.object3D.matrixWorld, {x: 2, y: 1, z: 0}, {x: 0, y: -90, z: 0})
      // Visualization in world coordinates.
      compareMatrixtoPosAndRot(component.visualization.object3D.matrixWorld, {x: 2, y: 1, z: 0}, {x: 0, y: -90, z: 0})
    })
    test('dimensions', () => {
      el.setAttribute(cr, {width: 2, height: 3, depth: 4})
      expect(component.resonanceAudioScene._room.early._halfDimensions).to.include({width: 1, height: 1.5, depth: 2})
      expect(component.visualization.getAttribute('width')).to.equal('2')
      expect(component.visualization.getAttribute('height')).to.equal('3')
      expect(component.visualization.getAttribute('depth')).to.equal('4')
    })
    test('acoustic parameters', () => {
      el.setAttribute(cr, {ambisonicOrder: 3, speedOfSound: 100})
      expect(component.resonanceAudioScene._ambisonicOrder).to.equal(3)
      expect(component.resonanceAudioScene._room.speedOfSound).to.equal(100)
    })
    test('remove and re-add visualization', () => {
      const v = component.visualization
      el.setAttribute(cr, 'visualize', false)
      expect([...el.sceneEl.children]).to.not.include(v)

      el.setAttribute(cr, 'visualize', true)
      expect([...el.sceneEl.children]).to.include(component.visualization)
    })
  })

  suite('lifecycle methods', () => {
    test('attachSource and exposeAPI', () => {
      expect(component.sources).to.be.an('array').that.includes(srcEl1.components[cs])
      expect(component.sources).to.be.an('array').that.includes(srcEl2.components[cs])
      expect(el.audioSources).to.be.an('array').that.includes(srcEl1.components[cs])
      expect(el.audioSources).to.be.an('array').that.includes(srcEl2.components[cs])
    })
    test('dynamic attachSource', done => {
      const srcEl3 = elementFactory('a-entity', {[cs]: {}})
      el.appendChild(srcEl3)
      srcEl3.addEventListener('loaded', () => {
        setTimeout(() => { // This timeout will be replaced by an event listener in the future.
          expect(component.sources).to.be.an('array').that.includes(srcEl3.components[cs])
          expect(el.audioSources).to.be.an('array').that.includes(srcEl3.components[cs])
          done()
        }, 200)
      })
    })
    test('detachSource', done => {
      expect(component.sources).to.be.an('array').that.does.include(srcEl1.components[cs])
      el.removeChild(srcEl1)
      setTimeout(() => { // This timeout will be replaced by an event listener in the future.
        expect(component.sources).to.be.an('array').that.does.not.include(srcEl1.components[cs])
        done()
      }, 200)
    })
    test('remove', done => {
      const v = component.visualization
      expect(component.sources).to.be.an('array').that.includes(srcEl1.components[cs])
      el.removeAttribute(cr)
      setTimeout(() => { // This timeout will be replaced by an event listener in the future.
        expect(component.sources).to.be.an('array').that.does.not.include(srcEl1.components[cs])
        expect([...el.sceneEl.children]).to.not.include(v)
        done()
      }, 200)
    })
  })

  suite('reverb', () => {
    // Reverb is tested like this because reverb doesn't work when the listener is not considered to be in the room (encountered this once).
    setup(() => {
      // Reset the room orientation.
      el.setAttribute('rotation', '0 0 0')
    })
    test('outside room', () => {
      // Set camera to same height as room.
      el.sceneEl.camera.el.setAttribute('position', '0 1 0')
      // Get camera position relative to the room.
      el.sceneEl.object3D.updateMatrixWorld(true)
      const m = new THREE.Matrix4().multiplyMatrices(
        new THREE.Matrix4().getInverse(el.object3D.matrixWorld),
        el.sceneEl.camera.matrixWorld
      )
      // Test distance from room.
      expect(component.resonanceAudioScene._room.getDistanceOutsideRoom(m.elements[12], m.elements[13], m.elements[14])).to.equal(1.5)
    })
    test('on room border', () => {
      // Set camera to same height as room.
      el.sceneEl.camera.el.setAttribute('position', '1.5 1 0')
      // Get camera position relative to the room.
      el.sceneEl.object3D.updateMatrixWorld(true)
      const m = new THREE.Matrix4().multiplyMatrices(
        new THREE.Matrix4().getInverse(el.object3D.matrixWorld),
        el.sceneEl.camera.matrixWorld
      )
      // Test distance from room.
      expect(component.resonanceAudioScene._room.getDistanceOutsideRoom(m.elements[12], m.elements[13], m.elements[14])).to.equal(0)
    })
    test('inside room', () => {
      // Set camera to same height as room.
      el.sceneEl.camera.el.setAttribute('position', '2 1 0')
      // Get camera position relative to the room.
      el.sceneEl.object3D.updateMatrixWorld(true)
      const m = new THREE.Matrix4().multiplyMatrices(
        new THREE.Matrix4().getInverse(el.object3D.matrixWorld),
        el.sceneEl.camera.matrixWorld
      )
      // Test distance from room.
      expect(component.resonanceAudioScene._room.getDistanceOutsideRoom(m.elements[12], m.elements[13], m.elements[14])).to.equal(0)
    })
  })
})
