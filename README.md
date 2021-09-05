# A-Frame Resonance Audio Component

**[👉 Live demo 👈][link-gh-pages]**

**With Resonance Audio, bring dynamic spatial sound into your A-Frame VR, AR experiences at scale.**

[![License][img-license-badge]][link-license]

**Install**  
[![npm version][img-npm-version-badge]][link-npm-package]
[![npm package][img-npm-download-badge]][link-npm-package]

![npm bundle size][img-bundle-size-min-badge]
![npm bundle size][img-bundle-size-minzip-badge]

```
npm i -S aframe-resonance-audio-component
# Or
yarn add aframe-resonance-audio-component
```

JS**DELIVR**  
[![A free CDN for Open Source][img-jsdelivr-badge]][link-jsdelivr]

**Use in version v0.4.9**
```html
<script src="https://cdn.jsdelivr.net/npm/aframe-resonance-audio-component@0.4.9/dist/aframe-resonance-audio-component.min.js"></script>
```
**Use in browser latest version** *(not recommended for production usage)*
```html
<script src="https://cdn.jsdelivr.net/npm/aframe-resonance-audio-component@latest/dist/aframe-resonance-audio-component.min.js"></script>
```

| **Builds** | | |
| ----- | ---- | ------- |
| [![linux][img-build-linux-badge]][link-build-linux] | [![macos][img-build-macos-badge]][link-build-macos] | [![windows][img-build-windows-badge]][link-build-windows] |

---

