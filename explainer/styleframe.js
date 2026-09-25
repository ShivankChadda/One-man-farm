// Style frame for the animated explainer: one Great Nicobar farm, golden morning,
// machines at work and a single supervisor. Flat 2D vector, side view, layered depth.

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const r = rng(11);
const f = (n) => n.toFixed(1);
const lerp = (a, b, t) => a + (b - a) * t;

const C = {
  ink: '#26302b',
  cream: '#f4efe4',
  creamShade: '#dcd3c1',
  lime: '#a8dc1c',
  limeGlow: '#c8ff4d',
  leaf: ['#357a3f', '#3f8a47', '#4b9a4f', '#58a957', '#2f6f3a'],
  cuke: '#4a8f35',
};

let defs = '';
let art = '';
const add = (s) => (art += s);

// ─────────── gradients & filters ───────────
defs += `
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#8fc3c6"/><stop offset="0.5" stop-color="#e9ddb8"/>
  <stop offset="0.82" stop-color="#f7d49c"/><stop offset="1" stop-color="#fbc987"/>
</linearGradient>
<radialGradient id="sunGlow" cx="1330" cy="392" r="760" gradientUnits="userSpaceOnUse">
  <stop offset="0" stop-color="#fff6de" stop-opacity="1"/><stop offset="0.1" stop-color="#fff0cc" stop-opacity="0.9"/>
  <stop offset="0.35" stop-color="#ffdca0" stop-opacity="0.45"/><stop offset="1" stop-color="#ffd79a" stop-opacity="0"/>
</radialGradient>
<linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#bcd9c8"/><stop offset="1" stop-color="#7fbdb6"/>
</linearGradient>
<linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#fbe4bd" stop-opacity="0"/><stop offset="0.45" stop-color="#fbe4bd" stop-opacity="0.55"/>
  <stop offset="1" stop-color="#fbe4bd" stop-opacity="0"/>
</linearGradient>
<linearGradient id="field" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#a7c56c"/><stop offset="0.4" stop-color="#86b053"/><stop offset="1" stop-color="#5d8c3c"/>
</linearGradient>
<linearGradient id="soil" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#d4a06c"/><stop offset="1" stop-color="#a86f42"/>
</linearGradient>
<linearGradient id="spray" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/><stop offset="1" stop-color="#e8fbff" stop-opacity="0"/>
</linearGradient>
<linearGradient id="screen" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#d4ff6a"/><stop offset="1" stop-color="#55c9ae"/>
</linearGradient>
<radialGradient id="vig" cx="0.5" cy="0.48" r="0.75">
  <stop offset="0.55" stop-color="#3a220e" stop-opacity="0"/><stop offset="1" stop-color="#3a220e" stop-opacity="0.38"/>
</radialGradient>
<radialGradient id="tabletGlow"><stop offset="0" stop-color="#c8ff4d" stop-opacity="0.55"/><stop offset="1" stop-color="#c8ff4d" stop-opacity="0"/></radialGradient>
<radialGradient id="ledGlow"><stop offset="0" stop-color="#d8ff6a" stop-opacity="0.9"/><stop offset="1" stop-color="#c8ff4d" stop-opacity="0"/></radialGradient>
<filter id="blur2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.5"/></filter>
<filter id="blur6" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7"/></filter>
<filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>
<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4"/><feColorMatrix type="saturate" values="0"/>
  <feComponentTransfer><feFuncA type="linear" slope="0.5"/></feComponentTransfer></filter>
`;

// ─────────── pieces ───────────
function cloud(x, y, w, op) {
  const h = w * 0.22;
  return `<g opacity="${op}" fill="#fff7e8">
    <ellipse cx="${x}" cy="${y}" rx="${w * 0.5}" ry="${h * 0.5}"/>
    <ellipse cx="${x - w * 0.18}" cy="${y - h * 0.35}" rx="${w * 0.2}" ry="${h * 0.55}"/>
    <ellipse cx="${x + w * 0.1}" cy="${y - h * 0.5}" rx="${w * 0.24}" ry="${h * 0.7}"/>
    <ellipse cx="${x + w * 0.3}" cy="${y - h * 0.2}" rx="${w * 0.16}" ry="${h * 0.45}"/></g>`;
}

