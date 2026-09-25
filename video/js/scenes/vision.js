// Chapters 02–03 — machines built for small farms, and crops built for one farm.
import { h, s, box, words, rise, sink, slam, exit, T, O, pr, E, lerp, clamp, rng, draw, neq } from '../lib.js';
import { crop, helix } from '../art.js';

const stageSvg = (...kids) => s('svg', { class: 'abs', width: 1920, height: 1080, viewBox: '0 0 1920 1080', style: 'left:0;top:0' }, ...kids);
const poly = (pts) => 'M' + pts.map((p) => p.join(' ')).join(' L') + ' Z';
const centroid = (pts) => pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length], [0, 0]);

// Swap headline helper: each line visible in [t_i, t_{i+1})
function headlines(texts, x, y, size, cls = 'hl') {
  return texts.map((t) => {
    const w = words(t, cls);
    box(x, y, { style: { fontSize: size + 'px' } }, w);
    return w;
  });
}
function swap(lines, times, b, opts = {}) {
  lines.forEach((w, i) => {
    const a = times[i], z = times[i + 1] ?? 1e9;
    const vis = b >= a - 0.01 && b < z + 0.3;
    w.parentElement.style.display = vis ? '' : 'none';
    if (!vis) return;
    rise(w, b, a, { stagger: 0.06, dur: 0.8, ...opts });
    if (b >= z - 0.05) sink(w, b, z - 0.05, { dur: 0.3 });
  });
}

function tractor(scale = 1) {
  return s('g', { transform: `scale(${scale})` },
    s('rect', { x: -150, y: -170, width: 34, height: 340, fill: '#2a3630', stroke: 'rgba(243,239,227,0.5)', 'stroke-width': 3 }),
    ...Array.from({ length: 9 }, (_, k) => s('line', { x1: -150, y1: -150 + k * 38, x2: -175, y2: -150 + k * 38, stroke: 'rgba(243,239,227,0.4)', 'stroke-width': 3 })),
    s('rect', { x: -116, y: -8, width: 40, height: 16, fill: '#3a4a40' }),
    s('rect', { x: -76, y: -62, width: 70, height: 124, rx: 6, fill: '#26332c', stroke: 'rgba(243,239,227,0.5)', 'stroke-width': 3 }),
    s('rect', { x: -6, y: -44, width: 120, height: 88, rx: 8, fill: '#1c2822', stroke: 'rgba(243,239,227,0.5)', 'stroke-width': 3 }),
    s('rect', { x: -66, y: -48, width: 52, height: 96, rx: 4, fill: 'rgba(61,224,192,0.25)' }),
    ...[[-64, -92, 64, 32], [-64, 60, 64, 32], [64, -72, 42, 22], [64, 50, 42, 22]].map(([x, y, w, hh]) =>
      s('rect', { x, y, width: w, height: hh, rx: 5, fill: '#0c1511', stroke: 'rgba(243,239,227,0.35)', 'stroke-width': 2 })));
}

