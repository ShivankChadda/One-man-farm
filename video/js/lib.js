// Tiny deterministic animation toolkit. Every visual is a pure function of
// time, so any frame can be rendered in any order (and in parallel).

export const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const lerp = (a, b, t) => a + (b - a) * t;
export const invlerp = (a, b, x) => clamp((x - a) / (b - a));

export const E = {
  lin: (t) => t,
  outQuad: (t) => 1 - (1 - t) * (1 - t),
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  outQuart: (t) => 1 - Math.pow(1 - t, 4),
  outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inQuad: (t) => t * t,
  inCubic: (t) => t * t * t,
  inExpo: (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  inOutQuart: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
  inOutExpo: (t) =>
    t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
  outBack: (t) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
};

// Eased progress of `t` through the window [a, a + d]. Units are beats.
export const pr = (t, a, d = 1, ease = E.outExpo) => ease(clamp((t - a) / d));

// Deterministic PRNG (mulberry32)
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Cheap hash noise in [0,1) for per-frame jitter
export const hash = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ---------- DOM ----------
function applyAttrs(el, attrs, isSvg) {
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'class') isSvg ? el.setAttribute('class', v) : (el.className = v);
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v);
  }
}
function append(el, kids) {
  for (const k of kids.flat(Infinity)) {
    if (k == null || k === false) continue;
    el.append(k instanceof Node ? k : document.createTextNode(String(k)));
  }
}
export function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  applyAttrs(el, attrs, false);
  append(el, kids);
  return el;
}
const NS = 'http://www.w3.org/2000/svg';
export function s(tag, attrs = {}, ...kids) {
  const el = document.createElementNS(NS, tag);
  applyAttrs(el, attrs, true);
  append(el, kids);
  return el;
}