// Coconut palm: tapered curved trunk + fronds made of drooping leaflets
function palm(x, y, h, lean, s, trunk, frond, opts = {}) {
  const tx = x + lean, ty = y - h;
  const cx = x + lean * 0.15, cy = y - h * 0.55;
  const w0 = 11 * s, w1 = 6 * s;
  let g = `<path d="M${f(x - w0)} ${f(y)} Q${f(cx - w0 * 0.8)} ${f(cy)} ${f(tx - w1)} ${f(ty)} L${f(tx + w1)} ${f(ty)} Q${f(cx + w0 * 0.8)} ${f(cy)} ${f(x + w0)} ${f(y)} Z" fill="${trunk}"/>`;
  if (!opts.flat) {
    for (let k = 1; k < 14; k++) {
      const u = k / 14;
      const px = lerp(lerp(x, cx, u), lerp(cx, tx, u), u), py = lerp(lerp(y, cy, u), lerp(cy, ty, u), u);
      const w = lerp(w0, w1, u);
      g += `<path d="M${f(px - w)} ${f(py)} q${f(w)} ${f(3 * s)} ${f(2 * w)} 0" stroke="rgba(0,0,0,0.18)" stroke-width="${f(1.6 * s)}" fill="none"/>`;
    }
  }
  const angles = opts.angles || [-172, -148, -122, -95, -62, -34, -8, 16];
  for (const a0 of angles) {
    const a = ((a0 + (r() - 0.5) * 10) * Math.PI) / 180;
    const L = (95 + r() * 30) * s;
    const ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L * 0.55 + L * 0.42;
    const mx = tx + Math.cos(a) * L * 0.55, my = ty + Math.sin(a) * L * 0.6 - L * 0.12;
    g += `<path d="M${f(tx)} ${f(ty)} Q${f(mx)} ${f(my)} ${f(ex)} ${f(ey)}" stroke="${frond}" stroke-width="${f(3.2 * s)}" fill="none" stroke-linecap="round"/>`;
    for (let k = 2; k <= 16; k++) {
      const u = k / 17;
      const px = lerp(lerp(tx, mx, u), lerp(mx, ex, u), u), py = lerp(lerp(ty, my, u), lerp(my, ey, u), u);
      const len = (24 - 12 * u) * s;
      const dir = Math.atan2(ey - my, ex - mx);
      for (const side of [-1, 1]) {
        const la = dir + side * 1.05 + 0.55;
        g += `<path d="M${f(px)} ${f(py)} l${f(Math.cos(la) * len)} ${f(Math.sin(la) * len * 0.9 + len * 0.45)}" stroke="${frond}" stroke-width="${f(4.4 * s)}" stroke-linecap="round"/>`;
      }
    }
  }
  if (!opts.flat) g += `<circle cx="${f(tx - 6 * s)}" cy="${f(ty + 8 * s)}" r="${f(6 * s)}" fill="#5b6b2e"/><circle cx="${f(tx + 5 * s)}" cy="${f(ty + 10 * s)}" r="${f(6 * s)}" fill="#6a7a35"/><circle cx="${f(tx)}" cy="${f(ty + 15 * s)}" r="${f(5.5 * s)}" fill="#556628"/>`;
  return `<g ${opts.attrs || ''}>${g}</g>`;
}

