// Small farms vs big machinery, the farm-specific seed, and scaling to millions of farms.
import { h, s, clamp, lerp, E, pr, rng, stage, camPath, Label, motes, hash } from '../core.js';
import { PAL, f, cloud, palm, heartLeaf, cucumber, flower } from '../world.js';
import { Bot, Tractor } from '../rigs.js';
import { icon, drawIcon } from '../../../video/js/art.js';

const svgEl = (tag, a, html = '') => { const e = s(tag, a); if (html) e.innerHTML = html; return e; };

// ───────────────────────── small farms ─────────────────────────
// World: mainland plains (0–1920) · sea (1920–2700) · Nicobar terraces (2700–4700)
const TER = [
  { x0: 2640, x1: 3560, y: 830 },
  { x0: 3420, x1: 4160, y: 700 },
  { x0: 4020, x1: 4760, y: 580 },
];
export const small = {
  build(el, cue) {
    const st = stage(el);
    const r = rng(91);
    let a = `<defs><linearGradient id="smsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fc3d6"/><stop offset="0.7" stop-color="#e9e7c6"/><stop offset="1" stop-color="#f6ddb0"/></linearGradient>
      <linearGradient id="plain" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9c77a"/><stop offset="1" stop-color="#b9a24e"/></linearGradient>
      <linearGradient id="smsea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe3db"/><stop offset="1" stop-color="#5fa9b0"/></linearGradient></defs>
      <rect x="-600" y="-400" width="6000" height="1900" fill="url(#smsky)"/>
      ${cloud(300, 160, 300, 0.6)}${cloud(1300, 120, 260, 0.5)}${cloud(2300, 190, 280, 0.55)}${cloud(3300, 130, 300, 0.55)}${cloud(4300, 180, 260, 0.5)}`;
    // plains
    a += `<clipPath id="plainClip"><rect x="-600" y="600" width="2590" height="900"/></clipPath>`;
    a += `<path d="M-600 610 L2000 610 L2000 1500 L-600 1500 Z" fill="url(#plain)"/><g clip-path="url(#plainClip)">`;
    a += `<path d="M-600 610 C 200 596 1200 598 2000 606" stroke="#9fb06a" stroke-width="10" fill="none"/>`;
    for (let k = -40; k <= 40; k++) a += `<path d="M${f(700 + k * 6)} 612 L${f(700 + k * 220)} 1500" stroke="rgba(120,96,40,0.28)" stroke-width="${f(2 + Math.abs(k) * 0.05)}"/>`;
    for (let k = 0; k < 9; k++) { const y = 612 + Math.pow(k / 8, 2) * 900; a += `<path d="M-600 ${f(y)} H2000" stroke="rgba(255,240,190,0.25)" stroke-width="${f(1 + k * 0.6)}"/>`; }
    a += `</g>`;
    for (const x of [120, 420, 1500, 1820]) a += `<g transform="translate(${x} 606)"><rect x="-2" y="-40" width="4" height="40" fill="#6b6f70"/><path d="M-20 -40 H20 M-14 -30 H14" stroke="#6b6f70" stroke-width="3"/></g>`;
    // sea
    a += `<rect x="1980" y="610" width="760" height="900" fill="url(#smsea)"/>`;
    for (let i = 0; i < 60; i++) a += `<rect x="${f(2000 + r() * 720)}" y="${f(640 + r() * 700)}" width="${f(14 + r() * 40)}" height="3" rx="1.5" fill="#e8fbf5" opacity="${f(0.3 + r() * 0.4)}"/>`;
    a += `<path d="M1960 612 C1980 700 1990 900 1970 1500" stroke="#d9c77a" stroke-width="40" fill="none"/>`;
    // island hills behind the terraces
    a += `<path d="M2700 640 C2900 520 3200 420 3600 380 C3900 350 4200 330 4500 360 C4700 380 4900 420 5100 460 L5100 900 L2700 900 Z" fill="#7fae7a"/>`;
    for (let x = 2760; x < 5100; x += 30) {
      const y = x < 3600 ? 640 - ((x - 2700) / 900) * 260 : 380 - ((x - 3600) / 900) * 40 + Math.max(0, (x - 4500) * 0.18);
      a += `<circle cx="${f(x)}" cy="${f(y + 10)}" r="${f(20 + r() * 12)}" fill="${r() > 0.5 ? '#6f9f6f' : '#86b683'}"/>`;
    }
    for (const [x, h] of [[2900, 150], [3150, 180], [3500, 160], [3800, 170], [4300, 150], [4650, 190]]) {
      const y = x < 3600 ? 640 - ((x - 2700) / 900) * 260 : 380;
      a += palm(r, x, y + 30, h, (r() - 0.5) * 30, 0.6, '#6f6049', '#4e8961');
    }
    // terraces (front face + top)
    for (const [i, T] of [...TER.entries()].reverse()) {
      a += `<path d="M${T.x0 - 40} ${T.y + 140 + i * 30} L${T.x1 + 400} ${T.y + 140 + i * 30} L${T.x1 + 400} 1500 L${T.x0 - 40} 1500 Z" fill="${['#8f5d34', '#86572f', '#7c502b'][i]}"/>`;
      a += `<path d="M${T.x0} ${T.y} L${T.x1 + 400} ${T.y} L${T.x1 + 400} ${T.y + 140 + i * 30} L${T.x0 - 40} ${T.y + 140 + i * 30} Z" fill="${['#b27a47', '#a86f40', '#9d673b'][i]}"/>`;
      a += `<rect x="${T.x0}" y="${T.y - 12}" width="${T.x1 - T.x0 + 400}" height="16" rx="6" fill="#86b053"/>`;
      for (let k = 0; k < 8; k++) a += `<path d="M${f(T.x0 + (k + 0.5) * (T.x1 - T.x0) / 8)} ${T.y + 10} q ${f((r() - 0.5) * 20)} 30 0 60" stroke="rgba(0,0,0,0.12)" stroke-width="3" fill="none"/>`;
    }
    a += `<path d="M2600 960 L4800 960 L4800 1500 L2600 1500 Z" fill="#a86f40"/>`;
    // narrow winding track up the terraces
    a += `<path d="M2700 960 C2900 950 3000 900 3060 850 L3100 832 C3300 830 3380 790 3440 720 L3470 704 C3700 700 3900 660 4040 590" stroke="#e6c48e" stroke-width="22" fill="none" stroke-linecap="round"/>`;
    // plot 1: trellis with cucumbers
    const T1 = TER[0];
    for (const x of [2760, 3000, 3240]) a += `<rect x="${x - 6}" y="${T1.y - 170}" width="12" height="170" fill="#8a5b3a"/>`;
    a += `<line x1="2740" y1="${T1.y - 164}" x2="3260" y2="${T1.y - 164}" stroke="#5b4a3a" stroke-width="2.5"/>`;
    for (let i = 0; i < 70; i++) a += heartLeaf(2750 + r() * 500, T1.y - 170 + Math.pow(r(), 1.6) * 150, 0.6 + r() * 0.3, (r() - 0.5) * 60, PAL.leaf[i % 5]);
    for (let i = 0; i < 6; i++) a += cucumber(2790 + i * 80, T1.y - 140 + (i % 2) * 30, 50, 16);
    // plot 1b: okra rows
    for (let x = 3300; x < 3540; x += 34) a += `<g transform="translate(${x} ${T1.y - 12})"><path d="M0 0 V-70" stroke="#3f8a47" stroke-width="5"/>${[0, 1, 2].map((k) => heartLeaf(0, -30 - k * 18, 0.5, k % 2 ? 60 : -60, PAL.leaf[(k + 2) % 5])).join('')}</g>`;
    // plot 2: mixed rows
    const T2 = TER[1];
    for (let x = T2.x0 + 30; x < T2.x1 - 20; x += 44) a += `<g transform="translate(${x} ${T2.y - 12})">${[0, 1, 2].map((k) => heartLeaf((k - 1) * 10, -18 - k * 6, 0.55, (k - 1) * 50 + 180, PAL.leaf[(k + x) % 5])).join('')}${x % 3 ? `<circle cx="6" cy="-30" r="6" fill="#e8412e"/>` : ''}</g>`;
    // plot 3: papaya trees
    const T3 = TER[2];
    for (let x = T3.x0 + 60; x < T3.x1 - 40; x += 130) {
      a += `<g transform="translate(${x} ${T3.y - 10})"><path d="M0 0 C-4 -60 4 -120 0 -170" stroke="#9b8a6a" stroke-width="12" fill="none"/>`;
      for (let k = 0; k < 7; k++) a += `<path d="M0 -168 q${f(Math.cos(k * 0.9) * 50)} ${f(-30 + Math.sin(k * 0.9) * 10)} ${f(Math.cos(k * 0.9) * 90)} ${f(10 + Math.abs(Math.sin(k)) * 20)}" stroke="#3f8a47" stroke-width="7" fill="none" stroke-linecap="round"/>`;
      a += `<ellipse cx="-12" cy="-148" rx="11" ry="16" fill="#f2a33a"/><ellipse cx="10" cy="-142" rx="11" ry="16" fill="#8cbf45"/></g>`;
    }
    st.cam.append(svgEl('g', {}, a));
    // tractor on the plains + ghost tractor on the island
    const tractor = Tractor();
    st.cam.append(tractor.el);
    const ghost = svgEl('g', {}, '');
    const gT = Tractor({ col: 'rgba(232,84,62,0.25)', shade: 'rgba(232,84,62,0.2)' });
    gT.el.setAttribute('opacity', 1);
    gT.el.querySelectorAll('*').forEach((e) => { if (e.getAttribute('fill') && !e.getAttribute('fill').startsWith('rgba')) e.setAttribute('fill', 'rgba(232,84,62,0.16)'); e.setAttribute('stroke', '#e8543e'); e.setAttribute('stroke-width', '3'); e.setAttribute('stroke-dasharray', '10 8'); });
    ghost.append(gT.el);
    st.cam.append(ghost);
    // compact bots
    const bots = [Bot('weeder'), Bot('inspector'), Bot('cart'), Bot('pruner')];
    bots.forEach((b) => st.cam.append(b.el));
    const mods = [Bot('weeder'), Bot('pruner'), Bot('trainer')];
    const modG = svgEl('g', {});
    mods.forEach((m) => modG.append(m.el));
    st.cam.append(modG);
    const L = {
      vast: Label('Vast, flat fields'), a3: Label('3 acres'), a5: Label('5 acres'), a10: Label('10 acres'),
      hilly: Label('Hilly'), track: Label('Narrow track'), trellis: Label('Trellises'), big: Label('Too big', { cls: 'warn big' }),
      sm: Label('Small'), lt: Label('Light'), md: Label('Modular'),
    };
    Object.values(L).forEach((l) => st.ui.append(l.el));
    const veil = h('div', { class: 'layer', style: { background: 'rgba(20,28,24,0.55)', opacity: 0 } });
    const q = h('div', { style: { position: 'absolute', left: '160px', right: '160px', top: '300px', textAlign: 'center', opacity: 0 } },
      h('div', { class: 'mono', style: { fontSize: '22px', color: '#c8ff4d', marginBottom: '24px' } }, 'The question'),
      h('div', { class: 'title', style: { fontSize: '96px', lineHeight: 1.02 } }, 'How do we bring industrial productivity to a ', h('span', { style: { color: '#c8ff4d' } }, 'five-acre farm?')));
    st.ui.append(veil, q);
    const T = {
      m1: cue.line('m1').start, m2: cue.line('m2').start, a3: cue.word('m2', 'three'), a5: cue.word('m2', 'five'), a10: cue.word('m2', 'ten'),
      hilly: cue.word('m2', 'hilly'), track: cue.word('m2', 'narrow'), trellis: cue.word('m2', 'trellises'), m3: cue.line('m3').start,
      sm: cue.word('m3', 'small'), lt: cue.word('m3', 'light'), md: cue.word('m3', 'modular'), q: cue.word('m3', 'The question'), end: cue.line('m3').end,
    };
    return { st, tractor, ghost, gT, bots, mods, L, veil, q, T };
  },
  update(t, c, cue) {
    const { T } = c;
    const cx = camPath([[-1, 900, 560, 1.0], [T.m2 - 0.3, 1000, 560, 1.0], [T.m2 + 2.2, 3700, 600, 1.0], [T.m3, 3720, 620, 1.02], [cue.dur, 3700, 610, 1.0]], t, E.inOutCubic);
    const swoop = Math.sin(clamp((t - T.m2 + 0.3) / 2.5) * Math.PI) * 0.22;
    c.st.camera.set(cx[0], cx[1] - swoop * 200, cx[2] - swoop);
    // big tractor across the plains
    const tx = lerp(-300, 1500, pr(t, -0.5, T.m2 + 1, E.lin));
    c.tractor.pose({ x: tx, y: 980, sc: 1.05, roll: tx * 0.6 });
    // ghost tractor dropped onto the small farm
    const gp = pr(t, T.trellis + 0.5, 0.6, E.outBack), gq = pr(t, T.sm - 0.3, 0.5);
    c.gT.pose({ x: 3160, y: 830 + (1 - gp) * -120, sc: 1.3, shake: t > T.trellis + 1 ? Math.sin(t * 40) * 2 : 0 });
    c.ghost.style.opacity = (clamp((t - T.trellis - 0.5) * 3) * (1 - gq)).toFixed(3);
    // compact bots working the terraces
    const lanes = [[2800, 3250, TER[0].y + 4, 0.5], [3500, 4080, TER[1].y + 4, 0.48], [2760, 3500, 958, 0.55], [4100, 4680, TER[2].y + 4, 0.45]];
    c.bots.forEach((b, i) => {
      const [x0, x1, y, sc] = lanes[i];
      const st0 = T.sm + i * 0.25;
      const k = pr(t, st0, 0.8, E.outBack);
      const u = ((Math.max(0, t - st0) * 0.12 + i * 0.3) % 2);
      const pp = u < 1 ? u : 2 - u;
      b.pose({ x: lerp(x0, x1, E.inOutCubic(pp)), y, sc: sc * k, dir: u < 1 ? 1 : -1, roll: t * 300, t, o: clamp((t - st0) * 3) });
    });
    // modular: one chassis, tools swap
    const mIdx = Math.floor(Math.max(0, t - T.md) / 0.6) % 3;
    c.mods.forEach((m, i) => {
      const on = t > T.md - 0.2 && i === mIdx;
      const p = on ? pr(t, T.md + Math.floor(Math.max(0, t - T.md) / 0.6) * 0.6, 0.3, E.outBack) : 0;
      m.pose({ x: 3380, y: 960, sc: 0.75 * (0.8 + 0.2 * p), t, o: on ? 1 : 0 });
    });
    const cam = c.st.camera;
    c.L.vast.at(cam.toScreen([900, 500]), t, T.m1 + 0.5, T.m2 + 0.5);
    c.L.a3.at(cam.toScreen([3000, 600]), t, T.a3, T.q - 0.2);
    c.L.a5.at(cam.toScreen([3660, 560]), t, T.a5, T.q - 0.2);
    c.L.a10.at(cam.toScreen([4390, 380]), t, T.a10, T.q - 0.2);
    c.L.hilly.at(cam.toScreen([3350, 430]), t, T.hilly, T.sm);
    c.L.track.at(cam.toScreen([3470, 690]), t, T.track, T.sm);
    c.L.trellis.at(cam.toScreen([2780, 640]), t, T.trellis, T.trellis + 0.4);
    c.L.big.at(cam.toScreen([3160, 520]), t, T.trellis + 0.9, T.sm - 0.3);
    c.L.sm.at(cam.toScreen([3025, 740]), t, T.sm, T.q - 0.2);
    c.L.lt.at(cam.toScreen([4000, 640]), t, T.lt, T.q - 0.2);
    c.L.md.at(cam.toScreen([3380, 790]), t, T.md, T.q - 0.2);
    const qp = pr(t, T.q, 0.8, E.outCubic);
    c.veil.style.opacity = (qp * 0.9).toFixed(3);
    c.q.style.opacity = qp.toFixed(3);
    c.q.style.transform = `translateY(${f((1 - qp) * 30)}px)`;
  },
};

