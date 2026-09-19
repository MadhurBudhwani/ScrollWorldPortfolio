# Madhur’s Tower

Phones and narrow portrait windows open a separate vertical experience. A desktop page also enters the tower when resized into a mobile viewport or switched to mobile emulation, retaining its current chapter. Once in the tower, rotating the device keeps the same experience and floor. An explicit `experience=desktop` override stays on desktop. The options menu provides a desktop link.

- Force the tower: `index.html?experience=portrait`
- Jump to its doors: `index.html?experience=portrait#hub`
- Open a portrait world: `world.html?world=about&experience=portrait` (also `work`, `genai`, `hobbies`)
- Force the original experience: add `experience=desktop`.

`story-data.js` owns the original nine chapters for both experiences. `director.js` retains the desktop choreography. `portrait-scene.js` owns the tower’s canvas geometry, vertical world camera, avatar and mechanical companion. `portrait-app.js` owns touch navigation, chapter pages, music tour and station panels. `portrait.css` loads only in portrait mode.

Swipe up/down, use the arrow buttons or choose any floor from the header. Tap a scene or its main action to interact. Work, lunar experiments, hobby collections and About Me reuse their existing data and paged exhibit controllers. No game challenge gates the content. Skills appear in batches; long copy retains its font size and uses measured reading pages.

The guided tour starts only on the arrival floor and uses the supplied music. Its 141-second route uses continuous interpolation, prepares avatar sprites before starting, caps frame deltas and stops on manual navigation or when the page becomes hidden. Music stays off outside the tour.

About Me’s palm laser targets the nearest floor’s constellation. A random hit colour expires three seconds after impact, including while a panel is open.

Build the static output with `node scripts/content-index.cjs --build`.

Implementation was delivered without running tests or browser QA, at the owner’s request.
