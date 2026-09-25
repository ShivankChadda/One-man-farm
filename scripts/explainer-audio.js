// Soundtrack for the animated explainer: narration + a warm 90 BPM score
// (pad, marimba, bass, light percussion) that ducks under the voice, plus
// sound design cued from the same narration timing the animation uses.
// Writes build/explainer-soundtrack.wav (48 kHz stereo).
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './server.js';
import { Cues } from '../explainer/js/core.js';
import { pr, E, lerp } from '../video/js/lib.js';

const SR = 48000;
const TAU = Math.PI * 2;
const timing = JSON.parse(fs.readFileSync(path.join(ROOT, 'explainer', 'timing.json'), 'utf8'));
const DUR = timing.duration;
const N = Math.ceil((DUR + 1) * SR);
const S = (t) => Math.round(t * SR);
const bus = () => [new Float32Array(N), new Float32Array(N)];
const MUSIC = bus(), FX = bus(), VERB = bus(), VO = new Float32Array(N);

let seed = 777;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const noise = () => rnd() * 2 - 1;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const panLR = (p) => [Math.cos(((p + 1) * Math.PI) / 4), Math.sin(((p + 1) * Math.PI) / 4)];
function addP(b, i, v, p = 0) { if (i < 0 || i >= N) return; const [l, r] = panLR(p); b[0][i] += v * l; b[1][i] += v * r; }

class Biquad {
  constructor(type, f, q = 0.707) { this.x1 = this.x2 = this.y1 = this.y2 = 0; this.set(type, f, q); }
  set(type, f, q = 0.707) {
    f = Math.min(Math.max(f, 10), SR * 0.45);
    const w = (TAU * f) / SR, cs = Math.cos(w), sn = Math.sin(w), al = sn / (2 * q);
    let b0, b1, b2;
    const a0 = 1 + al;
    if (type === 'lp') { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = b0; }
    else if (type === 'hp') { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = b0; }
    else { b0 = al; b1 = 0; b2 = -al; }
    this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0; this.a1 = (-2 * cs) / a0; this.a2 = (1 - al) / a0;
    return this;
  }
  run(x) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y;
    return y;
  }
}

// ───────── narration ─────────
function readWav(file) {
  const b = fs.readFileSync(file);
  let o = 12, fmt = null, data = null;
  while (o < b.length) {
    const id = b.toString('ascii', o, o + 4), sz = b.readUInt32LE(o + 4);
    if (id === 'fmt ') fmt = { ch: b.readUInt16LE(o + 10), sr: b.readUInt32LE(o + 12), bits: b.readUInt16LE(o + 22) };
    if (id === 'data') data = b.subarray(o + 8, o + 8 + sz);
    o += 8 + sz + (sz % 2);
  }
  const n = data.length / (fmt.bits / 8) / fmt.ch;
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = data.readInt16LE(i * 2 * fmt.ch) / 32768;
  return { x, sr: fmt.sr };
}
for (const sc of timing.scenes) for (const ln of sc.lines) {
  const { x, sr } = readWav(path.join(ROOT, 'explainer', 'vo', ln.id + '.wav'));
  const i0 = S(ln.start), k = sr / SR;
  const n = Math.floor(x.length / k);
  for (let i = 0; i < n; i++) {
    const p = i * k, j = Math.floor(p), fr = p - j;
    const v = x[j] * (1 - fr) + (x[j + 1] ?? 0) * fr;
    if (i0 + i < N) VO[i0 + i] += v;
  }
}
// gentle voice EQ: remove rumble, touch of presence
{
  const hp = new Biquad('hp', 80, 0.7), pk = new Biquad('bp', 3200, 1.0);
  for (let i = 0; i < N; i++) { const y = hp.run(VO[i]); VO[i] = y + pk.run(y) * 0.25; }
}
// ducking envelope from the voice
const duck = new Float32Array(N);
{
  let env = 0;
  const att = Math.exp(-1 / (0.03 * SR)), rel = Math.exp(-1 / (0.45 * SR));
  for (let i = 0; i < N; i++) {
    const a = Math.abs(VO[i]);
    env = a > env ? att * env + (1 - att) * a : rel * env + (1 - rel) * a;
    duck[i] = 1 - 0.55 * Math.min(1, env * 9);
  }
}