// ───────────────────────── the reality of small farms ─────────────────────────
const PLOTS = [
  { pts: [[170, 350], [560, 336], [590, 548], [190, 592]], label: '3 acres', kind: 'trellis' },
  { pts: [[620, 345], [980, 362], [962, 520], [640, 538]], kind: 'contour' },
  { pts: [[1030, 352], [1420, 332], [1450, 500], [1012, 536]], label: '5 acres', kind: 'rows', ang: 12 },
  { pts: [[1480, 342], [1760, 366], [1748, 556], [1500, 548]], kind: 'rows', ang: -28 },
  { pts: [[190, 632], [600, 610], [622, 872], [212, 882]], label: '10 acres', kind: 'mixed' },
  { pts: [[664, 596], [980, 578], [998, 860], [652, 874]], kind: 'contour' },
  { pts: [[1040, 594], [1460, 566], [1480, 862], [1030, 872]], kind: 'trellis' },
  { pts: [[1520, 612], [1752, 640], [1760, 880], [1532, 872]], kind: 'rows', ang: 70 },
];
const ROAD = 'M120 606 C330 612 450 590 612 580 S830 560 1005 562 S1300 552 1488 556 S1700 596 1800 600';
const DRAIN = 'M1004 330 C992 440 1016 500 1006 560 S1018 760 1010 896';
const TAGS = [['Irregular plots', 1510, 300], ['Hilly terrain', 690, 404], ['Narrow roads', 1170, 520], ['Trellises', 1150, 690], ['Drainage', 1030, 790], ['Mixed crops', 250, 690]];
const BOTS = [
  [[230, 420], [520, 400]], [[250, 760], [560, 740]], [[1080, 420], [1390, 380]], [[1100, 700], [1420, 680]],
  [[700, 420], [930, 440]], [[1540, 700], [1720, 730]], [[700, 700], [940, 720]],
];
export const small = {
  sfx: [[0, 'whoosh'], [0, 'rumble', 4], [4, 'hit', 0.7], ...TAGS.map((_, i) => [5.4 + i * 0.36, 'tick', 1 + i * 0.07]), [7.6, 'rumble', 1.2], [8.1, 'stamp', 1.2], [9, 'blip', 1], [9.4, 'blip', 1.12], [9.8, 'blip', 1.26], [10.2, 'blip', 1.5]],
  build(el) {
    const r = rng(5);
    const tag = box(140, 130, { class: 'tag' }, 'Reality check');
    const lines = headlines(['Most machinery was built for *this.*', 'Indian farms look like *this.*', 'Smaller. Lighter. Modular. *Smarter.*'], 140, 170, 84);

    // phase 1: the big flat field
    const big = s('g');
    big.append(s('rect', { x: 140, y: 330, width: 1640, height: 560, fill: 'rgba(243,239,227,0.02)', stroke: 'rgba(243,239,227,0.25)', 'stroke-width': 2 }));
    for (let y = 350; y < 880; y += 22) big.append(s('line', { x1: 150, y1: y, x2: 1770, y2: y, stroke: 'rgba(200,255,77,0.14)', 'stroke-width': 2 }));
    const bigTractor = tractor(1.25);
    big.append(bigTractor);
    const bigChip = box(1780, 290, { class: 'chip', style: { fontSize: '15px' } }, 'Vast · flat · uniform');
    bigChip.style.left = 'auto'; bigChip.style.right = '140px';

    // phase 2: the real plots
    const defs = s('defs');
    const plots = PLOTS.map((P, i) => {
      const id = 'plot' + i;
      defs.append(s('clipPath', { id }, s('path', { d: poly(P.pts) })));
      const fill = s('path', { d: poly(P.pts), fill: 'rgba(243,239,227,0.03)' });
      const edge = s('path', { d: poly(P.pts), fill: 'none', stroke: 'rgba(243,239,227,0.55)', 'stroke-width': 4, pathLength: 1, 'stroke-linejoin': 'round' });
      const pat = s('g', { 'clip-path': `url(#${id})` });
      const [cx, cy] = centroid(P.pts);
      if (P.kind === 'rows') {
        const g = s('g', { transform: `rotate(${P.ang} ${cx} ${cy})` });
        for (let k = -20; k <= 20; k++) g.append(s('line', { x1: cx - 400, y1: cy + k * 16, x2: cx + 400, y2: cy + k * 16, stroke: 'rgba(44,122,78,0.9)', 'stroke-width': 5 }));
        pat.append(g);
      } else if (P.kind === 'trellis') {
        for (let k = -20; k <= 20; k++) pat.append(s('line', { x1: cx + k * 24, y1: cy - 200, x2: cx + k * 24, y2: cy + 200, stroke: 'rgba(200,255,77,0.35)', 'stroke-width': 2 }));
        for (let k = -8; k <= 8; k++) pat.append(s('line', { x1: cx - 300, y1: cy + k * 30, x2: cx + 300, y2: cy + k * 30, stroke: 'rgba(243,239,227,0.12)', 'stroke-width': 1.5 }));
        for (let a = -12; a <= 12; a++) for (let k = -6; k <= 6; k++) pat.append(s('circle', { cx: cx + a * 24, cy: cy + k * 30, r: 4, fill: '#2c7a4e' }));
      } else if (P.kind === 'contour') {
        for (let k = 1; k <= 9; k++) {
          const pts = [];
          for (let a = 0; a <= 64; a++) {
            const th = (a / 64) * Math.PI * 2;
            const rr = k * 20 * (1 + 0.18 * Math.sin(th * 3 + k) + 0.08 * Math.sin(th * 5));
            pts.push([cx + 20 + Math.cos(th) * rr * 1.4, cy + 10 + Math.sin(th) * rr]);
          }
          pat.append(s('path', { d: poly(pts), fill: 'none', stroke: `rgba(61,224,192,${0.15 + k * 0.03})`, 'stroke-width': 2 }));
        }
      } else if (P.kind === 'mixed') {
        const cols = ['#2c7a4e', '#c8ff4d', '#e8412e', '#f2a33a'];
        for (let x = 190; x < 630; x += 20) for (let y = 610; y < 890; y += 20) {
          const band = Math.floor((x - 190) / 110);
          pat.append(s('circle', { cx: x + (r() - 0.5) * 4, cy: y, r: 3.5, fill: cols[band % 4], opacity: 0.8 }));
        }
      }
      return { P, fill, edge, pat, c: [cx, cy] };
    });
    const road = s('path', { d: ROAD, fill: 'none', stroke: '#0a130e', 'stroke-width': 26, pathLength: 1, 'stroke-linecap': 'round' });
    const roadEdge = s('path', { d: ROAD, fill: 'none', stroke: 'rgba(243,239,227,0.35)', 'stroke-width': 30, pathLength: 1, 'stroke-linecap': 'round' });
    const roadMid = s('path', { d: ROAD, fill: 'none', stroke: 'rgba(243,239,227,0.5)', 'stroke-width': 2, 'stroke-dasharray': '10 12' });
    const drain = s('path', { d: DRAIN, fill: 'none', stroke: 'var(--teal)', 'stroke-width': 6, pathLength: 1, 'stroke-linecap': 'round' });
    const plotG = s('g', {}, ...plots.map((p) => p.fill), ...plots.map((p) => p.pat), roadEdge, road, roadMid, drain, ...plots.map((p) => p.edge));
    const labels = plots.filter((p) => p.P.label).map((p) => box(p.c[0] - 60, p.c[1] - 18, { class: 'chip', style: { fontSize: '16px', width: '120px', justifyContent: 'center', background: 'rgba(6,17,12,0.9)' } }, p.P.label));
    const tags = TAGS.map(([t, x, y]) => box(x, y, { class: 'chip lime', style: { fontSize: '14px', padding: '6px 10px' } }, t));

    const fatTractor = tractor(1.25);
    const noFit = box(1350, 690, { class: 'chip solid-coral', style: { fontSize: '26px', padding: '12px 22px' } }, 'Doesn’t fit');
    const bots = BOTS.map(() => {
      const trail = s('line', { stroke: 'rgba(200,255,77,0.35)', 'stroke-width': 3, 'stroke-dasharray': '2 6' });
      const bot = s('g', {}, s('rect', { x: -15, y: -10, width: 30, height: 20, rx: 5, fill: 'var(--lime)' }), s('rect', { x: 4, y: -5, width: 7, height: 10, rx: 2, fill: '#06110c' }));
      return { trail, bot };
    });
    const botG = s('g', {}, ...bots.map((b) => b.trail), ...bots.map((b) => b.bot));
    el.append(stageSvg(defs, big, plotG, fatTractor, botG), bigChip, ...labels, ...tags, noFit, tag, ...lines.map((w) => w.parentElement));
    return { root: el, tag, lines, big, bigTractor, bigChip, plots, road, roadEdge, roadMid, drain, plotG, labels, tags, fatTractor, noFit, bots };
  },
  update(b, c) {
    O(c.tag, pr(b, 0, 0.4));
    swap(c.lines, [0, 4, 9], b, { stagger: b > 8.9 ? 0.4 : 0.06 });

    // phase 1
    const out1 = pr(b, 3.7, 0.4, E.inCubic);
    O(c.big, pr(b, 0, 0.5) * (1 - out1));
    c.bigTractor.setAttribute('transform', `translate(${lerp(-300, 1450, pr(b, 0, 3.9, E.lin))} 610) scale(1.25)`);
    O(c.bigChip, pr(b, 0.6, 0.4) * (1 - out1));

    // phase 2
    const on2 = b >= 4;
    O(c.plotG, on2 ? 1 : 0);
    c.plots.forEach((p, i) => {
      draw(p.edge, pr(b, 4 + i * 0.1, 0.9, E.inOutCubic));
      O(p.pat, pr(b, 4.5 + i * 0.1, 0.8));
      O(p.fill, pr(b, 4.3 + i * 0.1, 0.6));
    });
    draw(c.road, pr(b, 4.8, 0.9, E.inOutCubic));
    draw(c.roadEdge, pr(b, 4.8, 0.9, E.inOutCubic));
    O(c.roadMid, pr(b, 5.5, 0.4));
    draw(c.drain, pr(b, 5.0, 0.8, E.inOutCubic));
    c.labels.forEach((l, i) => T(l, { o: pr(b, 5 + i * 0.15, 0.4), y: (1 - pr(b, 5 + i * 0.15, 0.4)) * 10 }));
    c.tags.forEach((t, i) => {
      const st = 5.4 + i * 0.36;
      const p = pr(b, st, 0.4, E.outBack);
      T(t, { s: 0.6 + 0.4 * p, o: clamp((b - st) * 5) * (1 - pr(b, 8.6, 0.4)) });
    });

    // oversized machine tries the road
    const tx = lerp(2100, 1560, pr(b, 7.5, 0.6, E.outCubic)) + (b > 8.1 && b < 8.5 ? Math.sin(b * 90) * 6 : 0);
    c.fatTractor.setAttribute('transform', `translate(${tx} 600) scale(1.25)`);
    c.fatTractor.style.opacity = b >= 7.5 ? 1 - pr(b, 8.9, 0.4) : 0;
    c.fatTractor.style.filter = b > 8.05 ? 'drop-shadow(0 0 0 var(--coral)) drop-shadow(0 0 12px rgba(255,106,77,0.8))' : '';
    if (b >= 8.1) slam(c.noFit, b, 8.1, { from: 1.5, blur: 6 }); else O(c.noFit, 0);
    if (b >= 8.9) O(c.noFit, 1 - pr(b, 8.9, 0.3));

    // compact bots take over
    c.bots.forEach((bt, i) => {
      const [a, z] = BOTS[i];
      const st = 8.9 + i * 0.12;
      const vis = pr(b, st, 0.3);
      const u = ((Math.max(0, b - st) * 0.28 + i * 0.17) % 2);
      const k = u < 1 ? u : 2 - u;
      const x = lerp(a[0], z[0], E.inOutCubic(k)), y = lerp(a[1], z[1], E.inOutCubic(k));
      const ang = (Math.atan2(z[1] - a[1], z[0] - a[0]) * 180) / Math.PI + (u < 1 ? 0 : 180);
      bt.bot.setAttribute('transform', `translate(${x} ${y}) rotate(${ang}) scale(${vis})`);
      bt.trail.setAttribute('x1', a[0]); bt.trail.setAttribute('y1', a[1]);
      bt.trail.setAttribute('x2', x); bt.trail.setAttribute('y2', y);
      bt.trail.style.opacity = vis;
      bt.bot.style.opacity = vis;
    });
    exit(c.root, b, 11.6, 0.4);
  },
};

