// The end state montage, "one system", and the closing lockup.
import { h, s, box, words, chars, rise, sink, slam, exit, T, O, pr, E, lerp, clamp, draw, mark } from '../lib.js';
import { icon, drawIcon, helix } from '../art.js';

const stageSvg = (...kids) => s('svg', { class: 'abs', width: 1920, height: 1080, viewBox: '0 0 1920 1080', style: 'left:0;top:0' }, ...kids);

// ───────────────────────── the end state ─────────────────────────
const CARDS = [
  ['drop', 'Water', 'moves.'], ['nutrient', 'Nutrients', 'flow.'], ['eye', 'Machines', 'inspect.'],
  ['gripper', 'Robots', 'harvest.'], ['bug', 'Pests', 'detected.'], ['spray', 'Plants', 'treated.'],
  ['cart', 'Produce', 'moves.'], ['sensor', 'Sensors', 'observe.'], ['ai', 'AI', 'learns.'],
];
export const endstate = {
  sfx: [...CARDS.map((_, i) => [i, 'slam', 0.55 + (i % 3) * 0.12]), [9, 'impact', 0.7], [9, 'shimmer']],
  build(el) {
    const cards = CARDS.map(([ic, a, b2], i) => {
      const inv = i % 3 === 2;
      const ink = inv ? 'var(--bg)' : 'var(--ink)';
      const acc = inv ? 'var(--bg)' : 'var(--lime)';
      const ico = icon(ic, 380, acc, 1.4);
      const c = box(0, 0, { style: { width: '1920px', height: '1080px', background: inv ? 'var(--lime)' : 'transparent' } },
        box(140, 250, { class: 'mono', style: { fontSize: '22px', color: inv ? 'var(--bg)' : 'var(--dim)' } }, `The end state · 0${i + 1} / 09`),
        box(140, 300, { class: 'hl', style: { fontSize: '200px', fontWeight: 900, textTransform: 'uppercase', color: ink, lineHeight: 0.9, letterSpacing: '-0.045em' } },
          h('div', {}, a), h('div', { style: { color: acc } }, b2)),
        box(1360, 330, {}, ico));
      c._ico = ico;
      c._txt = c.children[1];
      return c;
    });
    const ticks = box(140, 880, { style: { display: 'flex', gap: '10px' } }, ...CARDS.map(() => h('i', { style: { width: '54px', height: '6px', background: 'var(--faint)', display: 'block' } })));
    const cv = h('canvas', { width: 1920, height: 1080, class: 'abs', style: { left: 0, top: 0 } });
    const tagG = box(0, 330, { class: 'tag', style: { width: '1920px', justifyContent: 'center' } }, 'And eventually');
    const g1 = words('_even the genetics adapt._', 'acc');
    const gBox = box(0, 380, { style: { width: '1920px', textAlign: 'center', fontSize: '170px' } }, g1);
    const gSub = box(0, 620, { class: 'mono', style: { width: '1920px', textAlign: 'center', fontSize: '20px', color: 'var(--dim)' } }, 'Crops increasingly adapted to the exact place they grow');
    el.append(cv, ...cards, ticks, tagG, gBox, gSub);
    return { root: el, cards, ticks: [...ticks.children], ticksBox: ticks, g: cv.getContext('2d'), tagG, g1, gSub };
  },
  update(b, c) {
    const k = Math.floor(b);
    c.cards.forEach((card, i) => {
      const on = i === k && b < 9;
      card.style.display = on ? '' : 'none';
      if (!on) return;
      const p = pr(b, i, 0.35);
      T(card._txt, { s: 1.1 - 0.1 * p, x: (1 - p) * -30, blur: (1 - p) * 10 });
      T(card._ico.parentElement, { s: 0.85 + 0.15 * p, r: (1 - p) * -8 });
      drawIcon(card._ico, pr(b, i, 0.7, E.outCubic));
    });
    c.ticks.forEach((t, i) => (t.style.background = i < k || (i === k && b < 9) ? (k % 3 === 2 && b < 9 ? 'var(--bg)' : 'var(--lime)') : k % 3 === 2 && b < 9 ? 'rgba(6,17,12,0.25)' : 'var(--faint)'));
    O(c.ticksBox, b < 9 ? 1 : 0);
    const g = c.g;
    g.clearRect(0, 0, 1920, 1080);
    if (b >= 9) {
      helix(g, { cx: 960, cy: 820, height: 1700, amp: 70, phase: b * 1.4, reveal: pr(b, 9, 1.2), alpha: 0.35, n: 48, horizontal: true });
    }
    O(c.tagG, pr(b, 9, 0.4));
    rise(c.g1, b, 9.1, { stagger: 0.1, dur: 1 });
    O(c.gSub, pr(b, 10, 0.5));
    exit(c.root, b, 11.7, 0.3);
  },
};