// ───────── instruments ─────────
function pad(t, dur, notes, vel = 1, cut = 1400) {
  const i0 = S(t), len = S(dur + 1.6);
  notes.forEach((m, n) => {
    const fs_ = [-7, 0, 7].map((c) => mtof(m) * Math.pow(2, c / 1200));
    const ph = fs_.map(() => rnd());
    const lpL = new Biquad('lp', cut, 0.6), lpR = new Biquad('lp', cut, 0.6);
    for (let i = 0; i < len; i++) {
      const tt = i / SR;
      const env = Math.min(1, tt / 0.9) * (tt > dur ? Math.exp(-(tt - dur) * 2.2) : 1);
      let l = 0, r = 0;
      fs_.forEach((fr, k) => {
        ph[k] += fr / SR; if (ph[k] > 1) ph[k] -= 1;
        const saw = 2 * ph[k] - 1, tri = 1 - 4 * Math.abs(ph[k] - 0.5);
        const v = saw * 0.35 + tri * 0.65;
        const [pl, pr_] = panLR((k - 1) * 0.6 * (n % 2 ? -1 : 1));
        l += v * pl; r += v * pr_;
      });
      const g = env * 0.028 * vel;
      const L = lpL.run(l) * g, R = lpR.run(r) * g;
      MUSIC[0][i0 + i] += L; MUSIC[1][i0 + i] += R;
      if (i0 + i < N) { VERB[0][i0 + i] += L * 0.5; VERB[1][i0 + i] += R * 0.5; }
    }
  });
}
function marimba(t, m, vel = 1, p = 0) {
  const i0 = S(t), len = S(0.9), f0 = mtof(m);
  for (let i = 0; i < len; i++) {
    const tt = i / SR;
    const v = (Math.sin(TAU * f0 * tt) * Math.exp(-tt * 5.5) + 0.35 * Math.sin(TAU * f0 * 3.93 * tt) * Math.exp(-tt * 22) + 0.12 * Math.sin(TAU * f0 * 9.2 * tt) * Math.exp(-tt * 60)) * Math.min(1, tt / 0.002) * 0.09 * vel;
    addP(MUSIC, i0 + i, v, p);
    addP(VERB, i0 + i, v * 0.35, p);
  }
}
function bass(t, dur, m, vel = 1) {
  const i0 = S(t), len = S(dur + 0.2), f0 = mtof(m);
  const lp = new Biquad('lp', 500, 0.8);
  for (let i = 0; i < len; i++) {
    const tt = i / SR;
    const env = Math.min(1, tt / 0.01) * (tt > dur ? Math.exp(-(tt - dur) * 20) : Math.exp(-tt * 0.6));
    const v = (Math.sin(TAU * f0 * tt) * 0.8 + lp.run(Math.sin(TAU * f0 * 2 * tt) > 0 ? 0.3 : -0.3)) * env * 0.16 * vel;
    addP(MUSIC, i0 + i, v, 0);
  }
}
function kick(t, vel = 1) {
  const i0 = S(t), len = S(0.4);
  let ph = 0;
  for (let i = 0; i < len; i++) {
    const tt = i / SR;
    ph += (TAU * (48 + 70 * Math.exp(-tt * 30))) / SR;
    addP(MUSIC, i0 + i, Math.sin(ph) * Math.exp(-tt * 9) * 0.3 * vel, 0);
  }
}
function rim(t, vel = 1) {
  const i0 = S(t), len = S(0.12);
  const bp = new Biquad('bp', 1800, 3);
  for (let i = 0; i < len; i++) {
    const tt = i / SR;
    const v = (bp.run(noise()) * 0.8 + Math.sin(TAU * 820 * tt) * 0.4) * Math.exp(-tt * 45) * 0.12 * vel;
    addP(MUSIC, i0 + i, v, -0.2);
    addP(VERB, i0 + i, v * 0.3, -0.2);
  }
}
function shaker(t, vel = 1, p = 0.3) {
  const i0 = S(t), len = S(0.09);
  const hp = new Biquad('hp', 6000, 0.7);
  for (let i = 0; i < len; i++) {
    const tt = i / SR;
    const env = Math.min(1, tt / 0.012) * Math.exp(-tt * 55);
    addP(MUSIC, i0 + i, hp.run(noise()) * env * 0.06 * vel, p);
  }
}

