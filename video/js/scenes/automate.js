// Chapter 01 — automating the physical work: irrigation, harvesting, spraying, everything else.
import { h, s, box, words, rise, slam, exit, T, O, pr, E, lerp, clamp, rng, draw, check, hash } from '../lib.js';
import { rosette, leaf, crop, icon, drawIcon, LEAF_COLORS } from '../art.js';

const stageSvg = (...kids) => s('svg', { class: 'abs', width: 1920, height: 1080, viewBox: '0 0 1920 1080', style: 'left:0;top:0' }, ...kids);

// ───────────────────────── water & nutrients ─────────────────────────
const ROWS = 6, COLS = 9;
const VALVE = (i) => 0.8 + i * 0.3;
const SPEED = 560; // px per beat
export const water = {
  sfx: [[0, 'whoosh'], ...Array.from({ length: ROWS }, (_, i) => [VALVE(i), 'blip', 1 + i * 0.12]), [0.8, 'water', 5], [5, 'stamp']],
  build(el) {
    const tag = box(140, 238, { class: 'tag', style: { color: 'var(--teal)' } }, 'Irrigation + fertigation');
    const hl = words('Water & / *nutrients.*', 'hl');
    const hlBox = box(140, 284, { style: { fontSize: '128px' } }, hl);
    const items = ['Drip lines to every plant.', 'Nutrients through the same pipes.', 'Sensors, valves, software.'].map((t, i) =>
      box(140, 560 + i * 62, { style: { fontSize: '36px', fontWeight: 600, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: '18px' } },
        h('span', { style: { width: '26px', height: '3px', background: 'var(--teal)', display: 'inline-block' } }), t));
    const stamp = box(140, 800, { class: 'chip solid', style: { fontSize: '26px', padding: '14px 24px', gap: '14px' } }, check(26, 'var(--bg)'), 'The easy part');

    const ox = 900, oy = 250;
    const g = s('g', { transform: `translate(${ox} ${oy})` });
    g.append(s('rect', { x: 0, y: 0, width: 880, height: 670, fill: 'rgba(243,239,227,0.02)', stroke: 'rgba(243,239,227,0.12)', 'stroke-width': 1.5 }));
    const main = s('path', { d: 'M30 0 V670', stroke: 'var(--teal)', 'stroke-width': 8, fill: 'none', pathLength: 1 });
    const rows = [];
    for (let i = 0; i < ROWS; i++) {
      const y = 60 + i * 110;
      const base = s('line', { x1: 30, y1: y, x2: 860, y2: y, stroke: 'rgba(61,224,192,0.25)', 'stroke-width': 3 });
      const flow = s('line', { x1: 30, y1: y, x2: 30, y2: y, stroke: 'var(--teal)', 'stroke-width': 4, 'stroke-dasharray': '14 12' });
      const valve = s('rect', { x: 20, y: y - 10, width: 20, height: 20, fill: '#1a2a24', stroke: 'var(--teal)', 'stroke-width': 2, transform: `rotate(45 30 ${y})` });
      const plants = [];
      for (let j = 0; j < COLS; j++) {
        const x = 110 + j * 92;
        const ripples = [0, 1].map(() => s('circle', { cx: x, cy: y, r: 10, fill: 'none', stroke: 'var(--teal)', 'stroke-width': 2 }));
        const pg = s('g', { transform: `translate(${x} ${y})` });
        const inner = rosette(30, i * COLS + j);
        pg.append(inner);
        g.append(...ripples);
        plants.push({ x, inner, ripples, tp: VALVE(i) + (x - 30) / SPEED });
      }
      g.append(base, flow);
      rows.push({ y, flow, valve, plants });
    }
    for (const r of rows) for (const p of r.plants) g.append(p.inner.parentNode);
    g.append(main, ...rows.map((r) => r.valve));
    const vis = h('div', { class: 'abs', style: { left: 0, top: 0, width: '1920px', height: '1080px', transformOrigin: '1340px 540px' } }, stageSvg(g));

    const panel = box(1450, 110, { class: 'card', style: { width: '330px', padding: '18px 22px', background: 'rgba(6,17,12,0.92)', borderColor: 'rgba(61,224,192,0.5)' } },
      h('div', { class: 'mono', style: { fontSize: '15px', color: 'var(--teal)' } }, 'Soil moisture'),
      h('div', { style: { height: '8px', background: 'var(--faint)', margin: '12px 0 14px', position: 'relative' } }, h('i', { style: { position: 'absolute', left: 0, top: 0, bottom: 0, background: 'var(--teal)', width: '0%' } })),
      h('div', { class: 'mono', style: { fontSize: '15px', display: 'flex', justifyContent: 'space-between' } }, h('span', { class: 'dim' }, 'Valves'), h('span', { class: 'vc' }, '0/6')),
      h('div', { class: 'mono', style: { fontSize: '15px', display: 'flex', justifyContent: 'space-between', marginTop: '6px' } }, h('span', { class: 'dim' }, 'Fertigation'), h('span', { class: 'fc' }, 'Standby')));
    el.append(vis, panel, tag, hlBox, ...items, stamp);
    return { root: el, tag, hl, items, stamp, main, rows, vis, panel, bar: panel.querySelector('i'), vc: panel.querySelector('.vc'), fc: panel.querySelector('.fc') };
  },
  update(b, c) {
    O(c.tag, pr(b, 0, 0.4));
    rise(c.hl, b, 0, { stagger: 0.08 });
    c.items.forEach((it, i) => { const p = pr(b, 1.4 + i * 0.6, 0.7); T(it, { x: (1 - p) * -30, o: p }); });
    if (b >= 5) slam(c.stamp, b, 5, { from: 1.4, dur: 0.4, blur: 8 }); else O(c.stamp, 0);
    T(c.vis, { s: 1 + b * 0.006, o: pr(b, 0, 0.5) });
    draw(c.main, pr(b, 0.1, 0.8, E.inOutCubic));
    let open = 0;
    c.rows.forEach((r, i) => {
      const ob = VALVE(i);
      const on = b >= ob;
      if (on) open++;
      r.valve.setAttribute('fill', on ? 'var(--teal)' : '#1a2a24');
      const front = clamp((b - ob) * SPEED, 0, 830);
      r.flow.setAttribute('x2', 30 + front);
      r.flow.setAttribute('stroke-dashoffset', (-b * 90).toFixed(1));
      r.plants.forEach((p) => {
        const g = pr(b, p.tp, 2.2, E.outCubic);
        p.inner.setAttribute('transform', `scale(${(0.62 + 0.38 * g).toFixed(3)}) rotate(${(g * 25).toFixed(1)})`);
        p.ripples.forEach((rp, k) => {
          const dt = b - p.tp;
          if (dt < 0) { rp.style.opacity = 0; return; }
          const ph = (dt * 0.9 + k * 0.5) % 1;
          rp.setAttribute('r', (10 + ph * 30).toFixed(1));
          rp.style.opacity = ((1 - ph) * 0.55 * clamp(dt * 4)).toFixed(3);
        });
      });
    });
    T(c.panel, { y: (1 - pr(b, 0.6, 0.8)) * -20, o: pr(b, 0.6, 0.6) });
    c.bar.style.width = (22 + 52 * pr(b, 1, 5, E.inOutCubic)).toFixed(1) + '%';
    c.vc.textContent = `${open}/6`;
    c.fc.textContent = b > 2.8 ? '● On' : 'Standby';
    c.fc.style.color = b > 2.8 ? 'var(--lime)' : '';
    exit(c.root, b, 9.5, 0.5);
  },
};

