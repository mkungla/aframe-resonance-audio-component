# A-Frame Resonance Audio Component
**Rich, Immersive, Audio [👉 Live demo 👈][gh-pages-link]**  


| Linux | macOS | Windows |
| --- | --- | --- |
| [![TravisCI Build Status][travis-img]][travis-link] | - | [![AppveyorCI Build Status][appveyor-img]][appveyor-link] |

[![Project License][license-img]][license-link]
[![Grade Badge][codacy-grade-img]][codacy-grade-link]
[![Dependencies][dep-status-img]][dep-status-link]
[![Dev Dependencies][devdep-status-img]][devdep-status-link]


> With Resonance Audio, bring dynamic spatial sound into your A-Frame VR, AR experiences at scale.

[Google Resonance](https://developers.google.com/resonance-audio/) works with audio rooms and audio sources. The acoustics of each source are affected by the room it is in. For that purpose, this package provides three components:
- resonance-audio-room
- resonance-audio-room-bb
- resonance-audio-src

These can be used as primitives (using the `a-` prefix) or as attributes, except resonance-audio-room-bb: it calculates the bounding box of an entity and considers that as the room. It can thus not be used as a primitive.

The audio source can also be a [MediaStream](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream).

# Declarative usage
Basic usage is quite simple and works just like any other A-Frame component. Don't forget to point the `src` attribute to the correct element or resource.

Example with basic usage with primitives:
```html
<a-scene>
  <a-assets>
    <audio id="track" src="assets/audio/track.mp3"></audio>
  </a-assets>
  <a-resonance-audio-room
    visualize="true"    position="0 0 -5"          width="40" height="4" depth="4"
    ambisonic-order="3" speed-of-sound="343"
    left="brick-bare"   right="curtain-heavy"      front="plywood-panel"
    back="glass-thin"   down="parquet-on-concrete" up="acoustic-ceiling-tiles">
    <a-resonance-audio-src
      visualize="true"  position="-10 0 0"
      src="#track"      loop="true"        autoplay="true"></a-resonance-audio-src>
    <a-resonance-audio-src
      visualize="true"  position="10 0 0"
      src="#track"      loop="true"        autoplay="true"></a-resonance-audio-src>
  </a-resonance-audio-room>
</a-scene>
```

Example with entities, models and a bounding box room:
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
      left: brick-bare; right: transparent;        front: transparent;
      back: brick-bare; down: parquet-on-concrete; up: transparent">
    <a-entity
      position="-1.5 -0.5 1.8"
      resonance-audio-src="
        visualize: true;
        src: #track; loop: true; autoplay: true;"></a-entity>
  </a-entity>
</a-scene>
```

# <a name="dynamicusage">Dynamic usage</a>
All properties can be changed dynamically. This allows for [MediaStream](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream)s to be set as audio sources.

Take the following example. A more comprehensive version is available in [examples/primitives-using-mediastream/](examples/primitives-using-mediastream/index.html).
```html
<a-scene>
  <a-assets>
    <audio id="track" src="assets/audio/track.mp3"></audio>
  </a-assets>
  <a-resonance-audio-room
    visualize="true"    position="0 0 -5"          width="4" height="4" depth="4"
    ambisonic-order="3" speed-of-sound="343"
    left="brick-bare"   right="curtain-heavy"      front="plywood-panel"
    back="glass-thin"   down="parquet-on-concrete" up="acoustic-ceiling-tiles">
    <a-resonance-audio-src
      id="audioSource"  visualize="true"   position="0 0 0"
      src="#track"      loop="true"        autoplay="true"></a-resonance-audio-src>
  </a-resonance-audio-room>
</a-scene>
```
When this is loaded, `track.mp3` plays indefinitely. Running the following javascript changes the source from `#track` to the passed [MediaStream](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream). A practical example of `stream` is a WebRTC stream.
```js
document.getElementById('audioSource').setAttribute('resonance-audio-src', 'src', stream)
```

# Installation

**npm**

```
npm install --save @digaverse/aframe-resonance-audio-component
# Or
yarn add @digaverse/aframe-resonance-audio-component
```

`import '@digaverse/aframe-resonance-audio-component'`

**from source**

1. Clone this repository.
2. Run `npm install` followed by `npm run build`.
3. Add `build/aframe-resonance-audio-component.js` to your html page.
4. Use the component like in one of the above examples.

# API
## resonance-audio-room
### Properties
| Property | Description | Default value | Values |
| -------- | ----------- | ------------- | ------ |
| `width`    | Width of the audio room (in meters). | [0](https://github.com/resonance-audio/resonance-audio-web-sdk/blob/master/src/utils.js#L182)
| `height`   | Height of the audio room (in meters). | [0](https://github.com/resonance-audio/resonance-audio-web-sdk/blob/master/src/utils.js#L182)
| `depth`    | Depth of the audio room (in meters). | [0](https://github.com/resonance-audio/resonance-audio-web-sdk/blob/master/src/utils.js#L182)
| `ambisonicOrder` | Ambisonic order of the audio room. | [1](https://github.com/resonance-audio/resonance-audio-web-sdk/blob/master/src/utils.js#L136)
| `speedOfSound` | Speed of sound within the audio room (in meters per second). | [343](https://github.com/resonance-audio/resonance-audio-web-sdk/blob/master/src/utils.js#L80)
| `left`     | Material of the left room wall.  | `brick-bare` | [room materials](https://github.com/resonance-audio/resonance-audio-web-sdk/blob/master/src/utils.js#L260)
| `right`     | Material of the right room wall.  | `brick-bare` | [room materials](https://github.com/resonance-audio/resonance-audio-web-sdk/blob/master/src/utils.js#L260)
| `front`     | Material of the front room wall.  | `brick-bare` | [room materials](https://github.com/resonance-audio/resonance-audio-web-sdk/blob/master/src/utils.js#L260)
| `back`     | Material of the back room wall.  | `brick-bare` | [room materials](https://github.com/resonance-audio/resonance-audio-web-sdk/blob/master/src/utils.js#L260)
| `left`     | Material of the room floor.  | `brick-bare` | [room materials](https://github.com/resonance-audio/resonance-audio-web-sdk/blob/master/src/utils.js#L260)
| `up`     | Material of the room ceiling.  | `brick-bare` | [room materials](https://github.com/resonance-audio/resonance-audio-web-sdk/blob/master/src/utils.js#L260)
| `visualize` | Show a wireframe box visualization of the audio room.  | false
### Members
Accessible via `entity.components['resonance-audio-room'].<member>`.

| Name | Description | Type |
| - | - | - |
| `audioContext` | The audio context used by Google Resonance. | [AudioContext](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext)
| `resonanceAudioScene` | The reference to the Google Resonance instance managing the audio in this room. | [ResonanceAudio](https://developers.google.com/resonance-audio/reference/web/ResonanceAudio)
| `sources` | A collection of the attached audio source components. | array of resonance-audio-src component instances |
| `visualization` | A reference to the visualized A-Frame entity. That element has a reference to the original room via its `audioRoom` property. | HTMLElement & [AEntity](https://github.com/aframevr/aframe/blob/master/src/core/a-entity.js) & [ANode](https://github.com/aframevr/aframe/blob/master/src/core/a-node.js)
| `el.audioSources` | Returns sources. | array of resonance-audio-src component instances |
| `el.sounds` | A collection of the origins of the attached audio sources. | array of [HTMLMediaElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement) and/or [MediaStream](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream) objects |

## resonance-audio-src
### Properties
| Property | Description | Default value | Values |
| -------- | ----------- | ------------- | ------ |
| `src` | The source of the audio. This can be a [HTMLMediaElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement) (`<audio />` or `<video />`), [MediaStream](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream), an ID string pointing to a [HTMLMediaElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement) or a resouce string. If a resource string is passed, the resource is loaded in the `<audio />` element accessible via the `defaultAudioEl` member. Note that you can not set the same [HTMLMediaElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement) on multiple entities with the `resonance-audio-src` component (globally!). | |
| `loop` | Whether to loop the element source. Overwrites the value set by the input element. | true |
| `autoplay` | Whether to autoplay the element source. Overwrites the value set by the input element. | true |
| [`gain`](https://developers.google.com/resonance-audio/reference/web/Source#setGain) | Source's gain (linear). | [1](https://github.com/resonance-audio/resonance-audio-web-sdk/blob/master/src/utils.js#L37)
| [`maxDistance`](https://developers.google.com/resonance-audio/reference/web/Source#setMaxDistance) | Source's maximum distance (in meters). | [1000](https://github.com/resonance-audio/resonance-audio-web-sdk/blob/master/src/utils.js#L100)
| [`minDistance`](https://developers.google.com/resonance-audio/reference/web/Source#setMinDistance) | Source's minimum distance (in meters). | [1](https://github.com/resonance-audio/resonance-audio-web-sdk/blob/master/src/utils.js#L96)
| [`directivityPattern`](https://developers.google.com/resonance-audio/reference/web/Source#setDirectivityPattern) | Source's directivity pattern where the [first number is the alpha](https://github.com/resonance-audio/resonance-audio-web-sdk/blob/master/src/utils.js#L107) and [the second is the sharpness](https://github.com/resonance-audio/resonance-audio-web-sdk/blob/master/src/utils.js#L114). An alpha of 0 is an omnidirectional pattern, 1 is a bidirectional pattern, 0.5 is a cardiod pattern. The sharpness of the pattern is increased exponentially. | `0 1` <br> or in [Vector3](https://github.com/mrdoob/three.js/blob/master/src/math/Vector3.js) format: `{x:0, y:1}`
| [`sourceWidth`](https://developers.google.com/resonance-audio/reference/web/Source#setSourceWidth) | The source width (in degrees), where 0 degrees is a point source and 360 degrees is an omnidirectional source. | [0](https://github.com/resonance-audio/resonance-audio-web-sdk/blob/master/src/utils.js#L143)
| [`rolloff`](https://developers.google.com/resonance-audio/reference/web/Source#setRolloff) | Source's rolloff model. | [`logarithmic`](https://github.com/resonance-audio/resonance-audio-web-sdk/blob/master/src/utils.js#L92) | [`logarithmic` \| `linear` \| `none`](https://github.com/resonance-audio/resonance-audio-web-sdk/blob/master/src/utils.js#L86)
| `position` | The position in local coordinates. If set, this position will be used instead of the entity's position component. Revert to the entity's position by setting this property to any invalid position (such as `null`). | { }
| `rotation` | The rotation in local degrees. If set, this rotation will be used instead of the entity's rotation component. Revert to the entity's rotation by setting this property to any invalid rotation (such as `null`). | { }
| `visualize` | Show a wireframe sphere visualization of the audio source. Its radius equals the minDistance. | false

### Members
Accessible via `entity.components['resonance-audio-src'].<member>`.

| Name | Description | Type |
| - | - | - |
| `room` | The audio room component. | [AComponent](https://github.com/aframevr/aframe/blob/master/src/core/component.js)
| `connected.element` | Whether the audio of this source comes from an [HTMLMediaElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement). | boolean
| `connected.stream` | Whether the audio of this source comes from a [MediaStream](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream). | boolean
| `sound` | The current connected [HTMLMediaElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement) or [MediaStream](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream) instance. | [HTMLMediaElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement) \| [MediaStream](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream)
| `resonance` | Reference to the Google Resonance audio source | [Source](https://developers.google.com/resonance-audio/reference/web/Source)
| `defaultAudioEl` | The audio element used when a resource string is set as the source. | [HTMLAudioElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement)
| `mediaAudioSourceNodes` | A collection of references to sources (so they can be reused). | mapping of [HTMLMediaElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement) to [MediaElementAudioSourceNode](https://developer.mozilla.org/en-US/docs/Web/API/MediaElementAudioSourceNode) and [MediaStream](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream) to [MediaStreamAudioSourceNode](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamAudioSourceNode)
| `visualization` | A reference to the visualized A-Frame entity. The element has a back-reference to the original audio source via its `audioSrc` property. | HTMLElement & [AEntity](https://github.com/aframevr/aframe/blob/master/src/core/a-entity.js) & [ANode](https://github.com/aframevr/aframe/blob/master/src/core/a-node.js)


# Notes
Support for custom positioning and rotation for the audio room is omitted due to the necessity to propagate positioning and rotation calculations to its audio source children and the complexities involved with that.

The visuals are now a simple box wireframe for the audio room and a simple sphere wireframe for the audio source. The box is how Google Resonance actually considers the room and all involved calculations, so other or more complex shapes are not possible (yet). Future work for the audio source visualization might take into account its parameters, such as the directivity pattern and source width.

The audio seems to continue to propagate to infinity outside of an audio room.

The visualized entities are added to the root scene so they are not affected by parent entities. This has the disadvantage that they don't get properly repositioned when parent entities are. This will be solved in future work.

The bounding box feature isn't perfect yet. It currently takes the dimensions of the entity's bounding box and assumes the center point of the entity is the same as the center point of the audio room. This is correct for simple shapes, but might not be correct for more complex models.

Audio rooms (entities with component resonance-audio-room) and audio sources (entities with component resonance-audio-src) have a one to many relationship, and only that relationship. Rooms do not have any influence on eachother. The same goes for audio sources and rooms that they are not descendants of, even if they are physically positioned within another audio room. Do not nest rooms. Furthermore, source entities don't have to be immediate room childs, but can be deeper descendants (except when dynamically adding entities with the resonance-audio-src component).


### Future work
- Allow attaching audio sources to audio rooms irrespective of the A-Frame entity hierarchy.
- Hook the `HTMLMediaElement.srcObject` interface so no changes to original code are necessary (except for adding the components).
- Take scaling into account.
- Add event that emits when an audio source is attached to an audio room.
- Make the visualization entity a child instead of a root entity.
- Find a better method of calculating the bounding box in `resonance-audio-room-bb`.

***

**Credits:**

<sub>**Original author Etienne Pinchon.**</sub>  
<sup>aframe-resonance-audio-component was forked from [etiennepinchon/aframe-resonance]</sup>  

<sub>**Google Resonance Audio project.**</sub>  
<sup>aframe-resonance-audio-component is based on [Google Resonance Audio project][resonance-audio-link]</sub>

<!-- links -->
[etiennepinchon/aframe-resonance]: https://github.com/etiennepinchon/aframe-resonance
[resonance-audio-link]: https://developers.google.com/resonance-audio/

[gh-pages-link]: https://digaverse.github.io/aframe-resonance-audio-component/

<!-- travis-ci -->
[travis-img]: https://travis-ci.org/digaverse/aframe-resonance-audio-component.svg?branch=master
[travis-link]: https://travis-ci.org/digaverse/aframe-resonance-audio-component

<!-- appveyor -->
[appveyor-img]: https://ci.appveyor.com/api/projects/status/44hwcfb3i05mhq7f/branch/master?svg=true
[appveyor-link]: https://ci.appveyor.com/project/mkungla/aframe-resonance-audio-component

<!-- License -->
[license-img]: https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square
[license-link]: https://raw.githubusercontent.com/digaverse/aframe-resonance-audio-component/master/LICENSE

<!-- Codacy Badge Grade -->
[codacy-grade-img]: https://api.codacy.com/project/badge/Grade/91449b55485b4f83810e1ce1aff33e7e
[codacy-grade-link]: https://www.codacy.com/app/mkungla/aframe-resonance-audio-component?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=digaverse/aframe-resonance-audio-component&amp;utm_campaign=Badge_Grade

<!-- Dependencies -->
[dep-status-img]: https://david-dm.org/digaverse/aframe-resonance-audio-component/status.svg
[dep-status-link]: https://david-dm.org/digaverse/aframe-resonance-audio-component#info=dependencies

[devdep-status-img]: https://david-dm.org/digaverse/aframe-resonance-audio-component/dev-status.svg
[devdep-status-link]: https://david-dm.org/digaverse/aframe-resonance-audio-component?type=dev