// ───────── sound design ─────────
function sine(t, dur, f0, f1, amp, p = 0, dec = 6, verb = 0.3) {
  const i0 = S(t), len = S(dur);
  let ph = 0;
  for (let i = 0; i < len; i++) {
    const u = i / len, tt = i / SR;
    ph += (TAU * f0 * Math.pow(f1 / f0, u)) / SR;
    const v = Math.sin(ph) * Math.exp(-tt * dec) * Math.min(1, tt / 0.003) * amp;
    addP(FX, i0 + i, v, p);
    addP(VERB, i0 + i, v * verb, p);
  }
}
function band(t, dur, freq, env, amp, q = 1.2, pan = () => 0, verb = 0.2) {
  const i0 = S(t), len = S(dur);
  const bp = new Biquad('bp', 500, q);
  for (let i = 0; i < len; i++) {
    const u = i / len;
    if (i % 32 === 0) bp.set('bp', freq(u), q);
    const v = bp.run(noise()) * env(u) * amp;
    addP(FX, i0 + i, v, pan(u));
    addP(VERB, i0 + i, v * verb, pan(u));
  }
}
const SFX = {
  pop: (t, k = 1) => { sine(t, 0.16, 520 * k, 900 * k, 0.1, (rnd() - 0.5) * 0.6, 22, 0.2); sine(t + 0.01, 0.1, 1400 * k, 1500 * k, 0.03, 0, 40, 0.2); },
  chime: (t, root = 81) => [0, 4, 7, 12].forEach((iv, k) => sine(t + k * 0.07, 2.4, mtof(root + iv), mtof(root + iv), 0.05, k % 2 ? 0.4 : -0.4, 1.6, 0.9)),
  whoosh: (t, amt = 1) => band(t - 0.35, 0.7, (u) => 300 * Math.pow(10, Math.sin(u * Math.PI)), (u) => Math.pow(Math.sin(u * Math.PI), 1.8), 0.28 * amt, 1.3, (u) => -0.7 + 1.4 * u, 0.3),
  swell: (t, d = 2) => band(t - d, d, (u) => 300 * Math.pow(12, u), (u) => u * u, 0.18, 1.5, () => 0, 0.4),
  dissolve: (t) => { for (let k = 0; k < 30; k++) sine(t + rnd() * 1.4, 0.4, 900 + rnd() * 1600, 1400 + rnd() * 2000, 0.025, rnd() * 2 - 1, 8, 0.6); },
  sparkle: (t, d = 1.5) => { for (let k = 0; k < 18; k++) sine(t + (k / 18) * d, 0.5, mtof(84 + [0, 2, 4, 7, 9, 12][k % 6]), mtof(84 + [0, 2, 4, 7, 9, 12][k % 6]), 0.02, rnd() * 1.6 - 0.8, 6, 0.8); },
  click: (t) => band(t, 0.02, () => 3500, (u) => 1 - u, 0.5, 2, () => 0.1, 0.05),
  servo: (t, d = 0.9, k = 1) => {
    const i0 = S(t), len = S(d);
    let ph = 0;
    const bp = new Biquad('bp', 1100, 4);
    for (let i = 0; i < len; i++) {
      const u = i / len;
      ph += ((180 + 90 * Math.sin(u * Math.PI)) * k) / SR;
      addP(FX, i0 + i, bp.run((ph % 1) * 2 - 1) * Math.sin(u * Math.PI) * 0.07, 0.3);
    }
  },
  snip: (t) => { band(t, 0.012, () => 7000, (u) => 1 - u, 0.9, 1, () => 0.2, 0.1); band(t + 0.04, 0.014, () => 5200, (u) => 1 - u, 0.7, 1, () => 0.2, 0.1); },
  thunk: (t) => { sine(t, 0.25, 140, 70, 0.22, 0.1, 14, 0.1); band(t, 0.05, () => 600, (u) => 1 - u, 0.3, 0.8, () => 0.1, 0.05); },
  scan: (t, d = 1.2) => sine(t, d, 900, 1600, 0.025, 0.2, 0.3, 0.3),
  alert: (t) => { sine(t, 0.12, 880, 880, 0.06, 0, 10, 0.3); sine(t + 0.16, 0.16, 660, 660, 0.06, 0, 10, 0.3); },
  spray: (t) => band(t, 0.35, () => 5200, (u) => Math.min(1, u * 30) * Math.pow(1 - u, 2), 0.2, 0.6, () => 0.1, 0.1),
  error: (t) => { sine(t, 0.18, 220, 200, 0.1, 0, 4, 0.2); sine(t + 0.2, 0.3, 196, 180, 0.1, 0, 4, 0.2); },
  zip: (t) => band(t, 0.25, (u) => 800 * Math.pow(6, u), (u) => Math.sin(u * Math.PI), 0.12, 2, (u) => -0.5 + u, 0.1),
  drip: (t) => sine(t, 0.08, 1400, 700, 0.05, (rnd() - 0.5), 30, 0.4),
  tick: (t) => sine(t, 0.03, 2600, 2400, 0.03, (rnd() - 0.5), 120, 0.2),
};
function loopNoise(t0, t1, fn) { const i0 = S(t0), len = S(t1 - t0); for (let i = 0; i < len; i++) fn(i0 + i, i / SR, i / len); }
function ambience(t0, t1, amp = 0.012) {
  const lp = new Biquad('lp', 700, 0.5), lp2 = new Biquad('lp', 500, 0.5);
  loopNoise(t0, t1, (i, tt, u) => {
    const g = Math.min(1, tt / 1.5, (t1 - t0 - tt) / 1.5) * amp * (0.8 + 0.2 * Math.sin(tt * 0.7));
    FX[0][i] += lp.run(noise()) * g; FX[1][i] += lp2.run(noise()) * g;
  });
}
function birds(t0, t1) {
  for (let t = t0 + 0.5; t < t1 - 0.5; t += 0.6 + rnd() * 1.4) {
    const f0 = 2600 + rnd() * 1800, n = 2 + Math.floor(rnd() * 3), p = rnd() * 1.6 - 0.8;
    for (let k = 0; k < n; k++) sine(t + k * 0.11, 0.09, f0 * (1 + rnd() * 0.2), f0 * (0.8 + rnd() * 0.5), 0.02, p, 20, 0.5);
  }
}
function droneBuzz(t0, t1, pan0 = -0.9, pan1 = 0.9) {
  const bp = new Biquad('bp', 900, 1.5);
  let a = 0, b = 0, c = 0;
  loopNoise(t0, t1, (i, tt, u) => {
    a += 190 / SR; b += 196 / SR; c += 238 / SR;
    const x = ((a % 1) + (b % 1) + (c % 1)) / 1.5 - 1;
    const v = bp.run(x) * Math.sin(Math.PI * u) * 0.05 * (0.8 + 0.2 * Math.sin(tt * TAU * 29));
    addP(FX, i, v, lerp(pan0, pan1, u));
  });
}
function motor(t0, t1, f = 70, amp = 0.05) {
  const lp = new Biquad('lp', 320, 1.2);
  let ph = 0;
  loopNoise(t0, t1, (i, tt, u) => {
    ph += (f + 5 * Math.sin(tt * 4)) / SR;
    addP(FX, i, lp.run((ph % 1) * 2 - 1) * Math.min(1, u * 6, (1 - u) * 6) * amp, lerp(-0.7, 0.7, u));
  });
}
function rain(t0, t1, amp = 0.05, shape = () => 1) {
  const hp = new Biquad('hp', 1500, 0.5), lp = new Biquad('lp', 7000, 0.5);
  loopNoise(t0, t1, (i, tt, u) => { const v = lp.run(hp.run(noise())) * amp * shape(tt); FX[0][i] += v; FX[1][i] += v * 0.95; });
}
function water(t0, t1) {
  const bp = new Biquad('bp', 1000, 2);
  loopNoise(t0, t1, (i, tt, u) => {
    if (i % 64 === 0) bp.set('bp', 800 + 400 * Math.sin(tt * 7) + 250 * Math.sin(tt * 19), 2);
    const v = bp.run(noise()) * Math.min(1, u * 8, (1 - u) * 5) * 0.035;
    FX[0][i] += v; FX[1][i] += v * 0.9;
  });
}