// Heart-shaped cucumber leaf, tip pointing down (at origin = stem)
function heartLeaf(x, y, s, rot, fill) {
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})">
    <path d="M0 -2 C-14 -12 -30 -4 -28 12 C-26 26 -10 36 0 46 C10 36 26 26 28 12 C30 -4 14 -12 0 -2 Z" fill="${fill}"/>
    <path d="M0 2 L0 40 M0 16 L-14 8 M0 16 L14 8 M0 28 L-10 22 M0 28 L10 22" stroke="rgba(255,255,220,0.22)" stroke-width="1.6" fill="none"/></g>`;
}

function cucumber(x, y, len, w = 26) {
  let g = `<path d="M${x} ${y - 10} L${x} ${y + 2}" stroke="#3f7f33" stroke-width="3" stroke-linecap="round"/>`;
  g += `<rect x="${f(x - w / 2)}" y="${y}" width="${w}" height="${len}" rx="${w / 2}" fill="${C.cuke}" stroke="#a9d77a" stroke-width="2"/>`;
  g += `<rect x="${f(x + w * 0.05)}" y="${y + 8}" width="${f(w * 0.26)}" height="${len - 18}" rx="3" fill="#7dbb62" opacity="0.55"/>`;
  for (let k = 0; k < len / 18; k++) g += `<circle cx="${f(x - w * 0.22 + (k % 2) * w * 0.3)}" cy="${y + 12 + k * 16}" r="1.8" fill="#c3e8a6" opacity="0.8"/>`;
  return g;
}

// ─────────── sky ───────────
add(`<rect width="1920" height="1080" fill="url(#sky)"/>`);
add(`<rect width="1920" height="1080" fill="url(#sunGlow)"/>`);
add(`<circle cx="1330" cy="392" r="54" fill="#fffbf1"/>`);
add(cloud(310, 170, 300, 0.55) + cloud(770, 118, 210, 0.45) + cloud(1690, 215, 260, 0.55) + cloud(1120, 262, 170, 0.35));
for (const [x, y, s] of [[1185, 205, 1], [1222, 190, 0.8], [1250, 222, 0.9], [1290, 198, 0.7]]) {
  add(`<path d="M${x} ${y} q${8 * s} ${-7 * s} ${16 * s} 0 q${8 * s} ${-7 * s} ${16 * s} 0" stroke="#5a4636" stroke-width="2.6" fill="none" stroke-linecap="round"/>`);
}

// ─────────── sea ───────────
add(`<rect x="0" y="462" width="1920" height="100" fill="url(#sea)"/>`);
for (let i = 0; i < 70; i++) {
  const x = 1130 + (r() - 0.5) * 520 * (1 + r()), y = 470 + r() * 70;
  const w = 10 + r() * 40 * (1 - Math.abs(x - 1330) / 700);
  if (w > 6) add(`<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="2" rx="1" fill="#fffbe9" opacity="${f(0.35 + r() * 0.5)}"/>`);
}
add(`<path d="M1720 468 C1780 454 1850 452 1920 458 L1920 470 L1720 470 Z" fill="#a9c7b2"/>`);

// ─────────── far hills (hazy) ───────────
add(`<path d="M0 318 C160 282 260 246 430 258 C590 270 720 350 870 398 C990 436 1090 460 1200 476 L1200 580 L0 580 Z" fill="#9fc2a5"/>`);
for (let i = 0; i < 16; i++) {
  const x = 40 + i * 70 + r() * 30;
  const y = x < 430 ? 318 - (x / 430) * 60 + 8 : 258 + ((x - 430) / 770) * 218 + 8;
  add(palm(x, y + 20, 34 + r() * 16, (r() - 0.5) * 12, 0.28, '#8db796', '#8db796', { flat: true, angles: [-160, -120, -80, -40, -10] }));
}
add(`<rect x="0" y="330" width="1920" height="300" fill="url(#haze)" opacity="0.8"/>`);

// ─────────── mid hill with jungle ───────────
add(`<path d="M0 420 C130 392 250 378 380 392 C540 410 660 452 790 490 C880 514 960 530 1040 546 L1040 620 L0 620 Z" fill="#6ea37b"/>`);
for (let x = -10; x < 1040; x += 26) {
  const y = x < 380 ? 420 - (x / 380) * 28 : 392 + ((x - 380) / 660) * 154;
  add(`<circle cx="${f(x)}" cy="${f(y + 6)}" r="${f(18 + r() * 12)}" fill="${r() > 0.5 ? '#659c73' : '#78ae83'}"/>`);
}
for (const [x, h, l, s] of [[90, 120, -10, 0.55], [215, 140, 14, 0.6], [330, 110, -6, 0.5], [520, 128, 12, 0.55], [690, 104, -8, 0.5], [830, 96, 10, 0.48]]) {
  const y = x < 380 ? 420 - (x / 380) * 28 : 392 + ((x - 380) / 660) * 154;
  add(palm(x, y + 16, h, l, s, '#557a5b', '#4e8961'));
}

// ─────────── coast strip, shed and weather mast ───────────
add(`<path d="M900 548 C1100 530 1400 532 1920 522 L1920 620 L900 620 Z" fill="#82b07a"/>`);
// shed
add(`<g>
  <rect x="1530" y="468" width="160" height="72" fill="#ecdcbc"/>
  <rect x="1530" y="468" width="30" height="72" fill="#d8c49f"/>
  <rect x="1604" y="492" width="30" height="48" fill="#5b4a3a"/>
  <rect x="1650" y="486" width="26" height="20" fill="#9dc9c9"/>
  <path d="M1518 460 L1702 474 L1702 484 L1518 470 Z" fill="#8a5b3a"/>
  <path d="M1526 452 L1694 466 L1694 474 L1526 460 Z" fill="#2c4a63"/>
  ${[0, 1, 2, 3, 4, 5].map((k) => `<path d="M${1526 + k * 28} ${452 + k * 2.33} l0 8" stroke="#8fb3d1" stroke-width="1.5"/>`).join('')}
  <path d="M1526 456 L1694 470" stroke="#8fb3d1" stroke-width="1.2" opacity="0.8"/>
  <path d="M1600 458 L1660 463" stroke="#fffbe9" stroke-width="3" opacity="0.7"/>
  <rect x="1712" y="494" width="44" height="46" rx="4" fill="#6f9197"/>
  <ellipse cx="1734" cy="494" rx="22" ry="6" fill="#8fb0b4"/>
  <line x1="1560" y1="470" x2="1560" y2="384" stroke="#3b3b36" stroke-width="4"/>
  <line x1="1540" y1="392" x2="1580" y2="392" stroke="#3b3b36" stroke-width="3"/>
  <circle cx="1540" cy="389" r="5" fill="#3b3b36"/><circle cx="1580" cy="389" r="5" fill="#3b3b36"/>
  <rect x="1552" y="408" width="16" height="12" fill="#e8e2d4" stroke="#3b3b36" stroke-width="2"/>
  <circle cx="1560" cy="380" r="10" fill="url(#ledGlow)"/><circle cx="1560" cy="380" r="3.5" fill="#d8ff6a"/>