// ───────────────────────── the question ─────────────────────────
export const question = {
  sfx: [[0, 'hit', 0.5], [1, 'impact', 0.8], [2, 'sweep'], [5.2, 'blip', 1.3]],
  build(el) {
    const sq = s('rect', { x: 960 - 105, y: 680, width: 210, height: 210, fill: 'rgba(200,255,77,0.05)', stroke: 'rgba(200,255,77,0.7)', 'stroke-width': 2, pathLength: 1 });
    const dimTop = s('g', {}, s('path', { d: 'M855 668 V660 H1065 V668', stroke: 'rgba(200,255,77,0.6)', 'stroke-width': 2, fill: 'none' }));
    const dimSide = s('g', {}, s('path', { d: 'M1077 680 H1085 V890 H1077', stroke: 'rgba(200,255,77,0.6)', 'stroke-width': 2, fill: 'none' }));
    const lab1 = box(1100, 774, { class: 'mono acc', style: { fontSize: '16px' } }, '≈ 142 m');
    const lab2 = box(0, 770, { class: 'mono', style: { fontSize: '16px', color: 'var(--dim)', width: '835px', textAlign: 'right' } }, '5 acres  ·  ≈ 20,000 m²');
    const lab3 = box(0, 0, {});
    const a = words('How do we bring the productivity of industrial machinery', 'hl');
    const aBox = box(0, 300, { style: { width: '1920px', textAlign: 'center', fontSize: '50px', fontWeight: 600, color: 'var(--dim)' } }, a);
    const bw = words('to a *five-acre* farm?', 'hl');
    const bBox = box(0, 380, { style: { width: '1920px', textAlign: 'center', fontSize: '176px', fontWeight: 900 } }, bw);
    const c3 = box(0, 930, { class: 'mono acc', style: { width: '1920px', textAlign: 'center', fontSize: '22px', letterSpacing: '0.24em' } }, '[  Solving that is an innovation in itself  ]');
    el.append(stageSvg(sq, dimTop, dimSide), lab1, lab2, lab3, aBox, bBox, c3);
    return { root: el, sq, dimTop, dimSide, lab1, lab2, lab3, a, bw, c3, grid: 0.4 };
  },
  update(b, c) {
    draw(c.sq, pr(b, 1.6, 1.4, E.inOutCubic));
    for (const e of [c.dimTop, c.dimSide, c.lab1, c.lab2, c.lab3]) O(e, pr(b, 2.6, 0.6));
    rise(c.a, b, 0, { stagger: 0.04 });
    rise(c.bw, b, 1, { stagger: 0.09, dur: 1 });
    T(c.bw.parentElement, { s: 1 + b * 0.006 });
    T(c.c3, { o: pr(b, 5.2, 0.5), y: (1 - pr(b, 5.2, 0.5)) * 10 });
    exit(c.root, b, 7.6, 0.4);
  },
};