// ───────── cue sheet ─────────
const sc = Object.fromEntries(timing.scenes.map((s) => [s.id, { ...s, cue: Cues(s) }]));
const at = (id, tt) => sc[id].start + tt;
const W = (id, line, word, k = 0) => at(id, sc[id].cue.word(line, word, k));
const L = (id, line) => ({ s: at(id, sc[id].cue.line(line).start), e: at(id, sc[id].cue.line(line).end) });

// scene transitions
timing.scenes.slice(1).forEach((s) => SFX.whoosh(s.start - 0.4, 0.7));
// open
ambience(0, sc.open.end + 1, 0.014); birds(0.3, sc.open.end + 0.5);
['Planting', 'weeding', 'spraying', 'picking', 'carrying'].forEach((w, i) => SFX.pop(W('open', 'o2', w), 1 + i * 0.08));
// idea
SFX.chime(W('idea', 'i1', 'One-Man') - 0.6, 81);
SFX.sparkle(W('idea', 'i1', 'One-Man') - 0.4, 1.2);
SFX.pop(W('idea', 'i2', 'one person'), 1.1);
SFX.dissolve(W('idea', 'i2', 'largely'));
SFX.pop(W('idea', 'i3', 'small team'), 1.0);
SFX.zip(W('idea', 'i3', 'Machines'));
droneBuzz(W('idea', 'i3', 'Machines'), sc.idea.end + 0.4, 0.9, 0.1);
motor(W('idea', 'i3', 'Machines'), sc.idea.end, 80, 0.03);
// water
{
  const d = W('water', 'w1', 'Drip lines');
  SFX.click(d - 0.4); water(d, sc.water.end + 0.3);
  for (let t = d + 0.4; t < sc.water.end; t += 0.35 + rnd() * 0.3) SFX.drip(t);
  SFX.pop(d + 0.3, 1); SFX.pop(W('water', 'w1', 'nutrients'), 1.1);
  SFX.scan(W('water', 'w2', 'sensors'), 0.6); SFX.pop(W('water', 'w2', 'sensors') + 0.2, 1.2);
  SFX.click(W('water', 'w2', 'automated valves')); SFX.pop(W('water', 'w2', 'automated valves'), 1.3);
  SFX.chime(W('water', 'w2', 'software'), 88);
}
// harvest
{
  const f_ = W('harvest', 'h2', 'find'), r_ = W('harvest', 'h2', 'reach'), c_ = W('harvest', 'h2', 'cut'), hd = W('harvest', 'h2', 'handle');
  ambience(sc.harvest.start, sc.eco.end, 0.01);
  [f_, r_, c_, hd].forEach((t, i) => SFX.pop(t, 1 + i * 0.1));
  SFX.scan(f_ - 0.3, 1.3); SFX.tick(f_ + 0.9);
  SFX.servo(r_ - 0.1, 1.1, 1); SFX.snip(c_ + 0.1); SFX.servo(hd - 0.2, 1.8, 0.8); SFX.thunk(hd + 1.6);
}
// crops
['cucumber', 'okra', 'chilli', 'bitter gourd', 'papaya'].forEach((w, i) => SFX.pop(W('crops', 'h3', w) - 0.1, 0.9 + i * 0.1));
// spray
{
  const s1 = L('spray', 's1'), under = W('spray', 's2', 'beneath');
  droneBuzz(s1.s - 0.6, s1.s + 6);
  birds(sc.spray.start, sc.spray.end);
  SFX.alert(W('spray', 's1', 'pests hide') + 0.4);
  motor(under - 0.8, under + 6.8, 66, 0.05);
  // same rover path as the scene: hits when roverX(t) + 40 ≥ pest x
  const PESTS = [420, 610, 790, 1010, 1180, 1390, 1560];
  const t0 = under - sc.spray.start - 0.8;
  const roverX = (tt) => lerp(-260, 2120, pr(tt, t0, 7.2, E.inOutCubic));
  for (const px of PESTS) { for (let tt = t0; tt < t0 + 8; tt += 0.01) if (roverX(tt) + 40 >= px) { SFX.tick(at('spray', tt - 0.35)); SFX.spray(at('spray', tt)); break; } }
  SFX.pop(W('spray', 's2', 'only where'), 1.2);
}
// eco
['Weeding', 'pruning', 'training', 'inspecting', 'moving'].forEach((w, i) => SFX.pop(W('eco', 'e1', w), 1 + i * 0.07));
SFX.chime(W('eco', 'e1', 'ecosystem'), 86); SFX.sparkle(W('eco', 'e1', 'ecosystem'), 1);
motor(sc.eco.start, sc.eco.end, 74, 0.02);
// small
{
  motor(sc.small.start, L('small', 'm2').s + 1, 46, 0.09);
  ['three', 'five', 'ten'].forEach((w, i) => SFX.pop(W('small', 'm2', w), 1 + i * 0.12));
  SFX.pop(W('small', 'm2', 'hilly'), 1.2); SFX.pop(W('small', 'm2', 'narrow'), 1.25); SFX.pop(W('small', 'm2', 'trellises'), 1.3);
  SFX.thunk(W('small', 'm2', 'trellises') + 0.6); SFX.error(W('small', 'm2', 'trellises') + 0.9);
  SFX.zip(W('small', 'm3', 'small')); SFX.pop(W('small', 'm3', 'small'), 1.3); SFX.pop(W('small', 'm3', 'light'), 1.4);
  for (let k = 0; k < 4; k++) SFX.click(W('small', 'm3', 'modular') + k * 0.6);
  SFX.swell(W('small', 'm3', 'The question'), 1.2); SFX.chime(W('small', 'm3', 'The question'), 76);
  birds(L('small', 'm2').s, sc.small.end);
}
// data
{
  const d = W('data', 'd1', 'collects data');
  for (let t = d; t < sc.data.end - 0.5; t += 0.18 + rnd() * 0.25) SFX.tick(t);
  SFX.pop(d, 1); SFX.pop(W('data', 'd1', 'harvester') + 0.3, 1.1); SFX.pop(W('data', 'd1', 'sprayer') + 0.3, 1.15); SFX.pop(W('data', 'd1', 'irrigation') + 0.4, 1.2);
  const s0 = L('data', 'd2').s, SL = 1.5;
  rain(s0, sc.data.end + 0.5, 0.07, (tt) => { const ph = ((tt) / SL) % 3; return Math.max(0, 1 - Math.abs(ph - 0.5) * 2.2); });
  SFX.chime(s0 + 0.6, 79); SFX.pop(W('data', 'd2', 'linking'), 1.3);
}
// ai
{
  const c_ = W('ai', 'a1', 'coordinate');
  SFX.sparkle(c_ - 0.3, 1.2); for (let k = 0; k < 8; k++) SFX.tick(c_ - 0.2 + k * 0.08);
  SFX.pop(W('ai', 'a1', 'what is growing'), 1); SFX.alert(W('ai', 'a1', 'struggling'));
  SFX.pop(W('ai', 'a1', 'when to harvest'), 1.2); SFX.chime(W('ai', 'a1', 'what to do next'), 84);
}
// seed
{
  SFX.sparkle(W('seed', 'g1', 'shape the seed') - 0.3, 1.2);
  SFX.pop(W('seed', 'g1', 'Today'), 0.9); SFX.whoosh(W('seed', 'g1', 'broad regions'), 0.6);
  SFX.pop(W('seed', 'g2', 'one farm'), 1.1);
  for (let k = 0; k < 6; k++) SFX.pop(W('seed', 'g2', 'exact conditions') - 0.3 + k * 0.12, 1 + k * 0.06);
  SFX.chime(W('seed', 'g2', 'exact conditions') + 1.0, 83); SFX.pop(W('seed', 'g2', 'personalised medicine'), 1.2);
}
// scale
{
  SFX.swell(W('scale', 'p1', 'millions') + 0.5, 2.5); SFX.sparkle(W('scale', 'p1', 'small farms like ours'), 3);
  SFX.pop(L('scale', 'p2').s, 1); SFX.pop(W('scale', 'p2', 'engineering problem'), 1.15); SFX.pop(W('scale', 'p2', 'product'), 1.3);
}
// end
{
  ambience(sc.end.start, DUR + 1, 0.012); birds(sc.end.start, DUR - 1);
  ['Machines', 'Sensors', 'Data', 'AI'].forEach((w, i) => SFX.pop(W('end', 'n1', w), 1 + i * 0.1));
  SFX.swell(W('end', 'n2', 'One-Man') - 0.2, 1.5); SFX.chime(W('end', 'n2', 'One-Man') - 0.2, 74); SFX.sparkle(W('end', 'n2', 'One-Man'), 2);
}

