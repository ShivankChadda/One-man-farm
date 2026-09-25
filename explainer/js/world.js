// Environment art for the explainer: sky, sea, hills, palms, fields, trellis, soil.
// Mostly static SVG built as strings; FarmWorld() assembles the shared Great Nicobar farm
// and exposes layer groups where scenes add animated characters and machines.
import { s, rng } from '../../video/js/lib.js';

export const f = (n) => (Math.round(n * 10) / 10).toString();
export const lerp = (a, b, t) => a + (b - a) * t;

export const PAL = {
  ink: '#26302b',
  cream: '#f4efe4',
  creamShade: '#dcd3c1',
  lime: '#a8dc1c',
  limeGlow: '#c8ff4d',
  leaf: ['#357a3f', '#3f8a47', '#4b9a4f', '#58a957', '#2f6f3a'],
  cuke: '#4a8f35',
  soil: '#b77c4c',
};

export const SKIES = {
  dawn: { stops: ['#7fa9c4', '#e7c7b0', '#f6c49a', '#f9b27d'], sun: '#ffe7b8', glow: '#ffc27a', sea: ['#c9c8c0', '#7fa9ae'], haze: '#f7d8bf', hill: 1 },
  day: { stops: ['#8fc3c6', '#e9ddb8', '#f7d49c', '#fbc987'], sun: '#fffbf1', glow: '#ffd79a', sea: ['#bcd9c8', '#7fbdb6'], haze: '#fbe4bd', hill: 1 },
  noon: { stops: ['#79b9d6', '#bfe0e4', '#e8efd8', '#f3eccc'], sun: '#fffdf5', glow: '#fff3cf', sea: ['#bfe3db', '#68b6b8'], haze: '#eef3e2', hill: 1 },
  sunset: { stops: ['#5f6f9e', '#c98ea0', '#f2a27a', '#f7b36a'], sun: '#fff0d0', glow: '#ffb27a', sea: ['#d9a58e', '#7b8fa0'], haze: '#f6c3a0', hill: 0.9 },
};

export function defs(p, sky, sunX, sunY) {
  const k = SKIES[sky];
  return `
<linearGradient id="${p}sky" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="${k.stops[0]}"/><stop offset="0.5" stop-color="${k.stops[1]}"/>
  <stop offset="0.82" stop-color="${k.stops[2]}"/><stop offset="1" stop-color="${k.stops[3]}"/>
</linearGradient>
<radialGradient id="${p}glow" cx="${sunX}" cy="${sunY}" r="760" gradientUnits="userSpaceOnUse">
  <stop offset="0" stop-color="${k.sun}" stop-opacity="1"/><stop offset="0.1" stop-color="${k.sun}" stop-opacity="0.85"/>
  <stop offset="0.35" stop-color="${k.glow}" stop-opacity="0.45"/><stop offset="1" stop-color="${k.glow}" stop-opacity="0"/>
</radialGradient>
<linearGradient id="${p}sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${k.sea[0]}"/><stop offset="1" stop-color="${k.sea[1]}"/></linearGradient>
<linearGradient id="${p}haze" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="${k.haze}" stop-opacity="0"/><stop offset="0.45" stop-color="${k.haze}" stop-opacity="0.55"/><stop offset="1" stop-color="${k.haze}" stop-opacity="0"/>
</linearGradient>`;
}

export const COMMON_DEFS = `
<linearGradient id="field" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#a7c56c"/><stop offset="0.4" stop-color="#86b053"/><stop offset="1" stop-color="#5d8c3c"/>
</linearGradient>
<linearGradient id="soilG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d4a06c"/><stop offset="1" stop-color="#a86f42"/></linearGradient>
<linearGradient id="soilDeep" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a6a42"/><stop offset="1" stop-color="#5e3d26"/></linearGradient>
<linearGradient id="spray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/><stop offset="1" stop-color="#e8fbff" stop-opacity="0"/></linearGradient>
<linearGradient id="screen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d4ff6a"/><stop offset="1" stop-color="#55c9ae"/></linearGradient>
<radialGradient id="ledGlow"><stop offset="0" stop-color="#d8ff6a" stop-opacity="0.9"/><stop offset="1" stop-color="#c8ff4d" stop-opacity="0"/></radialGradient>
<radialGradient id="softGlow"><stop offset="0" stop-color="#c8ff4d" stop-opacity="0.55"/><stop offset="1" stop-color="#c8ff4d" stop-opacity="0"/></radialGradient>
<radialGradient id="warmGlow"><stop offset="0" stop-color="#fff2c8" stop-opacity="0.9"/><stop offset="1" stop-color="#ffd58a" stop-opacity="0"/></radialGradient>
<radialGradient id="wetBulb"><stop offset="0" stop-color="#5fb7d6" stop-opacity="0.75"/><stop offset="1" stop-color="#5fb7d6" stop-opacity="0"/></radialGradient>
<radialGradient id="vig" cx="0.5" cy="0.48" r="0.75"><stop offset="0.55" stop-color="#3a220e" stop-opacity="0"/><stop offset="1" stop-color="#3a220e" stop-opacity="0.34"/></radialGradient>
<filter id="blur6" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7"/></filter>
<filter id="blur3" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter>
<filter id="glowF" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
`;