// ───────────────────────── seeds are bred for regions ─────────────────────────
const proj = (lat, lon) => [820 + (lon - 77) * 53.3, 250 + (16 - lat) * 54];
const COAST = [[16.0, 81.2], [15.2, 80.2], [14.5, 80.15], [13.6, 80.25], [13.08, 80.3], [12.2, 80.05], [11.4, 79.8], [10.8, 79.85], [10.3, 79.87], [9.95, 79.35], [9.3, 79.1], [8.8, 78.15], [8.08, 77.55], [8.4, 77.0]];
const LANKA = [[9.82, 80.2], [9.35, 80.9], [8.55, 81.25], [7.9, 81.62], [7.2, 81.87], [6.45, 81.8], [6.05, 81.1], [5.93, 80.55], [6.2, 80.05], [6.9, 79.85], [7.8, 79.8], [8.6, 79.9], [9.3, 80.05]];
const ISLANDS = [[13.1, 92.95, 0.14, 0.45], [12.45, 92.85, 0.15, 0.35], [11.75, 92.68, 0.18, 0.3], [10.72, 92.55, 0.12, 0.17], [9.17, 92.8, 0.07, 0.08], [8.05, 93.4, 0.06, 0.07], [7.9, 93.55, 0.07, 0.06], [7.0, 93.83, 0.2, 0.4]];
const CHENNAI = proj(13.08, 80.27), GN = proj(7.0, 93.83);
const ARC = `M${CHENNAI[0]} ${CHENNAI[1]} Q ${(CHENNAI[0] + GN[0]) / 2} ${CHENNAI[1] - 240} ${GN[0]} ${GN[1]}`;
const DIFFS = ['Rainfall', 'Humidity', 'Soil', 'Pest pressure', 'Disease pressure', 'Temperature'];