</g>`);
for (const [x, h, l, s] of [[1460, 190, -18, 0.78], [1800, 230, 22, 0.9], [1880, 170, -10, 0.7], [1080, 150, 14, 0.62]]) {
  add(palm(x, 546, h, l, s, '#8a7152', '#3f7a4f'));
}
add(`<rect x="0" y="470" width="1920" height="170" fill="url(#haze)" opacity="0.35"/>`);

// ─────────── field with crop rows ───────────
add(`<rect x="0" y="548" width="1920" height="532" fill="url(#field)"/>`);
// hedge / tree line where the field meets the hills
{
  let d = 'M0 560';
  for (let x = 0; x <= 1940; x += 22) d += ` Q${x + 11} ${f(538 - r() * 14)} ${x + 22} ${f(552 + r() * 4)}`;
  add(`<path d="${d} L1920 572 L0 572 Z" fill="#6e9d57"/>`);
}
const ROWS = 9;
for (let i = 0; i < ROWS; i++) {
  const t = i / (ROWS - 1);
  const y = 578 + 205 * Math.pow(t, 1.6);
  const hgt = 7 + 22 * t;
  const bump = 7 + 20 * t;
  const col = ['#7ea756', '#739f4d', '#679745', '#5b8e3e', '#4f8537'][Math.min(4, Math.floor(t * 5))];
  const hi = ['#9cc06a', '#93bb62', '#8ab75b', '#80b154', '#76aa4d'][Math.min(4, Math.floor(t * 5))];
  let d = `M-20 ${f(y + hgt)}`;
  let hl = '';
  for (let x = -20; x <= 1940; x += bump) {
    const top = y - (0.3 + r() * 0.7) * bump * 0.55;
    d += ` Q${f(x + bump / 2)} ${f(top)} ${f(x + bump)} ${f(y)}`;
    if (r() > 0.35) hl += `<ellipse cx="${f(x + bump / 2)}" cy="${f(top + bump * 0.22)}" rx="${f(bump * 0.28)}" ry="${f(bump * 0.12)}" fill="${hi}"/>`;
  }
  d += ` L1940 ${f(y + hgt)} Z`;
  add(`<path d="${d}" fill="${col}"/>${hl}`);
  add(`<rect x="0" y="${f(y + hgt)}" width="1920" height="${f(3 + 5 * t)}" fill="#b9975f" opacity="${f(0.35 + 0.2 * t)}"/>`);
}
add(`<rect x="0" y="540" width="1920" height="80" fill="url(#haze)" opacity="0.5"/>`);

// small under-canopy rover in the rows
add(`<g transform="translate(660 700) scale(0.46)">
  <ellipse cx="0" cy="4" rx="110" ry="12" fill="rgba(60,40,20,0.25)"/>
  <circle cx="-55" cy="-20" r="22" fill="${C.ink}"/><circle cx="55" cy="-20" r="22" fill="${C.ink}"/>
  <rect x="-90" y="-78" width="180" height="50" rx="14" fill="${C.cream}"/>
  <rect x="-90" y="-60" width="180" height="7" fill="${C.lime}"/>
  <rect x="30" y="-130" width="12" height="54" fill="${C.creamShade}"/>
  <path d="M36 -130 l60 -30" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/>
  <path d="M96 -160 L150 -210 L170 -180 Z" fill="#e8fbff" opacity="0.6"/>
