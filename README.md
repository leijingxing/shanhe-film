# 山河入梦 · A Living Landscape

A 180-second original real-time 3D Chinese landscape film. Version 2 replaces the original image slideshow with a continuous modeled river valley, cinematic cameras, independently animated objects and a synchronized original score.

## Run

Serve this folder over HTTP. No build step or external runtime CDN is required.

    python3 -m http.server 8000

Open http://localhost:8000. All runtime paths are relative and work on GitHub Pages.

## Film systems

- Sculpted, asymmetric 3D karst peaks with procedural ink/blue-green brush shading, atmospheric perspective and an opening terrain formation
- Real-time planar water reflections, moving wave patterns and a boat-local wake
- A modeled wooden boat, articulating oar and independently swaying pine trees
- Shader waterfall with falling spray, drifting mist and directional storm rain
- Deforming three-dimensional ink ribbons and articulated cranes
- Twelve composed camera shots across six acts, with foreground occlusion and full camera travel
- A deterministic 180-second stereo score synthesized locally: physical-model plucked strings, breath flute, drones, water, wind, percussion and thunder
- Pause, seek, chapter navigation, replay, mute, fullscreen, adaptive rendering quality and keyboard controls

## Playback

Click 入画 to play and permit audio. Audio preparation may take a few seconds on first use. Space toggles pause, M toggles sound, and the arrow keys move five seconds. Tab hiding automatically pauses playback. Reduced-motion preference disables the autoplay cover camera; the film remains opt-in and can be paused or scrubbed. No camera, microphone, account, tracking or paid API is used.

Modern WebGL 2 support is required. If unavailable, the page explains the requirement rather than silently replacing animation with still images. The quality button lowers render resolution while retaining the actual scene and movement.

## Development

    npm test

The timeline is deterministic; every rendered state is derived from film time. For diagnostic preview use `?qa=1&t=35`, which shows object/camera state and a camera-lock button. This allows a fixed-camera independent-motion check. `window.__film` also exposes the test transport.

## Attribution

Three.js 0.180.0 is vendored under its MIT license in vendor/THREE-LICENSE.txt. All scene geometry, shaders, animation, score, layout and writing are original to this project. The original AI paintings remain in assets and in v1 Git history. A limited portion of one painting supplies surface pigment and distant sky tone; it is mapped onto real geometry and never shown as a slideshow frame. No third-party recordings are used.