export const seeds = {
  sfx: [[0, 'whoosh'], [1, 'hit', 0.5], [1.5, 'blip', 1], [2.2, 'blip', 1.3], [2.8, 'sweep'], ...DIFFS.map((_, i) => [5 + i * 0.5, 'tick', 1 + i * 0.08]),
    [9, 'whoosh'], [10.2, 'hit', 0.8], [12.2, 'blip', 1], [13.2, 'zip'], [13.8, 'impact', 0.7]],
  build(el) {
    const p1 = box(0, 0, { style: { width: '1920px', height: '1080px' } });
    const tag = box(140, 150, { class: 'tag' }, 'Planting material');
    const hA = words('Seeds are bred for *regions.*', 'hl');
    const hB = words('Not for ^farms.^', 'hl');
    const hBoxA = box(140, 190, { style: { fontSize: '84px' } }, hA);
    const hBoxB = box(140, 272, { style: { fontSize: '84px' } }, hB);

    const dotLine = (pts, closed) => {
      const P = pts.map(([la, lo]) => proj(la, lo));
      return s('path', { d: 'M' + P.map((p) => p.map((v) => v.toFixed(1)).join(' ')).join(' L') + (closed ? ' Z' : ''), fill: closed ? 'rgba(243,239,227,0.04)' : 'none', stroke: 'rgba(243,239,227,0.45)', 'stroke-width': 3, 'stroke-dasharray': '1 9', 'stroke-linecap': 'round' });
    };
    const coast = dotLine(COAST, false);
    const lanka = dotLine(LANKA, true);
    const islands = ISLANDS.map(([la, lo, rx, ry], i) => {
      const [x, y] = proj(la, lo);
      return s('ellipse', { cx: x, cy: y, rx: rx * 53.3, ry: ry * 54, fill: i === ISLANDS.length - 1 ? 'var(--lime)' : 'rgba(243,239,227,0.55)', transform: `rotate(8 ${x} ${y})` });
    });
    const arcDraw = s('path', { d: ARC, fill: 'none', stroke: '#fff', 'stroke-width': 14, pathLength: 1 });
    const arcMask = s('mask', { id: 'arcMask', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: 1920, height: 1080 }, arcDraw);
    const arc = s('path', { d: ARC, fill: 'none', stroke: 'var(--lime)', 'stroke-width': 3, 'stroke-dasharray': '10 10', mask: 'url(#arcMask)' });
    const pin = (x, y) => s('g', { transform: `translate(${x} ${y})` }, s('circle', { r: 26, fill: 'none', stroke: 'var(--lime)', 'stroke-width': 2, class: 'ring' }), s('circle', { r: 9, fill: 'var(--lime)' }));
    const pinA = pin(...CHENNAI), pinB = pin(...GN);
    const seed = s('g', {}, s('ellipse', { rx: 11, ry: 16, fill: 'var(--lime)' }), s('path', { d: 'M0 -9 V9', stroke: 'var(--bg)', 'stroke-width': 2.5 }));
    const map = s('g', {}, s('defs', {}, arcMask), coast, lanka, ...islands, arc, pinA, pinB, seed);
    const labA = box(CHENNAI[0] + 34, CHENNAI[1] - 14, { class: 'mono', style: { fontSize: '18px', color: 'var(--ink)' } }, 'Chennai');
    const labB = box(GN[0] - 200, GN[1] + 36, { class: 'mono', style: { fontSize: '18px', color: 'var(--lime)', width: '260px', textAlign: 'right' } }, 'Great Nicobar');
    const [mx, my] = [(CHENNAI[0] + GN[0]) / 2, CHENNAI[1] - 120 + (GN[1] - CHENNAI[1]) / 2];
    const dist = box(mx - 80, my - 60, { class: 'chip lime', style: { fontSize: '16px' } }, '≈ 1,600 km');
    const same = box(mx - 90, my + 10, { class: 'chip', style: { fontSize: '14px' } }, 'Same variety');
    const bay = box(1180, 560, { class: 'serif', style: { fontSize: '40px', color: 'rgba(243,239,227,0.25)' } }, 'Bay of Bengal');
    const india = box(860, 330, { class: 'mono', style: { fontSize: '16px', color: 'rgba(243,239,227,0.35)' } }, 'India');
    const anda = box(1560, 330, { class: 'mono', style: { fontSize: '14px', color: 'rgba(243,239,227,0.35)', width: '150px', lineHeight: 1.5 } }, 'Andaman & Nicobar Islands');
    const diffs = DIFFS.map((d, i) => box(140, 420 + i * 64, { style: { display: 'flex', alignItems: 'center', gap: '18px' } },
      h('span', { style: { color: 'var(--coral)' } }, neq(30, 'var(--coral)', 2.6)),
      h('span', { class: 'mono', style: { fontSize: '26px', color: 'var(--ink)' } }, d)));
    p1.append(stageSvg(map), bay, india, anda, labA, labB, dist, same, tag, hBoxA, hBoxB, ...diffs);

    // phase 2
    const p2 = box(0, 0, { style: { width: '1920px', height: '1080px' } });
    const tag2 = box(0, 250, { class: 'tag', style: { width: '1920px', justifyContent: 'center' } }, 'Inspired by personalised medicine');
    const m1 = words('Medicine is becoming *personal.*', 'hl');
    const m1Box = box(0, 300, { style: { width: '1920px', textAlign: 'center', fontSize: '96px' } }, m1);
    const m2 = words('_Why not crops?_', 'acc');
    const m2Box = box(0, 420, { style: { width: '1920px', textAlign: 'center', fontSize: '190px' } }, m2);
    const q1 = words('Which cucumber performs well in tropical India?', 'hl');
    const q1Box = box(0, 330, { style: { width: '1920px', textAlign: 'center', fontSize: '52px', fontWeight: 600, color: 'var(--dim)' } }, q1);
    const strike = box(0, 364, { style: { height: '5px', background: 'var(--coral)', transformOrigin: '0 50%' } });
    const q2 = words('What should a cucumber be —', 'hl');
    const q2Box = box(0, 460, { style: { width: '1920px', textAlign: 'center', fontSize: '96px' } }, q2);
    const q3 = words('for _*this* *farm?*_', 'hl');
    const q3Box = box(0, 570, { style: { width: '1920px', textAlign: 'center', fontSize: '150px' } }, q3);
    const cuc = box(1600, 480, { style: { transformOrigin: '50% 50%' } }, crop('cucumber', 300));
    const cuc2 = box(220, 480, { style: { transformOrigin: '50% 50%' } }, crop('cucumber', 300));
    p2.append(tag2, m1Box, m2Box, q1Box, strike, q2Box, q3Box, cuc, cuc2);
    el.append(p1, p2);
    return { root: el, p1, p2, tag, hA, hB, arc, arcDraw, pinA, pinB, seed, islands, coast, lanka, labA, labB, dist, same, bay, india, anda, diffs, map, tag2, m1, m2, q1, q1Box, strike, q2, q3, cuc, cuc2 };
  },
  update(b, c) {
    // phase 1
    O(c.p1, 1 - pr(b, 8.2, 0.5, E.inCubic));
    c.p1.style.display = b < 8.8 ? '' : 'none';
    c.p2.style.display = b >= 8.6 ? '' : 'none';
    O(c.tag, pr(b, 0, 0.4));
    rise(c.hA, b, 0, { stagger: 0.07 });
    rise(c.hB, b, 1, { stagger: 0.09 });
    O(c.coast, pr(b, 0.4, 0.8)); O(c.lanka, pr(b, 0.6, 0.8));
    c.islands.forEach((e, i) => O(e, pr(b, 0.6 + i * 0.06, 0.4)));
    for (const e of [c.bay, c.india, c.anda]) O(e, pr(b, 0.8, 0.8));
    const pa = pr(b, 1.5, 0.5, E.outBack), pb = pr(b, 2.2, 0.5, E.outBack);
    c.pinA.setAttribute('transform', `translate(${CHENNAI[0]} ${CHENNAI[1]}) scale(${pa})`);
    c.pinB.setAttribute('transform', `translate(${GN[0]} ${GN[1]}) scale(${pb})`);
    for (const [pin, st] of [[c.pinA, 1.5], [c.pinB, 2.2]]) {
      const ph = ((b - st) * 0.8) % 1;
      const ring = pin.querySelector('.ring');
      ring.setAttribute('r', 12 + ph * 30);
      ring.style.opacity = b > st ? 1 - ph : 0;
    }
    O(c.labA, pr(b, 1.6, 0.4)); O(c.labB, pr(b, 2.3, 0.4));
    draw(c.arcDraw, pr(b, 2.8, 1.0, E.inOutCubic));
    O(c.dist, pr(b, 3.5, 0.4));
    const sp = pr(b, 3.8, 1.4, E.inOutCubic);
    const L = c.arc.getTotalLength();
    const pt = c.arc.getPointAtLength(sp * L);
    c.seed.setAttribute('transform', `translate(${pt.x} ${pt.y}) rotate(${b * 90})`);
    O(c.seed, b > 3.8 && b < 5.4 ? 1 : 0);
    O(c.same, pr(b, 3.9, 0.4) * (1 - pr(b, 5.6, 0.4)));
    c.diffs.forEach((d, i) => { const p = pr(b, 5 + i * 0.5, 0.5); T(d, { x: (1 - p) * -30, o: p }); });

    // phase 2
    O(c.tag2, pr(b, 8.7, 0.4) * (1 - pr(b, 11.8, 0.3)));
    rise(c.m1, b, 8.7, { stagger: 0.06 });
    rise(c.m2, b, 10.2, { stagger: 0.1, dur: 1 });
    if (b > 11.8) { sink(c.m1, b, 11.8); sink(c.m2, b, 11.8); }
    c.q1Box.style.display = b >= 12 ? '' : 'none';
    rise(c.q1, b, 12.2, { stagger: 0.04 });
    if (!c.sm && b >= 12) {
      const w0 = c.q1._w[0].parentElement, w1 = c.q1._w[c.q1._w.length - 1].parentElement;
      c.sm = true;
      Object.assign(c.strike.style, { left: w0.offsetLeft + 'px', width: w1.offsetLeft + w1.offsetWidth - w0.offsetLeft + 'px' });
    }
    T(c.strike, { sx: pr(b, 13.2, 0.5, E.inOutCubic), o: b > 13.2 ? 1 : 0 });
    O(c.q1Box, 1 - 0.5 * pr(b, 13.6, 0.4));
    rise(c.q2, b, 13.8, { stagger: 0.06 });
    rise(c.q3, b, 14.4, { stagger: 0.1, dur: 1 });
    for (const [cu, dir] of [[c.cuc, 1], [c.cuc2, -1]]) {
      const p = pr(b, 14.6, 1.2, E.outCubic);
      T(cu, { o: p * 0.9, y: (1 - p) * 60, r: dir * (12 + Math.sin(b * 1.5) * 4) });
    }
    exit(c.root, b, 17.6, 0.4);
  },
};