</g>`);

// ─────────── drone with spray ───────────
add(`<ellipse cx="960" cy="604" rx="70" ry="8" fill="rgba(50,40,20,0.14)"/>`);
add(`<path d="M890 332 L1030 332 L1150 586 L770 586 Z" fill="url(#spray)" opacity="0.8"/>`);
for (let i = 0; i < 140; i++) {
  const u = Math.pow(r(), 0.8);
  const y = 336 + u * 250;
  const half = 70 + u * 120;
  const x = 960 + (r() - 0.5) * 2 * half;
  add(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(1.2 + r() * 1.6)}" fill="#ffffff" opacity="${f(0.7 - u * 0.5)}"/>`);
}
add(`<g transform="translate(960 292)">
  <ellipse cx="-66" cy="-32" rx="40" ry="5" fill="rgba(255,255,255,0.45)" stroke="rgba(60,60,60,0.18)"/>
  <ellipse cx="66" cy="-32" rx="40" ry="5" fill="rgba(255,255,255,0.45)" stroke="rgba(60,60,60,0.18)"/>
  <path d="M-36 -6 L-66 -28 M36 -6 L66 -28" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>
  <path d="M-40 -2 L-96 -22 M40 -2 L96 -22" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/>
  <rect x="-100" y="-30" width="8" height="10" fill="${C.ink}"/><rect x="92" y="-30" width="8" height="10" fill="${C.ink}"/>
  <ellipse cx="-96" cy="-30" rx="48" ry="6" fill="rgba(255,255,255,0.62)" stroke="rgba(60,60,60,0.22)"/>
  <ellipse cx="96" cy="-30" rx="48" ry="6" fill="rgba(255,255,255,0.62)" stroke="rgba(60,60,60,0.22)"/>
  <rect x="-58" y="-16" width="116" height="30" rx="13" fill="${C.cream}"/>
  <rect x="-58" y="2" width="116" height="12" rx="6" fill="${C.creamShade}"/>
  <rect x="-24" y="12" width="48" height="22" rx="7" fill="#cfd8d4"/>
  <path d="M-72 40 L72 40" stroke="${C.ink}" stroke-width="4" stroke-linecap="round"/>
  <path d="M-8 34 L-8 40 M8 34 L8 40" stroke="${C.ink}" stroke-width="3"/>
  ${[-60, -30, 0, 30, 60].map((x) => `<rect x="${x - 3}" y="40" width="6" height="6" fill="${C.ink}"/>`).join('')}
  <circle cx="46" cy="-4" r="10" fill="url(#ledGlow)"/><circle cx="46" cy="-4" r="3.5" fill="#e4ff8a"/>
</g>`);

