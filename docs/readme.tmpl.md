# A-Frame Resonance Audio Component

**[👉 Live demo 👈][link-gh-pages]**

**With Resonance Audio, bring dynamic spatial sound into your A-Frame VR, AR experiences at scale.**

[![License][img-license-badge]][link-license]
[![A-Frame Version][img-aframe-badge]][link-aframe]

**Install**  
[![npm version][img-npm-version-badge]][link-npm-package]
[![npm package][img-npm-download-badge]][link-npm-package]

```
npm i -S aframe-resonance-audio-component
```

JS**DELIVR**  
[![A free CDN for Open Source][img-jsdelivr-badge]][link-jsdelivr]

**Use in version v<%= version %>**
```html
<script src="https://cdn.jsdelivr.net/npm/aframe-resonance-audio-component@<%= version %>/dist/aframe-resonance-audio-component.min.js"></script>
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

[![Codacy Badge][img-codacy-badge]][link-codacy]

## Notes
Support for custom positioning and rotation for the audio room is omitted due to the necessity to propagate positioning and rotation calculations to its audio source children and the complexities involved with that.

The visuals are now a simple box wireframe for the audio room and a simple sphere wireframe for the audio source. The box is how Google Resonance actually considers the room and all involved calculations, so other or more complex shapes are not possible (yet). Future work for the audio source visualization might take into account its parameters, such as the directivity pattern and source width.

The audio seems to continue to propagate to infinity outside of an audio room when the default directivity pattern is set.

The bounding box feature isn't perfect yet. It currently takes the dimensions of the entity's bounding box and assumes the center point of the entity is the same as the center point of the audio room. This is correct for simple shapes, but might not be correct for more complex models.

Audio rooms (entities with component `resonance-audio-room`) and audio sources (entities with component resonance-audio-src) have a one to many relationship, and only that relationship. Rooms do not have any influence on eachother. The same goes for audio sources and rooms that they are not descendants of, even if they are physically positioned within another audio room. Do not nest rooms. Furthermore, source entities don't have to be immediate room childs: in that case use the `room` property to point to the audio room.

Dynamically changing positioning and rotation of audio source or room container elements is not fully supported.

### Future work
- Hook the `HTMLMediaElement.srcObject` interface so no changes to original code are necessary (except for adding the components).
- Take scaling into account.
- Find a better method of calculating the bounding box in `resonance-audio-room-bb`.

## Credits

![[GitHub contributors][img-contributors-badge]][link-contributors]

<sub>**Original author Etienne Pinchon.**</sub>  
<sup>aframe-resonance-audio-component was forked from [etiennepinchon/aframe-resonance]</sup>

<sub>**Google Resonance Audio project.**</sub>  
<sup>aframe-resonance-audio-component is based on [Google Resonance Audio project][link-resonance-audio]</sub>



<!-- images -->
<% for (var image in images) { %>
[img-<%= image %>]: <%= images[image] %><% } %>

<!-- links -->
<% for (var link in links) { %>
[link-<%= link %>]: <%= links[link] %><% } %>
