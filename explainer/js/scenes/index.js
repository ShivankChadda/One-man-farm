import { open, idea, eco, data, ai, end } from './farm.js';
import { water, harvest, crops, spray } from './closeups.js';
import { small, seed, scale } from './ideas.js';

// One module per narration scene (ids match explainer/narration.json). Each exports:
//   build(el, cues) → ctx        create the scene once
//   update(t, ctx, cues)         draw scene-local time t (seconds); pure function of t
export const SCENES = { open, idea, water, harvest, crops, spray, eco, small, data, ai, seed, scale, end };