// ───────────────────────── the seed ─────────────────────────
function seedShape(fill = '#d9b36a', glow = false) {
  return `${glow ? '<circle r="90" fill="url(#softGlow)"/>' : ''}<path d="M0 -56 C34 -40 40 20 0 56 C-40 20 -34 -40 0 -56 Z" fill="${fill}"/><path d="M0 -44 C14 -20 14 24 0 44" stroke="rgba(0,0,0,0.18)" stroke-width="4" fill="none"/>`;
}
const FARMS = [
  ['flat', '#c9b25c'], ['hilly', '#7fae7a'], ['wet', '#5fa9b0'], ['dry', '#d9a86a'], ['flat', '#b9c46c'], ['island', '#86b683'],
  ['hilly', '#9ab86e'], ['dry', '#e0b774'], ['wet', '#6fb6a8'], ['flat', '#c2b865'], ['hilly', '#83b27a'], ['dry', '#d7a15f'],
];
function farmTile(kind, col, r) {
  let g = `<rect x="-70" y="-50" width="140" height="100" rx="18" fill="${col}"/>`;
  if (kind === 'hilly') g += `<path d="M-70 30 C-30 -20 10 -30 70 10 L70 50 L-70 50 Z" fill="rgba(60,110,60,0.45)"/>`;
  if (kind === 'wet') g += `<path d="M-50 10 q20 -10 40 0 t40 0 t40 0" stroke="#e8fbff" stroke-width="4" fill="none"/><path d="M-50 26 q20 -10 40 0 t40 0 t40 0" stroke="#e8fbff" stroke-width="4" fill="none"/>`;
  if (kind === 'dry') g += `<circle cx="40" cy="-24" r="14" fill="#fff0b0"/><path d="M-50 20 H40" stroke="rgba(120,80,30,0.5)" stroke-width="4"/>`;
  if (kind === 'flat') for (let k = 0; k < 4; k++) g += `<path d="M-56 ${-28 + k * 18} H56" stroke="rgba(90,70,20,0.35)" stroke-width="4"/>`;
  if (kind === 'island') g += `<path d="M-70 26 C-40 16 40 16 70 26 L70 50 L-70 50 Z" fill="#5fa9b0"/>${palm(r, 20, 22, 60, 10, 0.3, '#6f6049', '#3f7a4f')}`;
  return g;
}
export const seed = {
  build(el, cue) {
    const st = stage(el);
    const r = rng(5);
    st.cam.append(svgEl('g', {}, `<defs><radialGradient id="sdbg" cx="0.5" cy="0.45" r="0.8"><stop offset="0" stop-color="#f6f1dc"/><stop offset="1" stop-color="#d9e4c2"/></radialGradient></defs><rect x="-200" y="-200" width="2320" height="1480" fill="url(#sdbg)"/>
      ${Array.from({ length: 12 }, (_, k) => heartLeaf(90 + k * 170, k % 2 ? 1030 : 40, 2.2, k % 2 ? 180 : 0, 'rgba(90,150,80,0.14)')).join('')}`));
    // memory disc feeding the seed
    const disc = svgEl('g', { transform: 'translate(360 300)' }, `<circle r="150" fill="url(#softGlow)"/><circle r="88" fill="rgba(28,40,34,0.88)" stroke="#c8ff4d" stroke-width="3"/>${Array.from({ length: 7 }, (_, k) => `<circle r="${20 + k * 10}" fill="none" stroke="#c8ff4d" stroke-width="2.5"/>`).join('')}`);
    const flow = motes(16, 4);
    const seedG = svgEl('g', {}, seedShape('#d9b36a', true));
    const sprout = svgEl('g', {}, `<path d="M0 -50 C-4 -80 4 -100 0 -120" stroke="#4c8f45" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M0 -104 C-30 -120 -52 -104 -56 -86 C-30 -80 -10 -90 0 -104 Z" fill="#58a957"/><path d="M0 -112 C26 -132 52 -120 58 -100 C32 -94 10 -100 0 -112 Z" fill="#4b9a4f"/>`);
    seedG.append(sprout);
    // one packet → many farms
    const packet = svgEl('g', {}, `<rect x="-90" y="-110" width="180" height="220" rx="16" fill="#fffaf0" stroke="#c9bfa6" stroke-width="3"/><rect x="-90" y="-110" width="180" height="60" rx="16" fill="#e8543e"/><text x="0" y="-70" text-anchor="middle" font-family="Inter Tight" font-weight="800" font-size="26" fill="#fffaf0">VARIETY X</text><g transform="translate(0 20) scale(0.8)">${seedShape('#d9b36a')}</g><text x="0" y="96" text-anchor="middle" font-family="JetBrains Mono" font-size="14" fill="#6a6a60" letter-spacing="2">BROAD REGION</text>`);
    const farms = FARMS.map(([k, col], i) => svgEl('g', {}, farmTile(k, col, r) + `<g class="sd" transform="translate(-48 -32) scale(0.28)">${seedShape('#d9b36a')}</g>`));
    const fanG = svgEl('g', {});
    const fans = FARMS.map(() => { const e = svgEl('path', { stroke: '#e8543e', 'stroke-width': 2.5, fill: 'none', 'stroke-dasharray': '6 8' }); fanG.append(e); return e; });
    // our farm → conditions → helix → new seed
    const conds = ['Rainfall', 'Humidity', 'Soil', 'Pests', 'Sunlight', 'Temperature'].map((w) => Label(w));
    const helixG = svgEl('g', {});
    const hx = Array.from({ length: 16 }, () => { const e = svgEl('g', {}, `<line stroke="rgba(31,43,37,0.3)" stroke-width="3"/><circle r="8" fill="#9fd400"/><circle r="8" fill="#3fa7a0"/>`); helixG.append(e); return e; });
    const newSeed = svgEl('g', {}, seedShape('#b8e84a', true));
    const tag = Label('Bred for this farm', { cls: 'big' });
    const med = h('div', { class: 'card', style: { left: '1400px', top: '520px', width: '400px', padding: '22px 26px', display: 'flex', alignItems: 'center', gap: '18px', opacity: 0 } });
    med.innerHTML = `<svg width="90" height="90" viewBox="-45 -45 90 90"><circle cy="-16" r="14" fill="#8a5638"/><path d="M-24 30 C-24 4 24 4 24 30 Z" fill="#5f8fa0"/><g transform="translate(24 -22) rotate(35)"><rect x="-18" y="-8" width="36" height="16" rx="8" fill="#e8543e"/><rect x="0" y="-8" width="18" height="16" rx="0" fill="#fffaf0"/><rect x="-18" y="-8" width="36" height="16" rx="8" fill="none" stroke="#1f2b25" stroke-width="2"/></g></svg><div><div style="font-weight:800;font-size:28px;letter-spacing:-0.02em">Personalised medicine</div><div class="mono" style="font-size:13px;color:#6a7a70;margin-top:6px">Designed for one patient</div></div>`;
    st.cam.append(disc, flow.el, fanG, packet, ...farms, helixG, seedG, newSeed);
    [...conds, tag].forEach((l) => st.ui.append(l.el));
    st.ui.append(med);
    const regionL = Label('Same seed, different conditions', { cls: 'warn' });
    st.ui.append(regionL.el);
    const T = {
      seed: cue.word('g1', 'shape the seed'), today: cue.word('g1', 'Today'), broad: cue.word('g1', 'broad regions'),
      g2: cue.line('g2').start, one: cue.word('g2', 'one farm'), exact: cue.word('g2', 'exact conditions'), med: cue.word('g2', 'personalised medicine'),
    };
    const pos = FARMS.map((_, i) => [260 + (i % 6) * 280, 560 + Math.floor(i / 6) * 200]);
    return { st, disc, flow, seedG, sprout, packet, farms, fans, conds, helixG, hx, newSeed, tag, med, regionL, T, pos };
  },
  update(t, c, cue) {
    const { T, pos } = c;
    c.st.camera.set(960, 540, 1 + t * 0.002);
    // phase 1: data shapes the seed
    const p1 = pr(t, -0.7, 0.9, E.outBack), q1 = pr(t, T.today - 0.2, 0.6, E.inCubic);
    c.disc.setAttribute('transform', `translate(360 300) scale(${f(p1 * (1 - q1))})`);
    c.flow.run(t, [360, 300], { on: pr(t, -0.2, 0.6) * (1 - q1), speed: 120, height: 600, target: [960, 480] });
    const sp = pr(t, T.seed - 0.3, 0.8, E.outBack);
    c.seedG.setAttribute('transform', `translate(960 ${f(480 + Math.sin(t * 1.4) * 6)}) scale(${f(sp * 1.7 * (1 - q1))}) rotate(${f(Math.sin(t) * 4)})`);
    c.sprout.style.opacity = pr(t, T.seed + 0.5, 0.6);
    // phase 2: one variety for a broad region
    const p2 = pr(t, T.today, 0.7, E.outBack), q2 = pr(t, T.g2 + 0.2, 0.6, E.inCubic);
    c.packet.setAttribute('transform', `translate(960 ${f(230 - q2 * 400)}) scale(${f(p2)})`);
    c.farms.forEach((g, i) => {
      const [x, y] = pos[i];
      const island = i === 5;
      const k = pr(t, T.broad - 0.4 + i * 0.06, 0.5, E.outBack);
      const zoom = island ? pr(t, T.one - 0.4, 1.0, E.inOutCubic) : 0;
      const gx = lerp(x, 460, zoom), gy = lerp(y, 600, zoom), sc = k * lerp(1, 2.4, zoom);
      g.setAttribute('transform', `translate(${f(gx)} ${f(gy)}) scale(${f(sc)})`);
      g.style.opacity = island ? 1 : 1 - 0.85 * pr(t, T.g2, 0.6);
      const sd = g.querySelector('.sd');
      sd.style.opacity = pr(t, T.broad + 0.3 + i * 0.05, 0.3) * (island ? 1 - pr(t, T.one, 0.4) : 1);
      const fan = c.fans[i];
      fan.setAttribute('d', `M960 ${f(330 - q2 * 400)} Q${f((960 + x) / 2)} ${f(380)} ${f(x)} ${f(y - 50)}`);
      fan.style.opacity = pr(t, T.broad, 0.5) * (1 - q2);
    });
    c.regionL.at([960, 900], t, T.broad + 0.8, T.g2);
    // phase 3: conditions of one farm → helix → new seed
    const cpos = [[780, 300], [800, 395], [780, 490], [800, 585], [780, 680], [760, 775]];
    c.conds.forEach((l, i) => l.at(cpos[i], t, T.exact - 0.3 + i * 0.12, cue.dur - 0.4, { anchor: 'left' }));
    const hp = pr(t, T.exact + 0.2, 0.8);
    c.hx.forEach((g, i) => {
      const y = 330 + i * 34, a = t * 2 + i * 0.5, amp = 60 * hp;
      const x1 = 1150 + Math.sin(a) * amp, x2 = 1150 - Math.sin(a) * amp;
      const [ln, c1, c2] = g.children;
      ln.setAttribute('x1', f(x1)); ln.setAttribute('x2', f(x2)); ln.setAttribute('y1', f(y)); ln.setAttribute('y2', f(y));
      c1.setAttribute('cx', f(x1)); c1.setAttribute('cy', f(y)); c2.setAttribute('cx', f(x2)); c2.setAttribute('cy', f(y));
      c1.setAttribute('r', f(6 + 3 * Math.cos(a))); c2.setAttribute('r', f(6 - 3 * Math.cos(a)));
      g.style.opacity = hp * clamp(1 - Math.abs(i - 7.5) / 8 + 0.3) * (1 - 0.85 * pr(t, T.exact + 1.0, 0.8));
    });
    const ns = pr(t, T.exact + 1.0, 0.8, E.outBack);
    c.newSeed.setAttribute('transform', `translate(1150 ${f(590 + Math.sin(t * 1.3) * 6)}) scale(${f(ns * 1.5)}) rotate(${f(Math.sin(t) * 5)})`);
    c.newSeed.style.opacity = ns > 0 ? 1 : 0;
    c.tag.at([1150, 790], t, T.exact + 1.4, cue.dur, { anchor: 'center' });
    const mp = pr(t, T.med - 0.2, 0.6, E.outBack);
    c.med.style.opacity = clamp((t - T.med + 0.2) * 4).toFixed(3);
    c.med.style.transform = `translateY(${f((1 - mp) * 30)}px)`;
  },
};