// ───────────────────────── precision crop development ─────────────────────────
const VARS = ['Rainfall history', 'Temperature', 'Humidity', 'Sunlight', 'Soil', 'Nutrients', 'Pest populations', 'Disease patterns', 'Crop performance', 'Yield', 'Fruit quality', 'Planting dates', 'Irrigation'];
export const precision = {
  sfx: [...VARS.map((_, i) => [0.3 + i * 0.22, 'tick', 0.8 + (i % 4) * 0.1]), [3.9, 'suck'], [4.8, 'hit', 0.8], [5.8, 'impact', 0.8], [6, 'riser', 2]],
  build(el) {
    const cv = h('canvas', { width: 1920, height: 1080, class: 'abs', style: { left: 0, top: 0 } });
    const chips = VARS.map((v, i) => {
      const left = i % 2 === 0;
      const row = Math.floor(i / 2);
      const x = left ? 250 : 1370, y = 190 + row * 88;
      const ch = box(x, y, { class: 'chip', style: { fontSize: '17px', width: '300px', justifyContent: left ? 'flex-end' : 'flex-start' } }, v);
      ch._home = { x, y, left };
      return ch;
    });
    const lines = VARS.map(() => s('line', { stroke: 'rgba(200,255,77,0.25)', 'stroke-width': 1.5 }));
    const tag = box(0, 110, { class: 'tag', style: { width: '1920px', justifyContent: 'center' } }, 'Decades of local data → traits for this farm');
    const a = words('Not just precision farming.', 'hl');
    const aBox = box(0, 800, { style: { width: '1920px', textAlign: 'center', fontSize: '46px', fontWeight: 600, color: 'var(--dim)' } }, a);
    const bw = words('Precision *crop development.*', 'hl');
    const bBox = box(0, 860, { style: { width: '1920px', textAlign: 'center', fontSize: '110px' } }, bw);
    el.append(cv, stageSvg(...lines), ...chips, tag, aBox, bBox);
    return { root: el, g: cv.getContext('2d'), chips, lines, tag, a, bw };
  },
  update(b, c) {
    const g = c.g;
    g.clearRect(0, 0, 1920, 1080);
    const glow = pr(b, 4.6, 0.8);
    if (glow > 0) {
      const grd = g.createRadialGradient(960, 460, 0, 960, 460, 420);
      grd.addColorStop(0, `rgba(200,255,77,${0.18 * glow})`);
      grd.addColorStop(1, 'rgba(200,255,77,0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, 1920, 1080);
    }
    helix(g, { cx: 960, cy: 460, height: 560, amp: 110 + glow * 20, phase: b * 1.3, reveal: pr(b, 0, 1.6, E.outCubic), alpha: 0.6 + 0.4 * glow, n: 30 });
    O(c.tag, pr(b, 0.2, 0.5) * (1 - pr(b, 4.4, 0.4)));
    c.chips.forEach((ch, i) => {
      const st = 0.3 + i * 0.22;
      const p = pr(b, st, 0.6);
      const h0 = ch._home;
      const suck = pr(b, 3.9 + i * 0.04, 0.7, E.inExpo);
      const x = lerp(h0.x + (h0.left ? -200 : 200) * (1 - p), 810, suck);
      const y = lerp(h0.y, 440, suck);
      T(ch, { x: x - h0.x, y: y - h0.y, s: 1 - suck * 0.7, o: p * (1 - suck) });
      const ln = c.lines[i];
      const ax = h0.left ? h0.x + 300 : h0.x, ay = h0.y + 18;
      ln.setAttribute('x1', lerp(ax, 960, suck)); ln.setAttribute('y1', lerp(ay, 460, suck));
      ln.setAttribute('x2', 960); ln.setAttribute('y2', 460);
      ln.style.opacity = p * (1 - suck) * 0.8;
    });
    rise(c.a, b, 5, { stagger: 0.04 });
    rise(c.bw, b, 5.8, { stagger: 0.1, dur: 1 });
    exit(c.root, b, 7.7, 0.3);
  },
};