// ───────── score ─────────
const BPM = 90, BEAT = 60 / BPM, BAR = BEAT * 4;
const PROG = [
  { root: 38, pad: [62, 66, 69, 74] }, // D
  { root: 33, pad: [61, 64, 69, 73] }, // A
  { root: 35, pad: [59, 62, 66, 71] }, // Bm
  { root: 31, pad: [59, 62, 67, 71] }, // G
];
const MODE = { open: 'intro', idea: 'lift', water: 'groove', harvest: 'groove', crops: 'groove', spray: 'groove', eco: 'groove', small: 'groove', data: 'bright', ai: 'bright', seed: 'break', scale: 'build', end: 'full' };
const sceneAt = (t) => timing.scenes.find((s) => t >= s.start && t < s.end) || timing.scenes[timing.scenes.length - 1];
const MAR = [0, 2, 1, 3, 2, 1, 3, 0];
const q = sc.small.cue.word('m3', 'The question') + sc.small.start;
const lastBar = Math.floor((sc.end.end - 5) / BAR);
for (let bar = 0; bar * BAR < DUR; bar++) {
  const t = bar * BAR;
  const s = sceneAt(t + 0.01);
  let m = MODE[s.id];
  if (s.id === 'small' && t >= q - BAR * 0.5) m = 'break';
  const ch = PROG[bar % 4];
  const final = bar >= lastBar;
  if (final) {
    if (bar === lastBar) { pad(t, DUR - t - 1.5, [50, ...PROG[0].pad], 1.2, 1200); bass(t, DUR - t - 2, 38, 0.9); marimba(t, 74, 1); marimba(t + BEAT, 78, 0.8); marimba(t + 2 * BEAT, 81, 0.8); marimba(t + 3 * BEAT, 86, 0.9); }
    continue;
  }
  pad(t, BAR, ch.pad, { intro: 0.8, break: 1.1, full: 1.1 }[m] || 0.9, { intro: 900, break: 1100, bright: 1900, full: 1800 }[m] || 1400);
  if (m !== 'intro' || t > 2) bass(t, BAR * 0.9, ch.root, m === 'intro' ? 0.5 : 0.8);
  for (let b = 0; b < 8; b++) {
    const tt = t + b * BEAT / 2;
    const tones = ch.pad.map((n) => n + (m === 'bright' || m === 'full' ? 12 : 0));
    const want = m === 'intro' ? b % 4 === 0 : m === 'lift' || m === 'break' ? b % 2 === 0 : true;
    if (want && tt > 1.2) marimba(tt, tones[MAR[b] % tones.length], (b % 2 ? 0.6 : 0.9) * (m === 'break' ? 0.8 : 1), b % 2 ? 0.35 : -0.35);
  }
  const drums = ['groove', 'bright', 'build', 'full'].includes(m) || (m === 'lift' && t > s.start + 6);
  if (drums) {
    for (let b = 0; b < 4; b++) {
      const tt = t + b * BEAT;
      if (b === 0 || b === 2) kick(tt, m === 'lift' ? 0.6 : 0.85);
      if ((b === 1 || b === 3) && m !== 'lift') rim(tt, 0.8);
      for (let k = 0; k < 4; k++) shaker(tt + (k * BEAT) / 4, (k === 2 ? 1 : 0.55) * (m === 'build' ? 0.6 + 0.4 * ((t - s.start) / (s.end - s.start)) : 0.8));
    }
  }
}

