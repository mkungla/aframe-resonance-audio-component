if (!ResonanceAudio) {
  throw "ResonanceAudio has not been loaded!";
}
else if (!AFRAME) {
  throw "AFRAME has not been loaded!";
}

const RESONANCE_MATERIAL = Object.keys(ResonanceAudio.Utils.ROOM_MATERIAL_COEFFICIENTS);

AFRAME.registerComponent('resonance-room', {
  schema: {
    enabled: {default: true},
    src: {type: 'asset' },
    'src-position': {type: 'vec3', default: '0 0 0' },
    width: {type: 'number', default: 2 },
    height: {type: 'number', default: 2},
    depth: {type: 'number', default: 2 },
    helper: {type: 'boolean', default: false },
    'left-wall': {default: 'brick-bare', oneOf: RESONANCE_MATERIAL},
    'right-wall': {default: 'brick-bare', oneOf: RESONANCE_MATERIAL},
    'front-wall': {default: 'brick-bare', oneOf: RESONANCE_MATERIAL},
    'back-wall': {default: 'brick-bare', oneOf: RESONANCE_MATERIAL},
    'down-wall': {default: 'brick-bare', oneOf: RESONANCE_MATERIAL},
    'up-wall': {default: 'brick-bare', oneOf: RESONANCE_MATERIAL},
    loop: {type: 'boolean', default: true },
    autoplay: {type: 'boolean', default: true }
  },
  init() {
    this.el.sceneEl.addEventListener('loaded', ()=>{
      this._camera = this.el.sceneEl.querySelector('[camera]');
    })
    this.initResonanceScene();
    this.updateProps();
  },

  update() {
    this._camera = this.el.sceneEl.querySelector('[camera]');
  },

  tick() {
    // Update listener position (camera)
    let pos = this._camera.getAttribute('position');
    this.el.resonanceAudioScene.setListenerPosition(pos.x, pos.y, pos.z);
  },

  remove() {
    this.el.audioEl.pause();
    this.el.audioEl = null;
  },

  pause() {
    if (this.el.audioEl) {
      this.el.audioEl.pause();
    }
  },

  play() {
    if (this.el.audioEl && this.el.audioEl.paused) {
      this.el.audioEl.play();
    }
  },

  // Create singleton context..
  initResonanceScene() {
    if (this.el.audioContext) { return; }

    // Create an AudioContext
    this.el.audioContext = new AudioContext();

    // Create a (first-order Ambisonic) Resonance Audio scene and pass it
    // the AudioContext.
    this.el.resonanceAudioScene = new ResonanceAudio(this.el.audioContext);
    this.el.resonanceAudioScene.output.connect(this.el.audioContext.destination);
  },

  updateProps() {
    // Create room
    this.setUpRoom();
    this.setUpAudio();

    // Update helpers
    this.updateRoomHelper();
    this.updateSourceHelper();
  },

  // Create resonance room
  setUpRoom() {
    let roomDimensions = {
      width: this.data.width,
      height: this.data.height,
      depth: this.data.depth
    },
    roomMaterials = {
      left: this.data['left-wall'],
      right: this.data['right-wall'],
      front: this.data['front-wall'],
      back: this.data['back-wall'],
      down: this.data['down-wall'],
      up: this.data['up-wall']
    };
    this.el.resonanceAudioScene.setRoomProperties(roomDimensions, roomMaterials);
  },

  setUpAudio() {
    if (!this.data.src) {
      return;
    }

    // Create an AudioElement.
    let audioElement = document.createElement('audio');

    // Load an audio file into the AudioElement.
    audioElement.src = this.data.src;

    // Generate a MediaElementSource from the AudioElement.
    let audioElementSource = this.el.audioContext.createMediaElementSource(audioElement);

    // Add the MediaElementSource to the scene as an audio input source.
    let source = this.el.resonanceAudioScene.createSource();
    audioElementSource.connect(source.input);

    // Set position
    let pos = this.data['src-position'];
    source.setPosition(pos.x, pos.y, pos.z);

    // Play the audio.
    if (this.data.autoplay) {
      audioElement.play();
    }

    // Looping
    audioElement.loop = this.data.loop;

    this.el.audioEl = audioElement;
  },

  // Update helper box: helper
  updateRoomHelper() {

    // Fetch existing helper el
    let oldHelperEl = this.el.querySelector('.resonance-room-helper');

    // Add Box
    if (this.data.helper && !oldHelperEl)
    {
      let _helperEl = document.createElement('a-box');
      _helperEl.classList.add('resonance-room-helper');
      // NOTE: GOOGLE RESONANCE DOES NOT HAVE A WAY TO SET THE ROOM POSITION
      _helperEl.setAttribute('position', {x: 0, y: this.data.height/2, z: 0});
      _helperEl.setAttribute('width', this.data.width);
      _helperEl.setAttribute('height', this.data.height);
      _helperEl.setAttribute('depth', this.data.depth);
      _helperEl.setAttribute('wireframe', true);
      _helperEl.setAttribute('color', 'black');
      this.el.appendChild(_helperEl);
    }
    // Remove Helper box
    else if (!this.data.helper && oldHelperEl)
    {
      oldHelperEl.parendNode.removeChild(oldHelperEl);
      oldHelperEl = null;
    }
  },

  // Update helper source: helper
  updateSourceHelper() {

    // Fetch existing helper el
    let oldHelperEl = this.el.querySelector('.resonance-source-helper');

    // Add Sphere
    if (this.data.helper && !oldHelperEl)
    {
      let _helperEl = document.createElement('a-sphere');
      _helperEl.classList.add('resonance-source-helper');
      _helperEl.setAttribute('radius', 0.2);
      _helperEl.setAttribute('segments-width', 14);
      _helperEl.setAttribute('segments-height', 6);
      _helperEl.setAttribute('wireframe', true);
      _helperEl.setAttribute('color', 'blue');
      _helperEl.setAttribute('position', this.data['src-position']);
      this.el.appendChild(_helperEl);
    }
    // Remove Helper box
    else if (!this.data.helper && oldHelperEl)
    {
      oldHelperEl.parendNode.removeChild(oldHelperEl);
      oldHelperEl = null;
    }
  }
});

AFRAME.registerPrimitive('a-resonance-room', {
  defaultComponents: {},
  mappings: {
    enabled: 'resonance-room.enabled',
    src: 'resonance-room.src',
    'src-position': 'resonance-room.src-position',
    width: 'resonance-room.width',
    height: 'resonance-room.height',
    depth: 'resonance-room.depth',
    helper: 'resonance-room.helper',
    'left-wall': 'resonance-room.left-wall',
    'right-wall': 'resonance-room.right-wall',
    'front-wall': 'resonance-room.front-wall',
    'back-wall': 'resonance-room.back-wall',
    'down-wall': 'resonance-room.down-wall',
    'up-wall': 'resonance-room.up-wall',
    loop: 'resonance-room.loop',
    autoplay: 'resonance-room.autoplay',
  }
});
