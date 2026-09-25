// Animated rigs: people (forward-kinematics skeleton with clothes and props)
// and the machines (harvest robot, drone, under-canopy rover, task bots, tractor).
import { s, clamp } from '../../video/js/lib.js';
import { PAL, f, cucumber } from './world.js';

const D = Math.PI / 180;
const set = (el, a) => { for (const k in a) el.setAttribute(k, typeof a[k] === 'number' ? f(a[k]) : a[k]); };
const line = (el, p, q) => set(el, { x1: p[0], y1: p[1], x2: q[0], y2: q[1] });
const add = (p, v, k = 1) => [p[0] + v[0] * k, p[1] + v[1] * k];
const dirv = (a) => [Math.sin(a), Math.cos(a)]; // 0 = straight down, + = forward

// ───────────────────────── people ─────────────────────────
export const OUTFITS = {
  supervisor: { top: '#dc9e30', topShade: '#c4861f', bottom: '#34495e', bottomShade: '#2c3b4c', hat: 'cap', hatCol: '#2f6f63', hair: 'short' },
  farmerA: { top: '#e9e2cf', topShade: '#cfc6b0', bottom: '#5c6b4a', bottomShade: '#4d5a3d', hat: 'straw', hair: 'short', skin: '#7a4a2e' },
  farmerB: { top: '#c65a4a', topShade: '#a84a3c', bottom: '#2f6f63', bottomShade: '#285f55', dress: 'saree', drape: '#2f6f63', hair: 'bun', hat: 'none', skin: '#8f5a3a' },
  farmerC: { top: '#5b86a8', topShade: '#4c7390', bottom: '#e8e2d2', bottomShade: '#d0c9b7', dress: 'lungi', hat: 'scarfM', hatCol: '#e8e2d2', hair: 'short', skin: '#6f4128' },
  farmerD: { top: '#e3b24a', topShade: '#c99a38', bottom: '#8a3f5a', bottomShade: '#733449', dress: 'saree', drape: '#8a3f5a', hair: 'bun', hat: 'scarf', hatCol: '#8a3f5a', skin: '#8a5638' },
  farmerE: { top: '#7d9a5a', topShade: '#6a844b', bottom: '#3d3a36', bottomShade: '#33302c', hat: 'straw', hair: 'short', skin: '#7d4b30' },
  team: { top: '#5f8fa0', topShade: '#4e7a8a', bottom: '#2f3b48', bottomShade: '#27313c', hat: 'none', hair: 'bun', skin: '#8f5a3a' },
};

