// Vector artwork shared by scenes: leaves, crops, line icons, helix.
import { s, clamp } from './lib.js';

export const LEAF_COLORS = ['#1d5a3a', '#236a43', '#2c7a4e', '#19503a', '#2f8453'];

// Pointed leaf, base at origin, pointing +x
export function leafPath(L, W) {
  return `M0 0 C ${L * 0.28} ${-W}, ${L * 0.72} ${-W * 0.85}, ${L} 0 C ${L * 0.72} ${W * 0.85}, ${L * 0.28} ${W}, 0 0 Z`;
}
export function leaf(L, W, fill, rot = 0, x = 0, y = 0) {
  return s('g', { transform: `translate(${x} ${y}) rotate(${rot})` },
    s('path', { d: leafPath(L, W), fill }),
    s('path', { d: `M${L * 0.05} 0 L${L * 0.85} 0`, stroke: 'rgba(200,255,77,0.18)', 'stroke-width': 1.5, fill: 'none' }));
}

// Top-down plant rosette
export function rosette(r, seed = 0) {
  const g = s('g');
  const n = 7;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 360 + seed * 37;
    g.append(s('path', { d: leafPath(r, r * 0.38), fill: LEAF_COLORS[(i + seed) % LEAF_COLORS.length], transform: `rotate(${a})` }));
  }
  g.append(s('circle', { r: r * 0.16, fill: '#c8ff4d', opacity: 0.8 }));
  return g;
}

// ---------- crops (viewBox 0 0 100 200) ----------
function bumpyCapsule(cx, top, bottom, rw, bumps, amp) {
  const pts = [];
  const N = 90;
  const h = bottom - top;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const u = (1 - Math.cos(a)) / 2; // 0..1 along length
    const side = Math.sin(a) >= 0 ? 1 : -1;
    const prof = Math.pow(Math.sin(Math.PI * clamp(u, 0.0001, 0.9999)), 0.55);
    const bump = 1 + amp * Math.sin(u * Math.PI * bumps * 2) ** 2;
    const x = cx + side * rw * prof * bump * Math.abs(Math.sin(a)) ** 0.2;
    const y = top + u * h;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return 'M' + pts.join(' L') + ' Z';
}