// ───────────────────────── many farms ─────────────────────────
const COLS = 34, ROWS = 20, TS = 64;
export const scale = {
  build(el, cue) {
    const st = stage(el);
    const r = rng(12);
    const g = svgEl('g', {});
    const tiles = [];
    const cols = ['#a7c56c', '#86b053', '#c9b25c', '#9ab86e', '#b9c46c', '#7fae7a', '#d9b36a'];
    const W = COLS * TS, H = ROWS * TS;
    g.append(svgEl('rect', { x: -W / 2 - 400, y: -H / 2 - 400, width: W + 800, height: H + 800, fill: '#6f9b5c' }));
    for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
      const x = (i - COLS / 2) * TS, y = (j - ROWS / 2) * TS;
      const ci = i - COLS / 2 + 0.5, cj = j - ROWS / 2 + 0.5;
      const d = Math.hypot(ci, cj * 1.4);
      const ang = Math.floor(r() * 4) * 45;
      const t = svgEl('g', { transform: `translate(${x + TS / 2} ${y + TS / 2})` },
        `<rect x="${-TS / 2 + 3}" y="${-TS / 2 + 3}" width="${TS - 6}" height="${TS - 6}" rx="8" fill="${cols[Math.floor(r() * cols.length)]}"/>
         <g transform="rotate(${ang})">${[-16, -6, 4, 14].map((k) => `<path d="M-24 ${k} H24" stroke="rgba(60,80,30,0.3)" stroke-width="3"/>`).join('')}</g>
         <rect class="lit" x="${-TS / 2 + 3}" y="${-TS / 2 + 3}" width="${TS - 6}" height="${TS - 6}" rx="8" fill="rgba(200,255,77,0.25)" stroke="#c8ff4d" stroke-width="3" opacity="0"/>
         <circle class="dot" r="6" fill="#fffaf0" opacity="0"/>`);
      g.append(t);
      tiles.push({ el: t, d: d + r() * 1.5, lit: t.querySelector('.lit'), dot: t.querySelector('.dot') });
    }
    // our farm at the centre (tile at 0,0) drawn in detail
    const home = svgEl('g', {}, `<rect x="-${TS / 2 - 3}" y="-${TS / 2 - 3}" width="${TS - 6}" height="${TS - 6}" rx="8" fill="#86b683" stroke="#c8ff4d" stroke-width="3"/>
      <rect x="-24" y="10" width="48" height="10" rx="3" fill="#5fa9b0"/>${palm(r, -14, 12, 26, 4, 0.16, '#6f6049', '#3f7a4f')}${palm(r, 14, 12, 22, -4, 0.14, '#6f6049', '#3f7a4f')}
      <rect x="-10" y="-8" width="20" height="14" fill="#ecdcbc"/><path d="M-12 -8 L12 -6 L12 -4 L-12 -6 Z" fill="#2c4a63"/>`);
    home.setAttribute('transform', `translate(${TS / 2} ${TS / 2})`);
    g.append(home);
    st.cam.append(g);
    const loop = h('div', { class: 'layer', style: { opacity: 0 } });
    const nodes = [['Labour problem', 'weed'], ['Engineering problem', 'prune'], ['Product', 'cart']].map(([t, ic], i) => {
      const ico = icon(ic, 54, '#1f2b25', 1.8);
      const n = h('div', { class: 'card', style: { width: '380px', padding: '24px 26px', display: 'flex', alignItems: 'center', gap: '18px', fontWeight: 800, fontSize: '32px', letterSpacing: '-0.02em' } }, ico, t);
      n._ico = ico;
      loop.append(n);
      return n;
    });
    const arrows = svgEl('svg', { width: 1920, height: 1080, style: 'position:absolute;left:0;top:0' });
    arrows.innerHTML = `<defs><marker id="ah" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#c8ff4d"/></marker></defs>
      <path class="a0" d="M720 430 C 860 350 960 340 1070 345" stroke="#c8ff4d" stroke-width="6" fill="none" pathLength="1"/>
      <path class="a1" d="M1430 390 C 1540 480 1540 640 1450 718" stroke="#c8ff4d" stroke-width="6" fill="none" pathLength="1"/>
      <path class="a2" d="M1050 770 C 800 830 560 720 520 515" stroke="#c8ff4d" stroke-width="6" fill="none" pathLength="1"/>`;
    loop.prepend(arrows);
    const hub = h('div', { style: { position: 'absolute', left: '640px', top: '520px', width: '640px', textAlign: 'center' } },
      h('div', { class: 'serif', style: { fontSize: '46px', color: '#fffaf0', textShadow: '0 2px 12px rgba(0,0,0,0.35)' } }, 'Our farms are the testing ground'));
    loop.append(hub);
    const veil = h('div', { class: 'layer', style: { background: 'rgba(20,32,24,0.62)', opacity: 0 } });
    st.ui.append(veil, loop);
    const many = Label('Millions of small farms', { cls: 'big' });
    st.ui.append(many.el);
    const T = {
      ours: cue.word('p1', 'small farms like ours'), millions: cue.word('p1', 'millions'), p2: cue.line('p2').start,
      eng: cue.word('p2', 'engineering problem'), sol: cue.word('p2', 'Every solution'), prod: cue.word('p2', 'product'),
    };
    return { st, tiles, loop, nodes, arrows, veil, many, T };
  },
  update(t, c, cue) {
    const { T } = c;
    const z = Math.exp(lerp(Math.log(7.5), Math.log(0.9), E.inOutCubic(clamp((t - 0.2) / (T.millions + 0.6)))));
    c.st.camera.set(TS / 2, TS / 2, z);
    const wave = Math.max(0, (t - T.ours) * 7);
    c.tiles.forEach((tl) => {
      const on = tl.d < wave;
      const k = on ? clamp((wave - tl.d) / 3) : 0;
      tl.lit.setAttribute('opacity', f(k));
      tl.dot.setAttribute('opacity', f(k));
    });
    c.many.at([960, 170], t, T.millions + 0.3, T.p2);
    const lp = pr(t, T.p2 - 0.2, 0.6);
    c.veil.style.opacity = lp.toFixed(3);
    c.loop.style.opacity = lp.toFixed(3);
    const place = [[330, 420], [1080, 300], [1060, 720]];
    const times = [T.p2, T.eng, T.prod];
    c.nodes.forEach((n, i) => {
      const p = pr(t, times[i] - 0.1, 0.5, E.outBack);
      n.style.position = 'absolute';
      n.style.left = place[i][0] + 'px'; n.style.top = place[i][1] + 'px';
      n.style.opacity = clamp((t - times[i] + 0.1) * 4).toFixed(3);
      n.style.transform = `scale(${f(0.8 + 0.2 * p)})`;
      drawIcon(n._ico, pr(t, times[i], 0.8));
    });
    const ar = c.arrows.querySelectorAll('path[pathLength]');
    const at = [T.eng - 0.4, T.prod - 0.4, T.prod + 0.6];
    ar.forEach((a, i) => {
      const p = pr(t, at[i], 0.6, E.inOutCubic);
      a.style.strokeDasharray = '1 1'; a.style.strokeDashoffset = f(1 - p);
      a.style.opacity = p > 0.01 ? 1 : 0;
      if (p > 0.92) a.setAttribute('marker-end', 'url(#ah)'); else a.removeAttribute('marker-end');
    });
  },
};
