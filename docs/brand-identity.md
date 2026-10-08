# Citylit — Every city has a spark

Citylit's promise is a small adventure led by curiosity. The voice is warm, brief and slightly surreal. Use “Follow a little curiosity” for an invitation, “Somewhere worth finding” for search, and “A spark for later” after saving. Keep names, addresses, accessibility facts and source details plain and precise.

Khwezi is an original, faceted springhare: ivory body, ink-blue feet and ear tips, blush ears, a luminous diamond and a long tail. The main 3D model is procedural Three.js geometry in `components/KhweziView.tsx`. Front, side and interactive pose references live at `/brand`. `KhweziMark.tsx` is the original vector counterpart used for compact UI, loading, icons and offline support. Province palettes and landmark models remain independent.

The welcome is dismissible and remembered on this device. Gesture guidance is optional. Only newly added saves trigger a short spark-catching moment; opening or restoring a saved collection does not celebrate. Offline readiness is announced only after the service worker confirms the downloaded text guide. The brand cache upgrade keeps venue photos from an earlier downloaded guide. If storage cannot fit a copy, activation completes and the old photo cache stays available as a fallback. Connection loss uses a separate message directing users to their downloaded guide. Sound starts off on every reload; the save cue is two quiet notes. Haptics are optional and gracefully degrade.

One root WebGL renderer serves the map, atmosphere and mascot through drei Views; no avatar creates another canvas. The model uses flat materials, small primitive meshes, no textures, no shadows and no postprocessing. Offscreen or hidden mascots stop requesting frames. Pause and essential-motion preferences apply across routes; system reduced motion keeps an expressive still pose. The root DOM vector remains available when WebGL cannot initialize. Camera controls listen inside the model viewport so caption swipes and UI gestures stay independent. Utility controls use one focus-trapped settings dialog; map planning, theme and saved discoveries remain directly accessible.

## Assets and the concept sheet

The custom wordmark has a diamond-shaped first “i” dot. The app icon is Khwezi's face, with dedicated 16/32px, Apple touch, 192/512px and maskable exports. Social sharing uses a 1200×630 PNG. `/brand` is the interactive concept page; `public/brand/concept-sheet.svg` and `.png` are standalone sheets with the wordmark, character, palette, day/night examples and three UI moments.

The vectors originate in the React component. To regenerate the static exports after changing a vector:

    pnpm brand:export

The export command compiles the vector component to a temporary local module, renders it with React and uses the Sharp version bundled with Next to rasterize PNGs. It needs no network connection or running app; the temporary module is removed after rendering. Check the face at favicon size and the maskable safe area. Check the live `/brand` model separately from the vector references. Do not hand-edit generated PNGs. The exports are original Citylit artwork; font licenses remain under `public/fonts`.

Brand colours: ivory `#F3EFE3`, ink `#17243C`, electric `#6558F5`, blush `#E9B2BA`, lantern amber `#F3C975`. Existing day/night tokens select accessible text and interactive colours; decorative character colours do not replace those tokens. Saved sparks pick up the active destination's accent while the character's body stays consistent.