export function crop(name, size = 200) {
  const svg = s('svg', { width: size / 2, height: size, viewBox: '0 0 100 200', class: 'crop' });
  const stem = (x, y1, y2, c = '#3f7f33') => s('path', { d: `M${x} ${y1} L${x} ${y2}`, stroke: c, 'stroke-width': 5, 'stroke-linecap': 'round' });
  switch (name) {
    case 'cucumber':
      svg.append(stem(50, 6, 30),
        s('rect', { x: 31, y: 26, width: 38, height: 164, rx: 19, fill: '#2f7a3e' }),
        s('rect', { x: 38, y: 36, width: 8, height: 140, rx: 4, fill: '#4f9f55', opacity: 0.6 }),
        ...[50, 78, 104, 130, 156].flatMap((y, i) => [
          s('circle', { cx: 58, cy: y + (i % 2) * 8, r: 2.2, fill: '#a7d98a', opacity: 0.8 }),
          s('circle', { cx: 44, cy: y + 12, r: 2, fill: '#a7d98a', opacity: 0.6 })]));
      break;
    case 'okra':
      svg.append(stem(50, 4, 30),
        s('path', { d: 'M34 30 L66 30 C68 80, 62 140, 50 194 C38 140, 32 80, 34 30 Z', fill: '#5fae4a' }),
        s('path', { d: 'M42 34 C43 90 46 140 50 190 M58 34 C57 90 54 140 50 190 M50 32 L50 188', stroke: '#3e8a33', 'stroke-width': 2.5, fill: 'none' }),
        s('path', { d: 'M30 24 L70 24 L66 38 L34 38 Z', fill: '#2f6b2a' }));
      break;
    case 'cowpea':
      svg.append(
        s('path', { d: 'M44 8 C70 60, 22 120, 56 196', stroke: '#7cc55a', 'stroke-width': 14, fill: 'none', 'stroke-linecap': 'round' }),
        s('path', { d: 'M60 14 C84 70, 44 120, 76 188', stroke: '#5ea844', 'stroke-width': 10, fill: 'none', 'stroke-linecap': 'round' }),
        ...[0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map((u) => {
          const y = 8 + u * 188;
          const x = 44 + Math.sin(u * Math.PI * 1.6) * 12 + u * 12;
          return s('circle', { cx: x, cy: y, r: 3.5, fill: '#a6e07d', opacity: 0.7 });
        }),
        stem(44, 2, 10, '#2f6b2a'));
      break;
    case 'bittergourd':
      svg.append(stem(50, 4, 28),
        s('path', { d: bumpyCapsule(50, 24, 196, 26, 9, 0.12), fill: '#4f9a3e' }),
        s('path', { d: 'M50 30 L50 188 M40 40 C38 100 42 150 48 186 M60 40 C62 100 58 150 52 186', stroke: '#7fc063', 'stroke-width': 2.5, fill: 'none', opacity: 0.8 }));
      break;
    case 'chilli':
      svg.append(
        s('path', { d: 'M52 6 C52 14 50 20 48 26', stroke: '#3f7f33', 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' }),
        s('path', { d: 'M36 40 C30 100, 44 160, 78 196 C62 150, 64 96, 64 40 Z', fill: '#e8412e' }),
        s('path', { d: 'M44 50 C42 100, 52 150, 70 186', stroke: '#ff8a6a', 'stroke-width': 3, fill: 'none', opacity: 0.6 }),
        s('path', { d: 'M32 42 C38 26 60 24 68 42 C58 36 42 36 32 42 Z', fill: '#3f7f33' }));
      break;
    case 'papaya': {
      const id = 'pg' + Math.floor(Math.random() * 1e9);
      svg.append(
        s('defs', {}, s('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 },
          s('stop', { offset: 0, 'stop-color': '#7cbf45' }), s('stop', { offset: 0.55, 'stop-color': '#f2a33a' }), s('stop', { offset: 1, 'stop-color': '#f07d2a' }))),
        stem(50, 8, 34),
        s('path', { d: 'M50 30 C84 30, 94 110, 76 168 C66 196, 34 196, 24 168 C6 110, 16 30, 50 30 Z', fill: `url(#${id})` }),
        s('path', { d: 'M36 60 C30 100 32 140 40 170', stroke: '#ffd08a', 'stroke-width': 4, fill: 'none', opacity: 0.5, 'stroke-linecap': 'round' }));
      break;
    }
  }
  return svg;
}

// ---------- line icons (24x24) ----------
const ICONS = {
  weed: ['M12 21 V11', 'M12 13 C12 9 9 7 5 7 C5 11 8 13 12 13', 'M12 11 C12 7 15 5 19 5 C19 9 16 11 12 11', 'M3 21 H21'],
  vine: ['M18 2 V22', 'M18 20 C10 20 6 16 6 12 C6 8 10 6 13 8 C15 10 13 13 11 12', 'M18 9 C14 9 12 6 13 3'],
  prune: ['M9.5 8.5 L20 17', 'M9.5 15.5 L20 7', 'M4 7 A3 3 0 1 0 10 7 A3 3 0 1 0 4 7', 'M4 17 A3 3 0 1 0 10 17 A3 3 0 1 0 4 17'],
  eye: ['M2 12 C5 6 19 6 22 12 C19 18 5 18 2 12 Z', 'M8.5 12 A3.5 3.5 0 1 0 15.5 12 A3.5 3.5 0 1 0 8.5 12'],
  count: ['M5 5 V19', 'M9 5 V19', 'M13 5 V19', 'M17 5 V19', 'M3 16 L21 8'],
  virus: ['M7 12 A5 5 0 1 0 17 12 A5 5 0 1 0 7 12', 'M12 2 V7', 'M12 17 V22', 'M2 12 H7', 'M17 12 H22', 'M5 5 L8.5 8.5', 'M15.5 15.5 L19 19', 'M19 5 L15.5 8.5', 'M8.5 15.5 L5 19'],
  nutrient: ['M12 3 C12 3 5 11 5 15 A7 7 0 0 0 19 15 C19 11 12 3 12 3 Z', 'M12 11.5 V18.5', 'M8.5 15 H15.5'],
  cart: ['M2 6 H15 V16 H2 Z', 'M15 9 H19 L22 12.5 V16 H15', 'M4 18.5 A2 2 0 1 0 8 18.5 A2 2 0 1 0 4 18.5', 'M16 18.5 A2 2 0 1 0 20 18.5 A2 2 0 1 0 16 18.5'],
  drop: ['M12 2.5 C12 2.5 4.5 11 4.5 15 A7.5 7.5 0 0 0 19.5 15 C19.5 11 12 2.5 12 2.5 Z', 'M8.5 15.5 C8.5 17.5 10 19 12 19'],
  gripper: ['M7 2 V8 L4 13 V19', 'M17 2 V8 L20 13 V19', 'M7 8 H17', 'M9 17 A3 3 0 1 0 15 17 A3 3 0 1 0 9 17'],
  bug: ['M7.5 14 A4.5 5.5 0 1 0 16.5 14 A4.5 5.5 0 1 0 7.5 14', 'M10 7.5 A2 2 0 1 0 14 7.5 A2 2 0 1 0 10 7.5', 'M7.5 12 L3 10', 'M7.5 15 L3 16', 'M16.5 12 L21 10', 'M16.5 15 L21 16', 'M12 9.5 V19.5', 'M10.5 6 L8 3', 'M13.5 6 L16 3'],
  spray: ['M4 20 C4 12 10 6 20 4 C20 14 14 20 4 20 Z', 'M4 20 L14 10', 'M18 12 L18.2 12', 'M21 15 L21.2 15', 'M17 17 L17.2 17'],
  sensor: ['M12 22 V11', 'M10 9 A2 2 0 1 0 14 9 A2 2 0 1 0 10 9', 'M7.5 13.5 A6 6 0 0 1 7.5 4.5', 'M16.5 4.5 A6 6 0 0 1 16.5 13.5', 'M4.5 16.5 A10 10 0 0 1 4.5 1.5', 'M19.5 1.5 A10 10 0 0 1 19.5 16.5'],
  ai: ['M12 12 L5 5', 'M12 12 L19 5', 'M12 12 L5 19', 'M12 12 L19 19', 'M12 12 L12 3', 'M9.5 12 A2.5 2.5 0 1 0 14.5 12 A2.5 2.5 0 1 0 9.5 12', 'M3 5 A2 2 0 1 0 7 5 A2 2 0 1 0 3 5', 'M17 5 A2 2 0 1 0 21 5 A2 2 0 1 0 17 5', 'M3 19 A2 2 0 1 0 7 19 A2 2 0 1 0 3 19', 'M17 19 A2 2 0 1 0 21 19 A2 2 0 1 0 17 19'],
  seed: ['M12 3 C17 7 18 14 12 21 C6 14 7 7 12 3 Z', 'M12 7 V17'],
};

export function icon(name, size = 48, color = 'currentColor', stroke = 1.8) {
  const svg = s('svg', { width: size, height: size, viewBox: '0 0 24 24', class: 'ico' });
  svg._paths = ICONS[name].map((d) => {
    const p = s('path', { d, fill: 'none', stroke: color, 'stroke-width': stroke, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1 });
    svg.append(p);
    return p;
  });
  return svg;
}
export function drawIcon(svg, p) {
  for (const path of svg._paths) {
    path.style.strokeDasharray = '1 1';
    path.style.strokeDashoffset = (1 - clamp(p)).toFixed(4);
  }
}

// ---------- DNA helix on canvas ----------
export function helix(g, { cx, cy, height, amp, phase, reveal = 1, color = '200,255,77', alpha = 1, n = 26, horizontal = false }) {
  for (let i = 0; i < n; i++) {
    const d = Math.abs(i - (n - 1) / 2) / ((n - 1) / 2);
    if (d > reveal) continue;
    const u = i / (n - 1) - 0.5;
    const a = phase + i * 0.42;
    const sa = Math.sin(a), ca = Math.cos(a);
    const along = u * height;
    const p1 = horizontal ? [cx + along, cy + amp * sa] : [cx + amp * sa, cy + along];
    const p2 = horizontal ? [cx + along, cy - amp * sa] : [cx - amp * sa, cy + along];
    const edge = Math.min(1, (reveal - d) * 6 + 0.001);
    g.strokeStyle = `rgba(243,239,227,${0.16 * alpha * edge})`;
    g.lineWidth = 2;
    g.beginPath(); g.moveTo(p1[0], p1[1]); g.lineTo(p2[0], p2[1]); g.stroke();
    for (const [p, z] of [[p1, ca], [p2, -ca]]) {
      const k = 0.5 + 0.5 * z;
      g.fillStyle = z > 0 ? `rgba(${color},${(0.35 + 0.65 * k) * alpha * edge})` : `rgba(61,224,192,${(0.25 + 0.5 * k) * alpha * edge})`;
      g.beginPath(); g.arc(p[0], p[1], 4 + 4 * k, 0, Math.PI * 2); g.fill();
    }
  }
}