// ─────────── trellis plot ───────────
add(`<path d="M890 884 C1100 862 1480 862 1690 880 L1690 912 L890 912 Z" fill="#a8703f"/>`);
add(`<path d="M890 884 C1100 862 1480 862 1690 880" stroke="#c48a55" stroke-width="3" fill="none"/>`);
const posts = [950, 1290, 1630];
for (const x of posts) add(`<rect x="${x - 7}" y="588" width="14" height="292" fill="#8a5b3a"/><rect x="${x + 1}" y="588" width="6" height="292" fill="#a8744c"/>`);
add(`<line x1="930" y1="598" x2="1650" y2="598" stroke="#5b4a3a" stroke-width="2.5"/>`);
add(`<line x1="930" y1="728" x2="1650" y2="728" stroke="#5b4a3a" stroke-width="1.6" opacity="0.6"/>`);
for (let x = 966; x < 1630; x += 34) {
  add(`<line x1="${x}" y1="598" x2="${x}" y2="872" stroke="rgba(80,60,40,0.3)" stroke-width="1.4"/>`);
  let d = `M${x} 872`;
  for (let y = 850; y > 600; y -= 30) d += ` Q${f(x + (r() - 0.5) * 16)} ${y + 15} ${f(x + (r() - 0.5) * 6)} ${y}`;
  add(`<path d="${d}" stroke="#4c8f45" stroke-width="2.6" fill="none"/>`);
}
// leaves (dense along the top wire, thinning towards the ground)
const leaves = [];
for (let i = 0; i < 190; i++) {
  const x = 940 + r() * 700;
  const y = 598 + Math.pow(r(), 1.8) * 250;
  leaves.push([x, y, 0.7 + r() * 0.55 - (y - 598) / 900, (r() - 0.5) * 70, C.leaf[Math.floor(r() * C.leaf.length)]]);
}
leaves.sort((a, b) => a[1] - b[1]);
const CUKES = [[1010, 648, 88], [1082, 704, 70], [1170, 644, 98], [1245, 664, 96], [1345, 690, 82], [1425, 640, 104], [1505, 700, 74], [1585, 656, 92]];
leaves.forEach((l) => add(heartLeaf(...l)));
for (const [x, y, len] of CUKES) if (x !== 1245) add(cucumber(x, y, len));
for (let i = 0; i < 22; i++) {
  const x = 950 + r() * 680, y = 600 + r() * 50;
  if (Math.abs(x - 1245) < 60) continue;
  add(heartLeaf(x, y, 0.9 + r() * 0.3, (r() - 0.5) * 60, C.leaf[Math.floor(r() * C.leaf.length)]));
}
for (let i = 0; i < 16; i++) {
  const x = 950 + r() * 680, y = 610 + r() * 150;
  add(`<g transform="translate(${f(x)} ${f(y)})">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-4" rx="2.6" ry="5" fill="#ffd23f" transform="rotate(${a})"/>`).join('')}<circle r="2" fill="#e8a317"/></g>`);
}
// drip line
add(`<path d="M890 876 C1100 856 1480 856 1690 874" stroke="#2d2b28" stroke-width="5" fill="none"/>`);
for (let x = 930; x < 1680; x += 38) {
  const y = 868 - Math.sin(((x - 890) / 800) * Math.PI) * 10;
  add(`<ellipse cx="${x}" cy="${f(y + 12)}" rx="16" ry="4" fill="#8a5a33" opacity="0.6"/><ellipse cx="${x}" cy="${f(y + 6)}" rx="2.2" ry="3.2" fill="#8fe3f0"/>`);
}

// ─────────── harvesting robot ───────────
const S = [1142, 694], EL = [1182, 606], W = [1230, 690];
const dir = Math.atan2(W[1] - EL[1], W[0] - EL[0]);
add(`<g>
  <ellipse cx="1120" cy="886" rx="128" ry="15" fill="rgba(70,45,20,0.3)"/>
  <circle cx="1058" cy="858" r="25" fill="${C.ink}"/><circle cx="1058" cy="858" r="9" fill="#d9d4c6"/>
  <circle cx="1184" cy="858" r="25" fill="${C.ink}"/><circle cx="1184" cy="858" r="9" fill="#d9d4c6"/>
  <rect x="1018" y="798" width="206" height="60" rx="17" fill="${C.cream}"/>
  <rect x="1018" y="834" width="206" height="24" rx="12" fill="${C.creamShade}"/>
  <rect x="1018" y="814" width="206" height="8" fill="${C.lime}"/>
  <circle cx="1210" cy="810" r="12" fill="url(#ledGlow)"/><circle cx="1210" cy="810" r="4" fill="#e4ff8a"/>
  <rect x="1030" y="746" width="92" height="54" rx="4" fill="#c7874a"/>
  <path d="M1030 764 H1122 M1030 782 H1122" stroke="#a86c38" stroke-width="3"/>
  <rect x="1040" y="738" width="60" height="16" rx="8" fill="${C.cuke}" transform="rotate(-6 1070 746)"/>
  <rect x="1062" y="734" width="52" height="15" rx="7.5" fill="#44873f" transform="rotate(8 1088 742)"/>
  <rect x="1133" y="690" width="20" height="114" rx="7" fill="#ebe4d5"/>
  <rect x="1146" y="690" width="7" height="114" rx="3" fill="#fbf8f0"/>
  <rect x="1152" y="716" width="40" height="26" rx="7" fill="${C.ink}"/>
  <circle cx="1181" cy="729" r="12" fill="url(#ledGlow)"/><circle cx="1181" cy="729" r="6" fill="#bff23a"/>
  <line x1="${S[0]}" y1="${S[1]}" x2="${EL[0]}" y2="${EL[1]}" stroke="${C.cream}" stroke-width="22" stroke-linecap="round"/>
  <line x1="${S[0] + 5}" y1="${S[1]}" x2="${EL[0] + 5}" y2="${EL[1]}" stroke="#fffdf7" stroke-width="5" stroke-linecap="round" opacity="0.9"/>
  <line x1="${EL[0]}" y1="${EL[1]}" x2="${W[0]}" y2="${W[1]}" stroke="${C.cream}" stroke-width="17" stroke-linecap="round"/>
  <line x1="${EL[0] + 4}" y1="${EL[1] - 2}" x2="${W[0] + 4}" y2="${W[1] - 2}" stroke="#fffdf7" stroke-width="4" stroke-linecap="round" opacity="0.9"/>
  ${[S, EL].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="13" fill="${C.ink}"/><circle cx="${x}" cy="${y}" r="4.5" fill="${C.lime}"/>`).join('')}
  ${cucumber(1245, 662, 96, 28)}
  <g transform="translate(${W[0]} ${W[1]}) rotate(${f((dir * 180) / Math.PI)})">
    <rect x="-6" y="-14" width="24" height="28" rx="6" fill="${C.ink}"/>
    <rect x="14" y="-19" width="30" height="7" rx="3" fill="#3d4441"/>
    <rect x="14" y="12" width="30" height="7" rx="3" fill="#3d4441"/>
  </g>
</g>`);
// data motes rising from the robot and the drone
for (const [x0, y0, n] of [[1181, 716, 5], [1006, 270, 4], [1560, 368, 3]]) {
  for (let k = 0; k < n; k++) {
    add(`<rect x="${f(x0 - 3 + Math.sin(k * 1.7) * 6)}" y="${f(y0 - 18 - k * 24)}" width="6" height="6" rx="1.5" fill="${C.limeGlow}" opacity="${f(0.85 - k * 0.16)}"/>`);
  }
}