// ---------- small pieces ----------
export function cloud(x, y, w, op, fill = '#fff7e8') {
  const h = w * 0.22;
  return `<g opacity="${op}" fill="${fill}">
    <ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(w * 0.5)}" ry="${f(h * 0.5)}"/>
    <ellipse cx="${f(x - w * 0.18)}" cy="${f(y - h * 0.35)}" rx="${f(w * 0.2)}" ry="${f(h * 0.55)}"/>
    <ellipse cx="${f(x + w * 0.1)}" cy="${f(y - h * 0.5)}" rx="${f(w * 0.24)}" ry="${f(h * 0.7)}"/>
    <ellipse cx="${f(x + w * 0.3)}" cy="${f(y - h * 0.2)}" rx="${f(w * 0.16)}" ry="${f(h * 0.45)}"/></g>`;
}

export function palm(r, x, y, h, lean, sc, trunk, frond, opts = {}) {
  const tx = x + lean, ty = y - h;
  const cx = x + lean * 0.15, cy = y - h * 0.55;
  const w0 = 11 * sc, w1 = 6 * sc;
  let g = `<path d="M${f(x - w0)} ${f(y)} Q${f(cx - w0 * 0.8)} ${f(cy)} ${f(tx - w1)} ${f(ty)} L${f(tx + w1)} ${f(ty)} Q${f(cx + w0 * 0.8)} ${f(cy)} ${f(x + w0)} ${f(y)} Z" fill="${trunk}"/>`;
  if (!opts.flat) {
    for (let k = 1; k < 14; k++) {
      const u = k / 14;
      const px = lerp(lerp(x, cx, u), lerp(cx, tx, u), u), py = lerp(lerp(y, cy, u), lerp(cy, ty, u), u);
      const w = lerp(w0, w1, u);
      g += `<path d="M${f(px - w)} ${f(py)} q${f(w)} ${f(3 * sc)} ${f(2 * w)} 0" stroke="rgba(0,0,0,0.18)" stroke-width="${f(1.6 * sc)}" fill="none"/>`;
    }
  }
  const angles = opts.angles || [-172, -148, -122, -95, -62, -34, -8, 16];
  for (const a0 of angles) {
    const a = ((a0 + (r() - 0.5) * 10) * Math.PI) / 180;
    const L = (95 + r() * 30) * sc;
    const ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L * 0.55 + L * 0.42;
    const mx = tx + Math.cos(a) * L * 0.55, my = ty + Math.sin(a) * L * 0.6 - L * 0.12;
    g += `<path d="M${f(tx)} ${f(ty)} Q${f(mx)} ${f(my)} ${f(ex)} ${f(ey)}" stroke="${frond}" stroke-width="${f(3.2 * sc)}" fill="none" stroke-linecap="round"/>`;
    const dir = Math.atan2(ey - my, ex - mx);
    for (let k = 2; k <= 15; k++) {
      const u = k / 16;
      const px = lerp(lerp(tx, mx, u), lerp(mx, ex, u), u), py = lerp(lerp(ty, my, u), lerp(my, ey, u), u);
      const len = (24 - 12 * u) * sc;
      for (const side of [-1, 1]) {
        const la = dir + side * 1.05 + 0.55;
        g += `<path d="M${f(px)} ${f(py)} l${f(Math.cos(la) * len)} ${f(Math.sin(la) * len * 0.9 + len * 0.45)}" stroke="${frond}" stroke-width="${f(4.4 * sc)}" stroke-linecap="round"/>`;
      }
    }
  }
  if (!opts.flat) g += `<circle cx="${f(tx - 6 * sc)}" cy="${f(ty + 8 * sc)}" r="${f(6 * sc)}" fill="#5b6b2e"/><circle cx="${f(tx + 5 * sc)}" cy="${f(ty + 10 * sc)}" r="${f(6 * sc)}" fill="#6a7a35"/><circle cx="${f(tx)}" cy="${f(ty + 15 * sc)}" r="${f(5.5 * sc)}" fill="#556628"/>`;
  return `<g ${opts.attrs || ''}>${g}</g>`;
}