export function Person(opts = {}) {
  const o = { skin: '#8a5638', hairCol: '#1c1917', dress: 'trousers', face: true, ...OUTFITS.supervisor, ...opts };
  const skinShade = o.skinShade || '#6f4128';
  const g = s('g', { class: 'person' });
  const mk = (tag, a) => { const e = s(tag, a); g.append(e); return e; };
  const shadow = mk('ellipse', { cx: 0, cy: 3, rx: 58, ry: 10, fill: 'rgba(70,45,20,0.28)' });
  const backProp = mk('g', {});
  const bArmU = mk('line', { stroke: o.topShade, 'stroke-width': 17, 'stroke-linecap': 'round' });
  const bArmF = mk('line', { stroke: skinShade, 'stroke-width': 12, 'stroke-linecap': 'round' });
  const bHand = mk('circle', { r: 7.5, fill: skinShade });
  const bThigh = mk('line', { stroke: o.bottomShade, 'stroke-width': 21, 'stroke-linecap': 'round' });
  const bShin = mk('line', { stroke: o.bottomShade, 'stroke-width': 19, 'stroke-linecap': 'round' });
  const bFoot = mk('line', { stroke: '#2a241f', 'stroke-width': 10, 'stroke-linecap': 'round' });
  const fThigh = mk('line', { stroke: o.bottom, 'stroke-width': 21, 'stroke-linecap': 'round' });
  const fShin = mk('line', { stroke: o.bottom, 'stroke-width': 19, 'stroke-linecap': 'round' });
  const fFoot = mk('line', { stroke: '#2a241f', 'stroke-width': 10, 'stroke-linecap': 'round' });
  const skirt = mk('path', { fill: o.bottom, display: o.dress === 'trousers' ? 'none' : '' });
  const skirtLines = mk('path', { stroke: o.bottomShade, 'stroke-width': 2.5, fill: 'none', display: o.dress === 'trousers' ? 'none' : '' });
  const torso = mk('path', { fill: o.top });
  const torsoShade = mk('path', { fill: o.topShade });
  const drape = mk('path', { fill: o.drape || 'none', display: o.drape ? '' : 'none' });
  const neck = mk('line', { stroke: skinShade, 'stroke-width': 13, 'stroke-linecap': 'round' });
  const head = mk('g', {});
  head.innerHTML = headSvg(o);
  const headProp = mk('g', {});
  const fArmU = mk('line', { stroke: o.top, 'stroke-width': 18, 'stroke-linecap': 'round' });
  const fArmF = mk('line', { stroke: o.skin, 'stroke-width': 12.5, 'stroke-linecap': 'round' });
  const fHand = mk('circle', { r: 8, fill: o.skin });
  const handProp = mk('g', {});
  const frontProp = mk('g', {});

  const L1 = 74, L2 = 72, T = 108, U = 58, F = 54;
  let prop = null;
  function setProp(name) {
    if (name === prop) return;
    prop = name;
    backProp.innerHTML = headProp.innerHTML = handProp.innerHTML = frontProp.innerHTML = '';
    if (name === 'basket') headProp.innerHTML = `<path d="M-40 -6 L40 -6 L30 26 L-30 26 Z" fill="#c9924f"/><path d="M-40 -6 L40 -6" stroke="#a8743a" stroke-width="5"/><path d="M-34 6 H34 M-31 16 H31" stroke="#a8743a" stroke-width="2.5"/><circle cx="-18" cy="-12" r="10" fill="#4a8f35"/><circle cx="2" cy="-14" r="11" fill="#e8412e"/><circle cx="20" cy="-11" r="9" fill="#4a8f35"/><ellipse cx="0" cy="30" rx="16" ry="5" fill="#e8e2d2"/>`;
    if (name === 'sprayer') backProp.innerHTML = `<rect x="-30" y="-44" width="30" height="62" rx="9" fill="#e8e2d2"/><rect x="-30" y="-44" width="30" height="14" rx="7" fill="#cfc6b0"/><rect x="-27" y="-8" width="24" height="5" fill="#3fa7a0"/>`;
    if (name === 'sprayer') handProp.innerHTML = `<path d="M0 0 L62 26" stroke="#3b3b36" stroke-width="4.5" stroke-linecap="round"/><circle cx="64" cy="27" r="4" fill="#3b3b36"/>`;
    if (name === 'hoe') handProp.innerHTML = `<path d="M-30 -40 L58 120" stroke="#8a5b3a" stroke-width="6" stroke-linecap="round"/><path d="M52 112 L78 122 L70 134 L48 124 Z" fill="#6b6f70"/>`;
    if (name === 'tablet') handProp.innerHTML = `<g transform="rotate(-20)"><ellipse cx="4" cy="-6" rx="54" ry="42" fill="url(#softGlow)"/><rect x="-26" y="-26" width="60" height="40" rx="6" fill="#1f2623"/><rect x="-21" y="-21" width="50" height="30" rx="3" fill="url(#screen)"/><path d="M-14 3 L-5 -5 L4 0 L14 -12 L22 -8" stroke="#1f2623" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>`;
    if (name === 'seedling') handProp.innerHTML = `<path d="M0 0 L0 -14" stroke="#4c8f45" stroke-width="3"/><ellipse cx="-6" cy="-16" rx="7" ry="4" fill="#58a957" transform="rotate(-30 -6 -16)"/><ellipse cx="6" cy="-18" rx="7" ry="4" fill="#4b9a4f" transform="rotate(30 6 -18)"/><ellipse cx="0" cy="3" rx="6" ry="4" fill="#8a5a33"/>`;
    if (name === 'sack') backProp.innerHTML = `<path d="M-10 -40 C-44 -44 -52 -8 -40 18 C-24 28 2 20 8 -6 Z" fill="#d8c8a0"/><path d="M-30 -36 C-34 -20 -34 0 -30 14" stroke="#bda97c" stroke-width="3" fill="none"/>`;
    if (name === 'picked') handProp.innerHTML = `<g transform="rotate(-10)">${cucumber(0, -6, 62, 18)}</g>`;
  }

  function headSvg(o) {
    let h = `<circle cx="0" cy="0" r="28" fill="${o.skin}"/>`;
    if (o.hair === 'short') h += `<path d="M-22 4 C-27 18 -20 26 -12 28 C-19 18 -17 10 -10 4 Z" fill="${o.hairCol}"/><path d="M-26 -6 C-24 -30 18 -34 28 -10 C14 -18 -4 -18 -14 -8 Z" fill="${o.hairCol}"/>`;
    if (o.hair === 'bun') h += `<path d="M-28 4 C-32 -26 16 -38 28 -8 C14 -18 -2 -18 -12 -6 C-16 2 -18 12 -24 16 Z" fill="${o.hairCol}"/><circle cx="-28" cy="-4" r="11" fill="${o.hairCol}"/>`;
    if (o.face) h += `<ellipse cx="-8" cy="3" rx="5.5" ry="7.5" fill="${o.skinShade || '#9a6344'}"/><circle cx="17" cy="-2" r="3" fill="#1c1917"/><path d="M28 0 q7 7 0 11" stroke="#6f4128" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M13 15 q8 4 14 -1" stroke="#5a3320" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    if (o.hat === 'cap') h += `<path d="M-29 -8 C-26 -38 20 -42 32 -14 L56 -8 Q38 -1 -29 -6 Z" fill="${o.hatCol}"/><path d="M-29 -8 C-26 -38 -2 -41 12 -37 C-2 -30 -14 -20 -16 -7 Z" fill="rgba(0,0,0,0.12)"/>`;
    if (o.hat === 'straw') h += `<ellipse cx="2" cy="-12" rx="50" ry="10" fill="#e3c27a"/><path d="M-24 -12 C-24 -40 28 -40 28 -12 Z" fill="#d6b066"/><path d="M-24 -16 H28" stroke="#b5553c" stroke-width="4"/>`;
    if (o.hat === 'scarf') h += `<path d="M-32 10 C-36 -34 26 -44 34 -8 C22 -20 0 -22 -10 -12 C-14 4 -18 26 -34 44 C-38 30 -36 20 -32 10 Z" fill="${o.hatCol}"/>`;
    if (o.hat === 'scarfM') h += `<path d="M-30 -2 C-30 -36 26 -40 30 -8 C18 -14 -4 -14 -18 -6 Z" fill="${o.hatCol}"/><path d="M-30 -8 H30" stroke="rgba(0,0,0,0.12)" stroke-width="3"/>`;
    return h;
  }

  // pose: { x, y, dir, sc, bend, tilt, legs:[bt,bk,ft,fk], arms:[bs,be,fs,fe], prop, o }
  function pose(p) {
    const dir = p.dir ?? 1, sc = p.sc ?? 1;
    g.setAttribute('transform', `translate(${f(p.x)} ${f(p.y)}) scale(${f(dir * sc)} ${f(sc)})`);
    g.style.opacity = p.o ?? 1;
    setProp(p.prop || null);
    const [bt, bk, ft, fk] = (p.legs || [0, 0, 0, 0]).map((v) => v * D);
    const legY = (t, k) => L1 * Math.cos(t) + L2 * Math.cos(t + k);
    const hipH = Math.max(legY(bt, bk), legY(ft, fk)) + 6;
    const hip = [0, -hipH];
    const b = (p.bend || 0) * D;
    const up = [Math.sin(b), -Math.cos(b)], rt = [Math.cos(b), Math.sin(b)];
    const sh = add(hip, up, T);
    // legs
    const bKnee = add(add(hip, rt, -6), dirv(bt), L1), bAnk = add(bKnee, dirv(bt + bk), L2);
    const fKnee = add(add(hip, rt, 6), dirv(ft), L1), fAnk = add(fKnee, dirv(ft + fk), L2);
    line(bThigh, add(hip, rt, -6), bKnee); line(bShin, bKnee, bAnk); line(bFoot, [bAnk[0] - 4, bAnk[1] + 1], [bAnk[0] + 14, bAnk[1] + 1]);
    line(fThigh, add(hip, rt, 6), fKnee); line(fShin, fKnee, fAnk); line(fFoot, [fAnk[0] - 4, fAnk[1] + 1], [fAnk[0] + 15, fAnk[1] + 1]);
    set(shadow, { cx: (bAnk[0] + fAnk[0]) / 2 + 4, rx: 44 + Math.abs(fAnk[0] - bAnk[0]) * 0.5 });
    // skirt for saree / lungi
    if (o.dress !== 'trousers') {
      const yb = Math.max(bAnk[1], fAnk[1]) - (o.dress === 'lungi' ? 20 : 2);
      const xl = Math.min(bAnk[0], fAnk[0], hip[0] - 20) - 12, xr = Math.max(bAnk[0], fAnk[0], hip[0] + 20) + 14;
      const hl = add(hip, rt, -21), hr = add(hip, rt, 22);
      set(skirt, { d: `M${f(hl[0])} ${f(hl[1])} L${f(hr[0])} ${f(hr[1])} L${f(xr)} ${f(yb)} Q${f((xl + xr) / 2)} ${f(yb + 5)} ${f(xl)} ${f(yb)} Z` });
      set(skirtLines, { d: `M${f(hip[0] + 4)} ${f(hip[1] + 10)} L${f((xl + xr) / 2 + 6)} ${f(yb)} M${f(hip[0] + 12)} ${f(hip[1] + 10)} L${f(xr - 14)} ${f(yb)}` });
    }
    // torso
    const hem = o.dress === 'trousers' ? 36 : 16;
    const hL = add(add(hip, rt, -19), up, -hem), hR = add(add(hip, rt, 20), up, -hem);
    const sL = add(sh, rt, -20), sR = add(sh, rt, 21), top = add(sh, up, 8);
    set(torso, { d: `M${f(hL[0])} ${f(hL[1])} L${f(sL[0])} ${f(sL[1])} Q${f(top[0])} ${f(top[1])} ${f(sR[0])} ${f(sR[1])} L${f(hR[0])} ${f(hR[1])} Z` });
    const m1 = add(sh, rt, -6), m2 = add(add(hip, rt, -7), up, -hem);
    set(torsoShade, { d: `M${f(hL[0])} ${f(hL[1])} L${f(sL[0])} ${f(sL[1])} Q${f(sh[0] - rt[0] * 12 + up[0] * 6)} ${f(sh[1] + up[1] * 6)} ${f(m1[0])} ${f(m1[1])} L${f(m2[0])} ${f(m2[1])} Z` });
    if (o.drape) {
      const a1 = add(hip, rt, 20), a2 = add(sh, rt, -16), a3 = add(sh, rt, -2), a4 = add(add(hip, rt, 20), up, 26);
      set(drape, { d: `M${f(a1[0])} ${f(a1[1])} L${f(a2[0])} ${f(a2[1])} L${f(a3[0])} ${f(a3[1])} L${f(a4[0])} ${f(a4[1])} Z` });
    }
    // head
    const hb = b + (p.tilt || 0) * D;
    const nk = add(sh, up, 6);
    const hc = add(sh, [Math.sin(hb), -Math.cos(hb)], 38);
    line(neck, nk, add(sh, [Math.sin(hb), -Math.cos(hb)], 18));
    head.setAttribute('transform', `translate(${f(hc[0])} ${f(hc[1])}) rotate(${f(hb / D)})`);
    headProp.setAttribute('transform', `translate(${f(hc[0] + Math.sin(hb) * 36)} ${f(hc[1] - Math.cos(hb) * 36)}) rotate(${f(hb / D)})`);
    // arms (angles in world frame: 0 = down, + = forward)
    const [bs, be, fs, fe] = (p.arms || [0, 10, 0, 10]).map((v) => v * D);
    const bSh = add(sh, rt, -8), fSh = add(sh, rt, 8);
    const bEl = add(bSh, dirv(bs), U), bWr = add(bEl, dirv(bs + be), F);
    const fEl = add(fSh, dirv(fs), U), fWr = add(fEl, dirv(fs + fe), F);
    line(bArmU, bSh, bEl); line(bArmF, bEl, bWr); set(bHand, { cx: bWr[0], cy: bWr[1] });
    line(fArmU, fSh, fEl); line(fArmF, fEl, fWr); set(fHand, { cx: fWr[0], cy: fWr[1] });
    handProp.setAttribute('transform', `translate(${f(fWr[0])} ${f(fWr[1])})${prop === 'hoe' || prop === 'sprayer' ? '' : ` rotate(${f(-(fs + fe) / D + 90)})`}`);
    if (prop === 'tablet' || prop === 'seedling' || prop === 'picked') handProp.setAttribute('transform', `translate(${f(fWr[0])} ${f(fWr[1])})`);
    backProp.setAttribute('transform', `translate(${f(sh[0] - rt[0] * 14)} ${f(sh[1] + 34)}) rotate(${f(b / D)})`);
    return { hip, sh, hand: fWr, backHand: bWr, head: hc };
  }
  return { el: g, pose };
}

// Convenience poses
export const POSES = {
  stand: (x, y, o = {}) => ({ x, y, legs: [-3, 0, 4, 0], arms: [-4, 8, 6, 10], ...o }),
  walk: (x, y, ph, o = {}) => {
    const a = Math.sin(ph), c = Math.cos(ph);
    return {
      x, y,
      legs: [26 * a, -38 * Math.max(0, -c), -26 * a, -38 * Math.max(0, c)],
      arms: [-20 * a, 18, 20 * a, 18],
      bend: 4, ...o,
    };
  },
  bendPick: (x, y, t, o = {}) => ({ x, y, bend: 38 + Math.sin(t * 2.2) * 5, legs: [-8, -22, 14, -26], arms: [40, 30, 70 + Math.sin(t * 3) * 12, 36], tilt: -10, ...o }),
  crouch: (x, y, t, o = {}) => ({ x, y, bend: 34, legs: [62, -86, 82, -96], arms: [56, 14, 74 + Math.sin(t * 3) * 10, 16], tilt: -16, ...o }),
  hoe: (x, y, t, o = {}) => {
    const k = (Math.sin(t * 3.1) + 1) / 2;
    return { x, y, bend: 20 + k * 14, legs: [-12, -10, 16, -14], arms: [30 + k * 30, 40, 50 + k * 30, 20], tilt: -8, prop: 'hoe', ...o };
  },
  spray: (x, y, t, o = {}) => ({ x, y, bend: 6, legs: [-6, 0, 8, -4], arms: [-6, 12, 52 + Math.sin(t * 2) * 10, 30], prop: 'sprayer', ...o }),
  carry: (x, y, ph, o = {}) => ({ ...POSES.walk(x, y, ph), arms: [-12 * Math.sin(ph), 14, 170, 20], bend: 0, prop: 'basket', ...o }),
  tablet: (x, y, t, o = {}) => ({ x, y, legs: [-4, 0, 5, 0], arms: [30, 60, 34, 62], tilt: 12 + Math.sin(t * 0.7) * 3, prop: 'tablet', ...o }),
};

// ───────────────────────── machines ─────────────────────────
export function HarvestBot() {
  const g = s('g', { class: 'harvestbot' });
  g.innerHTML = `
  <ellipse cx="0" cy="6" rx="128" ry="15" fill="rgba(70,45,20,0.3)"/>
  <g class="wheel" transform="translate(-62 -22)"><circle r="25" fill="${PAL.ink}"/><circle r="9" fill="#d9d4c6"/><path d="M-6 -18 L6 -18" stroke="#555" stroke-width="3"/></g>
  <g class="wheel" transform="translate(64 -22)"><circle r="25" fill="${PAL.ink}"/><circle r="9" fill="#d9d4c6"/><path d="M-6 -18 L6 -18" stroke="#555" stroke-width="3"/></g>
  <rect x="-102" y="-82" width="206" height="60" rx="17" fill="${PAL.cream}"/>
  <rect x="-102" y="-46" width="206" height="24" rx="12" fill="${PAL.creamShade}"/>
  <rect x="-102" y="-66" width="206" height="8" fill="${PAL.lime}"/>
  <circle cx="90" cy="-70" r="12" fill="url(#ledGlow)"/><circle cx="90" cy="-70" r="4" fill="#e4ff8a"/>
  <rect x="-90" y="-134" width="92" height="54" rx="4" fill="#c7874a"/>
  <path d="M-90 -116 H2 M-90 -98 H2" stroke="#a86c38" stroke-width="3"/>
  <rect x="-80" y="-146" width="54" height="15" rx="7.5" fill="${PAL.cuke}" transform="rotate(-5 -54 -140)"/>
  <rect x="-44" y="-148" width="50" height="14" rx="7" fill="#44873f" transform="rotate(7 -20 -142)"/>
  <rect x="13" y="-190" width="20" height="114" rx="7" fill="#ebe4d5"/>
  <g class="crate"></g>
  <path d="M44 -104 L150 -104 L142 -82 L52 -82 Z" fill="#c7874a"/><path d="M50 -96 H146" stroke="#f09a7a" stroke-width="5" stroke-linecap="round"/>
  <rect x="26" y="-190" width="7" height="114" rx="3" fill="#fbf8f0"/>
  <rect x="32" y="-164" width="40" height="26" rx="7" fill="${PAL.ink}"/>
  <circle cx="61" cy="-151" r="12" fill="url(#ledGlow)"/><circle class="lens" cx="61" cy="-151" r="6" fill="#bff23a"/>`;
  const mk = (tag, a) => { const e = s(tag, a); g.append(e); return e; };
  const l1 = mk('line', { stroke: PAL.cream, 'stroke-width': 22, 'stroke-linecap': 'round' });
  const l1h = mk('line', { stroke: '#fffdf7', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.9 });
  const l2 = mk('line', { stroke: PAL.cream, 'stroke-width': 17, 'stroke-linecap': 'round' });
  const l2h = mk('line', { stroke: '#fffdf7', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.9 });
  const j1 = mk('g', {}); j1.innerHTML = `<circle r="13" fill="${PAL.ink}"/><circle r="4.5" fill="${PAL.lime}"/>`;
  const j2 = mk('g', {}); j2.innerHTML = j1.innerHTML;
  const held = mk('g', {});
  const grip = mk('g', {});
  grip.innerHTML = `<rect x="-6" y="-14" width="24" height="28" rx="6" fill="${PAL.ink}"/><rect class="fa" x="14" y="-19" width="30" height="7" rx="3" fill="#3d4441"/><rect class="fb" x="14" y="12" width="30" height="7" rx="3" fill="#3d4441"/><rect class="pa" x="30" y="-13" width="12" height="5" rx="2" fill="#f09a7a"/><rect class="pb" x="30" y="8" width="12" height="5" rx="2" fill="#f09a7a"/>`;
  const fa = grip.querySelector('.fa'), fb = grip.querySelector('.fb'), pa = grip.querySelector('.pa'), pb = grip.querySelector('.pb');
  const crate = g.querySelector('.crate');
  const wheels = [...g.querySelectorAll('.wheel')];
  const SH = [22, -190], A = 104, B = 100;
  let crateN = -1, heldOn = null;
  function pose({ x, y, target, open = 1, crate: n = 0, holding = false, holdRot = 0, sc = 1, roll = 0 }) {
    g.setAttribute('transform', `translate(${f(x)} ${f(y)}) scale(${sc})`);
    wheels.forEach((w, i) => w.setAttribute('transform', `translate(${i ? 64 : -62} -22) rotate(${f(roll)})`));
    const tx = (target[0] - x) / sc, ty = (target[1] - y) / sc;
    const dx = tx - SH[0], dy = ty - SH[1];
    const d = Math.min(Math.hypot(dx, dy), A + B - 1);
    const a = Math.atan2(dy, dx);
    const al = Math.acos(clamp((A * A + d * d - B * B) / (2 * A * d), -1, 1));
    const el = [SH[0] + A * Math.cos(a - al), SH[1] + A * Math.sin(a - al)];
    const wr = [SH[0] + d * Math.cos(a), SH[1] + d * Math.sin(a)];
    line(l1, SH, el); line(l1h, [SH[0] + 4, SH[1]], [el[0] + 4, el[1]]); line(l2, el, wr); line(l2h, [el[0] + 3, el[1] - 2], [wr[0] + 3, wr[1] - 2]);
    j1.setAttribute('transform', `translate(${f(SH[0])} ${f(SH[1])})`);
    j2.setAttribute('transform', `translate(${f(el[0])} ${f(el[1])})`);
    const ang = Math.atan2(wr[1] - el[1], wr[0] - el[0]) / D;
    grip.setAttribute('transform', `translate(${f(wr[0])} ${f(wr[1])}) rotate(${f(ang)})`);
    const gap = 4 + open * 12;
    set(fa, { y: -gap - 7 }); set(fb, { y: gap }); set(pa, { y: -gap - 1 }); set(pb, { y: gap - 4 });
    if (holding !== heldOn) { held.innerHTML = holding ? cucumber(0, -2, 90, 26) : ''; heldOn = holding; }
    held.setAttribute('transform', `translate(${f(wr[0] + Math.cos(ang * D) * 30)} ${f(wr[1] + Math.sin(ang * D) * 30)}) rotate(${f(holdRot)})`);
    if (n !== crateN) {
      crateN = n;
      crate.innerHTML = Array.from({ length: Math.min(n, 3) }, (_, k) => `<rect x="${54 + k * 8}" y="${-116 - k * 10}" width="84" height="16" rx="8" fill="${k % 2 ? '#44873f' : PAL.cuke}" stroke="#a9d77a" stroke-width="1.5" transform="rotate(${k % 2 ? 3 : -3} 96 ${-108 - k * 10})"/>`).join('');
    }
    return { wrist: [x + wr[0] * sc, y + wr[1] * sc], ang, tip: [x + (wr[0] + Math.cos(ang * D) * 30) * sc, y + (wr[1] + Math.sin(ang * D) * 30) * sc], lens: [x + 61 * sc, y - 151 * sc] };
  }
  return { el: g, pose };
}

export function Drone() {
  const g = s('g', { class: 'drone' });
  g.innerHTML = `
  <ellipse class="rb" cx="-66" cy="-32" rx="40" ry="5" fill="rgba(255,255,255,0.45)" stroke="rgba(60,60,60,0.18)"/>
  <ellipse class="rb" cx="66" cy="-32" rx="40" ry="5" fill="rgba(255,255,255,0.45)" stroke="rgba(60,60,60,0.18)"/>
  <path d="M-36 -6 L-66 -28 M36 -6 L66 -28" stroke="${PAL.ink}" stroke-width="5" stroke-linecap="round"/>
  <path d="M-40 -2 L-96 -22 M40 -2 L96 -22" stroke="${PAL.ink}" stroke-width="6" stroke-linecap="round"/>
  <rect x="-100" y="-30" width="8" height="10" fill="${PAL.ink}"/><rect x="92" y="-30" width="8" height="10" fill="${PAL.ink}"/>
  <ellipse class="rf" cx="-96" cy="-30" rx="48" ry="6" fill="rgba(255,255,255,0.62)" stroke="rgba(60,60,60,0.22)"/>
  <ellipse class="rf" cx="96" cy="-30" rx="48" ry="6" fill="rgba(255,255,255,0.62)" stroke="rgba(60,60,60,0.22)"/>
  <rect x="-58" y="-16" width="116" height="30" rx="13" fill="${PAL.cream}"/>
  <rect x="-58" y="2" width="116" height="12" rx="6" fill="${PAL.creamShade}"/>
  <rect x="-24" y="12" width="48" height="22" rx="7" fill="#cfd8d4"/>
  <path d="M-72 40 L72 40" stroke="${PAL.ink}" stroke-width="4" stroke-linecap="round"/>
  <path d="M-8 34 L-8 40 M8 34 L8 40" stroke="${PAL.ink}" stroke-width="3"/>
  ${[-60, -30, 0, 30, 60].map((x) => `<rect x="${x - 3}" y="40" width="6" height="6" fill="${PAL.ink}"/>`).join('')}
  <circle cx="46" cy="-4" r="10" fill="url(#ledGlow)"/><circle cx="46" cy="-4" r="3.5" fill="#e4ff8a"/>`;
  const rotors = [...g.querySelectorAll('.rf,.rb')];
  function pose({ x, y, tilt = 0, t = 0, sc = 1 }) {
    g.setAttribute('transform', `translate(${f(x)} ${f(y)}) rotate(${f(tilt)}) scale(${sc})`);
    rotors.forEach((r, i) => r.setAttribute('rx', f(28 + Math.abs(Math.sin(t * 37 + i * 1.3)) * 22)));
  }
  return { el: g, pose };
}

export function Rover({ tool = 'spray' } = {}) {
  const g = s('g', { class: 'rover' });
  g.innerHTML = `
  <ellipse cx="0" cy="5" rx="104" ry="12" fill="rgba(70,45,20,0.28)"/>
  <g class="wheel" transform="translate(-52 -20)"><circle r="21" fill="${PAL.ink}"/><circle r="8" fill="#d9d4c6"/><path d="M-5 -15 L5 -15" stroke="#555" stroke-width="3"/></g>
  <g class="wheel" transform="translate(52 -20)"><circle r="21" fill="${PAL.ink}"/><circle r="8" fill="#d9d4c6"/><path d="M-5 -15 L5 -15" stroke="#555" stroke-width="3"/></g>
  <rect x="-86" y="-66" width="172" height="46" rx="14" fill="${PAL.cream}"/>
  <rect x="-86" y="-38" width="172" height="18" rx="9" fill="${PAL.creamShade}"/>
  <rect x="-86" y="-52" width="172" height="7" fill="${PAL.lime}"/>
  <rect x="-70" y="-86" width="46" height="22" rx="6" fill="#cfd8d4"/>
  <rect x="20" y="-104" width="12" height="40" fill="#ebe4d5"/>
  <rect x="10" y="-122" width="40" height="22" rx="6" fill="${PAL.ink}"/>
  <circle cx="40" cy="-111" r="11" fill="url(#ledGlow)"/><circle cx="40" cy="-111" r="5" fill="#bff23a"/>
  <path d="M-30 -86 L-30 -100 L-8 -112" stroke="${PAL.ink}" stroke-width="5" fill="none" stroke-linecap="round"/>
  <circle cx="-6" cy="-113" r="5" fill="${PAL.ink}"/>`;
  const wheels = [...g.querySelectorAll('.wheel')];
  function pose({ x, y, sc = 1, roll = 0, dir = 1 }) {
    g.setAttribute('transform', `translate(${f(x)} ${f(y)}) scale(${f(sc * dir)} ${f(sc)})`);
    wheels.forEach((w, i) => w.setAttribute('transform', `translate(${i ? 52 : -52} -20) rotate(${f(roll)})`));
    return { cam: [x + 40 * sc * dir, y - 111 * sc], nozzle: [x - 6 * sc * dir, y - 113 * sc] };
  }
  return { el: g, pose };
}

// Small single-task bots sharing one chassis
export function Bot(kind) {
  const g = s('g', { class: 'bot ' + kind });
  let tool = '';
  if (kind === 'weeder') tool = `<g class="tool" transform="translate(70 -14)"><circle r="18" fill="none" stroke="${PAL.ink}" stroke-width="4"/>${[0, 60, 120].map((a) => `<path d="M0 0 L0 -18" stroke="${PAL.ink}" stroke-width="4" transform="rotate(${a})"/>`).join('')}</g><path d="M52 -40 L66 -16" stroke="${PAL.ink}" stroke-width="5"/>`;
  if (kind === 'pruner') tool = `<path class="arm" d="M20 -60 L40 -120 L78 -150" stroke="${PAL.cream}" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/><g class="tool" transform="translate(80 -152)"><path class="ba" d="M0 0 L22 -8" stroke="${PAL.ink}" stroke-width="5" stroke-linecap="round"/><path class="bb" d="M0 0 L22 8" stroke="${PAL.ink}" stroke-width="5" stroke-linecap="round"/><circle r="5" fill="${PAL.lime}"/></g>`;
  if (kind === 'trainer') tool = `<path class="arm" d="M20 -60 L30 -150 L60 -190" stroke="${PAL.cream}" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/><g class="tool" transform="translate(62 -192)"><rect x="-6" y="-8" width="16" height="16" rx="4" fill="${PAL.ink}"/><circle cx="12" cy="0" r="5" fill="${PAL.lime}"/></g>`;
  if (kind === 'inspector') tool = `<rect x="16" y="-230" width="10" height="170" fill="#ebe4d5"/><g class="tool" transform="translate(21 -236)"><rect x="-22" y="-14" width="44" height="28" rx="8" fill="${PAL.ink}"/><circle cx="12" cy="0" r="10" fill="url(#ledGlow)"/><circle cx="12" cy="0" r="5" fill="#bff23a"/></g>`;
  if (kind === 'cart') tool = `<rect x="-70" y="-100" width="62" height="40" rx="3" fill="#c7874a"/><rect x="-2" y="-100" width="62" height="40" rx="3" fill="#b97a40"/><path d="M-70 -86 H-8 M-2 -86 H60" stroke="#a86c38" stroke-width="3"/><circle cx="-54" cy="-104" r="9" fill="#4a8f35"/><circle cx="-36" cy="-106" r="9" fill="#e8412e"/><circle cx="-20" cy="-103" r="9" fill="#4a8f35"/><circle cx="12" cy="-104" r="9" fill="#f2a33a"/><circle cx="30" cy="-106" r="9" fill="#4a8f35"/><circle cx="46" cy="-103" r="9" fill="#e8412e"/>`;
  g.innerHTML = `
  <ellipse cx="0" cy="5" rx="92" ry="11" fill="rgba(70,45,20,0.28)"/>
  <g class="wheel" transform="translate(-44 -18)"><circle r="19" fill="${PAL.ink}"/><circle r="7" fill="#d9d4c6"/><path d="M-5 -13 L5 -13" stroke="#555" stroke-width="3"/></g>
  <g class="wheel" transform="translate(44 -18)"><circle r="19" fill="${PAL.ink}"/><circle r="7" fill="#d9d4c6"/><path d="M-5 -13 L5 -13" stroke="#555" stroke-width="3"/></g>
  <rect x="-76" y="-62" width="152" height="44" rx="14" fill="${PAL.cream}"/>
  <rect x="-76" y="-36" width="152" height="18" rx="9" fill="${PAL.creamShade}"/>
  <rect x="-76" y="-50" width="152" height="7" fill="${PAL.lime}"/>
  <circle cx="62" cy="-54" r="9" fill="url(#ledGlow)"/><circle cx="62" cy="-54" r="3" fill="#e4ff8a"/>
  ${tool}`;
  const wheels = [...g.querySelectorAll('.wheel')];
  const toolEl = g.querySelector('.tool');
  const ba = g.querySelector('.ba'), bb = g.querySelector('.bb');
  function pose({ x, y, sc = 1, dir = 1, roll = 0, t = 0, o = 1 }) {
    g.setAttribute('transform', `translate(${f(x)} ${f(y)}) scale(${f(sc * dir)} ${f(sc)})`);
    g.style.opacity = o;
    wheels.forEach((w, i) => w.setAttribute('transform', `translate(${i ? 44 : -44} -18) rotate(${f(roll)})`));
    if (kind === 'weeder') toolEl.setAttribute('transform', `translate(70 -14) rotate(${f(t * 400)})`);
    if (kind === 'pruner') { const k = Math.abs(Math.sin(t * 5)) * 14; ba.setAttribute('transform', `rotate(${f(-k)})`); bb.setAttribute('transform', `rotate(${f(k)})`); }
    if (kind === 'inspector') toolEl.setAttribute('transform', `translate(21 -236) rotate(${f(Math.sin(t * 1.2) * 12)})`);
  }
  return { el: g, pose };
}

// Big conventional tractor, side view
export function Tractor({ col = '#c8553d', shade = '#a8432f' } = {}) {
  const g = s('g', { class: 'tractor' });
  g.innerHTML = `
  <ellipse cx="0" cy="8" rx="260" ry="22" fill="rgba(60,40,20,0.3)"/>
  <rect x="-330" y="-60" width="120" height="40" rx="6" fill="#6b6f70"/>
  ${[0, 1, 2, 3, 4, 5].map((k) => `<path d="M${-322 + k * 20} -20 l-6 24" stroke="#4d5152" stroke-width="5"/>`).join('')}
  <path d="M-214 -44 L-150 -44" stroke="#4d5152" stroke-width="8"/>
  <rect x="-150" y="-230" width="150" height="150" rx="10" fill="${shade}"/>
  <rect x="-140" y="-220" width="130" height="80" rx="6" fill="#a9d4d6"/>
  <path d="M-140 -140 L-10 -220" stroke="#e6f5f5" stroke-width="5" opacity="0.6"/>
  <rect x="-160" y="-238" width="170" height="14" rx="5" fill="${col}"/>
  <path d="M0 -150 L200 -130 L210 -60 L0 -60 Z" fill="${col}"/>
  <path d="M0 -150 L200 -130 L202 -118 L0 -136 Z" fill="#e0735c"/>
  ${[0, 1, 2, 3].map((k) => `<path d="M${150 + k * 12} -120 v40" stroke="${shade}" stroke-width="4"/>`).join('')}
  <rect x="130" y="-200" width="12" height="60" rx="4" fill="#3b3b36"/>
  <g class="rw" transform="translate(-80 -95)"><circle r="95" fill="#2a2e2c"/><circle r="70" fill="#3b403e"/><circle r="36" fill="#e2c35a"/><circle r="10" fill="#2a2e2c"/>${Array.from({ length: 16 }, (_, k) => `<rect x="-8" y="-104" width="16" height="16" fill="#2a2e2c" transform="rotate(${k * 22.5})"/>`).join('')}</g>
  <g class="fw" transform="translate(160 -50)"><circle r="50" fill="#2a2e2c"/><circle r="34" fill="#3b403e"/><circle r="18" fill="#e2c35a"/>${Array.from({ length: 10 }, (_, k) => `<rect x="-5" y="-56" width="10" height="10" fill="#2a2e2c" transform="rotate(${k * 36})"/>`).join('')}</g>`;
  const rw = g.querySelector('.rw'), fw = g.querySelector('.fw');
  function pose({ x, y, sc = 1, roll = 0, dir = 1, shake = 0 }) {
    g.setAttribute('transform', `translate(${f(x)} ${f(y + shake)}) scale(${f(sc * dir)} ${f(sc)})`);
    rw.setAttribute('transform', `translate(-80 -95) rotate(${f(roll)})`);
    fw.setAttribute('transform', `translate(160 -50) rotate(${f(roll * 1.9)})`);
  }
  return { el: g, pose };
}
