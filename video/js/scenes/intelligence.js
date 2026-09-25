// Chapters 04–06 — data as memory, AI as coordinator, and the flywheel.
import { h, s, box, words, rise, sink, exit, T, O, pr, E, lerp, draw, arrow, fmt, hash } from '../lib.js';

const stageSvg = (...kids) => s('svg', { class: 'abs', width: 1920, height: 1080, viewBox: '0 0 1920 1080', style: 'left:0;top:0' }, ...kids);

// ───────────────────────── every machine is a sensor ─────────────────────────
const PANELS = [
  ['Harvest_bot_03', [
    ['fruit_count', (b) => fmt(1180 + Math.floor(b * 23))], ['fruit_size_mm', (b) => String(208 + Math.floor(hash(Math.floor(b * 4)) * 9))],
    ['location', () => 'R07 · P14'], ['maturity', (b) => (0.9 + hash(Math.floor(b * 3)) * 0.06).toFixed(2)], ['defects', () => '0.8 %'],
    ['yield_per_plant', () => '3.4 kg'], ['harvest_freq', () => '48 h'], ['productivity', () => '+4.1 %']]],
  ['Spray_rover_01', [
    ['pest_location', () => 'R03 · P22'], ['pest_density', (b) => (0.5 + hash(Math.floor(b * 3) + 7) * 0.2).toFixed(2) + ' /leaf'],
    ['symptoms', () => 'leaf curl'], ['treatment', () => 'spot · 12 ml'], ['applied_on', () => 'today 06:40'],
    ['crop_response', () => 'tracking'], ['blanket_spray', () => '0 %']]],
  ['Irrigation + env', [
    ['water_used_l', (b) => fmt(18400 + Math.floor(b * 61))], ['frequency', () => '2× / day'], ['soil_moisture', (b) => (40 + hash(Math.floor(b * 2) + 3) * 3).toFixed(1) + ' %'],
    ['rainfall_mm', () => '12'], ['humidity', () => '84 %'], ['temperature_c', (b) => (29 + hash(Math.floor(b * 2) + 5)).toFixed(1)], ['sunlight_h', () => '6.1']]],
];
export const data = {
  sfx: [[0, 'whoosh'], [1, 'type', 5.5], [7, 'sweep'], [9.1, 'impact', 0.7]],
  build(el) {
    const tag = box(140, 150, { class: 'tag' }, 'The foundation');
    const hl = words('Every machine is also a *sensor.*', 'hl');
    const hlBox = box(140, 190, { style: { fontSize: '90px' } }, hl);
    const panels = PANELS.map(([name, rows], p) => {
      const rec = h('span', { style: { width: '10px', height: '10px', borderRadius: '50%', background: 'var(--coral)', display: 'inline-block' } });
      const lines = rows.map(([k]) => {
        const v = h('span', { style: { color: 'var(--ink)' } });
        const row = h('div', { style: { display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid rgba(243,239,227,0.06)' } }, h('span', { class: 'dim' }, k), v);
        row._v = v;
        return row;
      });
      const panel = box(140 + p * 560, 340, { class: 'card', style: { width: '520px', height: '460px', padding: '0', fontFamily: 'JetBrains Mono', fontSize: '19px', letterSpacing: '0.04em' } },
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 22px', borderBottom: '1.5px solid var(--faint)', textTransform: 'uppercase', letterSpacing: '0.16em', fontSize: '16px', color: 'var(--lime)' } }, rec, name, h('span', { style: { marginLeft: 'auto', color: 'var(--dim)' } }, 'live')),
        h('div', { style: { padding: '8px 22px' } }, ...lines));
      panel._lines = lines; panel._rec = rec;
      return panel;
    });
    const left = box(0, 560, { class: 'chip', style: { fontSize: '20px', padding: '14px 22px', right: '1120px' } }, 'What was done to the crop');
    left.style.left = 'auto';
    const right = box(1120, 560, { class: 'chip lime', style: { fontSize: '20px', padding: '14px 22px' } }, 'What happened to the crop');
    const link = s('line', { x1: 812, y1: 588, x2: 1108, y2: 588, stroke: 'var(--lime)', 'stroke-width': 3, pathLength: 1 });
    const dots = [0, 1, 2, 3].map(() => s('circle', { r: 5, fill: 'var(--lime)', cy: 588 }));
    const linkSvg = stageSvg(link, ...dots, s('path', { d: 'M822 578 L810 588 L822 598 M1098 578 L1110 588 L1098 598', stroke: 'var(--lime)', 'stroke-width': 3, fill: 'none' }));
    const m1 = words('The farm starts', 'hl');
    const m2 = words('to _*remember.*_', 'hl');
    const mBox1 = box(0, 300, { style: { width: '1920px', textAlign: 'center', fontSize: '170px' } }, m1);
    const mBox2 = box(0, 480, { style: { width: '1920px', textAlign: 'center', fontSize: '190px' } }, m2);
    el.append(tag, hlBox, ...panels, linkSvg, left, right, mBox1, mBox2);
    return { root: el, tag, hl, panels, left, right, link, dots, linkSvg, m1, m2 };
  },
  update(b, c) {
    O(c.tag, pr(b, 0, 0.4) * (1 - pr(b, 8.8, 0.3)));
    rise(c.hl, b, 0, { stagger: 0.06 });
    if (b > 8.8) sink(c.hl, b, 8.8);
    const dimP = pr(b, 6.8, 0.6);
    c.panels.forEach((p, i) => {
      const st = 1 + i * 0.3;
      const pp = pr(b, st, 0.7);
      T(p, { y: (1 - pp) * 60 + dimP * 20, o: pp * (1 - dimP * 0.85), blur: dimP * 3 });
      p._rec.style.opacity = Math.floor(b * 2) % 2 ? 0.3 : 1;
      p._lines.forEach((ln, k) => {
        const t0 = st + 0.4 + k * 0.32;
        O(ln, pr(b, t0, 0.3));
        ln._v.textContent = b >= t0 ? PANELS[i][1][k][1](b) : '';
      });
    });
    const lk = pr(b, 7.1, 0.6);
    T(c.left, { x: (1 - lk) * -40, o: lk * (1 - pr(b, 8.8, 0.3)) });
    T(c.right, { x: (1 - lk) * 40, o: lk * (1 - pr(b, 8.8, 0.3)) });
    draw(c.link, pr(b, 7.4, 0.5));
    O(c.linkSvg, lk * (1 - pr(b, 8.8, 0.3)));
    c.dots.forEach((d, k) => {
      const u = (b * 0.6 + k / 4) % 1;
      const x = k % 2 ? lerp(830, 1090, u) : lerp(1090, 830, u);
      d.setAttribute('cx', x);
      d.style.opacity = b > 7.9 ? Math.sin(u * Math.PI) : 0;
    });
    rise(c.m1, b, 9.1, { stagger: 0.08, dur: 1 });
    rise(c.m2, b, 9.5, { stagger: 0.12, dur: 1.1 });
    exit(c.root, b, 11.6, 0.4);
  },
};

// ───────────────────────── agricultural intelligence ─────────────────────────
const LAYERS = [['Machines', 'capability'], ['Sensors', 'observation'], ['Data', 'memory'], ['AI', 'coordination']];
const NODES = ['Plot A1', 'Harvester', 'Soil', 'Plot B4', 'Sprayer', 'Weather', 'Irrigation', 'Plot C2', 'Drone', 'Transport'];
const NC = { x: 1400, y: 470 }, NR = 250;
const QS = [
  ['What was planted — and where?', 0], ['How is each plot performing?', 3], ['What pest pressure exists?', 4],
  ['What was sprayed?', 4], ['How much rain fell?', 5], ['Which plants are underperforming?', 7],
  ['When should we harvest?', 1], ['What will be needed next?', 9],
];
const QT = (k) => 3 + k * 0.6;
export const intel = {
  sfx: [...LAYERS.map((_, i) => [i * 0.5, 'hit', 0.4 + i * 0.1]), [1.5, 'sweep'], ...QS.map((_, k) => [QT(k), 'blip', 1.2 + (k % 3) * 0.15]), [8.2, 'hit', 0.8]],
  build(el) {
    const rows = LAYERS.map(([a, b2], i) => box(140, 200 + i * 104, { style: { display: 'flex', alignItems: 'center', gap: '26px', whiteSpace: 'nowrap' } },
      h('span', { class: 'hl', style: { fontSize: '76px', width: '330px' } }, a),
      h('span', { style: { color: 'var(--lime)' } }, arrow(46)),
      h('span', { class: 'serif acc', style: { fontSize: '80px' } }, b2)));
    const edges = NODES.map(() => s('line', { stroke: 'rgba(200,255,77,0.35)', 'stroke-width': 1.5, pathLength: 1 }));
    const pulses = NODES.map(() => s('circle', { r: 4.5, fill: 'var(--lime)' }));
    const nodes = NODES.map(() => s('circle', { r: 11, fill: '#0c1511', stroke: 'var(--ink)', 'stroke-width': 2.5 }));
    const halos = NODES.map(() => s('circle', { r: 20, fill: 'none', stroke: 'var(--lime)', 'stroke-width': 2 }));
    const ring = s('circle', { cx: NC.x, cy: NC.y, r: NR, fill: 'none', stroke: 'rgba(243,239,227,0.08)', 'stroke-width': 1.5, 'stroke-dasharray': '4 8' });
    const coreRings = [0, 1].map(() => s('circle', { cx: NC.x, cy: NC.y, r: 70, fill: 'none', stroke: 'var(--lime)', 'stroke-width': 2 }));
    const core = s('circle', { cx: NC.x, cy: NC.y, r: 66, fill: 'rgba(200,255,77,0.12)', stroke: 'var(--lime)', 'stroke-width': 3 });
    const coreTxt = box(NC.x - 80, NC.y - 34, { class: 'hl acc', style: { width: '160px', textAlign: 'center', fontSize: '60px', fontWeight: 900 } }, 'AI');
    const pos = NODES.map((_, i) => {
      const a = ((-90 + i * 36) * Math.PI) / 180;
      return { x: NC.x + Math.cos(a) * NR, y: NC.y + Math.sin(a) * NR, c: Math.cos(a), s: Math.sin(a) };
    });
    const labels = NODES.map((n, i) => {
      const p = pos[i];
      const l = box(p.x + (p.c >= -0.01 ? 22 : -222), p.y - 10 + p.s * 16, { class: 'mono', style: { fontSize: '14px', width: '200px', textAlign: p.c >= -0.01 ? 'left' : 'right', color: 'var(--dim)' } }, n);
      if (Math.abs(p.c) < 0.05) { l.style.left = p.x - 100 + 'px'; l.style.textAlign = 'center'; l.style.top = p.y + (p.s < 0 ? -44 : 22) + 'px'; }
      return l;
    });
    const svg = stageSvg(ring, ...edges, ...pulses, ...coreRings, core, ...halos, ...nodes);
    const feed = box(140, 668, { style: { width: '860px', height: '214px', overflow: 'hidden', borderLeft: '3px solid var(--lime)', paddingLeft: '24px' } });
    const feedInner = h('div', { style: { position: 'absolute', left: '24px', right: 0, top: 0 } });
    feed.append(feedInner);
    const qEls = QS.map(([q]) => {
      const e = h('div', { class: 'mono', style: { fontSize: '21px', height: '52px', lineHeight: '52px', whiteSpace: 'nowrap' } }, '› ' + q);
      feedInner.append(e);
      return e;
    });
    const fTag = box(140, 630, { class: 'mono', style: { fontSize: '14px', color: 'var(--dim)' } }, 'Farm query · live');
    const concl = box(1000, 880, { style: { width: '800px', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px', whiteSpace: 'nowrap' } },
      h('span', { class: 'hl dim', style: { fontSize: '50px' } }, 'Automated'),
      h('span', { style: { color: 'var(--lime)' } }, arrow(44)),
      h('span', { class: 'hl acc', style: { fontSize: '50px' } }, 'Intelligent.'));
    el.append(svg, coreTxt, ...labels, ...rows, fTag, feed, concl);
    return { root: el, rows, edges, pulses, nodes, halos, pos, core, coreRings, coreTxt, labels, feedInner, qEls, fTag, concl };
  },
  update(b, c) {
    c.rows.forEach((r, i) => { const p = pr(b, i * 0.5, 0.7); T(r, { x: (1 - p) * -50, o: p }); });
    const cp = pr(b, 0.4, 0.8, E.outBack);
    c.core.setAttribute('r', 66 * cp);
    O(c.coreTxt, pr(b, 0.6, 0.4));
    c.coreRings.forEach((r, k) => {
      const ph = (b * 0.5 + k * 0.5) % 1;
      r.setAttribute('r', 70 + ph * 120);
      r.style.opacity = (1 - ph) * 0.6 * cp;
    });
    const active = QS.map(([, n], k) => (b >= QT(k) && b < QT(k) + 0.9 ? n : -1)).filter((n) => n >= 0);
    c.pos.forEach((p, i) => {
      const st = 1.2 + i * 0.1;
      const pe = pr(b, st, 0.6, E.outCubic);
      const e = c.edges[i];
      e.setAttribute('x1', NC.x); e.setAttribute('y1', NC.y); e.setAttribute('x2', p.x); e.setAttribute('y2', p.y);
      draw(e, pe);
      const n = c.nodes[i];
      n.setAttribute('cx', p.x); n.setAttribute('cy', p.y);
      n.setAttribute('r', 11 * pr(b, st + 0.4, 0.4, E.outBack));
      const hot = active.includes(i);
      n.setAttribute('stroke', hot ? 'var(--lime)' : 'var(--ink)');
      const hl = c.halos[i];
      hl.setAttribute('cx', p.x); hl.setAttribute('cy', p.y);
      const ph = (b * 1.5) % 1;
      hl.setAttribute('r', 14 + ph * 22);
      hl.style.opacity = hot ? 1 - ph : 0;
      O(c.labels[i], pr(b, st + 0.4, 0.4));
      c.labels[i].style.color = hot ? 'var(--lime)' : '';
      const pu = c.pulses[i];
      const u = (b * 0.7 + hash(i) ) % 1;
      const inward = i % 2 === 0;
      const k = inward ? 1 - u : u;
      pu.setAttribute('cx', lerp(NC.x, p.x, k)); pu.setAttribute('cy', lerp(NC.y, p.y, k));
      pu.style.opacity = pe >= 1 ? Math.sin(u * Math.PI) : 0;
    });
    // query feed scrolls
    const shown = QS.filter((_, k) => b >= QT(k)).length;
    const last = shown - 1;
    const scroll = Math.max(0, shown - 4) + (shown > 4 ? -(1 - pr(b, QT(last), 0.4, E.outCubic)) : 0);
    c.feedInner.style.transform = `translateY(${(-scroll * 52).toFixed(1)}px)`;
    c.qEls.forEach((e, k) => {
      const p = pr(b, QT(k), 0.4);
      e.style.opacity = b >= QT(k) ? (k === last ? p : 0.4) : 0;
      e.style.color = k === last ? 'var(--lime)' : 'var(--ink)';
      e.style.transform = `translateX(${((1 - p) * 20).toFixed(1)}px)`;
    });
    O(c.fTag, pr(b, 2.8, 0.4));
    O(c.feedInner.parentElement, pr(b, 2.8, 0.4));
    T(c.concl, { o: pr(b, 8.2, 0.5), y: (1 - pr(b, 8.2, 0.5)) * 20 });
    exit(c.root, b, 9.6, 0.4);
  },
};

// ───────────────────────── the flywheel ─────────────────────────
const FC = { x: 560, y: 590 }, FR = 250;
const STAGES = [
  ['Labour problem', -90, 'Every labour problem', 'becomes an engineering problem.'],
  ['Engineering', 0, 'Every engineering solution', 'becomes a product.'],
  ['Product', 90, 'Every machine', 'generates data.'],
  ['Data', 180, 'Every season', 'makes the system smarter.'],
];
const ST = (i) => 1.2 + i * 1.6;
export const flywheel = {
  sfx: [[0, 'whoosh'], ...STAGES.map((_, i) => [ST(i), 'hit', 0.5 + i * 0.1]), [8.6, 'whoosh'], [9, 'impact', 0.8]],
  build(el) {
    const ring = s('circle', { cx: FC.x, cy: FC.y, r: FR, fill: 'none', stroke: 'rgba(243,239,227,0.15)', 'stroke-width': 3, pathLength: 1, transform: `rotate(-90 ${FC.x} ${FC.y})` });
    const hi = s('path', { fill: 'none', stroke: 'var(--lime)', 'stroke-width': 8, 'stroke-linecap': 'round' });
    const chevrons = [45, 135, 225, 315].map((a) => {
      const r = (a * Math.PI) / 180;
      const x = FC.x + Math.cos(r) * FR, y = FC.y + Math.sin(r) * FR;
      return s('path', { d: 'M-8 -10 L4 0 L-8 10', fill: 'none', stroke: 'rgba(243,239,227,0.5)', 'stroke-width': 3, transform: `translate(${x} ${y}) rotate(${a + 90})` });
    });
    const dots = STAGES.map(([, a]) => {
      const r = (a * Math.PI) / 180;
      return s('circle', { cx: FC.x + Math.cos(r) * FR, cy: FC.y + Math.sin(r) * FR, r: 14, fill: '#0c1511', stroke: 'var(--lime)', 'stroke-width': 3 });
    });
    const labels = STAGES.map(([n, a]) => {
      const r = (a * Math.PI) / 180;
      const x = FC.x + Math.cos(r) * (FR + 34), y = FC.y + Math.sin(r) * (FR + 34);
      const l = box(x - 110, y - 14, { class: 'chip', style: { fontSize: '15px', width: '220px', justifyContent: 'center' } }, n);
      if (a === 0) l.style.left = x - 6 + 'px';
      if (a === 180) l.style.left = x - 214 + 'px';
      if (a === -90) l.style.top = y - 34 + 'px';
      if (a === 90) l.style.top = y + 4 + 'px';
      return l;
    });
    const center = box(FC.x - 200, FC.y - 50, { style: { width: '400px', textAlign: 'center' } },
      h('div', { class: 'mono', style: { fontSize: '16px', color: 'var(--dim)' } }, 'Our farms'),
      h('div', { class: 'serif acc', style: { fontSize: '58px', lineHeight: 1.1 } }, 'the testing ground'));
    const tag = box(1000, 170, { class: 'tag' }, 'The larger opportunity');
    const lines = STAGES.map(([, , a, b2], i) => {
      const w1 = words(a, 'hl');
      const w2 = words(`_${b2}_`, 'acc');
      const row = box(1000, 240 + i * 150, {}, h('div', { style: { fontSize: '50px' } }, w1), h('div', { style: { fontSize: '54px', marginTop: '4px' } }, w2));
      row._w = [w1, w2];
      return row;
    });
    const e1 = words('An agriculture company, becoming', 'hl');
    const e2 = words('an *agri-tech* / *company.*', 'hl');
    const eBox = box(1000, 300, {}, h('div', { style: { fontSize: '46px', color: 'var(--dim)' } }, e1), h('div', { style: { fontSize: '120px', marginTop: '18px', lineHeight: 0.95 } }, e2));
    const eSub = box(1000, 700, { class: 'mono', style: { fontSize: '19px', color: 'var(--dim)', lineHeight: 1.8 } }, 'Compact machines for 3-, 5- and 10-acre farms.', h('br'), 'Built from problems met on our own fields.');
    el.append(stageSvg(ring, hi, ...chevrons, ...dots), center, ...labels, tag, ...lines, eBox, eSub);
    return { root: el, ring, hi, chevrons, dots, labels, center, tag, lines, e1, e2, eSub };
  },
  update(b, c) {
    draw(c.ring, pr(b, 0, 1.1, E.inOutCubic));
    c.chevrons.forEach((ch, i) => O(ch, pr(b, 0.6 + i * 0.1, 0.4)));
    O(c.center, pr(b, 0.4, 0.6));
    O(c.tag, pr(b, 0, 0.4));
    // rotating highlight arc, reaching stage i at ST(i)
    const ang = -90 + ((b - ST(0)) / 1.6) * 90;
    const a0 = ((ang - 50) * Math.PI) / 180, a1 = (ang * Math.PI) / 180;
    const P = (a) => `${(FC.x + Math.cos(a) * FR).toFixed(1)} ${(FC.y + Math.sin(a) * FR).toFixed(1)}`;
    c.hi.setAttribute('d', `M${P(a0)} A${FR} ${FR} 0 0 1 ${P(a1)}`);
    O(c.hi, pr(b, 0.8, 0.4));
    STAGES.forEach((_, i) => {
      const on = b >= ST(i);
      c.dots[i].setAttribute('fill', on ? 'var(--lime)' : '#0c1511');
      c.dots[i].setAttribute('r', 14 + (on ? 6 * (1 - pr(b, ST(i), 0.5)) : 0));
      const lb = c.labels[i];
      O(lb, pr(b, 0.5 + i * 0.12, 0.4));
      lb.className = 'abs chip' + (on ? ' lime' : '');
      const row = c.lines[i];
      rise(row._w[0], b, ST(i), { stagger: 0.05 });
      rise(row._w[1], b, ST(i) + 0.2, { stagger: 0.05 });
      O(row, (i === STAGES.findLastIndex((_, k) => b >= ST(k)) ? 1 : 0.35) * (1 - pr(b, 8.6, 0.3)));
    });
    rise(c.e1, b, 9, { stagger: 0.06 });
    rise(c.e2, b, 9.4, { stagger: 0.08 });
    T(c.eSub, { o: pr(b, 10.2, 0.5), y: (1 - pr(b, 10.2, 0.5)) * 12 });
    exit(c.root, b, 11.7, 0.3);
  },
};
