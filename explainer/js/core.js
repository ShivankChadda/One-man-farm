// Shared helpers for explainer scenes: camera, labels, narration cues.
import { h, s, clamp, lerp, E, pr } from '../../video/js/lib.js';
export { h, s, clamp, lerp, E, pr };
export { rng, hash } from '../../video/js/lib.js';

// Camera: world point (x, y) at screen centre, zoom z
export function Camera(g) {
  let st = { x: 960, y: 540, z: 1 };
  return {
    set(x, y, z = 1) {
      st = { x, y, z };
      g.setAttribute('transform', `translate(960 540) scale(${z.toFixed(4)}) translate(${(-x).toFixed(2)} ${(-y).toFixed(2)})`);
    },
    toScreen([wx, wy]) { return [(wx - st.x) * st.z + 960, (wy - st.y) * st.z + 540]; },
    get state() { return st; },
  };
}

// Keyframed camera path: keys = [[t, x, y, z], ...], eased between keys
export function camPath(keys, t, ease = E.inOutCubic) {
  if (t <= keys[0][0]) return keys[0].slice(1);
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, ...a] = keys[i - 1], [t1, ...b] = keys[i];
      const u = ease((t - t0) / (t1 - t0));
      return a.map((v, k) => lerp(v, b[k], u));
    }
  }
  return keys[keys.length - 1].slice(1);
}

// A pill label that pops in at `t0` and (optionally) out at `t1`
export function Label(text, { dot = true, cls = '' } = {}) {
  const el = h('div', { class: 'label ' + cls }, dot ? h('i') : null, text);
  return {
    el,
    at([x, y], t, t0, t1 = 1e9, { anchor = 'bottom' } = {}) {
      const p = pr(t, t0, 0.45, E.outBack), q = pr(t, t1, 0.35, E.inCubic);
      const vis = t >= t0 && q < 1;
      el.style.display = vis ? '' : 'none';
      if (!vis) return;
      const tx = anchor === 'left' ? '0%' : anchor === 'right' ? '-100%' : '-50%';
      const ty = anchor === 'bottom' ? '-100%' : '-50%';
      el.style.transformOrigin = anchor === 'bottom' ? '50% 100%' : '50% 50%';
      el.style.left = x.toFixed(1) + 'px';
      el.style.top = y.toFixed(1) + 'px';
      el.style.transform = `translate(${tx}, ${ty}) scale(${(0.6 + 0.4 * p) * (1 - 0.2 * q)})`;
      el.style.opacity = (Math.min(1, (t - t0) * 5) * (1 - q)).toFixed(3);
    },
  };
}

// Narration cues for one scene, in scene-local seconds
export function Cues(scene) {
  const lines = Object.fromEntries(scene.lines.map((l) => [l.id, { ...l, start: l.start - scene.start, end: l.end - scene.start }]));
  return {
    dur: scene.end - scene.start,
    line: (id) => lines[id],
    // time a word starts, estimated from its character position within the line
    word(id, needle, occurrence = 0) {
      const l = lines[id];
      let idx = -1;
      for (let k = 0; k <= occurrence; k++) idx = l.text.toLowerCase().indexOf(needle.toLowerCase(), idx + 1);
      if (idx < 0) throw new Error(`word "${needle}" not in ${id}`);
      return l.start + (l.end - l.start) * (idx / l.text.length);
    },
  };
}

// Stage-sized SVG with a camera group
export function stage(el) {
  const svg = s('svg', { width: 1920, height: 1080, viewBox: '0 0 1920 1080', class: 'art' });
  const cam = s('g', { class: 'cam' });
  svg.append(cam);
  const ui = h('div', { class: 'ui' });
  el.append(svg, ui);
  return { svg, cam, ui, camera: Camera(cam) };
}

// Rising data motes (lime squares) from a source point
export function motes(n, seed = 1) {
  const g = s('g', { class: 'motes' });
  const els = Array.from({ length: n }, () => { const e = s('rect', { width: 7, height: 7, rx: 1.5, fill: '#c8ff4d' }); g.append(e); return e; });
  return {
    el: g,
    run(t, [x, y], { on = 1, speed = 60, height = 220, spread = 14, target = null } = {}) {
      els.forEach((e, i) => {
        const ph = ((t * speed) / height + i / n + seed * 0.37) % 1;
        let px = x + Math.sin(i * 2.3 + t * 1.3) * spread * (0.4 + ph), py = y - ph * height;
        if (target) { px = lerp(x, target[0], ph) + Math.sin(i * 2.3 + t) * spread * (1 - ph); py = lerp(y, target[1], ph) - Math.sin(ph * Math.PI) * 60; }
        e.setAttribute('x', (px - 3.5).toFixed(1));
        e.setAttribute('y', (py - 3.5).toFixed(1));
        e.style.opacity = (on * Math.sin(ph * Math.PI) * 0.95).toFixed(3);
      });
    },
  };
}