// ─────────── foreground path + grass ───────────
add(`<path d="M0 902 C300 884 620 900 900 912 C1200 924 1520 912 1920 896 L1920 1080 L0 1080 Z" fill="url(#soil)"/>`);
add(`<path d="M0 902 C300 884 620 900 900 912 C1200 924 1520 912 1920 896" stroke="#e2b27e" stroke-width="3" fill="none" opacity="0.7"/>`);
for (let i = 0; i < 26; i++) add(`<ellipse cx="${f(r() * 1920)}" cy="${f(950 + r() * 120)}" rx="${f(4 + r() * 10)}" ry="${f(2 + r() * 3)}" fill="#9a6538" opacity="0.5"/>`);
for (let i = 0; i < 260; i++) {
  const x = r() * 1920;
  const yb = 902 + (x < 900 ? -18 * Math.sin((x / 900) * Math.PI) : 10) + 6;
  if (x > 880 && x < 1700) continue;
  const h = 10 + r() * 22;
  add(`<path d="M${f(x)} ${f(yb)} q${f((r() - 0.3) * 6)} ${f(-h * 0.6)} ${f((r() - 0.3) * 10)} ${f(-h)}" stroke="${r() > 0.5 ? '#5d8f3a' : '#7aab4a'}" stroke-width="3" stroke-linecap="round" fill="none"/>`);
}

