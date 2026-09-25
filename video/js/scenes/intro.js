// Cold open, title, and the "what it means" definition scenes.
import { h, s, box, words, chars, rise, slam, exit, T, O, pr, E, lerp, rng, draw, arrow } from '../lib.js';

// ───────────────────────── cold open ─────────────────────────
export const cold = {
  sfx: [
    [1, 'slam', 0.9], [2, 'slam', 1], [3, 'slam', 1.25],
    [4, 'tick'], [4.5, 'tick'], [5, 'tick'], [5.5, 'tick'], [6, 'tick'], [6.5, 'tick'],
    [7, 'down'], [7.5, 'hit', 0.45], [8, 'riser', 2],
  ],
  build(el) {
    const cv = h('canvas', { width: 1920, height: 1080, class: 'abs', style: { left: 0, top: 0 } });
    const cursor = box(946, 512, { style: { width: '28px', height: '56px', background: 'var(--lime)' } });
    const lines = ['Farming', 'runs on', '*hands.*'].map((t, i) => {
      const w = words(t, 'hl');
      const el2 = h('div', { class: 'abs', style: { left: 0, right: 0, top: 250 + i * 190 + 'px', textAlign: 'center', fontSize: '210px', fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 0.9 } }, w);
      w._w.forEach((x) => (x.parentElement.style.overflow = 'visible'));
      return el2;
    });
    const label = box(0, 500, { class: 'mono', style: { width: '1920px', textAlign: 'center', fontSize: '64px', fontWeight: 700, letterSpacing: '0.3em', color: 'var(--ink)' } });
    const labelBg = box(610, 470, { style: { width: '700px', height: '140px', background: 'var(--bg)', boxShadow: '0 0 60px 40px var(--bg)' } });
    const q = h('div', { class: 'abs serif', style: { left: 0, right: 0, top: '640px', textAlign: 'center', fontSize: '150px', color: 'var(--ink)' } });
    const qw = words('What if it *didn’t?*');
    qw._w.forEach((x) => x.classList.add('serif'));
    q.append(qw);
    el.append(cv, cursor, ...lines, labelBg, label, q);

    // dot field = the workforce
    const r = rng(7);
    const dots = [];
    const sp = 40;
    for (let y = sp / 2 + 10; y < 1080; y += sp) {
      for (let x = sp / 2; x < 1920; x += sp) {
        const d = Math.hypot(x - 960, y - 540) / 1100;
        dots.push({ x, y, a: 4 + d * 1.3 + r() * 0.35, ph: r() * 6.28, lime: r() < 0.08, c: d + r() * 0.2 });
      }
    }
    return { g: cv.getContext('2d'), cursor, lines, label, labelBg, qw, dots };
  },
  update(b, c) {
    O(c.cursor, b < 0.9 && Math.floor(b * 2) % 2 === 0 ? 1 : 0);

    c.lines.forEach((ln, i) => {
      const st = 1 + i;
      if (b < st) { O(ln, 0); return; }
      slam(ln, b, st, { from: 1.5, dur: 0.45, blur: 20 });
      const out = pr(b, 4, 0.5, E.inCubic);
      if (out > 0) T(ln, { s: 1 - out * 0.2, o: 1 - out, blur: out * 10 });
    });

    // dots
    const g = c.g;
    g.clearRect(0, 0, 1920, 1080);
    if (b > 3.9) {
      const col = pr(b, 7, 0.6, E.inCubic);
      for (const d of c.dots) {
        let a = pr(b, d.a, 0.35, E.outCubic);
        if (a <= 0) continue;
        a *= 1 - pr(b, 7 + d.c * 0.4, 0.45, E.inCubic);
        if (a <= 0.01) continue;
        const bob = Math.sin(b * Math.PI * 2 + d.ph) * 2.5;
        const k = col * 0.25;
        const x = lerp(d.x, 960, k), y = lerp(d.y + bob, 540, k);
        g.fillStyle = d.lime ? `rgba(200,255,77,${a})` : `rgba(243,239,227,${a * 0.45})`;
        g.beginPath();
        g.arc(x, y, 3.2, 0, Math.PI * 2);
        g.fill();
      }
      const cd = pr(b, 4, 0.3);
      if (cd > 0) {
        g.fillStyle = 'rgba(200,255,77,1)';
        g.beginPath();
        g.arc(960, 540, 4 + 8 * pr(b, 7.1, 0.7) * (1 + 0.18 * Math.sin(b * 6)), 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = `rgba(200,255,77,${0.5 * pr(b, 7.4, 0.5) * (1 - ((b * 0.8) % 1))})`;
        g.lineWidth = 2;
        g.beginPath();
        g.arc(960, 540, 14 + 60 * ((b * 0.8) % 1), 0, Math.PI * 2);
        g.stroke();
      }
    }

    // labels: the manual jobs
    const jobs = ['Planting', 'Weeding', 'Spraying', 'Pruning', 'Picking', 'Carrying'];
    const k = Math.floor((b - 4) / 0.5);
    if (b >= 4 && b < 7) {
      c.label.textContent = jobs[k];
      const p = pr(b, 4 + k * 0.5, 0.2);
      T(c.label, { s: lerp(1.12, 1, p), o: 1 });
      O(c.labelBg, 0.92);
    } else { O(c.label, 0); O(c.labelBg, 0); }

    rise(c.qw, b, 7.5, { stagger: 0.12, dur: 1.2 });
  },
};

// ───────────────────────── title ─────────────────────────
export const title = {
  sfx: [[0, 'impact', 1.2], [0.6, 'shimmer'], [2.4, 'sweep'], [9, 'whoosh']],
  build(el) {
    const rings = [0, 1, 2].map(() => s('circle', { cx: 960, cy: 540, r: 10, fill: 'none', stroke: 'var(--lime)', 'stroke-width': 3 }));
    const radar = box(160, -260, { style: { width: '1600px', height: '1600px', borderRadius: '50%', background: 'conic-gradient(from 0deg, rgba(200,255,77,0.07), rgba(200,255,77,0) 16%, transparent 100%)' } });
    const guides = s('svg', { class: 'abs', width: 1920, height: 1080, style: 'left:0;top:0' },
      ...[180, 360, 540, 720].map((r) => s('circle', { cx: 960, cy: 540, r, fill: 'none', stroke: 'rgba(243,239,227,0.06)', 'stroke-width': 1.5 })),
      ...rings);
    const group = box(0, 0, { style: { width: '1920px', height: '1080px' } });
    const pre = words('The Farmers of Great Nicobar  ·  presents', 'mono');
    const preBox = box(0, 332, { style: { width: '1920px', textAlign: 'center', fontSize: '22px', color: 'var(--ink)', letterSpacing: '0.34em' } }, pre);
    const the = chars('The', 'serif');
    const big = chars('ONE-MAN FARM', 'hl');
    const titleRow = box(0, 420, { style: { width: '1920px', textAlign: 'center', whiteSpace: 'nowrap' } },
      h('span', { class: 'serif acc', style: { fontSize: '146px', marginRight: '22px', display: 'inline-block' } }, the),
      h('span', { style: { fontSize: '178px', fontWeight: 900, letterSpacing: '-0.05em', display: 'inline-block' } }, big));
    big._w.slice(0, 7).forEach((x) => x.classList.add('acc'));
    const bar = box(460, 640, { style: { width: '1000px', height: '6px', background: 'var(--lime)', transformOrigin: '0 50%' } });
    const sub = words('A long-term vision for fully automated, data-driven agriculture.', 'body');
    const subBox = box(0, 690, { style: { width: '1920px', textAlign: 'center', fontSize: '38px', color: 'var(--dim)' } }, sub);
    group.append(preBox, titleRow, bar, subBox);
    el.append(radar, guides, group);
    return { rings, radar, group, pre, the, big, bar, sub };
  },
  update(b, c) {
    c.rings.forEach((r, i) => {
      const p = pr(b, i * 0.18, 2.4, E.outCubic);
      r.setAttribute('r', (10 + p * 1250).toFixed(1));
      r.style.opacity = ((1 - p) * 0.9).toFixed(3);
      r.setAttribute('stroke-width', (6 - 4 * p).toFixed(2));
    });
    T(c.radar, { r: b * 18, o: pr(b, 0.5, 2) * 0.8 });
    rise(c.pre, b, 0.3, { stagger: 0.05, dur: 1 });
    rise(c.the, b, 0.55, { stagger: 0.05, dur: 1.2 });
    rise(c.big, b, 0.7, { stagger: 0.045, dur: 1.2 });
    T(c.bar, { sx: pr(b, 2.3, 1.2, E.inOutExpo) });
    rise(c.sub, b, 3, { stagger: 0.05, dur: 1.1 });
    const out = pr(b, 9.2, 0.8, E.inCubic);
    T(c.group, { s: 1 + b * 0.004 + out * 0.08, o: 1 - out, blur: out * 16 });
  },
};

// ───────────────────────── not one person ─────────────────────────
export const notone = {
  sfx: [[0, 'whoosh'], [1, 'zip'], [1.8, 'hit', 0.7], [2.4, 'hit', 0.9], [3.2, 'blip', 1], [3.5, 'blip', 1.2], [4.9, 'dissolve']],
  build(el) {
    const a = words('It doesn’t mean one person does every job.', 'hl');
    const aBox = box(0, 250, { style: { width: '1920px', textAlign: 'center', fontSize: '64px', fontWeight: 600, color: 'var(--dim)' } }, a);
    const strike = box(0, 0, { style: { height: '6px', background: 'var(--coral)', transformOrigin: '0 50%' } });
    const b1 = words('It means human physical labour', 'hl');
    const bBox = box(0, 410, { style: { width: '1920px', textAlign: 'center', fontSize: '112px' } }, b1);
    const cWord = words('largely', 'hl');
    const dis = chars('disappears.', 'serif');
    const cBox = box(0, 540, { style: { width: '1920px', textAlign: 'center', whiteSpace: 'nowrap' } },
      h('span', { style: { fontSize: '112px', display: 'inline-block', marginRight: '30px' } }, cWord),
      h('span', { class: 'acc', style: { fontSize: '150px', display: 'inline-block' } }, dis));
    const chips = box(0, 800, { style: { width: '1920px', display: 'flex', justifyContent: 'center', gap: '22px' } },
      h('div', { class: 'chip' }, h('span', { class: 'dim' }, 'Supervisors'), ' ', h('b', {}, 'A few')),
      h('div', { class: 'chip lime' }, h('span', {}, 'Machines'), ' ', h('b', {}, 'Everything else')));
    el.append(aBox, strike, bBox, cBox, chips);
    const r = rng(3);
    const order = dis._w.map(() => r());
    return { a, aBox, strike, b1, cWord, dis, chips, order };
  },
  update(b, c) {
    rise(c.a, b, 0, { stagger: 0.04, dur: 0.8 });
    if (!c.m) {
      const w0 = c.a._w[3].parentElement, w1 = c.a._w[c.a._w.length - 1].parentElement;
      const x0 = w0.offsetLeft + c.aBox.offsetLeft, x1 = w1.offsetLeft + w1.offsetWidth + c.aBox.offsetLeft;
      c.m = { x0, x1 };
      Object.assign(c.strike.style, { left: x0 + 'px', top: '292px', width: x1 - x0 + 'px' });
    }
    T(c.strike, { sx: pr(b, 1, 0.5, E.inOutCubic) });
    O(c.aBox, 1 - 0.45 * pr(b, 1.5, 0.5));
    rise(c.b1, b, 1.8, { stagger: 0.05, dur: 0.9 });
    rise(c.cWord, b, 2.4, { stagger: 0.05, dur: 0.9 });
    c.dis._w.forEach((w, i) => {
      const p = pr(b, 2.5 + i * 0.03, 0.9);
      const out = pr(b, 4.9 + c.order[i] * 0.8, 0.5, E.inCubic);
      w.style.transform = `translateY(${((1 - p) * 105 - out * 40).toFixed(1)}%)`;
      w.style.opacity = (1 - out).toFixed(3);
      w.style.filter = out > 0 ? `blur(${(out * 10).toFixed(1)}px)` : '';
    });
    T(c.chips, { y: (1 - pr(b, 3.2, 0.8)) * 30, o: pr(b, 3.2, 0.5) * (1 - pr(b, 5.4, 0.5)) });
  },
};

// ───────────────────────── the system ─────────────────────────
const CARDS = [
  ['01', 'Machines', 'perform the work'],
  ['02', 'Sensors', 'collect information'],
  ['03', 'Software', 'interprets it'],
  ['04', 'The farm', 'gets smarter'],
];
export const system = {
  sfx: [[0, 'whoosh'], [2, 'blip', 1], [2.6, 'blip', 1.12], [3.2, 'blip', 1.26], [3.8, 'blip', 1.5], [4.8, 'sweep'], [6, 'hit', 0.6]],
  build(el) {
    const tag = box(140, 150, { class: 'tag' }, 'The system');
    const l1 = words('Not just mechanised farming —', 'hl');
    const l1Box = box(140, 196, { style: { fontSize: '56px', fontWeight: 600, color: 'var(--dim)' } }, l1);
    const l2 = words('one *interconnected* system.', 'hl');
    const l2Box = box(140, 262, { style: { fontSize: '112px' } }, l2);
    const cards = CARDS.map(([n, t, d], i) => {
      const card = box(140 + i * 416, 520, { class: 'card', style: { width: '370px', height: '250px' } },
        h('div', { class: 'mono acc', style: { fontSize: '20px' } }, n),
        h('div', { style: { fontSize: '54px', fontWeight: 800, letterSpacing: '-0.03em', marginTop: '70px' } }, t),
        h('div', { style: { fontSize: '28px', color: 'var(--dim)', marginTop: '6px', fontWeight: 500 } }, d));
      return card;
    });
    const arrows = [0, 1, 2].map((i) => box(140 + i * 416 + 370 + 4, 628, { style: { color: 'var(--lime)' } }, arrow(38)));
    const x1 = 140 + 185, x4 = 140 + 3 * 416 + 185;
    const loop = s('path', { d: `M${x4} 772 V 850 Q ${x4} 870 ${x4 - 20} 870 H ${x1 + 20} Q ${x1} 870 ${x1} 850 V 772`, fill: 'none', stroke: 'var(--lime)', 'stroke-width': 2.5, pathLength: 1 });
    const pulses = [0, 1, 2, 3, 4].map(() => s('circle', { r: 6, fill: 'var(--lime)' }));
    const svg = s('svg', { class: 'abs', width: 1920, height: 1080, style: 'left:0;top:0' }, loop, ...pulses);
    const loopLabel = box(0, 852, { style: { width: '1920px', textAlign: 'center' } }, h('span', { class: 'chip lime', style: { background: 'var(--bg)' } }, 'Every season · the loop tightens'));
    el.append(tag, l1Box, l2Box, svg, ...cards, ...arrows, loopLabel);
    return { root: el, tag, l1, l2, cards, arrows, loop, pulses, loopLabel };
  },
  update(b, c) {
    O(c.tag, pr(b, 0, 0.4));
    rise(c.l1, b, 0, { stagger: 0.04 });
    rise(c.l2, b, 0.7, { stagger: 0.07 });
    c.cards.forEach((card, i) => {
      const p = pr(b, 2 + i * 0.6, 0.8);
      T(card, { y: (1 - p) * 60, o: p });
      const hi = i === 3 ? pr(b, 6, 0.5) : 0;
      card.style.borderColor = hi > 0 ? `rgba(200,255,77,${0.12 + hi * 0.88})` : '';
      card.style.background = hi > 0 ? `rgba(200,255,77,${hi * 0.08})` : '';
    });
    c.arrows.forEach((a, i) => T(a, { x: (1 - pr(b, 2.4 + i * 0.6, 0.6)) * -20, o: pr(b, 2.4 + i * 0.6, 0.6) }));
    const lp = pr(b, 4.8, 1.2, E.inOutCubic);
    draw(c.loop, lp);
    const L = c.loop.getTotalLength();
    c.pulses.forEach((p, k) => {
      const u = (b * 0.32 + k / 5) % 1;
      const pt = c.loop.getPointAtLength(u * L);
      p.setAttribute('cx', pt.x); p.setAttribute('cy', pt.y);
      p.style.opacity = lp >= 1 ? 1 : 0;
    });
    T(c.loopLabel, { o: pr(b, 5.6, 0.6), y: (1 - pr(b, 5.6, 0.6)) * 12 });
    exit(c.root, b, 9.4, 0.6);
  },
};