// ───────────────────────── harvesting: the hard part ─────────────────────────
const HX = 60, HY = 120; // visual offset
const FRUITS = [
  { x: 300, y: 250, len: 170, w: 36, ready: true, rot: 6, conf: '0.96' },
  { x: 590, y: 190, len: 78, w: 20, ready: false, rot: -4, conf: '0.31' },
  { x: 660, y: 420, len: 180, w: 38, ready: true, rot: -5, conf: '0.94' },
  { x: 230, y: 560, len: 70, w: 18, ready: false, rot: 8, conf: '0.27' },
  { x: 450, y: 560, len: 160, w: 36, ready: true, rot: 4, conf: '0.91' },
];
const SCAN0 = 0.5, SCAN_D = 2.2;
const scanT = (cy) => SCAN0 + (SCAN_D * (cy - 40)) / 780;
const PICKS = [[0, 4.3], [2, 6.6], [4, 8.9]]; // [fruit, start beat]
const STEPS = [
  ['Identify', 'mature fruit', 3.0],
  ['Distinguish', 'ready from not-ready', 3.5],
  ['Locate', 'inside dense foliage', 4.0],
  ['Approach', 'without damaging the plant', 4.6],
  ['Cut', 'cleanly, at the stem', 5.3],
  ['Handle', 'without bruising', 5.8],
  ['Collect', 'into the transfer system', 6.4],
];
const REST = { x: 820, y: 330 }, CRATE = { x: 700, y: 720 };
const BASE = { x: 985, y: 10 }, L1 = 400, L2 = 400;

function armTarget(b) {
  // returns fingertip position, grip openness, and which fruit (if any) is carried
  let pos = { ...REST }, open = 1, carry = -1;
  let prev = { ...REST };
  for (const [fi, st] of PICKS) {
    const f = FRUITS[fi];
    const stem = { x: f.x, y: f.y + 6 };
    if (b < st) break;
    const a = pr(b, st, 0.9, E.inOutCubic);
    pos = { x: lerp(prev.x, stem.x, a), y: lerp(prev.y, stem.y, a) };
    open = 1 - pr(b, st + 1.0, 0.15, E.outCubic);
    if (b >= st + 1.2) {
      const cp = pr(b, st + 1.2, 0.8, E.inOutCubic);
      pos = { x: lerp(stem.x, CRATE.x, cp), y: lerp(stem.y, CRATE.y, cp) - Math.sin(cp * Math.PI) * 60 };
      carry = b < st + 2.0 ? fi : -1;
      if (b >= st + 2.0) open = pr(b, st + 2.0, 0.15);
    }
    prev = { ...CRATE };
  }
  const last = PICKS[PICKS.length - 1][1] + 2.3;
  if (b > last) {
    const a = pr(b, last, 0.8, E.inOutCubic);
    pos = { x: lerp(CRATE.x, REST.x, a), y: lerp(CRATE.y, REST.y, a) };
  }
  return { pos, open, carry };
}