// ─────────── supervisor ───────────
add(`<g transform="translate(430 944)">
  <ellipse cx="10" cy="4" rx="78" ry="12" fill="rgba(70,45,20,0.3)"/>
  <path d="M-12 -168 L-24 -12" stroke="#2c3b4c" stroke-width="22" stroke-linecap="round"/>
  <path d="M8 -168 L18 -12" stroke="#3a4f65" stroke-width="22" stroke-linecap="round"/>
  <path d="M-42 -2 C-42 -17 -25 -19 -12 -15 L-6 -3 Z" fill="#2a241f"/>
  <path d="M4 -2 C4 -17 23 -19 38 -13 L42 -2 Z" fill="#2a241f"/>
  <!-- back arm -->
  <path d="M-12 -268 C-6 -248 -8 -228 -2 -212" stroke="#b77818" stroke-width="19" stroke-linecap="round" fill="none"/>
  <path d="M-2 -212 L42 -222" stroke="#6f4128" stroke-width="13" stroke-linecap="round"/>
  <!-- kurta -->
  <path d="M-32 -146 C-36 -200 -34 -252 -24 -284 C-12 -298 18 -298 28 -284 C36 -252 36 -200 34 -146 Q2 -136 -32 -146 Z" fill="#dc9e30"/>
  <path d="M-32 -146 C-36 -200 -34 -252 -24 -284 C-18 -291 -10 -294 -3 -294 C-13 -252 -13 -200 -7 -142 Q-20 -142 -32 -146 Z" fill="#c4861f"/>
  <path d="M-8 -292 L4 -270 L14 -292" stroke="#b97a1a" stroke-width="3" fill="none"/>
  <path d="M4 -270 L4 -236" stroke="#b97a1a" stroke-width="2.5"/>
  <circle cx="4" cy="-258" r="1.8" fill="#8f5f14"/><circle cx="4" cy="-246" r="1.8" fill="#8f5f14"/>
  <!-- tablet -->
  <g transform="translate(62 -238) rotate(-20)">
    <ellipse cx="0" cy="0" rx="64" ry="50" fill="url(#tabletGlow)"/>
    <rect x="-34" y="-23" width="68" height="46" rx="6" fill="#1f2623"/>
    <rect x="-29" y="-18" width="58" height="36" rx="3" fill="url(#screen)"/>
    <path d="M-21 9 L-11 -1 L-1 5 L11 -9 L21 -5" stroke="#1f2623" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  </g>
  <circle cx="44" cy="-222" r="8.5" fill="#6f4128"/>
  <!-- front arm -->
  <path d="M16 -274 C26 -254 22 -232 24 -214" stroke="#eab04a" stroke-width="21" stroke-linecap="round" fill="none"/>
  <path d="M10 -262 C16 -246 14 -230 16 -218" stroke="#c98a22" stroke-width="3" fill="none" opacity="0.7"/>
  <path d="M24 -214 L54 -236" stroke="#8a5638" stroke-width="13" stroke-linecap="round"/>
  <circle cx="56" cy="-238" r="9" fill="#8a5638"/>
  <!-- head -->
  <rect x="-5" y="-310" width="17" height="22" rx="6" fill="#744528"/>
  <circle cx="6" cy="-330" r="32" fill="#8a5638"/>
  <path d="M-24 -326 C-29 -312 -22 -300 -12 -298 C-19 -310 -17 -319 -10 -326 Z" fill="#1c1917"/>
  <ellipse cx="-7" cy="-326" rx="6" ry="8" fill="#9a6344"/>
  <circle cx="25" cy="-332" r="3.2" fill="#1c1917"/>
  <path d="M36 -330 q7 7 0 11" stroke="#6f4128" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M20 -314 q8 4 14 -1" stroke="#5a3320" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  <path d="M-27 -340 C-24 -370 22 -374 34 -346 L58 -340 Q40 -333 -27 -338 Z" fill="#2f6f63"/>
  <path d="M-27 -340 C-24 -370 0 -373 14 -369 C0 -362 -12 -352 -14 -339 Z" fill="#285f55"/>
</g>`);

// ─────────── leader lines for labels ───────────
add(`<g stroke="#fffaf0" stroke-width="2" fill="#fffaf0">
  <path d="M1192 596 L1308 516" fill="none"/><circle cx="1192" cy="596" r="4"/>
  <path d="M990 262 L1032 222" fill="none"/><circle cx="990" cy="262" r="4"/>
</g>`);

// ─────────── foreground framing: fronds + banana leaf (out of focus) ───────────
add(palm(-70, 90, 60, 60, 1.6, '#2b5438', '#2b5438', { flat: true, angles: [-10, 18, 40, 62], attrs: 'filter="url(#blur6)" opacity="0.95"' }));
add(`<g filter="url(#blur6)" opacity="0.9">
  ${Array.from({ length: 9 }, (_, k) => `<path d="M${1780 + k * 18} 1090 q${-20 + k * 4} -${90 + (k % 3) * 40} ${-60 + k * 10} -${150 + (k % 4) * 30}" stroke="#2f6340" stroke-width="${14 - k}" stroke-linecap="round" fill="none"/>`).join('')}
</g>`);

// ─────────── light & finish ───────────
add(`<g opacity="0.09" fill="#fff6dc" style="mix-blend-mode:screen">
  <path d="M1330 392 L260 1080 L620 1080 Z"/><path d="M1330 392 L900 1080 L1120 1080 Z"/><path d="M1330 392 L0 700 L0 860 Z"/>
</g>`);
add(`<rect width="1920" height="1080" fill="url(#vig)"/>`);
add(`<rect width="1920" height="1080" filter="url(#grain)" opacity="0.07"/>`);

document.getElementById('art').innerHTML = `<defs>${defs}</defs>${art}`;
window.__ready = document.fonts.ready.then(() => true);