![dependencies](https://img.shields.io/david/mkungla/aframe-resonance-audio-component?style=flat-square)
![devDependencies](https://img.shields.io/david/dev/mkungla/aframe-resonance-audio-component?style=flat-square)
![GitHub last commit](https://img.shields.io/github/last-commit/mkungla/aframe-resonance-audio-component?style=flat-square)

## Table of contents

  - [Usage](#usage)
    - [Declarative usage](#declarative-usage)
      - [Example with basic usage with primitives](#example-with-basic-usage-with-primitives)
      - [Example with entities, models and a bounding box room](#example-with-entities-models-and-a-bounding-box-room)
    - [Dynamic usage](#dynamic-usage)
  - [API](#api)
    - [resonance-audio-room](#resonance-audio-room)
    - [resonance-audio-room-bb](#resonance-audio-room-bb)
    - [resonance-audio-room-bb](#resonance-audio-room-src)
  - [Notes](#notes)
    - [Future work](#future-work)
  - [Credits](#credits)

---

[![A-Frame Version][img-aframe-badge]][link-aframe]
[![Codacy Badge][img-codacy-badge]][link-codacy]
[![CodeQL][img-codeql-badge]][link-codeql]
[![Coverage Status](https://coveralls.io/repos/github/mkungla/aframe-resonance-audio-component/badge.svg?branch=main)](https://coveralls.io/github/mkungla/aframe-resonance-audio-component?branch=main)

---

## Usage

[Google Resonance][link-resonance-audio] works with audio rooms and audio sources. The acoustics of each source are affected by the room it is in. For that purpose, this package provides three components:

  - resonance-audio-room
  - resonance-audio-room-bb
  - resonance-audio-src

These can be used as primitives (using the `a-` prefix) or as attributes, except `resonance-audio-room-bb`: it calculates the bounding box of an entity and considers that as the room. It can thus not be used as a primitive.

The audio source can also be a [MediaStream][link-web-api-mediastream].

Audio rooms and audio sources don't necessarily have to have a parent-child relationship. See resonance-audio-src's `room` property.

### Declarative usage
Basic usage is quite simple and works just like any other A-Frame component. Don't forget to point the `src` attribute to the correct element or resource.

#### Example with basic usage with primitives

```html
<a-scene>
  <a-assets>
    <audio id="track" src="assets/audio/track.mp3"></audio>
  </a-assets>
  <a-resonance-audio-room
    position="0 0 -5"
    width="40"
    height="4"
    depth="4"
    ambisonic-order="3"
    speed-of-sound="343"
    left="brick-bare"
    right="curtain-heavy"
    front="plywood-panel"
    back="glass-thin"
    down="parquet-on-concrete"
    up="acoustic-ceiling-tiles"
    visualize="true">
    <a-resonance-audio-src
      position="-10 0 0"
      src="#track"
      loop="true"
      autoplay="true"
      visualize="true"></a-resonance-audio-src>
    <a-resonance-audio-src
      position="10 0 0"
      src="#track"
      loop="true"
      autoplay="true"
      visualize="true"></a-resonance-audio-src>
  </a-resonance-audio-room>
</a-scene>
```
#### Example with entities, models and a bounding box room

```html
<a-scene>
  <a-assets>
    <a-asset-item id="room-obj" src="assets/models/room/room-model.obj"></a-asset-item>
    <a-asset-item id="room-mtl" src="assets/models/room/room-materials.mtl"></a-asset-item>
    <audio id="track" src="assets/audio/track.mp3"></audio>
  </a-assets>
  <a-entity
    obj-model="obj: #room-obj; mtl: #room-mtl"
    position="0 1 -0.5"
    resonance-audio-room-bb="
      visualize: true;
      left: brick-bare;
      right: transparent;
      front: transparent;
      back: brick-bare;
      down: parquet-on-concrete;
      up: transparent">
    <a-entity
      position="-1.5 -0.5 1.8"
      resonance-audio-src="
        visualize: true;
        src: #track;
        loop: true;
        autoplay: true;"></a-entity>
  </a-entity>
</a-scene>
```

### Dynamic usage
All properties can be changed dynamically. This allows for [MediaStreams][link-web-api-mediastream] to be set as audio sources.

Take the following example. A more comprehensive version is available in [examples/primitives-using-mediastream/][link-primitives-using-mediastream example].

```html
<a-scene>
  <a-assets>
    <audio id="track" src="assets/audio/track.mp3"></audio>
  </a-assets>
  <a-resonance-audio-room
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
    up="acoustic-ceiling-tiles"
    visualize="true">
    <a-resonance-audio-src
      id="audioSource"
      position="0 0 0"
      src="#track"
      loop="true"
      autoplay="true"
      visualize="true"></a-resonance-audio-src>
  </a-resonance-audio-room>
</a-scene>
```

When this is loaded, `track.mp3` plays indefinitely. Running the following javascript changes the source from `#track` to the passed [MediaStream][link-web-api-mediastream]. A practical example of `stream` is a WebRTC stream.

```js
document.getElementById('audioSource').setAttribute('resonance-audio-src', 'src', stream)
```

## API

---

### resonance-audio-room

**properties**

| Property | Description | Default value | Values |
| -------- | ----------- | ------------- | ------ |
| `width`           | Width of the audio room (in meters). | [0][DEFAULT_ROOM_DIMENSIONS] | |
| `height`          | Height of the audio room (in meters). | [0][DEFAULT_ROOM_DIMENSIONS] | |
| `depth`           | Depth of the audio room (in meters). | [0][DEFAULT_ROOM_DIMENSIONS] | |
| `ambisonicOrder`  | Ambisonic order of the audio room. | 1 | |
| `speedOfSound`    | Speed of sound within the audio room (in meters per second). | [343][DEFAULT_SPEED_OF_SOUND] | |
| `left`            | Material of the left room wall.  | `brick-bare` | [room materials][ROOM_MATERIAL_COEFFICIENTS] |
| `right`           | Material of the right room wall.  | `brick-bare` | [room materials][ROOM_MATERIAL_COEFFICIENTS] |
| `front`           | Material of the front room wall.  | `brick-bare` | [room materials][ROOM_MATERIAL_COEFFICIENTS] |
| `back`            | Material of the back room wall.  | `brick-bare` | [room materials][ROOM_MATERIAL_COEFFICIENTS] |
| `down`            | Material of the room floor.  | `brick-bare` | [room materials][ROOM_MATERIAL_COEFFICIENTS] |
| `up`              | Material of the room ceiling.  | `brick-bare` | [room materials][ROOM_MATERIAL_COEFFICIENTS] |
| `visualize`       | Show a wireframe box visualization of the audio room. Access using `el.getObject3D('audio-room')` | false | `true` |

**members**

Accessible via `entity.components['resonance-audio-room'].<member>`.

| Name | Description | Type |
| - | - | - |
| `audioContext` | The audio context used by Google Resonance. | [AudioContext] |
| `resonanceAudioScene` | The reference to the Google Resonance instance managing the audio in this room. | [ResonanceAudio] |
| `sources` | A collection of the attached audio source components. | array of resonance-audio-src component instances |
| `el.audioSources` | Returns sources. | array of resonance-audio-src component instances |
| `el.sounds` | A collection of the origins of the attached audio sources. | array of [HTMLMediaElement] and/or [MediaStream] objects |

### resonance-audio-room-bb
This component's only purpose is to instantiate a resonance-audio-room component with the dimensions of the bounded object. For any interaction, use the resonance-audio-room component after it has been fully loaded.

**events**

| Event                    | `evt.detail` property | Description             |
| ------------------------ | --------------------- | ----------------------- |
| bounded-audioroom-loaded | `room`                | The audio room element. |

---

### resonance-audio-src

**properties**

| Property | Description | Default value | Values |
| -------- | ----------- | ------------- | ------ |
| `src` | The source of the audio. This can be a [HTMLMediaElement] (`<audio />` or `<video />`), [MediaStream], an ID string pointing to a [HTMLMediaElement] or a resouce string. If a resource string is passed, the resource is loaded in the `<audio />` element accessible via the `defaultAudioEl` member. Note that you can not set the same [HTMLMediaElement] on multiple entities with the `resonance-audio-src` component (globally!). | | |
| `room` | The audio room of this audio source. Use this if the room and source aren't parent and child, respectively. This can be a string selector (used with `document.querySelector` or a [HTMLElement]). | el.parentNode | |
| `loop` | Whether to loop the element source. Overwrites the value set by the input element. | true | |
| `autoplay` | Whether to autoplay the element source. Overwrites the value set by the input element. | true | |
| [`gain`][ra_setGain] | Source's gain (linear). | [1][DEFAULT_SOURCE_GAIN] | |
| [`maxDistance`][ra_setMaxDistance] | Source's maximum distance (in meters). | [1000][DEFAULT_MAX_DISTANCE] | |
| [`minDistance`][ra_setMinDistance] | Source's minimum distance (in meters). | [1][DEFAULT_MIN_DISTANCE] | |
| [`directivityPattern`][ra_setDirectivityPattern] | Source's directivity pattern where the [first number is the alpha][DEFAULT_DIRECTIVITY_ALPHA] and [the second is the sharpness][DEFAULT_DIRECTIVITY_SHARPNESS]. An alpha of 0 is an omnidirectional pattern, 1 is a bidirectional pattern, 0.5 is a cardiod pattern. The sharpness of the pattern is increased exponentially. | `0 1` <br> or in [THREE.Vector3][THREE_Vector3] format: `{x:0, y:1}` | |
| [`sourceWidth`][ra_setSourceWidth] | The source width (in degrees), where 0 degrees is a point source and 360 degrees is an omnidirectional source. | [0][DEFAULT_SOURCE_WIDTH] | |
| [`rolloff`][ra_setRolloff] | Source's rolloff model. | [`logarithmic`][DEFAULT_ATTENUATION_ROLLOFF] | [oneOf(`logarithmic`, `linear`, `none`)][ATTENUATION_ROLLOFFS]
| `position` | The position in local coordinates. If set, this position will be used instead of the entity's position component. Revert to the entity's position by setting this property to any invalid position (such as `null`). | { } | |
| `rotation` | The rotation in local degrees. If set, this rotation will be used instead of the entity's rotation component. Revert to the entity's rotation by setting this property to any invalid rotation (such as `null`). | { } | |
| `visualize` | Show a wireframe sphere visualization of the audio source. Its radius equals the minDistance. If this audio source is not in an audio room, the sphere turns red. Access using `el.getObject3D('audio-src')`. | false | true|

**members**

Accessible via `entity.components['resonance-audio-src'].<member>`.

| Name | Description | Type |
| - | - | - |
| `room` | The audio room component. | [AComponent] |
| `connected.element` | Whether the audio of this source comes from an [HTMLMediaElement]. | boolean |
| `connected.stream` | Whether the audio of this source comes from a [MediaStream]. | boolean |
| `sound` | The current connected [HTMLMediaElement] or [MediaStream] instance. | [HTMLMediaElement] or [MediaStream] |
| `resonance` | Reference to the Google Resonance audio source | [Source][ra_Source] |
| `defaultAudioEl` | The audio element used when a resource string is set as the source. | [HTMLAudioElement] |
| `mediaAudioSourceNodes` | A collection of references to sources (so they can be reused). | mapping of [HTMLMediaElement] to [MediaElementAudioSourceNode] and [MediaStream] to [MediaStreamAudioSourceNode]


**events**

| Event | `evt.detail` property | Description |
| - | - | - |
| audioroom-entered | `room` | The audio room element that was entered. |
|                   | `src`  | The audio source element that entered the room. |
| audioroom-left    | `room` | The audio room element that was left. |
|                   | `src`  | The audio source element that left the room. |

---

## Notes

Support for custom positioning and rotation for the audio room is omitted due to the necessity to propagate positioning and rotation calculations to its audio source children and the complexities involved with that.

The visuals are now a simple box wireframe for the audio room and a simple sphere wireframe for the audio source. The box is how Google Resonance actually considers the room and all involved calculations, so other or more complex shapes are not possible (yet). Future work for the audio source visualization might take into account its parameters, such as the directivity pattern and source width.

The audio seems to continue to propagate to infinity outside of an audio room when the default directivity pattern is set.

The bounding box feature isn't perfect yet. It currently takes the dimensions of the entity's bounding box and assumes the center point of the entity is the same as the center point of the audio room. This is correct for simple shapes, but might not be correct for more complex models.

Audio rooms (entities with component `resonance-audio-room`) and audio sources (entities with component resonance-audio-src) have a one to many relationship, and only that relationship. Rooms do not have any influence on eachother. The same goes for audio sources and rooms that they are not descendants of, even if they are physically positioned within another audio room. Do not nest rooms. Furthermore, source entities don't have to be immediate room childs: in that case use the `room` property to point to the audio room.

Dynamically changing positioning and rotation of audio source or room container elements is not fully supported.

### Future work

- [ ] Hook the `HTMLMediaElement.srcObject` interface so no changes to original code are necessary (except for adding the components).
- [ ] Take scaling into account.
- [ ] Find a better method of calculating the bounding box in `resonance-audio-room-bb`.

## Credits

[![GitHub contributors][img-contributors-badge]][link-contributors]

<sub>**Original author Etienne Pinchon.**</sub>  
<sup>aframe-resonance-audio-component was forked from [etiennepinchon/aframe-resonance]</sup>

<sub>**Google Resonance Audio project.**</sub>  
<sup>aframe-resonance-audio-component is based on [Google Resonance Audio project][link-resonance-audio]</sub>

<!-- images -->
[img-build-linux-badge]: https://github.com/mkungla/aframe-resonance-audio-component/actions/workflows/linux.yml/badge.svg
[img-build-macos-badge]: https://github.com/mkungla/aframe-resonance-audio-component/actions/workflows/macos.yml/badge.svg
[img-build-windows-badge]: https://github.com/mkungla/aframe-resonance-audio-component/actions/workflows/windows.yml/badge.svg
[img-bundle-size-min-badge]: https://img.shields.io/bundlephobia/min/aframe-resonance-audio-component?style=flat-square
[img-bundle-size-minzip-badge]: https://img.shields.io/bundlephobia/minzip/aframe-resonance-audio-component?style=flat-square
[img-codacy-badge]: https://app.codacy.com/project/badge/Grade/22954e84e25844d4bc615cfc0c298638
[img-codeql-badge]: https://github.com/mkungla/aframe-resonance-audio-component/actions/workflows/codeql-analysis.yml/badge.svg
[img-contributors-badge]: https://img.shields.io/github/contributors/mkungla/aframe-resonance-audio-component?style=flat-square
[img-jsdelivr-badge]: https://img.shields.io/jsdelivr/npm/hy/aframe-resonance-audio-component?style=flat-square
[img-license-badge]: https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square
[img-npm-download-badge]: https://img.shields.io/npm/dt/aframe-resonance-audio-component?style=flat-square
[img-npm-version-badge]: https://img.shields.io/npm/v/aframe-resonance-audio-component?style=flat-square



[img-aframe-badge]: https://img.shields.io/badge/a--frame-1.2.0-FC3164.svg?style=flat-square

<!-- links -->
[link-aframe]: https://aframe.io/
[link-build-linux]: https://github.com/mkungla/aframe-resonance-audio-component/actions/workflows/linux.yml
[link-build-macos]: https://github.com/mkungla/aframe-resonance-audio-component/actions/workflows/macos.yml
[link-build-windows]: https://github.com/mkungla/aframe-resonance-audio-component/actions/workflows/windows.yml
[link-codacy]: https://www.codacy.com/gh/mkungla/aframe-resonance-audio-component/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=mkungla/aframe-resonance-audio-component&amp;utm_campaign=Badge_Grade
[link-codeql]: https://github.com/mkungla/aframe-resonance-audio-component/actions/workflows/codeql-analysis.yml
[link-contributors]: https://github.com/mkungla/aframe-resonance-audio-component/graphs/contributors
[link-etiennepinchon/aframe-resonance]: https://github.com/etiennepinchon/aframe-resonance
[link-gh-pages]: https://mkungla.github.io/aframe-resonance-audio-component/
[link-jsdelivr]: https://www.jsdelivr.com/package/npm/aframe-resonance-audio-component
[link-license]: ./LICENSE
[link-npm-package]: https://www.npmjs.com/package/aframe-resonance-audio-component
[link-resonance-audio]: https://developers.google.com/resonance-audio/
[link-web-api-mediastream]: https://developer.mozilla.org/en-US/docs/Web/API/MediaStream
[link-primitives-using-mediastream example]: ./docs/examples/primitives-using-mediastream.html



<!-- Links to resonance-audio -->
[DEFAULT_ROOM_DIMENSIONS]: https://github.com/resonance-audio/resonance-audio-web-sdk/blob/master/src/utils.js#L182
[DEFAULT_SPEED_OF_SOUND]: https://github.com/resonance-audio/resonance-audio-web-sdk/blob/master/src/utils.js#L80
[ROOM_MATERIAL_COEFFICIENTS]: https://github.com/resonance-audio/resonance-audio-web-sdk/blob/master/src/utils.js#L260
[DEFAULT_SOURCE_GAIN]: https://github.com/resonance-audio/resonance-audio-web-sdk/blob/master/src/utils.js#L37
[DEFAULT_MAX_DISTANCE]: https://github.com/resonance-audio/resonance-audio-web-sdk/blob/master/src/utils.js#L100
[DEFAULT_MIN_DISTANCE]: https://github.com/resonance-audio/resonance-audio-web-sdk/blob/master/src/utils.js#L96
[DEFAULT_DIRECTIVITY_ALPHA]: https://github.com/resonance-audio/resonance-audio-web-sdk/blob/master/src/utils.js#L107
[DEFAULT_DIRECTIVITY_SHARPNESS]: https://github.com/resonance-audio/resonance-audio-web-sdk/blob/master/src/utils.js#L114
[DEFAULT_SOURCE_WIDTH]: https://github.com/resonance-audio/resonance-audio-web-sdk/blob/master/src/utils.js#L143
[DEFAULT_ATTENUATION_ROLLOFF]: https://github.com/resonance-audio/resonance-audio-web-sdk/blob/master/src/utils.js#L92
[ATTENUATION_ROLLOFFS]: https://github.com/resonance-audio/resonance-audio-web-sdk/blob/master/src/utils.js#L86

[ra_setGain]: https://developers.google.com/resonance-audio/reference/web/Source#setGain
[ra_setMaxDistance]: https://developers.google.com/resonance-audio/reference/web/Source#setMaxDistance
[ra_setMinDistance]: https://developers.google.com/resonance-audio/reference/web/Source#setMinDistance
[ra_setDirectivityPattern]: https://developers.google.com/resonance-audio/reference/web/Source#setDirectivityPattern
[ra_setSourceWidth]: https://developers.google.com/resonance-audio/reference/web/Source#setSourceWidth
[ra_setRolloff]: https://developers.google.com/resonance-audio/reference/web/Source#setRolloff
[ra_Source]: https://developers.google.com/resonance-audio/reference/web/Source

<!-- other -->
[HTMLMediaElement]: https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement
[HTMLAudioElement]: https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement
[MediaElementAudioSourceNode]: https://developer.mozilla.org/en-US/docs/Web/API/MediaElementAudioSourceNode
[MediaStreamAudioSourceNode]: https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamAudioSourceNode
[MediaStream]: https://developer.mozilla.org/en-US/docs/Web/API/MediaStream
[AudioContext]: https://developer.mozilla.org/en-US/docs/Web/API/AudioContext
[ResonanceAudio]: https://developers.google.com/resonance-audio/reference/web/ResonanceAudio
[HTMLElement]: https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement
[THREE_Vector3]: https://github.com/mrdoob/three.js/blob/master/src/math/Vector3.js
[AComponent]: https://github.com/aframevr/aframe/blob/master/src/core/component.js