function capsule(f) {
  const g = s('g');
  const col = f.ready ? '#2f7a3e' : '#6fbf5a';
  g.append(s('path', { d: `M0 -16 L0 4`, stroke: '#3f7f33', 'stroke-width': 4, 'stroke-linecap': 'round' }),
    s('rect', { x: -f.w / 2, y: 0, width: f.w, height: f.len, rx: f.w / 2, fill: col }),
    s('rect', { x: -f.w / 2 + 6, y: 10, width: f.w * 0.22, height: f.len - 20, rx: 3, fill: '#8fd07a', opacity: 0.35 }));
  for (let k = 0; k < f.len / 26; k++) g.append(s('circle', { cx: (k % 2 ? 0.2 : -0.1) * f.w, cy: 18 + k * 24, r: 2, fill: '#b9e7a0', opacity: 0.7 }));
  if (!f.ready) {
    for (let k = 0; k < 5; k++) g.append(s('ellipse', { cx: 0, cy: f.len + 6, rx: 4, ry: 9, fill: '#ffd23f', transform: `rotate(${k * 72} 0 ${f.len + 2})` }));
  }
  return g;
}

export const harvestA = {
  sfx: (() => {
    const cues = [[0, 'whoosh'], [SCAN0, 'scan', SCAN_D]];
    FRUITS.forEach((f) => cues.push([scanT(f.y + f.len / 2), 'blip', f.ready ? 1.4 : 1.1]));
    STEPS.forEach(([, , t], i) => cues.push([t, 'tick', 1 + i * 0.08]));
    PICKS.forEach(([, st]) => cues.push([st, 'servo', 0.9], [st + 1.1, 'snip'], [st + 1.2, 'servo', 0.8], [st + 2.3, 'thud']));
    return cues;
  })(),
  build(el) {
    const r = rng(11);
    const g = s('g', { transform: `translate(${HX} ${HY})` });
    for (const x of [140, 470, 800]) g.append(s('line', { x1: x, y1: 30, x2: x, y2: 840, stroke: 'rgba(243,239,227,0.14)', 'stroke-width': 3 }));
    for (const y of [110, 350, 590]) g.append(s('line', { x1: 40, y1: y, x2: 900, y2: y, stroke: 'rgba(243,239,227,0.1)', 'stroke-width': 2 }));
    const stems = ['M200 840 C170 700 260 560 210 420 S250 180 220 40', 'M500 840 C540 700 440 560 510 420 S460 200 500 40', 'M780 840 C740 700 820 560 770 420 S810 200 760 40'];
    for (const d of stems) g.append(s('path', { d, stroke: '#2c7a4e', 'stroke-width': 6, fill: 'none' }));
    const sx = [205, 500, 775];
    for (let i = 0; i < 34; i++) {
      const k = i % 3;
      const x = sx[k] + (r() - 0.5) * 190, y = 50 + r() * 770;
      const side = x > sx[k] ? 1 : -1;
      g.append(leaf(70 + r() * 50, 30 + r() * 12, LEAF_COLORS[i % 5], (side > 0 ? -30 : 210) + (r() - 0.5) * 70, x, y));
    }
    const fruits = FRUITS.map((f) => {
      const fg = s('g', { transform: `translate(${f.x} ${f.y}) rotate(${f.rot})` }, capsule(f));
      return fg;
    });
    g.append(...fruits);
    // scan line
    const scanGlow = s('rect', { x: 0, y: -60, width: 940, height: 60, fill: 'url(#scanGrad)' });
    const scanLine = s('line', { x1: 0, y1: 0, x2: 940, y2: 0, stroke: 'var(--lime)', 'stroke-width': 3 });
    const scan = s('g', {}, scanGlow, scanLine);
    const boxes = FRUITS.map(() => s('path', { fill: 'none', 'stroke-width': 3 }));
    const reticle = s('g', {}, s('circle', { r: 30, fill: 'none', stroke: 'var(--lime)', 'stroke-width': 2 }),
      s('path', { d: 'M-46 0 H-18 M18 0 H46 M0 -46 V-18 M0 18 V46', stroke: 'var(--lime)', 'stroke-width': 2 }));
    // arm
    const link1 = s('line', { stroke: '#2a3b33', 'stroke-width': 26, 'stroke-linecap': 'round' });
    const link2 = s('line', { stroke: '#2a3b33', 'stroke-width': 20, 'stroke-linecap': 'round' });
    const link1b = s('line', { stroke: 'var(--lime)', 'stroke-width': 2, opacity: 0.6 });
    const link2b = s('line', { stroke: 'var(--lime)', 'stroke-width': 2, opacity: 0.6 });
    const joint = s('circle', { r: 16, fill: '#16241d', stroke: 'var(--lime)', 'stroke-width': 3 });
    const f1 = s('rect', { x: -2, y: 0, width: 30, height: 7, fill: 'var(--lime)' });
    const f2 = s('rect', { x: -2, y: 0, width: 30, height: 7, fill: 'var(--lime)' });
    const head = s('g', {}, s('rect', { x: -34, y: -17, width: 34, height: 34, rx: 4, fill: '#16241d', stroke: 'var(--lime)', 'stroke-width': 3 }),
      s('circle', { cx: -17, cy: 0, r: 5, fill: 'var(--coral)' }), f1, f2);
    const spark = s('g', {}, ...Array.from({ length: 8 }, (_, k) => s('line', { x1: 0, y1: 0, x2: 0, y2: 0, stroke: 'var(--lime)', 'stroke-width': 3, 'data-a': k * 45 })));
    const crate = s('g', { transform: `translate(${CRATE.x - 20} ${CRATE.y + 50})` },
      s('rect', { x: 0, y: 0, width: 230, height: 80, fill: '#16241d', stroke: 'rgba(243,239,227,0.35)', 'stroke-width': 2 }),
      ...[0, 1, 2].map((k) => s('line', { x1: 0, y1: 22 + k * 22, x2: 230, y2: 22 + k * 22, stroke: 'rgba(243,239,227,0.12)', 'stroke-width': 2 })));
    g.append(crate, ...boxes, reticle, scan, link1, link1b, link2, link2b, joint, head, spark);
    const svg = stageSvg(s('defs', {}, s('linearGradient', { id: 'scanGrad', x1: 0, y1: 0, x2: 0, y2: 1 },
      s('stop', { offset: 0, 'stop-color': '#c8ff4d', 'stop-opacity': 0 }), s('stop', { offset: 1, 'stop-color': '#c8ff4d', 'stop-opacity': 0.25 }))), g);
    const chips = FRUITS.map((f) => box(HX + f.x + f.w / 2 + 20, HY + f.y + 6, { class: 'chip', style: { fontSize: '14px', padding: '5px 10px' } }));
    const crateLabel = box(HX + CRATE.x - 20, HY + CRATE.y + 142, { class: 'mono', style: { fontSize: '16px', width: '230px', textAlign: 'center', color: 'var(--dim)' } });

    const tag = box(1080, 176, { class: 'tag coral' }, 'The hard part');
    const hl = words('Harvesting.', 'hl');
    const hlBox = box(1080, 220, { style: { fontSize: '128px' } }, hl);
    const steps = STEPS.map(([v, d], i) => {
      const ck = check(26, 'var(--lime)');
      const row = box(1080, 400 + i * 74, { style: { display: 'flex', alignItems: 'baseline', gap: '18px', whiteSpace: 'nowrap' } },
        h('span', { class: 'mono acc', style: { fontSize: '16px', width: '30px' } }, '0' + (i + 1)),
        h('span', { style: { fontSize: '44px', fontWeight: 800, letterSpacing: '-0.03em' } }, v),
        h('span', { style: { fontSize: '26px', color: 'var(--dim)', fontWeight: 500 } }, d),
        h('span', { style: { alignSelf: 'center' } }, ck));
      row._ck = ck;
      return row;
    });
    el.append(svg, ...chips, crateLabel, tag, hlBox, ...steps);
    return { root: el, g, fruits, scan, boxes, chips, reticle, link1, link2, link1b, link2b, joint, head, f1, f2, spark, crateLabel, tag, hl, steps };
  },
  update(b, c) {
    O(c.g, pr(b, 0, 0.4));
    O(c.tag, pr(b, 0, 0.4));
    rise(c.hl, b, 0.1, { stagger: 0.05 });

    // scan
    const sp = clamp((b - SCAN0) / SCAN_D);
    c.scan.setAttribute('transform', `translate(0 ${(40 + sp * 780).toFixed(1)})`);
    O(c.scan, b > SCAN0 && b < SCAN0 + SCAN_D + 0.2 ? 1 - pr(b, SCAN0 + SCAN_D, 0.2) : 0);

    const { pos, open, carry } = armTarget(b);
    const classify = b >= 3.5;
    FRUITS.forEach((f, i) => {
      const tb = scanT(f.y + f.len / 2);
      const p = pr(b, tb, 0.5, E.outBack);
      const pick = PICKS.find(([fi]) => fi === i);
      const picked = pick && b >= pick[1] + 1.2;
      const inCrate = pick && b >= pick[1] + 2.3;
      const bx = c.boxes[i];
      const chip = c.chips[i];
      if (b < tb || picked) { bx.style.opacity = 0; O(chip, 0); } else {
        const pad = 14 + (1 - p) * 40;
        const x0 = f.x - f.w / 2 - pad, y0 = f.y - pad - 10, x1 = f.x + f.w / 2 + pad, y1 = f.y + f.len + pad;
        const L = 18;
        bx.setAttribute('d', `M${x0} ${y0 + L} V${y0} H${x0 + L} M${x1 - L} ${y0} H${x1} V${y0 + L} M${x1} ${y1 - L} V${y1} H${x1 - L} M${x0 + L} ${y1} H${x0} V${y1 - L}`);
        const col = !classify ? 'var(--ink)' : f.ready ? 'var(--lime)' : 'var(--coral)';
        bx.setAttribute('stroke', col);
        bx.style.opacity = (!classify || f.ready ? 1 : 0.55) * clamp((b - tb) * 6);
        chip.textContent = !classify ? 'Fruit · detected' : f.ready ? `Ready · ${f.conf}` : `Not yet · ${f.conf}`;
        chip.className = 'chip abs ' + (!classify ? '' : f.ready ? 'lime' : 'coral');
        O(chip, clamp((b - tb) * 4) * (!classify || f.ready ? 1 : 0.7));
      }
      // fruit motion when carried / dropped
      const fg = c.fruits[i];
      if (carry === i) {
        const rot = lerp(f.rot, -90, pr(b, pick[1] + 1.3, 0.6, E.inOutCubic));
        fg.setAttribute('transform', `translate(${pos.x} ${pos.y + 4}) rotate(${rot})`);
      } else if (picked && !inCrate) {
        const d = pr(b, pick[1] + 2.0, 0.3, E.inQuad);
        fg.setAttribute('transform', `translate(${CRATE.x + 10} ${CRATE.y + 4 + d * 70}) rotate(-90)`);
        fg.style.opacity = 1 - d * 0.6;
      } else if (inCrate) fg.style.opacity = 0;
    });

    // locate reticle on the current target
    const cur = PICKS.find(([, st]) => b >= st - 0.4 && b < st + 1.1);
    if (cur) {
      const f = FRUITS[cur[0]];
      const p = pr(b, cur[1] - 0.4, 0.6, E.outCubic);
      c.reticle.setAttribute('transform', `translate(${f.x} ${f.y + 6}) scale(${(2.2 - 1.2 * p).toFixed(3)}) rotate(${(1 - p) * 90})`);
      O(c.reticle, p);
    } else O(c.reticle, 0);

    // arm IK (fingertip at pos)
    const dx = pos.x - BASE.x, dy = pos.y - BASE.y;
    const d = Math.min(Math.hypot(dx, dy), L1 + L2 - 1);
    const a = Math.atan2(dy, dx);
    const al = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    const el = { x: BASE.x + L1 * Math.cos(a + al), y: BASE.y + L1 * Math.sin(a + al) };
    const dir = Math.atan2(pos.y - el.y, pos.x - el.x);
    const wrist = { x: pos.x - Math.cos(dir) * 30, y: pos.y - Math.sin(dir) * 30 };
    for (const [ln, p1, p2] of [[c.link1, BASE, el], [c.link1b, BASE, el], [c.link2, el, wrist], [c.link2b, el, wrist]]) {
      ln.setAttribute('x1', p1.x); ln.setAttribute('y1', p1.y); ln.setAttribute('x2', p2.x); ln.setAttribute('y2', p2.y);
    }
    c.joint.setAttribute('cx', el.x); c.joint.setAttribute('cy', el.y);
    c.head.setAttribute('transform', `translate(${wrist.x} ${wrist.y}) rotate(${(dir * 180) / Math.PI})`);
    const gap = 3 + open * 12;
    c.f1.setAttribute('y', -gap - 7); c.f2.setAttribute('y', gap);
    const armIn = pr(b, 3.6, 0.8, E.outCubic);
    for (const e of [c.link1, c.link2, c.link1b, c.link2b, c.joint, c.head]) e.style.opacity = armIn;

    // snip spark
    const snip = PICKS.find(([, st]) => b >= st + 1.05 && b < st + 1.45);
    if (snip) {
      const f = FRUITS[snip[0]];
      const p = pr(b, snip[1] + 1.05, 0.4, E.outCubic);
      c.spark.setAttribute('transform', `translate(${f.x} ${f.y + 2})`);
      for (const ln of c.spark.children) {
        const ang = (+ln.dataset.a * Math.PI) / 180;
        ln.setAttribute('x1', Math.cos(ang) * (10 + p * 20)); ln.setAttribute('y1', Math.sin(ang) * (10 + p * 20));
        ln.setAttribute('x2', Math.cos(ang) * (18 + p * 40)); ln.setAttribute('y2', Math.sin(ang) * (18 + p * 40));
      }
      O(c.spark, 1 - p);
    } else O(c.spark, 0);

    const n = PICKS.filter(([, st]) => b >= st + 2.3).length;
    c.crateLabel.textContent = `Crate · ${n}/3`;
    c.crateLabel.style.color = n ? 'var(--lime)' : '';
    O(c.crateLabel, pr(b, 3.8, 0.5));

    c.steps.forEach((row, i) => {
      const t = STEPS[i][2];
      const p = pr(b, t, 0.6);
      T(row, { x: (1 - p) * 40, o: p });
      drawIcon(row._ck, pr(b, t + 0.15, 0.4));
    });
    exit(c.root, b, 11.5, 0.5);
  },
};

