// Single source of truth for timing. Imported by the browser (visuals)
// and by Node (soundtrack + renderer), so every cut lands on the beat.

export const W = 1920;
export const H = 1080;
export const FPS = 30;
export const BPM = 120;
export const BEAT = 60 / BPM; // seconds per beat

// music: arrangement mode for scripts/audio.js
// chapter: label shown in the HUD while the scene is on screen
const DEFS = [
  { id: 'cold', beats: 10, music: 'cold' },
  { id: 'title', beats: 10, music: 'title' },
  { id: 'notone', beats: 6, music: 'A', chapter: '00 / The vision' },
  { id: 'system', beats: 10, music: 'A', chapter: '00 / The vision' },

  { id: 'ch1', type: 'chapter', beats: 2, music: 'B', n: '01', title: 'Automate / the physical.' },
  { id: 'water', beats: 10, music: 'B', chapter: '01 / Automate the physical' },
  { id: 'harvestA', beats: 12, music: 'B', chapter: '01 / Automate the physical' },
  { id: 'harvestB', beats: 8, music: 'B', chapter: '01 / Automate the physical' },
  { id: 'spray', beats: 10, music: 'B', chapter: '01 / Automate the physical' },
  { id: 'eco', beats: 8, music: 'B', chapter: '01 / Automate the physical' },

  { id: 'ch2', type: 'chapter', beats: 2, music: 'C', n: '02', title: 'Built for / small farms.' },
  { id: 'small', beats: 12, music: 'C', chapter: '02 / Built for small farms' },
  { id: 'question', beats: 8, music: 'Q', chapter: '02 / Built for small farms' },

  { id: 'ch3', type: 'chapter', beats: 2, music: 'D', n: '03', title: 'Crops built / for one farm.' },
  { id: 'seeds', beats: 18, music: 'D', chapter: '03 / Precision crops' },
  { id: 'precision', beats: 8, music: 'E', chapter: '03 / Precision crops' },

  { id: 'ch4', type: 'chapter', beats: 2, music: 'B', n: '04', title: 'Data is the / foundation.' },
  { id: 'data', beats: 12, music: 'B', chapter: '04 / Data' },

  { id: 'ch5', type: 'chapter', beats: 2, music: 'B', n: '05', title: 'Agricultural / intelligence.' },
  { id: 'intel', beats: 10, music: 'B', chapter: '05 / Intelligence' },

  { id: 'ch6', type: 'chapter', beats: 2, music: 'B', n: '06', title: 'The larger / opportunity.' },
  { id: 'flywheel', beats: 12, music: 'B', chapter: '06 / The opportunity' },

  { id: 'endstate', beats: 12, music: 'P', chapter: 'The end state' },
  { id: 'onesystem', beats: 10, music: 'R', chapter: 'The end state' },
  { id: 'outro', beats: 10, music: 'O' },
];

let acc = 0;
export const SCENES = DEFS.map((d) => {
  const s = { type: d.id, ...d, startBeat: acc, start: acc * BEAT, end: (acc + d.beats) * BEAT };
  acc += d.beats;
  return s;
});

export const TOTAL_BEATS = acc;
export const DURATION = acc * BEAT;
