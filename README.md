# The One-Man Farm — vision film

A 1:45 motion-graphics film for **The Farmers of Great Nicobar**, built from the
"One-Man Farm" vision document. Everything is code: the visuals are HTML/SVG/Canvas
driven by JavaScript, Playwright renders every frame, and ffmpeg encodes the result.
The soundtrack is synthesised in JavaScript as well, from the same beat grid the
visuals are cut to.

**Output:** `out/one-man-farm.mp4` (1920×1080, 30 fps, H.264 + AAC, loudness-normalised to −14 LUFS)

## Structure of the film

| # | Section | What it says |
|---|---------|--------------|
| — | Cold open | Farming runs on hands. What if it didn't? |
| — | Title | The One-Man Farm: fully automated, data-driven agriculture |
| 00 | The vision | Not one person doing every job. Human labour largely disappears; machines, sensors and software form one system |
| 01 | Automate the physical | Irrigation and fertigation (the easy part) · harvesting (identify → collect) · six crops, six problems · drones vs. under-canopy spraying · an ecosystem of specialised machines |
| 02 | Built for small farms | Machinery built for vast flat fields vs. irregular, hilly 3–10 acre plots · "How do we bring industrial productivity to a five-acre farm?" |
| 03 | Crops built for one farm | Seeds bred for regions, not farms (Chennai ↔ Great Nicobar) · personalised medicine for crops · precision crop development |
| 04 | Data is the foundation | Every machine is also a sensor · the farm starts to remember |
| 05 | Agricultural intelligence | Machines → capability, sensors → observation, data → memory, AI → coordination |
| 06 | The larger opportunity | Labour problem → engineering problem → product → data → a smarter system |
| — | End state | Nine beats of full automation, genetics that adapt, "one system", closing lockup |

## Build it

Requires Node 18+ and ffmpeg on `PATH`. Playwright uses its bundled Chromium.

```bash
npm install
npx playwright install chromium   # skip if a Chromium is already provisioned
npm run build                      # soundtrack + full render → out/one-man-farm.mp4
```

Other commands:

```bash
npm run audio                                   # regenerate build/soundtrack.wav only
npm run render -- --fps 10 --out build/prev.mp4 # fast low-fps preview
npm run render -- --from 18 --to 34             # render a section (seconds)
npm run stills -- 12 27.5 64                    # PNG frames at given times → build/stills
npm run stills -- --scene harvestA              # 8 frames across one scene
npm run preview                                 # live preview in a browser at /video/?play
```

## How it works

```
video/
  index.html, style.css     stage (1920×1080), fonts, HUD, grain, vignette
  js/timeline.js            BPM, scene order and lengths in beats — shared by visuals and audio
  js/lib.js                 easing, kinetic-type helpers (rise, slam, sink), DOM/SVG builders
  js/art.js                 vector art: leaves, crops, line icons, DNA helix
  js/scenes/*.js            one module per scene: build(), update(beat), sfx cues
  js/main.js                window.__seek(t): renders any frame as a pure function of time
scripts/
  audio.js                  synthesised score (kick, clap, hats, bass, pads, arp) + sound design
  render.js                 Playwright → CDP screenshots → ffmpeg, split across parallel workers
  stills.js                 review frames and contact sheets
  server.js                 tiny static server (ES modules need http://)
```

- **Deterministic frames.** No CSS animations or timers: every scene's `update()` is a
  pure function of the local beat, so frames can be rendered out of order and in parallel.
- **Cut to the beat.** Scene lengths are defined in beats at 120 BPM. Each scene exports
  `sfx` cues (`[beat, kind, amount]`) that drive both the sound design and the camera
  shake/flash on impacts, so hits land on the same frame as the visuals.
- **Editing text or timing.** Change copy inside the scene modules; change pacing by
  editing `beats` in `timeline.js`. Re-run `npm run build`.

Map positions in chapter 03 use real coordinates (Chennai 13.08°N 80.27°E, Great Nicobar
≈7.0°N 93.8°E, ≈1,600 km apart). Readouts on the dashboards (fruit counts, moisture,
dosages) are illustrative UI, not measured data.
