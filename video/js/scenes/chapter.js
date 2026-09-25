// Chapter slam cards: a lime flash, a huge outlined number, a glitching title.
import { box, words, rise, T, O, pr, hash, exit } from '../lib.js';

export const chapter = {
  sfx: [[0, 'impact', 0.9], [0, 'glitch']],
  build(el, def) {
    const num = box(0, 150, {
      style: { right: '110px', fontSize: '640px', fontWeight: 900, letterSpacing: '-0.06em', lineHeight: 1, color: 'transparent', WebkitTextStroke: '3px var(--lime)', opacity: 0.9 },
    }, def.n);
    num.style.left = 'auto';
    const tag = box(140, 360, { class: 'tag' }, `Chapter ${def.n} / 06`);
    const mk = () => {
      const w = words(def.title, 'hl');
      return { w, el: box(140, 410, { style: { fontSize: '140px', lineHeight: 0.95 } }, w) };
    };
    const main = mk();
    const ghostA = mk(), ghostB = mk();
    ghostA.el.style.color = 'var(--coral)'; ghostA.el.style.mixBlendMode = 'screen';
    ghostB.el.style.color = 'var(--teal)'; ghostB.el.style.mixBlendMode = 'screen';
    el.append(num, tag, ghostA.el, ghostB.el, main.el);
    return { root: el, num, tag, main, ghostA, ghostB, seed: parseInt(def.n, 10) };
  },
  update(b, c, def) {
    const p = pr(b, 0, 0.5);
    T(c.num, { x: (1 - p) * 120, s: 1.15 - 0.15 * p, o: 0.9 * p });
    O(c.tag, pr(b, 0.05, 0.3));
    rise(c.main.w, b, 0, { stagger: 0.05, dur: 0.6 });
    const g = b < 0.4;
    for (const [gh, dir] of [[c.ghostA, 1], [c.ghostB, -1]]) {
      rise(gh.w, b, 0, { stagger: 0.05, dur: 0.6 });
      if (g) {
        const f = Math.floor(b * 24);
        const top = hash(f + c.seed * 13 + dir) * 70;
        gh.el.style.clipPath = `inset(${top}% 0 ${Math.max(0, 100 - top - 18 - hash(f * 3 + dir) * 20)}% 0)`;
        T(gh.el, { x: dir * (10 + hash(f * 7 + dir) * 26), o: 0.9 });
      } else O(gh.el, 0);
    }
    exit(c.root, b, 1.72, 0.28, { blur: 6, y: -20 });
  },
};
