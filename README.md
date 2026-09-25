# The One-Man Farm — films

Two films for **The Farmers of Great Nicobar**, built from the "One-Man Farm" vision
document. Everything is code: the visuals are HTML/SVG/Canvas driven by JavaScript,
Playwright renders every frame, ffmpeg encodes the result, and the music and sound
design are synthesised in JavaScript.

| Film | Output | Length | Style |
|------|--------|--------|-------|
| **Animated explainer** | `out/one-man-farm-explainer.mp4` | ~3:04 | Illustrated, narrated, one farm that changes over time |
| Pitch cut (first version) | `out/one-man-farm.mp4` | 1:45 | Kinetic typography, cut to a 120 BPM beat |

Both are 1920×1080, 30 fps, H.264 + AAC.

---

## Animated explainer

A narrated walk through one farm on Great Nicobar: today's manual work, the One-Man
Farm idea, irrigation, harvesting robots, crop-specific tools, under-canopy spraying,
an ecosystem of small machines, why big machinery doesn't fit small farms, data as the
farm's memory, AI coordination, seeds bred for one farm, and the opportunity beyond our
own fields.

### Voiceover

The film ships with a synthetic narrator (Kokoro, an open-source neural voice). To use
your own voice:

1. Read `explainer/NARRATION.md`. Each line has an ID (`o1`, `o2`, …).
2. Record each line as its own file in `explainer/vo-recorded/`, named by ID
   (`o1.m4a`, `o2.wav`, …). Any common format works; silence at the ends is trimmed.
3. Run `npm run explainer:build`.

The animation is timed to the narration, not to fixed seconds: every label, camera move
and robot action is keyed to the moment a word is spoken. A slower or faster read
re-times the whole film automatically. You can replace some lines and keep the
synthetic voice for others.

To change the words, edit `explainer/narration.json` and re-run `npm run explainer:build`.
Visual cues look up words by text (e.g. the harvest arm cuts on the word "cut"), so if you
remove a word a scene is keyed to, the build tells you which one.

### Build

```bash
npm install
pip install kokoro-onnx soundfile      # only needed for synthetic narration
# Kokoro model files (only needed for synthetic narration):
#   build/tts/kokoro-v1.0.onnx, build/tts/voices-v1.0.bin
#   from https://github.com/thewh1teagle/kokoro-onnx/releases (model-files-v1.0)
npm run explainer:build                # voice → timing → soundtrack → render
```

Individual steps:

```bash
npm run explainer:voice                # narration WAVs + explainer/timing.json
npm run explainer:audio                # music + sound design + voice → build/explainer-soundtrack.wav
npm run explainer:render               # frames → out/one-man-farm-explainer.mp4
npm run explainer:render -- --fps 10 --out build/preview.mp4   # quick preview
npm run frames -- --page explainer --scene harvest              # review stills → build/frames
```

Live preview in a browser: `npm run preview`, then open `/explainer/?play`.

### How it's put together

```
explainer/
  narration.json          the script: scenes, lines, pauses, voice settings
  timing.json             generated: when each line starts and ends
  vo/                     generated narration takes (one WAV per line)
  index.html              stage, captions, vignette
  js/world.js             the Great Nicobar farm: sky, sea, hills, palms, rows, trellis
  js/rigs.js              animated rigs: people (jointed skeleton), harvest robot (IK arm),
                          drone, rover, task bots, tractor
  js/core.js              camera, labels, narration cues (word → time)
  js/scenes/*.js          one module per narration scene
  js/main.js              window.__seek(t), captions, cross-dissolves
scripts/
  voice.py                recorded or synthetic narration → timing.json
  explainer-audio.js      score (pad, marimba, bass, light percussion) ducked under the voice,
                          ambience and sound effects cued from the same word timings
  render.js               shared renderer (--page explainer)
```

---

## Pitch cut (first version)

```bash
npm run build                          # soundtrack + render → out/one-man-farm.mp4
npm run stills -- 12 27.5 64           # PNG frames at given times → build/stills
```

Sources live in `video/` (scenes, timeline in beats) and `scripts/audio.js`. Scene lengths
are defined in beats at 120 BPM; each scene exports `sfx` cues that drive both the sound
design and the camera shake on impacts.

---

Both films render deterministically: nothing uses CSS animations or timers, every frame
is a pure function of time, so frames render in parallel and any moment can be
inspected. Map positions in the pitch cut use real coordinates (Chennai ↔ Great Nicobar
≈1,600 km). Numbers on dashboards and labels (moisture, fruit sizes, "harvest in 2 days")
are illustrative, not measured data.