// ───────────────────────── one system ─────────────────────────
const PARTS = ['Agriculture', 'Robotics', 'AI', 'Biotechnology', 'Mechanisation', 'Data'];
const SCATTER = [[250, 330], [1420, 290], [1560, 690], [230, 760], [1180, 880], [700, 880]];
const OC = { x: 960, y: 590 }, OR = 300, ORX = 480;
export const onesystem = {
  sfx: [...PARTS.map((_, i) => [0.5 + i * 0.25, 'blip', 1 + i * 0.1]), [3, 'sweep'], [5, 'hit', 0.9], [6.8, 'hit', 0.6], [6.5, 'riser', 3.5]],
  build(el) {
    const top1 = words('Not a farm without workers.', 'hl');
    const top2 = words('A farm that *thinks.*', 'hl');
    const t1 = box(0, 150, { style: { width: '1920px', textAlign: 'center', fontSize: '76px', color: 'var(--dim)' } }, top1);
    const t2 = box(0, 140, { style: { width: '1920px', textAlign: 'center', fontSize: '100px' } }, top2);
    const ring = s('ellipse', { cx: OC.x, cy: OC.y, rx: ORX, ry: OR, fill: 'none', stroke: 'rgba(200,255,77,0.5)', 'stroke-width': 2, pathLength: 1 });
    const spokes = PARTS.map(() => s('line', { stroke: 'rgba(200,255,77,0.25)', 'stroke-width': 1.5 }));
    const dot = s('circle', { cx: OC.x, cy: OC.y, r: 0, fill: 'var(--lime)' });
    const parts = PARTS.map((p) => box(0, 0, { class: 'chip lime', style: { fontSize: '22px', padding: '10px 18px', background: 'var(--bg)' } }, p));
    const one = words('One *system.*', 'hl');
    const oneBox = box(0, OC.y - 58, { style: { width: '1920px', textAlign: 'center', fontSize: '110px' } }, one);
    el.append(stageSvg(ring, ...spokes, dot), ...parts, t1, t2, oneBox);
    return { root: el, top1, top2, ring, spokes, dot, parts, one };
  },
  update(b, c) {
    rise(c.top1, b, 0, { stagger: 0.05 });
    if (b >= 6.6) sink(c.top1, b, 6.6);
    rise(c.top2, b, 6.9, { stagger: 0.1, dur: 1 });
    draw(c.ring, pr(b, 3.4, 1.2, E.inOutCubic));
    const conv = pr(b, 3, 1.6, E.inOutCubic);
    const spin = b * 5;
    c.parts.forEach((p, i) => {
      const w = p.offsetWidth || 200, hh = p.offsetHeight || 46;
      const [sx, sy] = SCATTER[i];
      const drift = (1 - conv) * 12;
      const a = ((-90 + i * 60 + spin) * Math.PI) / 180;
      const rx = OC.x + Math.cos(a) * ORX, ry = OC.y + Math.sin(a) * OR;
      const x = lerp(sx + Math.sin(b * 1.3 + i) * drift, rx, conv) - w / 2;
      const y = lerp(sy + Math.cos(b * 1.1 + i) * drift, ry, conv) - hh / 2;
      const ap = pr(b, 0.5 + i * 0.25, 0.5, E.outBack);
      p.style.left = x.toFixed(1) + 'px'; p.style.top = y.toFixed(1) + 'px';
      T(p, { s: ap, o: clamp((b - 0.5 - i * 0.25) * 4) });
      const sp = c.spokes[i];
      sp.setAttribute('x1', OC.x); sp.setAttribute('y1', OC.y);
      sp.setAttribute('x2', lerp(OC.x, rx, pr(b, 4.4, 0.6))); sp.setAttribute('y2', lerp(OC.y, ry, pr(b, 4.4, 0.6)));
      sp.style.opacity = pr(b, 4.4, 0.4);
    });
    c.dot.setAttribute('r', 8 * pr(b, 4.2, 0.4, E.outBack));
    O(c.dot, 1 - pr(b, 4.9, 0.3));
    rise(c.one, b, 5, { stagger: 0.12, dur: 1 });
    exit(c.root, b, 9.6, 0.4, { blur: 14, s: 1.06 });
  },
};