// ───────── mix ─────────
function freeverb([inL, inR], room = 0.82, damp = 0.35) {
  const out = bus();
  for (const [ch, spread] of [[0, 0], [1, 23]]) {
    const inp = ch ? inR : inL, o = out[ch];
    const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((d) => ({ b: new Float32Array(Math.round((d + spread) * SR / 44100)), i: 0, s: 0 }));
    const aps = [556, 441, 341, 225].map((d) => ({ b: new Float32Array(Math.round((d + spread) * SR / 44100)), i: 0 }));
    for (let n = 0; n < N; n++) {
      const x = inp[n] * 0.015;
      let y = 0;
      for (const c of combs) { const v = c.b[c.i]; c.s = v * (1 - damp) + c.s * damp; c.b[c.i] = x + c.s * room; if (++c.i >= c.b.length) c.i = 0; y += v; }
      for (const a of aps) { const v = a.b[a.i]; const z = -y + v; a.b[a.i] = y + v * 0.5; if (++a.i >= a.b.length) a.i = 0; y = z; }
      o[n] = y * 3;
    }
  }
  return out;
}
console.log('reverb…');
const rev = freeverb(VERB);
const outL = new Float32Array(N), outR = new Float32Array(N);
const MUS = 0.75, FXG = 0.9;
for (let i = 0; i < N; i++) {
  const d = duck[i];
  outL[i] = VO[i] * 0.9 + (MUSIC[0][i] * MUS + rev[0][i] * 0.6) * d + FX[0][i] * FXG;
  outR[i] = VO[i] * 0.9 + (MUSIC[1][i] * MUS + rev[1][i] * 0.6) * d + FX[1][i] * FXG;
}
if (process.env.DEBUG_MIX) {
  const db = (x) => (10 * Math.log10(x + 1e-12)).toFixed(1);
  let v = 0, m = 0, mg = 0, fx = 0, nv = 0, ng = 0, fxPeak = 0, voPeak = 0;
  for (let i = 0; i < N; i += 4) {
    const ml = (MUSIC[0][i] * MUS + rev[0][i] * 0.6);
    const speaking = duck[i] < 0.75;
    if (speaking) { v += VO[i] * VO[i]; m += (ml * duck[i]) ** 2; nv++; } else { mg += ml * ml; ng++; }
    fx += (FX[0][i] * FXG) ** 2;
    fxPeak = Math.max(fxPeak, Math.abs(FX[0][i] * FXG)); voPeak = Math.max(voPeak, Math.abs(VO[i]));
  }
  console.log('voice', db(v / nv), '| music under voice', db(m / nv), '| music in gaps', db(mg / ng), '| fx avg', db(fx / (N / 4)), '| peaks fx/vo', fxPeak.toFixed(2), voPeak.toFixed(2));
}
// fade in/out, gentle peak control (final loudness is set by ffmpeg loudnorm at mux time)
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const g = Math.min(1, t / 0.3) * Math.min(1, Math.max(0, (DUR + 0.8 - t) / 2.5));
  outL[i] = Math.tanh(outL[i] * g * 1.1) / 1.1;
  outR[i] = Math.tanh(outR[i] * g * 1.1) / 1.1;
}
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(outL[i]), Math.abs(outR[i]));
const norm = 0.9 / peak;
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28);
buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, outL[i] * norm)) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, outR[i] * norm)) * 32767), 46 + i * 4);
}
const out = path.join(ROOT, 'build', 'explainer-soundtrack.wav');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, buf);
console.log(`wrote ${path.relative(ROOT, out)} (${(N / SR).toFixed(1)} s)`);
