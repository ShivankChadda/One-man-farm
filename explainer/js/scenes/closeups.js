// Close-up explainers: irrigation cross-section, the harvesting robot, crop-specific
// tools, and under-canopy spraying.
import { h, s, clamp, lerp, E, pr, rng, stage, camPath, Label, hash } from '../core.js';
import { FarmWorld, PAL, f, heartLeaf, cloud, palm, cucumber } from '../world.js';
import { HarvestBot, Drone, Rover } from '../rigs.js';
import { crop } from '../../../video/js/art.js';

const svgEl = (tag, a, html = '') => { const e = s(tag, a); if (html) e.innerHTML = html; return e; };

// ───────────────────────── water & nutrients ─────────────────────────
const PLANTS = [560, 830, 1100, 1370, 1640];
const GY = 540; // ground line
export const water = {
  build(el, cue) {
    const st = stage(el);
    const r = rng(31);
    const bg = svgEl('g', {}, `
      <defs><linearGradient id="wsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd0d2"/><stop offset="1" stop-color="#f3e6c2"/></linearGradient></defs>
      <rect width="1920" height="${GY}" fill="url(#wsky)"/>
      ${cloud(380, 150, 280, 0.6)}${cloud(1500, 110, 240, 0.5)}${cloud(1050, 210, 160, 0.4)}
      <path d="M0 430 C200 380 420 360 640 392 C860 424 1060 440 1300 420 C1500 404 1720 380 1920 400 L1920 ${GY} L0 ${GY} Z" fill="#a9c9a0"/>
      ${palm(r, 150, 470, 150, 14, 0.6, '#8a7152', '#6fa06f')}${palm(r, 1790, 470, 170, -12, 0.66, '#8a7152', '#6fa06f')}
      <rect y="${GY - 20}" width="1920" height="20" fill="#86b053"/>
      <rect y="${GY}" width="1920" height="${1080 - GY}" fill="url(#soilDeep)"/>
      ${Array.from({ length: 5 }, (_, k) => `<path d="M0 ${GY + 110 + k * 95} C400 ${GY + 96 + k * 95} 900 ${GY + 124 + k * 95} 1920 ${GY + 104 + k * 95}" stroke="rgba(0,0,0,0.08)" stroke-width="3" fill="none"/>`).join('')}
      ${Array.from({ length: 70 }, () => `<ellipse cx="${f(r() * 1920)}" cy="${f(GY + 40 + r() * 500)}" rx="${f(3 + r() * 9)}" ry="${f(2 + r() * 5)}" fill="rgba(60,35,20,${f(0.2 + r() * 0.3)})"/>`).join('')}
      <path d="M0 ${GY} H1920" stroke="#6d4a2e" stroke-width="3"/>`);
    // wet bulbs, roots, plants
    const bulbs = PLANTS.map((x) => svgEl('ellipse', { cx: x, cy: GY + 90, rx: 10, ry: 8, fill: 'url(#wetBulb)' }));
    const roots = PLANTS.map((x, i) => {
      let d = '';
      for (let k = 0; k < 7; k++) {
        const a = (k - 3) * 0.32 + (r() - 0.5) * 0.2;
        const L = 90 + r() * 70;
        d += `M${x} ${GY + 6} q${f(Math.sin(a) * L * 0.4)} ${f(L * 0.5)} ${f(Math.sin(a) * L)} ${f(Math.cos(a) * L)} `;
      }
      return svgEl('path', { d, stroke: '#e9d3a8', 'stroke-width': 3.5, fill: 'none', 'stroke-linecap': 'round', opacity: 0.9 });
    });
    const plants = PLANTS.map((x, i) => {
      const g = svgEl('g', { transform: `translate(${x} ${GY})` });
      let inner = `<path d="M0 0 C-4 -40 4 -80 0 -130" stroke="#3f8a47" stroke-width="7" fill="none" stroke-linecap="round"/>`;
      for (let k = 0; k < 8; k++) {
        const y = -20 - k * 14, side = k % 2 ? 1 : -1;
        inner += heartLeaf(side * 5, y, 1.25 - k * 0.07, side > 0 ? -100 - k * 3 : 100 + k * 3, PAL.leaf[(k + i) % 5]);
      }
      inner += heartLeaf(0, -128, 0.9, 180, '#58a957') + `<circle cx="18" cy="-70" r="6" fill="#ffd23f"/><circle cx="-16" cy="-96" r="5" fill="#ffd23f"/>`;
      const plant = svgEl('g', {}, inner);
      g.append(plant);
      g._p = plant;
      return g;
    });
    // pipe, emitters, drops
    const pipe = svgEl('path', { d: `M300 ${GY - 6} H1800`, stroke: '#2d2b28', 'stroke-width': 12, 'stroke-linecap': 'round', fill: 'none' });
    const flow = svgEl('path', { d: `M300 ${GY - 6} H1800`, stroke: '#5fc3e0', 'stroke-width': 5, 'stroke-dasharray': '16 18', fill: 'none' });
    const flowG = svgEl('path', { d: `M300 ${GY - 6} H1800`, stroke: '#b8e84a', 'stroke-width': 5, 'stroke-dasharray': '8 26', fill: 'none' });
    const clipR = svgEl('clipPath', { id: 'wflow' }, `<rect x="290" y="${GY - 20}" width="0" height="30"/>`);
    const clipRect = clipR.firstElementChild;
    flow.setAttribute('clip-path', 'url(#wflow)');
    flowG.setAttribute('clip-path', 'url(#wflow)');
    const emit = PLANTS.map((x) => svgEl('circle', { cx: x + 26, cy: GY - 1, r: 5, fill: '#1a1918' }));
    const drops = PLANTS.map(() => svgEl('ellipse', { rx: 4, ry: 6, fill: '#6fd0ef' }));
    // pump + tanks + valve + controller + sensor
    const station = svgEl('g', {}, `
      <rect x="70" y="${GY - 210}" width="120" height="170" rx="14" fill="#6f9197"/><ellipse cx="130" cy="${GY - 210}" rx="60" ry="14" fill="#8fb0b4"/>
      <path d="M78 ${GY - 150} H182" stroke="#5c7d83" stroke-width="3"/><path d="M78 ${GY - 110} H182" stroke="#5c7d83" stroke-width="3"/>
      <path d="M88 ${GY - 40} V${GY}" stroke="#5a4a3a" stroke-width="8"/><path d="M172 ${GY - 40} V${GY}" stroke="#5a4a3a" stroke-width="8"/>
      <rect x="210" y="${GY - 110}" width="64" height="86" rx="12" fill="#6fa84a"/><ellipse cx="242" cy="${GY - 110}" rx="32" ry="8" fill="#8cc25e"/>
      <path d="M242 ${GY - 82} v26 M229 ${GY - 69} h26" stroke="#eaf7d0" stroke-width="6" stroke-linecap="round"/>
      <path d="M130 ${GY - 40} V${GY - 6} H300" stroke="#2d2b28" stroke-width="12" fill="none" stroke-linecap="round"/>
      <path d="M242 ${GY - 24} V${GY - 6}" stroke="#2d2b28" stroke-width="8"/>
      <line x1="360" y1="${GY - 6}" x2="360" y2="${GY - 330}" stroke="#4a4a44" stroke-width="7"/>
      <rect x="330" y="${GY - 300}" width="60" height="74" rx="10" fill="${PAL.cream}" stroke="#4a4a44" stroke-width="3"/>
      <rect x="340" y="${GY - 290}" width="40" height="22" rx="4" fill="#1f2623"/>
      <path d="M318 ${GY - 350} L402 ${GY - 336} L398 ${GY - 322} L314 ${GY - 336} Z" fill="#2c4a63"/>
      <path d="M390 ${GY - 300} L408 ${GY - 360}" stroke="#4a4a44" stroke-width="3"/>`);
    const ctrlLed = svgEl('circle', { cx: 360, cy: GY - 244, r: 6, fill: '#3a3a36' });
    const valve = svgEl('g', { transform: `translate(300 ${GY - 6})` }, `<rect x="-18" y="-18" width="36" height="36" rx="8" fill="#3b403e"/><g class="wheel"><circle r="13" fill="none" stroke="#cfd6cf" stroke-width="4"/><path d="M-13 0 H13 M0 -13 V13" stroke="#cfd6cf" stroke-width="3"/></g><circle class="vled" cx="12" cy="-24" r="6" fill="#3a3a36"/>`);
    const vWheel = valve.querySelector('.wheel'), vLed = valve.querySelector('.vled');
    const sensor = svgEl('g', { transform: `translate(1235 ${GY})` }, `<rect x="-6" y="-60" width="12" height="150" rx="4" fill="#e8e2d4"/><rect x="-14" y="-78" width="28" height="22" rx="6" fill="${PAL.ink}"/><circle cx="0" cy="-67" r="5" fill="#bff23a"/><rect x="-4" y="40" width="8" height="46" fill="#9fd400"/>`);
    const waves = svgEl('g', {});
    const loop = svgEl('g', { opacity: 0 }, `
      <path id="lp1" d="M1235 ${GY - 90} C1000 ${GY - 330} 700 ${GY - 360} 400 ${GY - 290}" stroke="#c8ff4d" stroke-width="4" fill="none" stroke-dasharray="10 12"/>
      <path id="lp2" d="M360 ${GY - 226} C340 ${GY - 150} 320 ${GY - 80} 306 ${GY - 30}" stroke="#c8ff4d" stroke-width="4" fill="none" stroke-dasharray="10 12"/>`);
    st.cam.append(bg, ...bulbs, ...roots, ...plants, station, pipe, flow, flowG, ...emit, ...drops, valve, ctrlLed, sensor, waves, loop);
    st.svg.prepend(svgEl('defs', {}, '').appendChild(clipR).parentNode);
    const waveEls = [0, 1, 2].map(() => { const e = svgEl('path', { stroke: '#c8ff4d', 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' }); waves.append(e); return e; });
    // app card
    const app = h('div', { class: 'card', style: { left: '1440px', top: '96px', width: '380px', padding: '22px 26px' } },
      h('div', { class: 'mono', style: { fontSize: '14px', color: '#6a7a70', marginBottom: '12px' } }, 'Irrigation · today'),
      ...[['06:00', 'Plot A', 0.8], ['09:30', 'Plot B', 0.55], ['16:00', 'Plot A · nutrients', 0.35]].map(([tm, lb, w]) =>
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px', margin: '10px 0', fontSize: '20px', fontWeight: 600 } },
          h('span', { class: 'mono', style: { fontSize: '14px', color: '#6a7a70', width: '52px', letterSpacing: '0.08em' } }, tm),
          h('span', { style: { flex: 1 } }, lb),
          h('i', { style: { display: 'block', width: w * 90 + 'px', height: '10px', borderRadius: '5px', background: '#5fc3e0' } }))),
      h('div', { style: { marginTop: '14px', padding: '10px 14px', borderRadius: '12px', background: '#eef7d8', fontWeight: 700, fontSize: '19px', color: '#46660c' } }, '● Running automatically'));
    const labels = { drip: Label('Drip line'), fert: Label('Nutrients'), sensor: Label('Soil sensor'), valve: Label('Automated valve'), soft: Label('Software') };
    Object.values(labels).forEach((l) => st.ui.append(l.el));
    st.ui.append(app);
    const T = {
      drip: cue.word('w1', 'Drip lines'), nut: cue.word('w1', 'nutrients'), sens: cue.word('w2', 'sensors'),
      valve: cue.word('w2', 'automated valves'), soft: cue.word('w2', 'software'), own: cue.word('w2', 'almost on its own'),
    };
    return { st, bulbs, roots, plants, flow, flowG, clipRect, drops, emit, vWheel, vLed, ctrlLed, sensor, waveEls, loop, app, labels, T };
  },
  update(t, c, cue) {
    const { T } = c;
    c.st.camera.set(...camPath([[-1, 980, 560, 1.02], [cue.dur, 960, 540, 1.0]], t));
    const front = clamp((t - T.drip) * 700, 0, 1520);
    c.clipRect.setAttribute('width', f(front));
    c.flow.setAttribute('stroke-dashoffset', f(-t * 90));
    c.flowG.setAttribute('stroke-dashoffset', f(-t * 90));
    c.flowG.style.opacity = pr(t, T.nut, 0.6);
    c.vWheel.setAttribute('transform', `rotate(${f(pr(t, T.drip - 0.4, 0.6) * 90 + pr(t, T.valve, 0.6) * 90)})`);
    c.vLed.setAttribute('fill', t > T.drip - 0.2 ? '#bff23a' : '#3a3a36');
    PLANTS.forEach((x, i) => {
      const ta = T.drip + (x + 26 - 300) / 700;
      const on = t > ta;
      const ph = on ? ((t - ta) * 1.1) % 1 : 0;
      c.drops[i].setAttribute('cx', x + 26);
      c.drops[i].setAttribute('cy', f(GY + 4 + ph * 26));
      c.drops[i].style.opacity = on ? (1 - ph) : 0;
      const wet = pr(t, ta + 0.2, 3.5, E.outCubic);
      c.bulbs[i].setAttribute('rx', f(10 + wet * 150));
      c.bulbs[i].setAttribute('ry', f(8 + wet * 110));
      c.bulbs[i].setAttribute('cy', f(GY + 20 + wet * 70));
      const nut = pr(t, T.nut + i * 0.25, 1.2);
      c.roots[i].setAttribute('stroke', nut > 0 ? `rgb(${Math.round(lerp(233, 190, nut))},${Math.round(lerp(211, 240, nut))},${Math.round(lerp(168, 80, nut))})` : '#e9d3a8');
      const grow = 0.86 + 0.14 * pr(t, ta, 3) + 0.08 * nut;
      c.plants[i]._p.setAttribute('transform', `scale(${f(grow)}) rotate(${f(Math.sin(t * 1.3 + i) * 1.5)})`);
    });
    // sensor → controller → valve
    const sp = pr(t, T.sens, 0.5, E.outBack);
    c.sensor.setAttribute('transform', `translate(1235 ${f(GY + (1 - sp) * 60)})`);
    c.sensor.style.opacity = clamp((t - T.sens) * 4);
    c.waveEls.forEach((w, k) => {
      const ph = ((t - T.sens) * 0.9 + k / 3) % 1;
      const rr = 20 + ph * 60;
      w.setAttribute('d', `M${f(1235 - rr * 0.7)} ${f(GY - 90 - rr * 0.5)} A${f(rr)} ${f(rr)} 0 0 1 ${f(1235 + rr * 0.7)} ${f(GY - 90 - rr * 0.5)}`);
      w.style.opacity = t > T.sens ? (1 - ph) * 0.9 : 0;
    });
    c.ctrlLed.setAttribute('fill', t > T.sens + 0.4 && Math.floor(t * 3) % 2 ? '#bff23a' : '#3a3a36');
    c.loop.style.opacity = pr(t, T.own - 0.2, 0.6);
    for (const p of c.loop.children) p.setAttribute('stroke-dashoffset', f(-t * 50));
    const ap = pr(t, T.soft, 0.6, E.outBack);
    c.app.style.opacity = clamp((t - T.soft) * 4);
    c.app.style.transform = `translateY(${f((1 - ap) * 30)}px) scale(${f(0.92 + 0.08 * ap)})`;
    const cam = c.st.camera;
    c.labels.drip.at(cam.toScreen([1000, GY - 40]), t, T.drip + 0.3, T.valve - 0.2);
    c.labels.fert.at(cam.toScreen([242, GY - 130]), t, T.nut, cue.dur - 0.2);
    c.labels.sensor.at(cam.toScreen([1235, GY - 150]), t, T.sens + 0.2, cue.dur - 0.2);
    c.labels.valve.at(cam.toScreen([300, GY - 60]), t, T.valve, cue.dur - 0.2, { anchor: 'left' });
    c.labels.soft.at([1630, 92], t, 1e9);
  },
};

// ───────────────────────── harvesting ─────────────────────────
export const harvest = {
  build(el, cue) {
    const st = stage(el);
    const world = FarmWorld({ id: 'harv', sky: 'day' });
    st.cam.append(world.el);
    const bot = HarvestBot();
    world.layers.trellis.append(bot.el);
    const scan = svgEl('path', { fill: 'rgba(200,255,77,0.18)', stroke: 'rgba(200,255,77,0.7)', 'stroke-width': 2 });
    const bracket = svgEl('path', { fill: 'none', stroke: '#c8ff4d', 'stroke-width': 4 });
    const spark = svgEl('g', {}, Array.from({ length: 8 }, (_, k) => `<line data-a="${k * 45}" stroke="#fffbe0" stroke-width="4" stroke-linecap="round"/>`).join(''));
    world.layers.fx.append(scan, bracket, spark);
    const steps = ['Find', 'Reach', 'Cut', 'Handle'].map((w, i) => h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 22px 12px 14px', borderRadius: '999px', background: 'rgba(255,252,244,0.95)', boxShadow: '0 6px 24px rgba(60,40,20,0.18)', fontWeight: 700, fontSize: '26px', transition: 'none' } },
      h('b', { style: { width: '34px', height: '34px', borderRadius: '50%', background: '#e7e1d2', color: '#1f2b25', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' } }, String(i + 1)), w));
    const bar = h('div', { style: { position: 'absolute', left: '80px', top: '70px', display: 'flex', gap: '14px' } }, ...steps);
    st.ui.append(bar);
    const T = {
      find: cue.word('h2', 'find'), reach: cue.word('h2', 'reach'), cut: cue.word('h2', 'cut'), handle: cue.word('h2', 'handle'),
      h1: cue.line('h1').start,
    };
    return { st, world, bot, scan, bracket, spark, steps, bar, T };
  },
  update(t, c, cue) {
    const { T, world } = c;
    c.st.camera.set(...camPath([[-1, 1150, 640, 1.35], [T.find, 1230, 700, 1.75], [cue.dur, 1250, 705, 1.85]], t));
    world.clouds.setAttribute('transform', `translate(${f(t * 6)} 0)`);
    const target = world.cukes[3];
    const stem = [target.x, target.y + 8];
    const rest = [1150, 600];
    const crateAt = [1070, 752];
    // arm choreography
    let tg = [rest[0] + Math.sin(t) * 6, rest[1]], open = 1, holding = false, n = 1, holdRot = 0;
    const r1 = pr(t, T.reach - 0.1, 1.1, E.inOutCubic);
    tg = [lerp(tg[0], stem[0] - 30, r1), lerp(tg[1], stem[1] - 6, r1)];
    open = 1 - pr(t, T.cut - 0.15, 0.25);
    const cutT = T.cut + 0.1;
    if (t > T.handle - 0.2) {
      const m = pr(t, T.handle - 0.2, 1.8, E.inOutCubic);
      tg = [lerp(stem[0] - 30, crateAt[0], m), lerp(stem[1] - 6, crateAt[1], m) - Math.sin(m * Math.PI) * 70];
      holding = m < 1;
      holdRot = -90 * E.inOutCubic(clamp((m - 0.3) / 0.7));
      if (m >= 1) { open = pr(t, T.handle + 1.6, 0.3); n = 2; }
    }
    holding = holding || (t > cutT && t < T.handle - 0.2);
    world.cukeEls[3].style.display = t > cutT ? 'none' : '';
    const k = c.bot.pose({ x: 1040, y: 884, target: tg, open, holding, holdRot, crate: n });
    // scanning beam from the lens across the vine, then lock on
    const sw = pr(t, T.find - 0.3, 1.4, E.inOutCubic);
    const lock = pr(t, T.find + 0.9, 0.5, E.outBack);
    const ang = lerp(-60, -20, sw) + Math.sin(t * 2) * 3;
    const L = 220;
    const a1 = (ang - 12) * Math.PI / 180, a2 = (ang + 12) * Math.PI / 180;
    c.scan.setAttribute('d', `M${f(k.lens[0])} ${f(k.lens[1])} L${f(k.lens[0] + Math.cos(a1) * L)} ${f(k.lens[1] + Math.sin(a1) * L)} L${f(k.lens[0] + Math.cos(a2) * L)} ${f(k.lens[1] + Math.sin(a2) * L)} Z`);
    c.scan.style.opacity = t > T.find - 0.3 && t < T.reach + 0.3 ? 1 : 0;
    const pad = 16 + (1 - lock) * 30;
    const x0 = target.x - 13 - pad, x1 = target.x + 13 + pad, y0 = target.y - pad, y1 = target.y + target.len + pad, Lc = 16;
    c.bracket.setAttribute('d', `M${x0} ${y0 + Lc} V${y0} H${x0 + Lc} M${x1 - Lc} ${y0} H${x1} V${y0 + Lc} M${x1} ${y1 - Lc} V${y1} H${x1 - Lc} M${x0 + Lc} ${y1} H${x0} V${y1 - Lc}`);
    c.bracket.style.opacity = t > T.find + 0.9 && t < cutT ? 1 : 0;
    const sp = pr(t, cutT, 0.45, E.outCubic);
    c.spark.style.opacity = t > cutT && sp < 1 ? 1 - sp : 0;
    for (const ln of c.spark.children) {
      const a = (+ln.dataset.a * Math.PI) / 180;
      ln.setAttribute('x1', f(stem[0] + Math.cos(a) * (8 + sp * 12))); ln.setAttribute('y1', f(stem[1] + Math.sin(a) * (8 + sp * 12)));
      ln.setAttribute('x2', f(stem[0] + Math.cos(a) * (14 + sp * 30))); ln.setAttribute('y2', f(stem[1] + Math.sin(a) * (14 + sp * 30)));
    }
    // step bar
    const ts = [T.find, T.reach, T.cut, T.handle];
    c.steps.forEach((e, i) => {
      const on = t >= ts[i];
      const p = pr(t, ts[i], 0.4, E.outBack);
      e.style.opacity = clamp((t - T.h1 - 1.4) * 3).toFixed(3);
      e.style.transform = `scale(${f(on ? 1 + 0.08 * (1 - p) : 1)})`;
      e.style.background = on ? '#1f2b25' : 'rgba(255,252,244,0.95)';
      e.style.color = on ? '#fffaf0' : '#1f2b25';
      e.firstElementChild.style.background = on ? '#c8ff4d' : '#e7e1d2';
    });
  },
};

// ───────────────────────── one crop, one design ─────────────────────────
const CROPS = [
  ['cucumber', 'Cucumber', 'Soft gripper', 'grip'],
  ['okra', 'Okra', 'Snip and catch', 'snip'],
  ['chilli', 'Chilli', 'Comb picker', 'comb'],
  ['bittergourd', 'Bitter gourd', 'Padded cradle', 'cradle'],
  ['papaya', 'Papaya', 'Reach and twist', 'lift'],
];
const TOOLS = {
  grip: `<path d="M-30 -40 V-10 L-18 14 M30 -40 V-10 L18 14 M-30 -40 H30" stroke="#1f2b25" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="-24" y="6" width="12" height="16" rx="5" fill="#f09a7a"/><rect x="12" y="6" width="12" height="16" rx="5" fill="#f09a7a"/><path d="M0 -40 V-70" stroke="#1f2b25" stroke-width="9" stroke-linecap="round"/>`,
  snip: `<path d="M-6 -60 L10 10 M22 -60 L-2 10" stroke="#1f2b25" stroke-width="6" stroke-linecap="round"/><circle cx="-8" cy="-66" r="9" fill="none" stroke="#1f2b25" stroke-width="5"/><circle cx="24" cy="-66" r="9" fill="none" stroke="#1f2b25" stroke-width="5"/><path d="M-34 22 H40 L32 36 H-26 Z" fill="#a8dc1c"/>`,
  comb: `<rect x="-36" y="-40" width="72" height="14" rx="5" fill="#1f2b25"/>${Array.from({ length: 7 }, (_, k) => `<path d="M${-30 + k * 10} -26 V4" stroke="#1f2b25" stroke-width="5" stroke-linecap="round"/>`).join('')}<path d="M0 -40 V-70" stroke="#1f2b25" stroke-width="9" stroke-linecap="round"/><path d="M-40 10 Q0 34 40 10" stroke="#a8dc1c" stroke-width="6" fill="none"/>`,
  cradle: `<path d="M-44 -20 Q0 40 44 -20" stroke="#1f2b25" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M-36 -12 Q0 30 36 -12" stroke="#f09a7a" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M0 12 V-70" stroke="#1f2b25" stroke-width="9" stroke-linecap="round"/>`,
  lift: `<path d="M-10 60 V-40 L30 -70" stroke="#1f2b25" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 -86 Q30 -52 60 -66" stroke="#1f2b25" stroke-width="7" fill="none"/><path d="M18 -84 Q32 -60 56 -70" stroke="#f09a7a" stroke-width="5" fill="none"/><path d="M-28 70 H12" stroke="#1f2b25" stroke-width="10" stroke-linecap="round"/><path d="M40 -100 a26 26 0 0 1 20 22" stroke="#a8dc1c" stroke-width="5" fill="none" marker-end=""/>`,
};
export const crops = {
  build(el, cue) {
    const st = stage(el);
    st.cam.append(svgEl('g', {}, `<defs><linearGradient id="cbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8f0d4"/><stop offset="1" stop-color="#c9ddb0"/></linearGradient></defs>
      <rect width="1920" height="1080" fill="url(#cbg)"/>
      ${Array.from({ length: 14 }, (_, k) => heartLeaf(80 + k * 140, k % 2 ? 1010 : 60, 2.4, k % 2 ? 180 : 0, 'rgba(90,150,80,0.18)')).join('')}`));
    const cards = CROPS.map(([key, name, tool, tk], i) => {
      const card = h('div', { class: 'card', style: { left: 150 + i * 330 + 'px', top: '250px', width: '300px', height: '560px', display: 'flex', flexDirection: 'column', alignItems: 'center' } });
      const img = h('div', { style: { height: '250px', marginTop: '30px', display: 'flex', alignItems: 'center' } }, crop(key, 230));
      const toolSvg = s('svg', { width: 160, height: 140, viewBox: '-80 -100 160 140' });
      toolSvg.innerHTML = TOOLS[tk];
      card.append(img, h('div', { style: { fontWeight: 800, fontSize: '34px', letterSpacing: '-0.02em', marginTop: '6px' } }, name), toolSvg,
        h('div', { class: 'mono', style: { fontSize: '14px', color: '#5b6a60', marginTop: '2px' } }, tool));
      st.ui.append(card);
      return card;
    });
    const head = h('div', { class: 'title', style: { position: 'absolute', left: 0, right: 0, top: '96px', textAlign: 'center', fontSize: '72px', color: '#1f2b25', textShadow: 'none' } }, 'One crop, one design.');
    st.ui.append(head);
    const T = ['cucumber', 'okra', 'chilli', 'bitter gourd', 'papaya'].map((w) => cue.word('h3', w));
    return { st, cards, head, T };
  },
  update(t, c, cue) {
    c.cards.forEach((card, i) => {
      const p = pr(t, c.T[i] - 0.15, 0.6, E.outBack);
      card.style.opacity = clamp((t - c.T[i] + 0.15) * 4).toFixed(3);
      card.style.transform = `translateY(${f((1 - p) * 60)}px) rotate(${f((1 - p) * (i % 2 ? 4 : -4))}deg)`;
    });
    const hp = pr(t, c.T[4] + 0.6, 0.6);
    c.head.style.opacity = hp.toFixed(3);
    c.head.style.transform = `translateY(${f((1 - hp) * 16)}px)`;
  },
};

// ───────────────────────── spraying ─────────────────────────
const PESTS = [[420, 640], [610, 628], [790, 652], [1010, 634], [1180, 648], [1390, 630], [1560, 646]];
export const spray = {
  build(el, cue) {
    const st = stage(el);
    const r = rng(77);
    let a = `<defs><linearGradient id="ssky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fc3c6"/><stop offset="1" stop-color="#f6ddb0"/></linearGradient></defs>
      <rect width="1920" height="1080" fill="url(#ssky)"/>${cloud(300, 150, 260, 0.55)}${cloud(1600, 120, 240, 0.5)}
      <path d="M0 520 C300 470 600 480 900 510 C1200 540 1500 500 1920 490 L1920 700 L0 700 Z" fill="#9fc2a5"/>
      <rect y="660" width="1920" height="420" fill="url(#field)"/>
      <rect y="880" width="1920" height="200" fill="url(#soilG)"/>
      <path d="M0 880 H1920" stroke="#8a5a33" stroke-width="3"/>`;
    for (const x of [160, 960, 1760]) a += `<rect x="${x - 8}" y="410" width="16" height="470" fill="#8a5b3a"/><rect x="${x}" y="410" width="7" height="470" fill="#a8744c"/>`;
    a += `<line x1="140" y1="420" x2="1780" y2="420" stroke="#5b4a3a" stroke-width="3"/>`;
    for (let x = 190; x < 1760; x += 40) a += `<line x1="${x}" y1="420" x2="${x}" y2="872" stroke="rgba(80,60,40,0.3)" stroke-width="1.5"/>`;
    const leaves = [];
    for (let i = 0; i < 260; i++) leaves.push([150 + r() * 1620, 410 + Math.pow(r(), 1.5) * 230, 0.9 + r() * 0.5, (r() - 0.5) * 80, PAL.leaf[Math.floor(r() * 5)]]);
    leaves.sort((m, n) => m[1] - n[1]);
    const canopy = svgEl('g', {}, leaves.map((l) => heartLeaf(...l)).join(''));
    const pests = PESTS.map(() => svgEl('g', {}, `<circle class="ring" r="20" fill="none" stroke="#e8543e" stroke-width="2.5"/><g class="bug">${[-1, 1].flatMap((sd) => [-6, 0, 6].map((dx) => `<line x1="${dx}" y1="0" x2="${dx * 1.6 + sd * 2}" y2="${sd * 12}" stroke="#b83a2a" stroke-width="2"/>`)).join('')}<ellipse rx="12" ry="8" fill="#e8543e"/><circle cx="12" cy="0" r="5" fill="#b83a2a"/></g>`));
    const marks = PESTS.map(() => svgEl('path', { fill: 'none', stroke: '#c8ff4d', 'stroke-width': 3.5 }));
    const drone = Drone(), rover = Rover();
    const cone = svgEl('path', { fill: 'rgba(200,255,77,0.14)', stroke: 'rgba(200,255,77,0.6)', 'stroke-width': 2 });
    const jet = svgEl('g', {});
    const jetDots = Array.from({ length: 22 }, () => { const e = svgEl('circle', { r: 3, fill: '#d9ff7a' }); jet.append(e); return e; });
    const mist = svgEl('g', {});
    const mistDots = Array.from({ length: 170 }, () => { const e = svgEl('circle', { r: 2.2, fill: '#ffffff' }); mist.append(e); return e; });
    const settled = svgEl('g', {});
    const settleDots = Array.from({ length: 90 }, (_, i) => { const e = svgEl('circle', { cx: f(170 + (i / 90) * 1590 + (hash(i) - 0.5) * 12), cy: f(418 + hash(i * 3.1) * 16), r: 2.6, fill: '#e8fbff' }); settled.append(e); return e; });
    st.cam.append(svgEl('g', {}, a), canopy, ...pests, ...marks, settled, cone, jet, rover.el, mist, drone.el);
    // magnifier lens showing the underside
    const lens = svgEl('g', {}, `<defs><clipPath id="lensClip"><circle cx="0" cy="0" r="170"/></clipPath></defs>
      <circle r="178" fill="#fffaf0"/>
      <g clip-path="url(#lensClip)">
        <rect x="-180" y="-180" width="360" height="360" fill="#cfe3b0"/>
        <g transform="translate(-10 -150) scale(4.2) rotate(180)"><path d="M0 -2 C-14 -12 -30 -4 -28 12 C-26 26 -10 36 0 46 C10 36 26 26 28 12 C30 -4 14 -12 0 -2 Z" fill="#6aa864"/><path d="M0 2 L0 40 M0 16 L-14 8 M0 16 L14 8 M0 28 L-10 22 M0 28 L10 22" stroke="#9ccf8a" stroke-width="1.4" fill="none"/></g>
        ${[[-60, -20], [20, -46], [70, 10], [-10, 30]].map(([x, y], k) => `<g class="lbug" transform="translate(${x} ${y}) scale(2.2) rotate(${k * 40 - 20})">${[-1, 1].flatMap((sd) => [-6, 0, 6].map((dx) => `<line x1="${dx}" y1="0" x2="${dx * 1.6 + sd * 2}" y2="${sd * 12}" stroke="#b83a2a" stroke-width="2"/>`)).join('')}<ellipse rx="12" ry="8" fill="#e8543e"/><circle cx="12" cy="0" r="5" fill="#b83a2a"/></g>`).join('')}
        ${[[-120, -150], [-40, -160], [60, -155], [130, -148]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="6" ry="8" fill="#e8fbff"/>`).join('')}
      </g>
      <circle r="174" fill="none" stroke="#1f2b25" stroke-width="8"/>
      <path d="M120 120 L200 200" stroke="#1f2b25" stroke-width="22" stroke-linecap="round"/>`);
    st.cam.append(lens);
    const lensLabel = Label('Pests hide underneath', { cls: 'pest' });
    const precise = Label('Only where needed');
    const droneLabel = Label('Spray from above');
    st.ui.append(lensLabel.el, precise.el, droneLabel.el);
    const T = {
      drones: cue.line('s1').start, hide: cue.word('s1', 'pests hide'), cant: cue.word('s1', "can't reach"),
      under: cue.word('s2', 'beneath'), spots: cue.word('s2', 'spots'), only: cue.word('s2', 'only where'),
    };
    // rover path and pest hit times
    const roverX = (tt) => lerp(-260, 2120, pr(tt, T.under - 0.8, 7.2, E.inOutSine || E.inOutCubic));
    const hits = PESTS.map(([px]) => { for (let tt = T.under - 1; tt < T.under + 8; tt += 0.01) if (roverX(tt) + 40 >= px) return tt; return 1e9; });
    return { st, pests, marks, drone, rover, cone, jetDots, mistDots, settleDots, lens, lensLabel, precise, droneLabel, T, roverX, hits };
  },
  update(t, c, cue) {
    const { T } = c;
    c.st.camera.set(...camPath([[-1, 960, 540, 1.0], [T.hide, 960, 560, 1.02], [cue.dur, 960, 560, 1.04]], t));
    // drone pass during s1
    const dx = lerp(-250, 2170, pr(t, T.drones - 0.6, 6.5, E.inOutCubic)), dy = 250 + Math.sin(t * 2) * 8;
    c.drone.pose({ x: dx, y: dy, t, tilt: 4 });
    c.mistDots.forEach((e, i) => {
      const ph = (t * 1.3 + i / c.mistDots.length) % 1;
      const age = ph * 0.9;
      const x0 = dx - (age * 180) + (hash(i) - 0.5) * 160 * (0.4 + ph);
      const y = dy + 44 + ph * 150;
      e.setAttribute('cx', f(x0)); e.setAttribute('cy', f(y));
      e.style.opacity = dx > 100 && dx < 1800 && y < 430 ? (1 - ph) * 0.8 : 0;
    });
    c.settleDots.forEach((e, i) => {
      const x = +e.getAttribute('cx');
      e.style.opacity = dx > x + 60 ? 0.9 * (1 - pr(t, T.hide, 1.2) * 0.3) : 0;
    });
    // pests pulse once revealed; marked + treated by the rover
    const rev = pr(t, T.hide, 0.8);
    const rx = c.roverX(t);
    const rp = c.rover.pose({ x: rx, y: 880, sc: 0.95, roll: rx * 1.5 });
    PESTS.forEach(([px, py], i) => {
      const hit = c.hits[i];
      const dead = pr(t, hit + 0.5, 0.5);
      const g = c.pests[i];
      g.setAttribute('transform', `translate(${px} ${py})`);
      g.style.opacity = (0.4 + 0.6 * rev) * (1 - dead * 0.85);
      const ring = g.querySelector('.ring');
      const ph = (t * 1.2 + i * 0.17) % 1;
      ring.setAttribute('r', f(14 + ph * 24));
      ring.style.opacity = rev * (1 - ph) * (1 - dead);
      g.querySelector('.bug').setAttribute('transform', `rotate(${f(Math.sin(t * 3 + i) * 8)})`);
      const mk = c.marks[i], lk = pr(t, hit - 0.35, 0.35, E.outBack);
      const pad = 18 + (1 - lk) * 26, Lc = 10;
      mk.setAttribute('d', `M${px - pad} ${py - pad + Lc} V${py - pad} H${px - pad + Lc} M${px + pad - Lc} ${py - pad} H${px + pad} V${py - pad + Lc} M${px + pad} ${py + pad - Lc} V${py + pad} H${px + pad - Lc} M${px - pad + Lc} ${py + pad} H${px - pad} V${py + pad - Lc}`);
      mk.style.opacity = t > hit - 0.35 && dead < 1 ? 1 - dead : 0;
    });
    const act = PESTS.findIndex((_, i) => t >= c.hits[i] && t < c.hits[i] + 0.5);
    c.jetDots.forEach((e, k) => {
      if (act < 0) { e.style.opacity = 0; return; }
      const [px, py] = PESTS[act];
      const u = (hash(k) + (t - c.hits[act]) * 3) % 1;
      e.setAttribute('cx', f(lerp(rp.nozzle[0], px, u) + (hash(k * 3.3) - 0.5) * 16 * u));
      e.setAttribute('cy', f(lerp(rp.nozzle[1], py, u) + (hash(k * 5.1) - 0.5) * 16 * u));
      e.style.opacity = (1 - u) * 0.95;
    });
    c.cone.setAttribute('d', `M${f(rp.cam[0])} ${f(rp.cam[1])} L${f(rp.cam[0] - 90)} 600 L${f(rp.cam[0] + 110)} 600 Z`);
    c.cone.style.opacity = t > T.under - 0.5 && rx > -100 && rx < 1900 ? 1 : 0;
    // lens
    const lp = pr(t, T.hide + 0.1, 0.6, E.outBack), lq = pr(t, T.under - 0.6, 0.5, E.inCubic);
    c.lens.setAttribute('transform', `translate(1480 760) scale(${f(lp * (1 - lq))})`);
    c.lens.style.opacity = t > T.hide ? 1 - lq : 0;
    c.lens.querySelectorAll('.lbug').forEach((b, k) => b.setAttribute('transform', b.getAttribute('transform').replace(/rotate\([^)]*\)/, `rotate(${f(k * 40 - 20 + Math.sin(t * 3 + k) * 10)})`)));
    const cam = c.st.camera;
    c.droneLabel.at(cam.toScreen([dx, dy - 50]), t, T.drones + 0.5, T.hide - 0.2);
    c.lensLabel.at(cam.toScreen([1480, 560]), t, T.hide + 0.5, T.under - 0.6);
    c.precise.at(cam.toScreen([960, 300]), t, T.only, cue.dur - 0.2);
  },
};