// ───────────────────────── every crop is different ─────────────────────────
const CROPS = [
  ['cucumber', 'Cucumber', 'Long · hanging · hidden'],
  ['okra', 'Okra', 'Upright pod · fragile tip'],
  ['cowpea', 'Cowpea', 'Thin · long · clustered'],
  ['bittergourd', 'Bitter gourd', 'Warty · delicate skin'],
  ['chilli', 'Chilli', 'Small · dozens per plant'],
  ['papaya', 'Papaya', 'Heavy · high on the trunk'],
];
export const harvestB = {
  sfx: [...CROPS.map((_, i) => [i * 0.5, 'slam', 0.45 + i * 0.05]), [3, 'whoosh'], [5.4, 'stamp']],
  build(el) {
    const flashes = CROPS.map(([k, name, desc], i) => {
      const f = box(0, 0, { style: { width: '1920px', height: '1080px' } },
        box(960 - 110, 150, { style: { width: '220px', display: 'flex', justifyContent: 'center' } }, crop(k, 440)),
        box(0, 620, { class: 'hl', style: { width: '1920px', textAlign: 'center', fontSize: '150px', fontWeight: 900, textTransform: 'uppercase' } }, name),
        box(0, 800, { class: 'mono', style: { width: '1920px', textAlign: 'center', fontSize: '22px', color: 'var(--lime)' } }, `0${i + 1} / 06  ·  ${desc}`));
      return f;
    });
    const tiles = CROPS.map(([k, name, desc], i) =>
      box(130 + i * 280, 360, { class: 'card', style: { width: '260px', height: '380px', padding: '22px', display: 'flex', flexDirection: 'column', alignItems: 'center' } },
        h('div', { style: { height: '220px', display: 'flex', alignItems: 'center' } }, crop(k, 210)),
        h('div', { style: { fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em', marginTop: '14px' } }, name),
        h('div', { class: 'mono', style: { fontSize: '13px', color: 'var(--dim)', marginTop: '10px', textAlign: 'center', lineHeight: 1.6 } }, ...desc.split(' · ').flatMap((x, k) => (k ? [h('br'), x] : [x])))));
    const hl = words('Different crops. *Different machines.*', 'hl');
    const hlBox = box(130, 190, { style: { fontSize: '96px' } }, hl);
    const stamp = box(0, 820, { style: { width: '1920px', textAlign: 'center' } },
      h('span', { class: 'chip solid', style: { fontSize: '26px', padding: '14px 26px' } }, 'Goal: harvesting becomes a machine operation'));
    el.append(...flashes, ...tiles, hlBox, stamp);
    return { root: el, flashes, tiles, hl, stamp };
  },
  update(b, c) {
    const k = Math.floor(b / 0.5);
    c.flashes.forEach((f, i) => {
      if (i !== k || b >= 3) { O(f, 0); return; }
      const p = pr(b, i * 0.5, 0.3);
      T(f, { s: 1.08 - 0.08 * p, o: 1 });
      T(f.children[0], { y: (1 - p) * 40, r: (1 - p) * (i % 2 ? 8 : -8) });
    });
    c.tiles.forEach((t, i) => {
      const p = pr(b, 3 + i * 0.12, 0.7);
      T(t, { y: (1 - p) * 80, o: p });
    });
    rise(c.hl, b, 3.1, { stagger: 0.07 });
    if (b >= 5.4) slam(c.stamp, b, 5.4, { from: 1.3, blur: 6 }); else O(c.stamp, 0);
    exit(c.root, b, 7.6, 0.4);
  },
};

// ───────────────────────── crop protection ─────────────────────────
const PESTS = [380, 560, 760, 980, 1180, 1390, 1580].map((x, i) => ({ x, y: 640 + ((i * 37) % 30) }));
const droneX = (b) => lerp(-260, 2180, pr(b, 0, 5.6, E.inOutCubic));
const roverX = (b) => lerp(-240, 1860, pr(b, 5.0, 5.0, E.inOutQuad));
const HIT = PESTS.map((p) => {
  for (let b = 5; b < 10; b += 0.005) if (roverX(b) >= p.x) return b;
  return 99;
});
export const spray = {
  sfx: [[0, 'drone', 5.6], [3, 'alert'], [5, 'rover', 5], ...HIT.filter((t) => t < 10).map((t) => [t, 'spray']), [7.6, 'hit', 0.5]],
  build(el) {
    const r = rng(21);
    const g = s('g');
    g.append(s('line', { x1: 0, y1: 880, x2: 1920, y2: 880, stroke: 'rgba(243,239,227,0.25)', 'stroke-width': 2 }));
    for (let i = 0; i < 60; i++) g.append(s('line', { x1: i * 34, y1: 884, x2: i * 34 - 14, y2: 900, stroke: 'rgba(243,239,227,0.08)', 'stroke-width': 2 }));
    for (const x of [220, 960, 1700]) g.append(s('line', { x1: x, y1: 425, x2: x, y2: 880, stroke: '#3a4a40', 'stroke-width': 9 }));
    g.append(s('line', { x1: 200, y1: 428, x2: 1720, y2: 428, stroke: 'rgba(243,239,227,0.3)', 'stroke-width': 2 }));
    const leaves = s('g');
    for (let i = 0; i < 120; i++) {
      const x = 230 + r() * 1460, y = 420 + Math.pow(r(), 1.4) * 220;
      leaves.append(leaf(55 + r() * 40, 22 + r() * 10, LEAF_COLORS[i % 5], 60 + r() * 200, x, y));
    }
    const pests = PESTS.map((p) => {
      const pg = s('g', { transform: `translate(${p.x} ${p.y})` },
        s('circle', { class: 'ring', r: 18, fill: 'none', stroke: 'var(--coral)', 'stroke-width': 2 }),
        ...[-1, 1].flatMap((sd) => [-5, 0, 5].map((dx) => s('line', { x1: dx, y1: 0, x2: dx * 1.6 + sd * 2, y2: sd * 11, stroke: 'var(--coral)', 'stroke-width': 1.8 }))),
        s('ellipse', { class: 'body', rx: 11, ry: 7.5, fill: 'var(--coral)' }),
        s('circle', { cx: 11, cy: 0, r: 4.5, fill: 'var(--coral)' }));
      return pg;
    });
    const boxes = PESTS.map(() => s('path', { fill: 'none', stroke: 'var(--lime)', 'stroke-width': 2.5 }));
    const cone = s('path', { fill: 'rgba(200,255,77,0.10)', stroke: 'rgba(200,255,77,0.4)', 'stroke-width': 1.5 });
    const jet = s('line', { stroke: 'var(--lime)', 'stroke-width': 4, 'stroke-dasharray': '4 8' });
    // rover
    const rover = s('g', {},
      s('rect', { x: -80, y: -64, width: 160, height: 46, rx: 8, fill: '#16241d', stroke: 'var(--lime)', 'stroke-width': 3 }),
      s('rect', { x: -60, y: -52, width: 40, height: 8, fill: 'var(--lime)', opacity: 0.7 }),
      s('line', { x1: 30, y1: -64, x2: 30, y2: -170, stroke: '#3a4a40', 'stroke-width': 8 }),
      s('circle', { cx: 30, cy: -176, r: 11, fill: '#16241d', stroke: 'var(--lime)', 'stroke-width': 3 }),
      s('circle', { cx: 30, cy: -176, r: 4, fill: 'var(--lime)' }),
      ...[-50, 50].map((x) => s('circle', { cx: x, cy: -16, r: 16, fill: '#0c1511', stroke: 'rgba(243,239,227,0.5)', 'stroke-width': 3 })));
    // drone
    const rotors = [-78, -30, 30, 78].map((x) => s('ellipse', { cx: x, cy: -22, rx: 30, ry: 4, fill: 'rgba(243,239,227,0.5)' }));
    const drone = s('g', {},
      s('rect', { x: -70, y: -14, width: 140, height: 28, rx: 10, fill: '#16241d', stroke: 'var(--ink)', 'stroke-width': 3 }),
      ...[-78, -30, 30, 78].map((x) => s('line', { x1: x, y1: -14, x2: x, y2: -22, stroke: 'var(--ink)', 'stroke-width': 3 })),
      ...rotors,
      s('rect', { x: -14, y: 14, width: 28, height: 16, fill: 'var(--teal)' }));
    g.append(leaves, ...pests, ...boxes, cone, jet, rover, drone);
    const cv = h('canvas', { width: 1920, height: 1080, class: 'abs', style: { left: 0, top: 0 } });
    const tag = box(140, 130, { class: 'tag' }, 'Crop protection');
    const lines = ['Drones spray from above.', 'But pests hide ^below.^', 'So machines go *under the canopy.*', 'Spraying only *where it’s needed.*'].map((t) => {
      const w = words(t, 'hl');
      box(140, 170, { style: { fontSize: '76px' } }, w);
      return w;
    });
    const counter = box(0, 940, { class: 'chip lime', style: { fontSize: '17px', right: '140px' } });
    counter.style.left = 'auto';
    el.append(stageSvg(g), cv, tag, ...lines.map((w) => w.parentElement), counter);
    return { root: el, gx: cv.getContext('2d'), leaves, pests, boxes, cone, jet, rover, drone, rotors, tag, lines, counter };
  },
  update(b, c) {
    O(c.tag, pr(b, 0, 0.4));
    const L = [0.2, 3, 5.2, 7.6];
    c.lines.forEach((w, i) => {
      const on = b >= L[i] && (i === 3 || b < L[i + 1]);
      w.parentElement.style.display = b >= L[i] - 0.01 && (i === 3 || b < L[i + 1] + 0.01) ? '' : 'none';
      if (on) rise(w, b, L[i], { stagger: 0.06, dur: 0.8 });
    });

    // drone + spray particles
    const dx = droneX(b), dy = 290 + Math.sin(b * 3) * 8;
    c.drone.setAttribute('transform', `translate(${dx} ${dy}) rotate(${Math.sin(b * 2) * 2})`);
    c.rotors.forEach((rt, i) => rt.setAttribute('rx', 12 + Math.abs(Math.sin(b * 40 + i)) * 20));
    const g = c.gx;
    g.clearRect(0, 0, 1920, 1080);
    if (b < 6.5) {
      for (let te = Math.max(0, b - 0.7); te <= b; te += 1 / 50) {
        const tq = Math.round(te * 50) / 50;
        const x0 = droneX(tq);
        if (x0 < 230 || x0 > 1700) continue;
        for (let k = 0; k < 4; k++) {
          const seed = tq * 50 * 4 + k;
          const age = b - tq;
          const vx = (hash(seed) - 0.5) * 140;
          const x = x0 + vx * age, y = 300 + 16 + age * 420;
          const topY = 432 + hash(seed + 9) * 20;
          if (y > topY) {
            const sa = clamp((y - topY) / 40);
            g.fillStyle = `rgba(61,224,192,${0.5 * (1 - sa)})`;
            g.fillRect(x - 3, topY - 1, 6, 2);
            continue;
          }
          g.fillStyle = 'rgba(61,224,192,0.75)';
          g.beginPath(); g.arc(x, y, 2.4, 0, Math.PI * 2); g.fill();
        }
      }
    }

    // reveal pests
    const rev = pr(b, 3, 0.6);
    c.leaves.style.opacity = (1 - 0.35 * rev).toFixed(3);
    let treated = 0;
    PESTS.forEach((p, i) => {
      const pg = c.pests[i];
      const hit = HIT[i];
      const dead = pr(b, hit + 0.35, 0.4);
      if (b >= hit + 0.35) treated++;
      pg.style.opacity = (0.35 + 0.65 * rev) * (1 - 0.75 * dead);
      const ring = pg.querySelector('.ring');
      const ph = (b * 1.2 + i * 0.13) % 1;
      ring.setAttribute('r', 14 + ph * 26);
      ring.style.opacity = rev * (1 - ph) * (1 - dead);
      const bx = c.boxes[i];
      const lock = pr(b, hit - 0.25, 0.3, E.outBack);
      if (b >= hit - 0.25 && dead < 1) {
        const pad = 16 + (1 - lock) * 30, Lc = 10;
        const x0 = p.x - pad, y0 = p.y - pad, x1 = p.x + pad, y1 = p.y + pad;
        bx.setAttribute('d', `M${x0} ${y0 + Lc} V${y0} H${x0 + Lc} M${x1 - Lc} ${y0} H${x1} V${y0 + Lc} M${x1} ${y1 - Lc} V${y1} H${x1 - Lc} M${x0 + Lc} ${y1} H${x0} V${y1 - Lc}`);
        bx.style.opacity = 1 - dead;
      } else bx.style.opacity = 0;
    });

    // rover + camera cone + jet
    const rx = roverX(b);
    c.rover.setAttribute('transform', `translate(${rx} 880)`);
    const hx = rx + 30, hy = 880 - 176;
    c.cone.setAttribute('d', `M${hx} ${hy} L${hx - 100} 600 L${hx + 100} 600 Z`);
    c.cone.style.opacity = b > 5 ? 1 : 0;
    const active = PESTS.findIndex((_, i) => b >= HIT[i] && b < HIT[i] + 0.4);
    if (active >= 0) {
      const p = PESTS[active];
      c.jet.setAttribute('x1', hx); c.jet.setAttribute('y1', hy);
      c.jet.setAttribute('x2', p.x); c.jet.setAttribute('y2', p.y);
      c.jet.setAttribute('stroke-dashoffset', -b * 60);
      c.jet.style.opacity = 1;
      for (let k = 0; k < 18; k++) {
        const u = (hash(k + active * 30) + (b - HIT[active]) * 3) % 1;
        g.fillStyle = `rgba(200,255,77,${0.8 * (1 - u)})`;
        g.beginPath();
        g.arc(lerp(hx, p.x, u) + (hash(k * 3.3) - 0.5) * 20 * u, lerp(hy, p.y, u) + (hash(k * 5.1) - 0.5) * 20 * u, 2.5, 0, Math.PI * 2);
        g.fill();
      }
    } else c.jet.style.opacity = 0;

    c.counter.textContent = `Targets treated · ${treated}/${PESTS.length}  ·  blanket spray · 0`;
    O(c.counter, pr(b, 5.4, 0.5));
    exit(c.root, b, 9.5, 0.5);
  },
};

// ───────────────────────── everything else ─────────────────────────
const TASKS = [
  ['weed', 'Weed / control'], ['vine', 'Vine / training'], ['prune', 'Pruning'], ['eye', 'Plant / inspection'],
  ['count', 'Crop / counting'], ['virus', 'Disease / detection'], ['nutrient', 'Nutrient / monitoring'], ['cart', 'Produce / transport'],
];
export const eco = {
  sfx: [...TASKS.map((_, i) => [0.6 + i * 0.35, 'tick', 1 + i * 0.06]), [4.4, 'hit', 0.6], [5.2, 'hit', 1]],
  build(el) {
    const tag = box(140, 150, { class: 'tag' }, 'Field operations');
    const hl = words('And everything else.', 'hl');
    const hlBox = box(140, 190, { style: { fontSize: '96px' } }, hl);
    const tiles = TASKS.map(([ic, label], i) => {
      const ico = icon(ic, 64, 'var(--lime)', 1.6);
      const t = box(140 + (i % 4) * 416, 360 + Math.floor(i / 4) * 236, { class: 'card', style: { width: '392px', height: '212px' } },
        h('div', { class: 'mono acc', style: { fontSize: '16px' } }, '0' + (i + 1)),
        h('div', { class: 'abs', style: { right: '26px', top: '24px' } }, ico),
        h('div', { class: 'abs', style: { left: '30px', bottom: '24px', fontSize: '40px', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.0 } }, ...label.split(' / ').flatMap((x, k) => (k ? [h('br'), x] : [x]))));
      t._ico = ico;
      return t;
    });
    const veil = box(0, 0, { style: { width: '1920px', height: '1080px', background: 'rgba(6,17,12,0.93)' } });
    const a = words('Not one machine.', 'hl');
    const aBox = box(0, 360, { style: { width: '1920px', textAlign: 'center', fontSize: '96px', color: 'var(--dim)' } }, a);
    const bb = words('An *ecosystem.*', 'hl');
    const bBox = box(0, 480, { style: { width: '1920px', textAlign: 'center', fontSize: '200px' } }, bb);
    const sub = box(0, 720, { class: 'mono', style: { width: '1920px', textAlign: 'center', fontSize: '22px', color: 'var(--lime)' } }, 'Specialised machines · one task group each');
    el.append(tag, hlBox, ...tiles, veil, aBox, bBox, sub);
    return { root: el, tag, hl, tiles, veil, a, bb, sub };
  },
  update(b, c) {
    O(c.tag, pr(b, 0, 0.4));
    rise(c.hl, b, 0, { stagger: 0.06 });
    c.tiles.forEach((t, i) => {
      const st = 0.6 + i * 0.35;
      const p = pr(b, st, 0.6);
      T(t, { y: (1 - p) * 50, s: 0.94 + 0.06 * p, o: p });
      drawIcon(t._ico, pr(b, st + 0.1, 0.9, E.outCubic));
    });
    O(c.veil, pr(b, 4.3, 0.4));
    rise(c.a, b, 4.4, { stagger: 0.06 });
    rise(c.bb, b, 5.2, { stagger: 0.1 });
    O(c.sub, pr(b, 5.8, 0.5));
    exit(c.root, b, 7.7, 0.3);
  },
};
