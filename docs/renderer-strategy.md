# CityLit renderer strategy

## Production: Three.js r187 and WebGL 2

The persistent `SceneCanvas` uses React Three Fiber v9 and Three.js's
`WebGLRenderer`. City and place galleries, the classic atlas's city chapters,
and the five category dioramas now share procedural Three.js geometry.
The existing Kimberley McGregor Museum hero remains a separately curated model.

GLSL shaders provide animated water, emissive effects and material variation.
Surface materials use physically based lighting; light sources, real silhouettes,
terrain profiles, architecture and detail geometry still matter more than a
renderer brand. Movement is demand-rendered (up to 30 fps) and honors reduced
motion, app animation pauses and page visibility. This is illustrative geometry,
not survey-accurate reconstruction of the referenced landmarks.

## Why we have not globally enabled WebGPU

Three.js's `WebGPURenderer` offers GPU compute and a TSL/node shader pipeline,
with a WebGL 2 fallback, but that renderer cannot run the existing GLSL
`ShaderMaterial` assets. CityLit also uses a shared R3F v9 canvas, where
`WebGLRenderer` remains the supported configuration. Changing the renderer
alone would break water shaders and potentially other addon materials.

A safe experiment should:
1. Create an isolated WebGPU preview with identical geometry and camera paths.
2. Port GLSL materials, custom post-processing and any third-party shaders
   to TSL/node materials before using `WebGPURenderer`.
3. Measure frame time, shader compilation, memory, draw calls and battery
   behavior on real iOS Safari and Android Chrome devices.
4. Verify WebGL 2 fallback, offline PWA behavior, context loss and reduced motion.
5. Ship an opt-in GPU path only when visually equivalent and measurably better.

Keep classic WebGL as the shipping default until these conditions are met.
Documentation: https://threejs.org/manual/pages/webgpurenderer
