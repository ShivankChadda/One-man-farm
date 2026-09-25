import { SCENES, BEAT, DURATION, FPS } from './timeline.js';
import { h, O, clamp, hash, mark, pr, E } from './lib.js';
import { MODS } from './scenes/index.js';

const $ = (id) => document.getElementById(id);
const camera = $('camera');
const layer = $('scenes');
const flash = $('flash');
const grain = $('grain');
const black = $('black');
const grid = $('grid');
const glow = $('glow');

// ---------- scenes ----------
const built = SCENES.map((def) => {
  const el = h('div', { class: 'scene', 'data-id': def.id });
  el.style.display = 'none';
  layer.append(el);
  const mod = MODS[def.type];
  if (!mod) throw new Error('missing scene module: ' + def.type);
  const ctx = mod.build(el, def) || {};
  return { def, el, mod, ctx, on: false };
});

// Impacts (for camera shake + flashes) come straight from the scenes' sfx cues
const impacts = [];
for (const { def, mod } of built) {
  const cues = typeof mod.sfx === 'function' ? mod.sfx(def) : mod.sfx || [];
  for (const [b, kind, amt = 1] of cues) {
    if (kind === 'impact' || kind === 'slam' || kind === 'stamp') {
      impacts.push({ t: def.start + b * BEAT, amt: kind === 'impact' ? 1.4 * amt : kind === 'stamp' ? 0.6 * amt : amt });
    }
  }
}

// ---------- film grain ----------
const tiles = [];
for (let k = 0; k < 6; k++) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const img = g.createImageData(256, 256);
  let seed = 1234 + k * 999;
  for (let i = 0; i < img.data.length; i += 4) {
    seed = (seed * 16807) % 2147483647;
    const v = seed % 256;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  tiles.push(`url(${c.toDataURL()})`);
}

// ---------- HUD ----------
const hud = $('hud');
const hudBrand = h('div', { class: 'abs brand', style: { left: '60px', top: '46px' } }, mark(26), h('span', {}, 'The Farmers of Great Nicobar'));
const hudChapter = h('div', { class: 'abs', style: { right: '60px', top: '50px', color: 'var(--ink)' } });
const hudCoords = h('div', { class: 'abs', style: { left: '60px', bottom: '54px' } }, '07°00′N  093°56′E  ·  Great Nicobar');
const hudTc = h('div', { class: 'abs', style: { right: '60px', bottom: '54px' } });
const hudBar = h('i');
hud.append(hudBrand, hudChapter, hudCoords, hudTc, h('div', { class: 'bar' }, hudBar));
for (const [x, y, bw] of [['left:34px', 'top:30px', 'border-left-width:2px;border-top-width:2px'],
  ['right:34px', 'top:30px', 'border-right-width:2px;border-top-width:2px'],
  ['left:34px', 'bottom:30px', 'border-left-width:2px;border-bottom-width:2px'],
  ['right:34px', 'bottom:30px', 'border-right-width:2px;border-bottom-width:2px']]) {
  hud.append(h('div', { class: 'corner', style: `${x};${y};${bw}` }));
}
const hudStart = SCENES.find((s) => s.id === 'notone').start;
const hudEnd = SCENES.find((s) => s.id === 'outro').start;
let lastChapter = '';

function pad(n, l = 2) { return String(Math.floor(n)).padStart(l, '0'); }