export function heartLeaf(x, y, sc, rot, fill) {
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(sc)})">
    <path d="M0 -2 C-14 -12 -30 -4 -28 12 C-26 26 -10 36 0 46 C10 36 26 26 28 12 C30 -4 14 -12 0 -2 Z" fill="${fill}"/>
    <path d="M0 2 L0 40 M0 16 L-14 8 M0 16 L14 8 M0 28 L-10 22 M0 28 L10 22" stroke="rgba(255,255,220,0.22)" stroke-width="1.6" fill="none"/></g>`;
}

export function cucumber(x, y, len, w = 26, fill = PAL.cuke) {
  let g = `<path d="M${f(x)} ${f(y - 10)} L${f(x)} ${f(y + 2)}" stroke="#3f7f33" stroke-width="3" stroke-linecap="round"/>`;
  g += `<rect x="${f(x - w / 2)}" y="${f(y)}" width="${f(w)}" height="${f(len)}" rx="${f(w / 2)}" fill="${fill}" stroke="#a9d77a" stroke-width="2"/>`;
  g += `<rect x="${f(x + w * 0.05)}" y="${f(y + 8)}" width="${f(w * 0.26)}" height="${f(len - 18)}" rx="3" fill="#7dbb62" opacity="0.55"/>`;
  for (let k = 0; k < len / 18; k++) g += `<circle cx="${f(x - w * 0.22 + (k % 2) * w * 0.3)}" cy="${f(y + 12 + k * 16)}" r="1.8" fill="#c3e8a6" opacity="0.8"/>`;
  return g;
}

export function flower(x, y, sc = 1) {
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${sc})">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-4" rx="2.6" ry="5" fill="#ffd23f" transform="rotate(${a})"/>`).join('')}<circle r="2" fill="#e8a317"/></g>`;
}

export function grass(r, x0, x1, yAt, n, cols = ['#5d8f3a', '#7aab4a'], skip = () => false) {
  let g = '';
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * (x1 - x0);
    if (skip(x)) continue;
    const yb = yAt(x);
    const h = 10 + r() * 22;
    g += `<path d="M${f(x)} ${f(yb)} q${f((r() - 0.3) * 6)} ${f(-h * 0.6)} ${f((r() - 0.3) * 10)} ${f(-h)}" stroke="${cols[i % cols.length]}" stroke-width="3" stroke-linecap="round" fill="none"/>`;
  }
  return g;
}

export function birds(list) {
  return list.map(([x, y, sc]) => `<path d="M${x} ${y} q${8 * sc} ${-7 * sc} ${16 * sc} 0 q${8 * sc} ${-7 * sc} ${16 * sc} 0" stroke="#5a4636" stroke-width="2.6" fill="none" stroke-linecap="round"/>`).join('');
}

export function shed(x, y) {
  return `<g transform="translate(${x - 1530} ${y - 540})">
  <rect x="1530" y="468" width="160" height="72" fill="#ecdcbc"/>
  <rect x="1530" y="468" width="30" height="72" fill="#d8c49f"/>
  <rect x="1604" y="492" width="30" height="48" fill="#5b4a3a"/>
  <rect x="1650" y="486" width="26" height="20" fill="#9dc9c9"/>
  <path d="M1518 460 L1702 474 L1702 484 L1518 470 Z" fill="#8a5b3a"/>
  <path d="M1526 452 L1694 466 L1694 474 L1526 460 Z" fill="#2c4a63"/>
  ${[0, 1, 2, 3, 4, 5].map((k) => `<path d="M${1526 + k * 28} ${452 + k * 2.33} l0 8" stroke="#8fb3d1" stroke-width="1.5"/>`).join('')}
  <path d="M1600 458 L1660 463" stroke="#fffbe9" stroke-width="3" opacity="0.7"/>
  <rect x="1712" y="494" width="44" height="46" rx="4" fill="#6f9197"/>
  <ellipse cx="1734" cy="494" rx="22" ry="6" fill="#8fb0b4"/>
  <line x1="1560" y1="470" x2="1560" y2="384" stroke="#3b3b36" stroke-width="4"/>
  <line x1="1540" y1="392" x2="1580" y2="392" stroke="#3b3b36" stroke-width="3"/>
  <circle cx="1540" cy="389" r="5" fill="#3b3b36"/><circle cx="1580" cy="389" r="5" fill="#3b3b36"/>
  <rect x="1552" y="408" width="16" height="12" fill="#e8e2d4" stroke="#3b3b36" stroke-width="2"/>
