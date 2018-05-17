# A-Frame Resonance Audio Component
**Rich, Immersive, Audio [👉👉 Live demo 😎 👈👈][gh-pages-link]**  
> With Resonance Audio, bring dynamic spatial sound into your A-Frame VR, AR experiences at scale.

## Getting Started
A-Frame Resonance Audio Component provides 2 components and 2 primitives.

**Add a room to the scene using**
- `resonance-audio-room` component or `a-resonance-audio-room` primitive

**Add and position audio input source in the room using**
- `resonance-audio-src` component and `a-resonance-audio-src` primitive


### Using primitives  
> basic usage

```html
<a-assets>
  <audio id="track" src="assets/audio/track.mp3"></audio>
</a-assets>
<a-resonance-audio-room
  material="wireframe:true"
  position="0 0 -5"
  width="4"
  height="4"
  depth="4"
  ambisonic-order="3"
  speed-of-sound="343"
  left="brick-bare"
  right="curtain-heavy"
  front="plywood-panel"
  back="glass-thin"
  down="parquet-on-concrete"
  up="acoustic-ceiling-tiles">
  <a-resonance-audio-src
    position="0 0 0"
    src="#track"
    loop="true"
    autoplay="true"></a-resonance-audio-src>
<a-resonance-audio-room>
```

### Using entities or any A-Frame primitive
> resonance-audio-room and resonance-audio-src component can be added to any geometry

```html
<a-assets>
  <audio id="track" src="assets/audio/track.mp3"></audio>
</a-assets>
<a-entity
  material="wireframe:true"
  position="0 0 -5"
  resonance-audio-room="
    width:4;
    height:4;
    depth:4;
    ambisonicOrder:3;
    speedOfSound:343;
    left:brick-bare;
    right:curtain-heavy;
    front:plywood-panel;
    back:glass-thin;
    down:parquet-on-concrete;
    up:acoustic-ceiling-tiles">
  <a-entity
    position="0 0 0"
    geometry="primitive:sphere"
    color="black"
    resonance-audio-src="src:#track; loop:true; autoplay:true"></a-entity>
<a-entity>
```

### Using object for a room
> resonance-audio-room and resonance-audio-src component can be added to any model

```html
<a-assets>
  <a-asset-item id="room-obj" src="assets/models/room/room-model.obj"></a-asset-item>
  <a-asset-item id="room-mtl" src="assets/models/room/room-materials.mtl"></a-asset-item>
  <audio id="track" src="assets/audio/track.mp3"></audio>
</a-assets>
<a-entity
  obj-model="obj: #room-obj; mtl: #room-mtl "
  position="0 1 -0.5"
  resonance-audio-room="
    left:brick-bare;
    right:transparent;
    front:transparent;
    back:brick-bare;
    down:parquet-on-concrete;
    up:transparent">
  <a-entity
    visible="false"
    position="-1.5 -0.5 1.8"
    color="black"
    resonance-audio-src="src:#track; loop:true; autoplay:true"></a-entity>
</a-entity>
```

when using models for resonance-audio-room then room size is set from object bounding box

```js
const bb = new THREE.Box3().setFromObject(this.el.object3D)
dimensions.width = bb.size().x
dimensions.height = bb.size().y
dimensions.depth = bb.size().z
```


### Using a MediaStream as input
Several APIs have been exposed to allow for dynamic switching between audio files and ```MediaStream```s (obtained from, for example, WebRTC).
```html
<a-assets>
  <audio id="track" src="assets/audio/track.mp3"></audio>
</a-assets>
<a-resonance-audio-room
  material="wireframe:true"
  position="0 0 -5"
  width="4"
  height="4"
  depth="4"
  ambisonic-order="3"
  speed-of-sound="343"
  left="brick-bare" right="curtain-heavy" front="plywood-panel" 
  back="glass-thin" down="parquet-on-concrete" up="acoustic-ceiling-tiles">
  <a-resonance-audio-src
    position="0 0 0"
    src=""></a-resonance-audio-src>
</a-resonance-audio-room>
```
The APIs exposed are available on the element having the component and the component itself:
```js
document.querySelector('a-resonance-audio-src').srcObject = stream
document.querySelector('a-resonance-audio-src').setAttribute('srcObject', stream)
document.querySelector('a-resonance-audio-src').components['resonance-audio-src'].setMediaStream(stream)

document.querySelector('a-resonance-audio-src').src = '#track'
document.querySelector('a-resonance-audio-src').setAttribute('src', '#track')
document.querySelector('a-resonance-audio-src').components['resonance-audio-src'].setMediaSrc('assets/audio/track.mp3')
```
As ```setMediaSrc()``` bypasses A-Frame's updater, the property type it accepts is not asset, but string. The ```setAttribute()``` interface works only on the primitives.


***

**Credits:**

<sub>**Original author Etienne Pinchon.**</sub>  
<sup>aframe-resonance-audio-component was forked from [etiennepinchon/aframe-resonance]</sup>  

<sub>**Google Resonance Audio project.**</sub>  
<sup>aframe-resonance-audio-component is based on [Google Resonance Audio project][resonance-audio-link]</sub>

<!-- links -->
[etiennepinchon/aframe-resonance]: https://github.com/etiennepinchon/aframe-resonance
[resonance-audio-link]: https://developers.google.com/resonance-audio/

[gh-pages-link]: https://mkungla.github.io/aframe-resonance-audio-component/