// ---------- seek ----------
function seek(t) {
  const frame = Math.round(t * FPS);

  let active = null;
  for (const sc of built) {
    const on = t >= sc.def.start && t < sc.def.end;
    if (on !== sc.on) { sc.el.style.display = on ? '' : 'none'; sc.on = on; }
    if (on) { active = sc; sc.mod.update((t - sc.def.start) / BEAT, sc.ctx, sc.def); }
  }

  // camera shake from impacts
  let sx = 0, sy = 0, fl = 0;
  for (const im of impacts) {
    const dt = t - im.t;
    if (dt < 0 || dt > 0.45) continue;
    const k = Math.exp(-dt * 11) * im.amt;
    sx += (hash(frame * 3.1 + im.t) - 0.5) * 22 * k;
    sy += (hash(frame * 7.7 + im.t) - 0.5) * 22 * k;
  }
  camera.style.transform = `translate(${sx.toFixed(2)}px,${sy.toFixed(2)}px)`;

  // flash on scene cuts that ask for it
  if (active && active.def.flash !== false && active.def.id !== 'cold') {
    const dt = t - active.def.start;
    fl = dt < 0.12 ? (active.def.type === 'chapter' ? 0.9 : 0.12) * (1 - dt / 0.12) : 0;
  }
  O(flash, fl);

  // background grid drifts, glow breathes
  grid.style.backgroundPosition = `${(-1 - t * 6) % 120}px ${(-1 - t * 3) % 120}px`;
  O(grid, active && active.ctx.grid !== undefined ? active.ctx.grid : 1);
  O(glow, 0.7 + 0.3 * Math.sin(t * 0.8));

  // grain: a static dither texture (animated grain costs ~4x the bitrate)
  if (!grain.style.backgroundImage) grain.style.backgroundImage = tiles[0];

  // HUD
  const hv = clamp((t - hudStart) / 0.4) * (1 - clamp((t - hudEnd + 0.3) / 0.3));
  O(hud, hv);
  // derived from the timeline alone, so parallel render workers agree
  const d = active && active.def;
  const ch = !d ? lastChapter : d.chapter || (d.type === 'chapter' ? `${d.n} / ${d.title.replace(' / ', ' ').replace(/\.$/, '')}` : '');
  if (ch !== lastChapter) { hudChapter.innerHTML = ''; hudChapter.append(h('span', { class: 'rec' }), ch); lastChapter = ch; }
  const f = frame % FPS;
  hudTc.textContent = `${pad(t / 60)}:${pad(t % 60)}:${pad(f)}  ·  ${pad(frame, 5)}`;
  hudBar.style.width = ((t / DURATION) * 100).toFixed(3) + '%';

  // final fade
  O(black, pr(t, DURATION - 1.2, 1.1, E.inOutCubic));
}

window.__seek = seek;
window.__duration = DURATION;
window.__fps = FPS;

const fontsReady = Promise.all([
  '400 20px "Inter Tight"', '500 20px "Inter Tight"', '600 20px "Inter Tight"', '700 20px "Inter Tight"',
  '800 20px "Inter Tight"', '900 20px "Inter Tight"', 'italic 400 20px "Instrument Serif"',
  '400 20px "Instrument Serif"', '400 20px "JetBrains Mono"', '500 20px "JetBrains Mono"', '700 20px "JetBrains Mono"',
].map((f) => document.fonts.load(f)));

window.__ready = fontsReady.then(() => document.fonts.ready).then(() => { seek(0); return true; });

// ---------- preview player (open /video/?play) ----------
const params = new URLSearchParams(location.search);
if (params.has('play') || params.has('t')) {
  const fit = () => {
    const k = Math.min(innerWidth / 1920, innerHeight / 1080);
    const st = $('stage');
    st.style.transformOrigin = '0 0';
    st.style.transform = `translate(${(innerWidth - 1920 * k) / 2}px,${(innerHeight - 1080 * k) / 2}px) scale(${k})`;
  };
  addEventListener('resize', fit); fit();
  window.__ready.then(() => {
    if (params.has('t')) { seek(parseFloat(params.get('t'))); return; }
    const audio = new Audio('../build/soundtrack.wav');
    let t0 = null;
    const go = () => { audio.currentTime = 0; audio.play().catch(() => {}); t0 = performance.now(); };
    document.body.addEventListener('click', go);
    go();
    const loop = () => {
      const t = audio.paused || !audio.duration ? (performance.now() - t0) / 1000 : audio.currentTime;
      seek(Math.min(t, DURATION - 1e-3));
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
}
