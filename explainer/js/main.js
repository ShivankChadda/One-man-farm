// Explainer runtime: loads the narration timing, builds every scene once, and
// renders any moment with window.__seek(t). Scenes cross-dissolve into each other.
import { h, clamp, E, pr } from './core.js';
import { Cues } from './core.js';
import { SCENES as MODS } from './scenes/index.js';
import { COMMON_DEFS } from './world.js';

const XF = 0.8; // cross-dissolve length (s)
const FPS = 30;
const $ = (id) => document.getElementById(id);

// gradients/filters live in one always-rendered <defs>: Chrome can't paint from defs inside hidden scenes
document.getElementById('globalDefs').innerHTML = COMMON_DEFS;

const timing = await (await fetch('timing.json', { cache: 'no-store' })).json();
const DURATION = timing.duration;

const built = timing.scenes.map((sc, i) => {
  const el = h('div', { class: 'scene', 'data-id': sc.id });
  el.style.display = 'none';
  el.style.zIndex = String(i + 1);
  $('scenes').append(el);
  const mod = MODS[sc.id];
  if (!mod) throw new Error('missing scene ' + sc.id);
  const cues = Cues(sc);
  const ctx = mod.build(el, cues) || {};
  return { sc, el, mod, cues, ctx, on: false };
});

// captions: split each line into readable chunks, timed by character count
const chunks = [];
for (const sc of timing.scenes) {
  for (const ln of sc.lines) {
    const parts = [];
    for (const sent of ln.text.match(/[^.!?:]+[.!?:]?/g).map((x) => x.trim()).filter(Boolean)) {
      if (sent.length <= 56) { parts.push(sent); continue; }
      const bits = sent.split(/(?<=,)\s+/);
      let cur = '';
      for (const b of bits) {
        if ((cur + ' ' + b).trim().length > 56 && cur) { parts.push(cur.trim()); cur = b; } else cur = (cur + ' ' + b).trim();
      }
      if (cur) {
        if (cur.length > 60) {
          const w = cur.split(' ');
          const mid = Math.ceil(w.length / 2);
          parts.push(w.slice(0, mid).join(' '), w.slice(mid).join(' '));
        } else parts.push(cur);
      }
    }
    const total = parts.reduce((a, p) => a + p.length, 0);
    let t = ln.start;
    for (const p of parts) {
      const d = ((ln.end - ln.start) * p.length) / total;
      chunks.push({ text: p, start: t, end: t + d });
      t += d;
    }
  }
}
const capEl = $('captions').firstElementChild;
let capText = null;
const showCaptions = !new URLSearchParams(location.search).has('nocaptions');
if (!showCaptions) $('captions').style.display = 'none';

function seek(t) {
  for (const b of built) {
    const { start, end } = b.sc;
    const on = t >= start - XF && t < end + 0.001;
    if (on !== b.on) { b.el.style.display = on ? '' : 'none'; b.on = on; }
    if (!on) continue;
    b.el.style.opacity = start === 0 ? 1 : E.inOutCubic(clamp((t - (start - XF)) / XF)).toFixed(3);
    b.mod.update(t - start, b.ctx, b.cues);
  }
  // captions (hold briefly across short gaps)
  const c = chunks.find((k) => t >= k.start - 0.05 && t < k.end + 0.25);
  const txt = c ? c.text : '';
  if (txt !== capText) { capEl.textContent = txt; capText = txt; }
  capEl.style.opacity = c ? Math.min(1, (t - c.start + 0.05) / 0.15).toFixed(3) : 0;
  $('black').style.opacity = (pr(t, DURATION - 1.6, 1.5, E.inOutCubic) + (t < 0.4 ? 1 - t / 0.4 : 0)).toFixed(3);
}

window.__seek = seek;
window.__duration = DURATION;
window.__fps = FPS;
window.__ready = Promise.all(['600 20px "Inter Tight"', '800 20px "Inter Tight"', '900 20px "Inter Tight"', 'italic 400 20px "Instrument Serif"', '500 20px "JetBrains Mono"']
  .map((ff) => document.fonts.load(ff))).then(() => { seek(0); return true; });

// live preview: /explainer/?play  (or ?t=42 to freeze a moment)
const q = new URLSearchParams(location.search);
if (q.has('play') || q.has('t')) {
  const fit = () => {
    const k = Math.min(innerWidth / 1920, innerHeight / 1080);
    $('stage').style.transformOrigin = '0 0';
    $('stage').style.transform = `translate(${(innerWidth - 1920 * k) / 2}px,${(innerHeight - 1080 * k) / 2}px) scale(${k})`;
  };
  addEventListener('resize', fit); fit();
  window.__ready.then(() => {
    if (q.has('t')) { seek(parseFloat(q.get('t'))); return; }
    const audio = new Audio('../build/explainer-soundtrack.wav');
    const t0 = performance.now();
    audio.play().catch(() => {});
    document.body.addEventListener('click', () => { audio.currentTime = 0; audio.play(); });
    const loop = () => { seek(Math.min(audio.duration ? audio.currentTime : (performance.now() - t0) / 1000, DURATION - 0.01)); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  });
}