// ───────────────────────── outro lockup ─────────────────────────
export const outro = {
  sfx: [[0, 'impact', 1.3], [0.2, 'shimmer']],
  build(el) {
    const mk = box(900, 190, {}, mark(120));
    const pre = words('The Farmers of Great Nicobar', 'mono');
    const preBox = box(0, 352, { style: { width: '1920px', textAlign: 'center', fontSize: '22px', letterSpacing: '0.34em' } }, pre);
    const the = chars('The', 'serif');
    const big = chars('ONE-MAN FARM', 'hl');
    big._w.slice(0, 7).forEach((x) => x.classList.add('acc'));
    const row = box(0, 400, { style: { width: '1920px', textAlign: 'center', whiteSpace: 'nowrap' } },
      h('span', { class: 'serif acc', style: { fontSize: '140px', marginRight: '22px', display: 'inline-block' } }, the),
      h('span', { style: { fontSize: '170px', fontWeight: 900, letterSpacing: '-0.05em', display: 'inline-block' } }, big));
    const bar = box(560, 612, { style: { width: '800px', height: '5px', background: 'var(--lime)', transformOrigin: '50% 50%' } });
    const tl = words('_Designed for the realities of smaller farms._', 'dim');
    const tlBox = box(0, 650, { style: { width: '1920px', textAlign: 'center', fontSize: '56px', color: 'var(--ink)' } }, tl);
    const sub = box(0, 770, { class: 'mono', style: { width: '1920px', textAlign: 'center', fontSize: '18px', color: 'var(--dim)' } }, 'From labour-intensive work to a continuously learning system');
    const coords = box(0, 960, { class: 'mono', style: { width: '1920px', textAlign: 'center', fontSize: '15px', color: 'rgba(243,239,227,0.35)' } }, '07°00′N  093°56′E  ·  Great Nicobar Island  ·  Andaman & Nicobar');
    el.append(mk, preBox, row, bar, tlBox, sub, coords);
    return { root: el, mk, pre, the, big, bar, tl, sub, coords, grid: 0.5 };
  },
  update(b, c) {
    const mp = pr(b, 0, 0.9, E.outBack);
    T(c.mk, { s: mp, r: (1 - mp) * -90, o: clamp(b * 4) });
    rise(c.pre, b, 0.3, { stagger: 0.04 });
    rise(c.the, b, 0.5, { stagger: 0.05, dur: 1.2 });
    rise(c.big, b, 0.6, { stagger: 0.045, dur: 1.2 });
    T(c.bar, { sx: pr(b, 1.8, 1.2, E.inOutExpo) });
    rise(c.tl, b, 2.4, { stagger: 0.05, dur: 1 });
    O(c.sub, pr(b, 3.4, 0.6));
    O(c.coords, pr(b, 3.8, 0.6));
  },
};
