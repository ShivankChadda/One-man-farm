import { cold, title, notone, system } from './intro.js';
import { chapter } from './chapter.js';
import { water, harvestA, harvestB, spray, eco } from './automate.js';
import { small, question, seeds, precision } from './vision.js';
import { data, intel, flywheel } from './intelligence.js';
import { endstate, onesystem, outro } from './finale.js';

// Scene modules keyed by timeline `type`. Each exports:
//   build(el, def) → ctx      create DOM once
//   update(beat, ctx, def)    pure function of local beat time
//   sfx                       [beat, kind, amount] cues for the soundtrack
export const MODS = {
  cold, title, notone, system, chapter,
  water, harvestA, harvestB, spray, eco,
  small, question, seeds, precision,
  data, intel, flywheel,
  endstate, onesystem, outro,
};