</g>`;
}

// ---------- the shared farm ----------
// Returns { el, layers:{sky, field, trellis, path, fx}, anchors, cukes, dyn }
export function FarmWorld({ id, sky = 'day', sunX = 1330, sunY = 392, width = 1920, trellis = true, seed = 11 } = {}) {
  const r = rng(seed);
  const p = id + '-';
  let a = '';
  const W = width;
  a += `<defs>${defs(p, sky, sunX, sunY)}</defs>`;
  a += `<rect x="-400" y="-300" width="${W + 800}" height="1680" fill="url(#${p}sky)"/>`;
  a += `<rect x="-400" y="-300" width="${W + 800}" height="1680" fill="url(#${p}glow)" class="sunglow"/>`;
  a += `<g class="sun"><circle cx="${sunX}" cy="${sunY}" r="54" fill="${SKIES[sky].sun}"/></g>`;
  a += `<g class="clouds">${cloud(310, 170, 300, 0.55) + cloud(770, 118, 210, 0.45) + cloud(1690, 215, 260, 0.55) + cloud(1120, 262, 170, 0.35)}${W > 1920 ? cloud(2250, 160, 280, 0.5) : ''}</g>`;
  a += `<g class="skyLayer"></g>`;
  // sea
  a += `<rect x="-400" y="462" width="${W + 800}" height="100" fill="url(#${p}sea)"/>`;
  for (let i = 0; i < 80; i++) {
    const x = sunX + (r() - 0.5) * 520 * (1 + r()), y = 470 + r() * 70;
    const w = 10 + r() * 40 * (1 - Math.abs(x - sunX) / 700);
    if (w > 6) a += `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="2" rx="1" fill="#fffbe9" opacity="${f(0.3 + r() * 0.5)}"/>`;
  }
  a += `<path d="M${W - 200} 468 C${W - 140} 454 ${W - 70} 452 ${W} 458 L${W} 470 L${W - 200} 470 Z" fill="#a9c7b2"/>`;
  // far hills
  a += `<path d="M-400 360 L0 318 C160 282 260 246 430 258 C590 270 720 350 870 398 C990 436 1090 460 1200 476 L1200 580 L-400 580 Z" fill="#9fc2a5"/>`;
  for (let i = 0; i < 16; i++) {
    const x = 40 + i * 70 + r() * 30;
    const y = x < 430 ? 318 - (x / 430) * 60 + 8 : 258 + ((x - 430) / 770) * 218 + 8;
    a += palm(r, x, y + 20, 34 + r() * 16, (r() - 0.5) * 12, 0.28, '#8db796', '#8db796', { flat: true, angles: [-160, -120, -80, -40, -10] });
  }
  a += `<rect x="0" y="330" width="${W}" height="300" fill="url(#${p}haze)" opacity="0.8"/>`;
  // mid hill with jungle
  a += `<path d="M-400 440 L0 420 C130 392 250 378 380 392 C540 410 660 452 790 490 C880 514 960 530 1040 546 L1040 620 L-400 620 Z" fill="#6ea37b"/>`;
  for (let x = -10; x < 1040; x += 26) {
    const y = x < 380 ? 420 - (x / 380) * 28 : 392 + ((x - 380) / 660) * 154;
    a += `<circle cx="${f(x)}" cy="${f(y + 6)}" r="${f(18 + r() * 12)}" fill="${r() > 0.5 ? '#659c73' : '#78ae83'}"/>`;
  }
  for (const [x, h, l, sc] of [[90, 120, -10, 0.55], [215, 140, 14, 0.6], [330, 110, -6, 0.5], [520, 128, 12, 0.55], [690, 104, -8, 0.5], [830, 96, 10, 0.48]]) {
    const y = x < 380 ? 420 - (x / 380) * 28 : 392 + ((x - 380) / 660) * 154;
    a += palm(r, x, y + 16, h, l, sc, '#557a5b', '#4e8961');
  }
  // coast + shed + palms
  a += `<path d="M900 548 C1100 530 1400 532 ${W} 522 L${W + 400} 522 L${W + 400} 620 L900 620 Z" fill="#82b07a"/>`;
  a += shed(1530, 540);
  a += `<g class="mastLed"><circle cx="1560" cy="380" r="10" fill="url(#ledGlow)"/><circle cx="1560" cy="380" r="3.5" fill="#d8ff6a"/></g>`;
  const coastPalms = [[1460, 190, -18, 0.78], [1800, 230, 22, 0.9], [1880, 170, -10, 0.7], [1080, 150, 14, 0.62]];
  if (W > 1920) coastPalms.push([2150, 210, 16, 0.85], [2420, 180, -12, 0.75], [2560, 240, 20, 0.9]);
  for (const [x, h, l, sc] of coastPalms) a += palm(r, x, 546, h, l, sc, '#8a7152', '#3f7a4f');
  a += `<rect x="0" y="470" width="${W}" height="170" fill="url(#${p}haze)" opacity="0.35"/>`;
  // field + hedge + rows
  a += `<rect x="-400" y="548" width="${W + 800}" height="700" fill="url(#field)"/>`;
  {
    let d = 'M-400 560';
    for (let x = -400; x <= W + 400; x += 22) d += ` Q${x + 11} ${f(538 - r() * 14)} ${x + 22} ${f(552 + r() * 4)}`;
    a += `<path d="${d} L${W + 400} 572 L-400 572 Z" fill="#6e9d57"/>`;
  }
  const ROWS = 9;
  const rowYs = [];
  for (let i = 0; i < ROWS; i++) {
    const t = i / (ROWS - 1);
    const y = 578 + 205 * Math.pow(t, 1.6);
    rowYs.push(y);
    const hgt = 7 + 22 * t, bump = 7 + 20 * t;
    const col = ['#7ea756', '#739f4d', '#679745', '#5b8e3e', '#4f8537'][Math.min(4, Math.floor(t * 5))];
    const hi = ['#9cc06a', '#93bb62', '#8ab75b', '#80b154', '#76aa4d'][Math.min(4, Math.floor(t * 5))];
    let d = `M-420 ${f(y + hgt)}`;
    let hl = '';
    for (let x = -420; x <= W + 420; x += bump) {
      const top = y - (0.3 + r() * 0.7) * bump * 0.55;
      d += ` Q${f(x + bump / 2)} ${f(top)} ${f(x + bump)} ${f(y)}`;
      if (r() > 0.35) hl += `<ellipse cx="${f(x + bump / 2)}" cy="${f(top + bump * 0.22)}" rx="${f(bump * 0.28)}" ry="${f(bump * 0.12)}" fill="${hi}"/>`;
    }
    d += ` L${W + 420} ${f(y + hgt)} Z`;
    a += `<path d="${d}" fill="${col}"/>${hl}`;
    a += `<rect x="-400" y="${f(y + hgt)}" width="${W + 800}" height="${f(3 + 5 * t)}" fill="#b9975f" opacity="${f(0.35 + 0.2 * t)}"/>`;
  }
  a += `<rect x="0" y="540" width="${W}" height="80" fill="url(#${p}haze)" opacity="0.5"/>`;
  a += `<g class="fieldLayer"></g>`;

  // trellis plot
  const cukes = [];
  if (trellis) {
    a += `<path d="M890 884 C1100 862 1480 862 1690 880 L1690 912 L890 912 Z" fill="#a8703f"/>`;
    a += `<path d="M890 884 C1100 862 1480 862 1690 880" stroke="#c48a55" stroke-width="3" fill="none"/>`;
    for (const x of [950, 1290, 1630]) a += `<rect x="${x - 7}" y="588" width="14" height="292" fill="#8a5b3a"/><rect x="${x + 1}" y="588" width="6" height="292" fill="#a8744c"/>`;
    a += `<line x1="930" y1="598" x2="1650" y2="598" stroke="#5b4a3a" stroke-width="2.5"/>`;
    a += `<line x1="930" y1="728" x2="1650" y2="728" stroke="#5b4a3a" stroke-width="1.6" opacity="0.6"/>`;
    for (let x = 966; x < 1630; x += 34) {
      a += `<line x1="${x}" y1="598" x2="${x}" y2="872" stroke="rgba(80,60,40,0.3)" stroke-width="1.4"/>`;
      let d = `M${x} 872`;
      for (let y = 850; y > 600; y -= 30) d += ` Q${f(x + (r() - 0.5) * 16)} ${y + 15} ${f(x + (r() - 0.5) * 6)} ${y}`;
      a += `<path d="${d}" stroke="#4c8f45" stroke-width="2.6" fill="none"/>`;
    }
    const leaves = [];
    for (let i = 0; i < 190; i++) {
      const x = 940 + r() * 700, y = 598 + Math.pow(r(), 1.8) * 250;
      leaves.push([x, y, 0.7 + r() * 0.55 - (y - 598) / 900, (r() - 0.5) * 70, PAL.leaf[Math.floor(r() * PAL.leaf.length)]]);
    }
    leaves.sort((m, n) => m[1] - n[1]);
    leaves.forEach((l) => (a += heartLeaf(...l)));
    for (const [x, y, len] of [[1010, 648, 88], [1082, 704, 70], [1170, 644, 98], [1245, 664, 96], [1345, 690, 82], [1425, 640, 104], [1505, 700, 74], [1585, 656, 92]]) {
      cukes.push({ x, y, len });
    }
    a += `<g class="cukes">${cukes.map((c, i) => `<g class="cuke" data-i="${i}">${cucumber(c.x, c.y, c.len)}</g>`).join('')}</g>`;
    for (let i = 0; i < 22; i++) {
      const x = 950 + r() * 680, y = 600 + r() * 50;
      if (cukes.some((c) => Math.abs(x - c.x) < 34)) continue;
      a += heartLeaf(x, y, 0.9 + r() * 0.3, (r() - 0.5) * 60, PAL.leaf[Math.floor(r() * PAL.leaf.length)]);
    }
    for (let i = 0; i < 16; i++) a += flower(950 + r() * 680, 610 + r() * 150);
    a += `<g class="dripLine"><path d="M890 876 C1100 856 1480 856 1690 874" stroke="#2d2b28" stroke-width="5" fill="none"/>`;
    for (let x = 930; x < 1680; x += 38) {
      const y = 868 - Math.sin(((x - 890) / 800) * Math.PI) * 10;
      a += `<ellipse cx="${x}" cy="${f(y + 12)}" rx="16" ry="4" fill="#8a5a33" opacity="0.6"/><ellipse class="drop" cx="${x}" cy="${f(y + 6)}" rx="2.2" ry="3.2" fill="#8fe3f0"/>`;
    }
    a += `</g>`;
  }
  a += `<g class="trellisLayer"></g>`;
  // foreground path
  const pathY = (x) => (x < 900 ? 902 - 18 * Math.sin((x / 900) * Math.PI) : 912 - ((x - 900) / 1020) * 16);
  a += `<path d="M-400 900 L0 902 C300 884 620 900 900 912 C1200 924 1520 912 ${W} 896 L${W + 400} 896 L${W + 400} 1400 L-400 1400 Z" fill="url(#soilG)"/>`;
  a += `<path d="M0 902 C300 884 620 900 900 912 C1200 924 1520 912 ${W} 896" stroke="#e2b27e" stroke-width="3" fill="none" opacity="0.7"/>`;
  for (let i = 0; i < 30; i++) a += `<ellipse cx="${f(r() * W)}" cy="${f(950 + r() * 120)}" rx="${f(4 + r() * 10)}" ry="${f(2 + r() * 3)}" fill="#9a6538" opacity="0.5"/>`;
  a += grass(r, 0, W, (x) => pathY(x) + 6, Math.round(W / 7), undefined, (x) => trellis && x > 880 && x < 1700);
  a += `<g class="pathLayer"></g>`;
  a += `<g class="fxLayer"></g>`;

  const el = s('g', { class: 'world' });
  el.innerHTML = a;
  const q = (c) => el.querySelector('.' + c);
  return {
    el,
    layers: { sky: q('skyLayer'), field: q('fieldLayer'), trellis: q('trellisLayer'), path: q('pathLayer'), fx: q('fxLayer') },
    sun: q('sun'), glow: q('sunglow'), glowGrad: el.querySelector(`#${p}glow`), clouds: q('clouds'), mastLed: q('mastLed'),
    cukeEls: [...el.querySelectorAll('.cuke')], drops: [...el.querySelectorAll('.drop')],
    cukes, rowYs, pathY,
  };
}