// Transform + opacity + blur in one call
export function T(el, { x = 0, y = 0, s: sc = 1, sx, sy, r = 0, o, blur = 0 } = {}) {
  el.style.transform = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) rotate(${r.toFixed(3)}deg) scale(${(sx ?? sc).toFixed(4)},${(sy ?? sc).toFixed(4)})`;
  if (o !== undefined) el.style.opacity = clamp(o).toFixed(3);
  el.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : '';
}
export const O = (el, o) => (el.style.opacity = clamp(o).toFixed(3));
export const show = (el, on) => (el.style.visibility = on ? 'visible' : 'hidden');

// Absolute-positioned box
export function box(x, y, attrs = {}, ...kids) {
  const el = h('div', attrs, ...kids);
  el.classList.add('abs');
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  return el;
}

// ---------- Kinetic type ----------
// Markup: *word* → lime accent, ^word^ → coral, _word_ → serif italic, ~word~ → dim.
// Markers can span several words.
export function words(text, cls = '') {
  const el = h('div', { class: 'words ' + cls });
  const flags = { acc: false, ser: false, dim: false, coral: false };
  const inner = [];
  const toks = text.split(' ');
  const marks = { '*': 'acc', _: 'ser', '~': 'dim', '^': 'coral' };
  toks.forEach((tok, i) => {
    if (tok === '/') { el.append(h('br')); return; } // explicit line break
    const [, open, core, close, punct] = tok.match(/^([*_~^]*)(.*?)([*_~^]*)([.,?!:;]*)$/);
    for (const c of open) flags[marks[c]] = true;
    const cl = ['wi'];
    if (flags.acc) cl.push('acc');
    if (flags.ser) cl.push('serif');
    if (flags.dim) cl.push('dim');
    if (flags.coral) cl.push('coral');
    const wi = h('span', { class: cl.join(' ') }, core + punct);
    inner.push(wi);
    el.append(h('span', { class: 'w' }, wi));
    if (i < toks.length - 1 && toks[i + 1] !== '/') el.append(' ');
    for (const c of close) flags[marks[c]] = false;
  });
  el._w = inner;
  return el;
}

// Split into characters (for titles)
export function chars(text, cls = '') {
  const el = h('div', { class: 'words ' + cls });
  el._w = [];
  for (const ch of text) {
    if (ch === ' ') { el.append(' '); continue; }
    const wi = h('span', { class: 'wi' }, ch);
    el._w.push(wi);
    el.append(h('span', { class: 'w' }, wi));
  }
  return el;
}

// Masked rise-in per word (t, start, stagger, dur in beats)
export function rise(el, t, start, { stagger = 0.06, dur = 0.9, dist = 105, ease = E.outExpo, fade = false } = {}) {
  const n = el._w.length;
  for (let i = 0; i < n; i++) {
    const p = pr(t, start + i * stagger, dur, ease);
    const w = el._w[i];
    w.style.transform = `translateY(${((1 - p) * dist).toFixed(2)}%)`;
    w.style.visibility = p > 0 ? 'visible' : 'hidden';
    if (fade) w.style.opacity = p.toFixed(3);
  }
}
// Masked exit (words drop out upward)
export function sink(el, t, start, { stagger = 0.03, dur = 0.5, ease = E.inCubic } = {}) {
  if (t < start) return;
  el._w.forEach((w, i) => {
    const p = pr(t, start + i * stagger, dur, ease);
    if (p > 0) w.style.transform = `translateY(${(-p * 130).toFixed(2)}%)`;
    if (p >= 1) w.style.visibility = 'hidden';
  });
}

// Slam in: scale down + un-blur
export function slam(el, t, start, { from = 1.35, dur = 0.35, blur = 14 } = {}) {
  const p = pr(t, start, dur, E.outExpo);
  const vis = t >= start;
  T(el, { s: lerp(from, 1, p), o: vis ? Math.min(1, (t - start) / 0.06) : 0, blur: (1 - p) * blur });
}

// Typewriter for mono strings
export function type(el, text, t, start, cps = 40, cursor = true) {
  const n = Math.max(0, Math.floor((t - start) * cps));
  const done = n >= text.length;
  el.textContent = text.slice(0, n) + (cursor && t >= start && !done ? '▌' : '');
}

// Stroke-draw an SVG path created with pathLength="1"
export function draw(path, p) {
  path.style.strokeDasharray = '1 1';
  path.style.strokeDashoffset = (1 - clamp(p)).toFixed(4);
}

// ---------- Icons ----------
export function arrow(size = 40, color = 'currentColor', stroke = 3) {
  return s('svg', { width: size, height: size * 0.6, viewBox: '0 0 40 24', class: 'ico' },
    s('path', { d: 'M2 12 H36 M26 3 L37 12 L26 21', fill: 'none', stroke: color, 'stroke-width': stroke, 'stroke-linecap': 'square' }));
}
export function check(size = 28, color = 'currentColor', stroke = 3.5) {
  const p = s('path', { d: 'M3 12.5 L9.5 19 L21 5', fill: 'none', stroke: color, 'stroke-width': stroke, 'stroke-linecap': 'square', pathLength: 1 });
  const svg = s('svg', { width: size, height: size, viewBox: '0 0 24 24', class: 'ico' }, p);
  svg._paths = [p];
  return svg;
}
export function neq(size = 28, color = 'currentColor', stroke = 3) {
  return s('svg', { width: size, height: size, viewBox: '0 0 24 24', class: 'ico' },
    s('path', { d: 'M3 9 H21 M3 15 H21 M16 3 L8 21', fill: 'none', stroke: color, 'stroke-width': stroke }));
}

// Brand mark: a ring (the farm), a seedling, and a sensor dot
export function mark(size = 40, color = 'var(--lime)') {
  return s('svg', { width: size, height: size, viewBox: '0 0 40 40', class: 'mark' },
    s('circle', { cx: 20, cy: 20, r: 17.5, fill: 'none', stroke: color, 'stroke-width': 3 }),
    s('path', { d: 'M20 31 V17', stroke: color, 'stroke-width': 3, 'stroke-linecap': 'round' }),
    s('path', { d: 'M20 19 C20 13 15 10 10 11 C10 16 14 19 20 19 Z', fill: color }),
    s('path', { d: 'M20 22 C20 16 25 13 30 14 C30 19 26 22 20 22 Z', fill: color }),
    s('circle', { cx: 20, cy: 20, r: 0.1, fill: 'none' }));
}

export const fmt = (n) => Math.round(n).toLocaleString('en-US');

// Fade + blur a whole scene root out over [start, start + dur]
export function exit(el, t, start, dur = 0.6, { blur = 10, y = 0, s: sc = 1 } = {}) {
  const p = pr(t, start, dur, E.inCubic);
  el.style.opacity = (1 - p).toFixed(3);
  el.style.filter = p > 0 ? `blur(${(p * blur).toFixed(2)}px)` : '';
  el.style.transform = p > 0 ? `translateY(${(p * y).toFixed(1)}px) scale(${(1 + (sc - 1) * p).toFixed(4)})` : '';
}
