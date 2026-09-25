// Synthesises the soundtrack from the same timeline the visuals use:
// a 120 BPM electronic bed (kick, clap, hats, bass, pads, arp) plus
// sound design cued by every scene's `sfx` list. Writes build/soundtrack.wav.
import fs from 'node:fs';
import path from 'node:path';
import { SCENES, BEAT, DURATION, TOTAL_BEATS } from '../video/js/timeline.js';
import { MODS } from '../video/js/scenes/index.js';
import { ROOT } from './server.js';

const SR = 44100;
const TAIL = 3;
const N = Math.ceil((DURATION + TAIL) * SR);
const TAU = Math.PI * 2;

// ---------- buses ----------
const bus = () => [new Float32Array(N), new Float32Array(N)];
const MUSIC = bus(), DRUMS = bus(), FX = bus(), VERB = bus(), DELAY = bus();
const duck = new Float32Array(N).fill(1);

let seed = 12345;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const noise = () => rnd() * 2 - 1;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const panLR = (p) => [Math.cos(((p + 1) * Math.PI) / 4), Math.sin(((p + 1) * Math.PI) / 4)];
function add(b, i, l, r) { if (i >= 0 && i < N) { b[0][i] += l; b[1][i] += r; } }
function addP(b, i, v, p = 0) { const [l, r] = panLR(p); add(b, i, v * l, v * r); }

class Biquad {
  constructor(type, f, q = 0.707) { this.x1 = this.x2 = this.y1 = this.y2 = 0; this.set(type, f, q); }
  set(type, f, q = 0.707) {
    f = Math.min(Math.max(f, 10), SR * 0.45);
    const w = (TAU * f) / SR, cs = Math.cos(w), sn = Math.sin(w), al = sn / (2 * q);
    let b0, b1, b2;
    const a0 = 1 + al, a1 = -2 * cs, a2 = 1 - al;
    if (type === 'lp') { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = (1 - cs) / 2; }
    else if (type === 'hp') { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = (1 + cs) / 2; }
    else { b0 = al; b1 = 0; b2 = -al; } // band-pass, 0 dB peak
    this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0; this.a1 = a1 / a0; this.a2 = a2 / a0;
    return this;
  }
  run(x) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y;
    return y;
  }
}
function polyblep(t, dt) {
  if (t < dt) { t /= dt; return t + t - t * t - 1; }
  if (t > 1 - dt) { t = (t - 1) / dt; return t * t + t + t + 1; }
  return 0;
}
class Saw {
  constructor(f) { this.ph = rnd(); this.f = f; }
  next() { const dt = this.f / SR; const v = 2 * this.ph - 1 - polyblep(this.ph, dt); this.ph += dt; if (this.ph >= 1) this.ph -= 1; return v; }
}
const S = (t) => Math.round(t * SR);

// ---------- drums ----------
function kick(t, vel = 1, sidechain = 0.6) {
  const i0 = S(t), len = S(0.5);
  let ph = 0;
  for (let i = 0; i < len; i++) {
    const tt = i / SR;
    const f = 46 + 130 * Math.exp(-tt * 32) + 60 * Math.exp(-tt * 220);
    ph += (TAU * f) / SR;
    const env = Math.exp(-tt * 6.5) * (1 - Math.exp(-tt * 3000));
    const click = i < 220 ? noise() * 0.35 * (1 - i / 220) : 0;
    const v = Math.tanh((Math.sin(ph) * env + click) * 1.8) * 0.62 * vel;
    add(DRUMS, i0 + i, v, v);
  }
  for (let i = 0; i < S(0.32); i++) {
    const tt = i / SR;
    const g = 1 - sidechain * vel * Math.exp(-tt / 0.085);
    if (i0 + i < N) duck[i0 + i] = Math.min(duck[i0 + i], g);
  }
}
function clap(t, vel = 1) {
  const i0 = S(t), len = S(0.3);
  const bp = new Biquad('bp', 1400, 0.9), hp = new Biquad('hp', 700);
  for (let i = 0; i < len; i++) {
    const tt = i / SR;
    let env = 0;
    for (const o of [0, 0.011, 0.022]) if (tt >= o) env = Math.max(env, Math.exp(-(tt - o) * 180));
    env = Math.max(env, 0.55 * Math.exp(-(tt - 0.022) * 14) * (tt > 0.022 ? 1 : 0));
    const n = hp.run(bp.run(noise())) * env * 1.8;
    const body = Math.sin(TAU * 190 * tt) * Math.exp(-tt * 40) * 0.25;
    const v = (n + body) * 0.42 * vel;
    add(DRUMS, i0 + i, v * 0.9, v);
    add(VERB, i0 + i, v * 0.25, v * 0.25);
  }
}
function hat(t, vel = 1, open = false, p = 0.2) {
  const i0 = S(t), len = S(open ? 0.35 : 0.06);
  const hp = new Biquad('hp', 7500, 0.8), bp = new Biquad('bp', 10500, 1.2);
  const dec = open ? 11 : 75;
  for (let i = 0; i < len; i++) {
    const tt = i / SR;
    const v = (hp.run(noise()) * 0.6 + bp.run(noise()) * 0.8) * Math.exp(-tt * dec) * 0.16 * vel;
    addP(DRUMS, i0 + i, v, p);
  }
}
function crash(t, vel = 1) {
  const i0 = S(t), len = S(2.2);
  const hp = new Biquad('hp', 5000, 0.7);
  for (let i = 0; i < len; i++) {
    const tt = i / SR;
    const v = hp.run(noise()) * Math.exp(-tt * 2.2) * 0.13 * vel;
    add(DRUMS, i0 + i, v * (0.8 + 0.2 * Math.sin(tt * 3)), v);
    add(VERB, i0 + i, v * 0.3, v * 0.3);
  }
}

// ---------- tonal ----------
function bass(t, dur, midi, vel = 1) {
  const i0 = S(t), len = S(dur + 0.08);
  const saw = new Saw(mtof(midi + 12));
  const lp = new Biquad('lp', 400, 1.1);
  let ph = 0;
  const f = mtof(midi);
  for (let i = 0; i < len; i++) {
    const tt = i / SR;
    if (i % 32 === 0) lp.set('lp', 180 + 1000 * Math.exp(-tt * 14), 1.1);
    ph += (TAU * f) / SR;
    const env = Math.min(1, tt / 0.004) * (tt > dur ? Math.exp(-(tt - dur) * 60) : 1);
    const v = (Math.sin(ph) * 0.75 + lp.run(saw.next()) * 0.45) * env * 0.33 * vel;
    add(MUSIC, i0 + i, v, v);
  }
}
function pad(t, dur, notes, vel = 1, cutoff = 1500) {
  const i0 = S(t), rel = 1.0, len = S(dur + rel);
  notes.forEach((m, n) => {
    const voices = [-9, 0, 9].map((c) => new Saw(mtof(m) * Math.pow(2, c / 1200)));
    const pans = [-0.7, 0, 0.7];
    const lp = new Biquad('lp', cutoff, 0.6), lp2 = new Biquad('lp', cutoff, 0.6);
    for (let i = 0; i < len; i++) {
      const tt = i / SR;
      const env = Math.min(1, tt / 0.45) * (tt > dur ? Math.exp(-(tt - dur) * 4) : 1);
      let l = 0, r = 0;
      voices.forEach((v, k) => { const x = v.next(); const [pl, pr] = panLR(pans[k] * (n % 2 ? -1 : 1)); l += x * pl; r += x * pr; });
      l = lp.run(l); r = lp2.run(r);
      const g = env * 0.045 * vel;
      add(MUSIC, i0 + i, l * g, r * g);
      add(VERB, i0 + i, l * g * 0.35, r * g * 0.35);
    }
  });
}
function pluck(t, midi, vel = 1, p = 0, bright = 1) {
  const i0 = S(t), len = S(0.4);
  const a = new Saw(mtof(midi)), b = new Saw(mtof(midi) * 1.004);
  const lp = new Biquad('lp', 4000, 2);
  for (let i = 0; i < len; i++) {
    const tt = i / SR;
    if (i % 32 === 0) lp.set('lp', 400 + 4200 * bright * Math.exp(-tt * 22), 2);
    const v = lp.run((a.next() + b.next()) * 0.5) * Math.exp(-tt * 9) * 0.11 * vel;
    addP(MUSIC, i0 + i, v, p);
    addP(DELAY, i0 + i, v * 0.45, p);
    add(VERB, i0 + i, v * 0.15, v * 0.15);
  }
}
function sine(t, dur, f0, f1, amp, p = 0, target = FX, dec = 6, verb = 0.2) {
  const i0 = S(t), len = S(dur);
  let ph = 0;
  for (let i = 0; i < len; i++) {
    const u = i / len, tt = i / SR;
    const f = f0 * Math.pow(f1 / f0, u);
    ph += (TAU * f) / SR;
    const v = Math.sin(ph) * Math.exp(-tt * dec) * Math.min(1, tt / 0.002) * amp;
    addP(target, i0 + i, v, p);
    add(VERB, i0 + i, v * verb, v * verb);
  }
}
// noise through a swept band-pass. env(u) and freq(u) with u in 0..1
function sweep(t, dur, freq, env, amp, q = 1.2, pan = (u) => 0, verb = 0.25, target = FX) {
  const i0 = S(t), len = S(dur);
  const bp = new Biquad('bp', 500, q);
  for (let i = 0; i < len; i++) {
    const u = i / len;
    if (i % 32 === 0) bp.set('bp', freq(u), q);
    const v = bp.run(noise()) * env(u) * amp;
    addP(target, i0 + i, v, pan(u));
    add(VERB, i0 + i, v * verb, v * verb);
  }
}

// ---------- sound design ----------
const SFX = {
  impact(t, amt = 1) {
    kick(t, 1.0 * Math.min(1.2, amt), 0.85);
    sine(t, 2.2, 58, 30, 0.75 * amt, 0, FX, 1.8, 0.1);
    const lp = new Biquad('lp', 2500, 0.7);
    const i0 = S(t);
    for (let i = 0; i < S(1.8); i++) {
      const tt = i / SR;
      if (i % 64 === 0) lp.set('lp', 300 + 3000 * Math.exp(-tt * 3), 0.7);
      const v = lp.run(noise()) * Math.exp(-tt * 3.2) * 0.42 * amt;
      add(FX, i0 + i, v, v * 0.95);
      add(VERB, i0 + i, v * 0.6, v * 0.6);
    }
    crash(t, 0.9 * amt);
  },
  slam(t, amt = 1) {
    sine(t, 0.35, 150, 48, 0.8 * amt, 0, FX, 9, 0.1);
    sweep(t, 0.09, () => 2200, (u) => 1 - u, 0.9 * amt, 0.8, () => 0, 0.5);
    for (let i = 0; i < S(0.25); i++) if (S(t) + i < N) duck[S(t) + i] = Math.min(duck[S(t) + i], 1 - 0.5 * amt * Math.exp(-i / SR / 0.08));
  },
  hit(t, amt = 1) {
    sine(t, 0.6, 110, 60, 0.45 * amt, 0, FX, 7, 0.3);
    sweep(t, 0.25, () => 1600, (u) => Math.pow(1 - u, 3), 0.55 * amt, 0.7, () => 0, 0.6);
  },
  stamp(t, amt = 1) {
    sine(t, 0.18, 120, 55, 0.7 * amt, 0, FX, 18, 0.05);
    sweep(t, 0.04, () => 3500, (u) => 1 - u, 0.8 * amt, 0.9, () => 0, 0.2);
  },
  tick(t, pitch = 1) {
    sine(t, 0.03, 2400 * pitch, 2200 * pitch, 0.16, 0.3, FX, 160, 0.1);
    sweep(t, 0.012, () => 6000, (u) => 1 - u, 0.25, 1, () => -0.2, 0);
  },
  blip(t, pitch = 1) {
    sine(t, 0.14, 880 * pitch, 990 * pitch, 0.13, 0.2, FX, 28, 0.25);
    sine(t, 0.1, 1760 * pitch, 1980 * pitch, 0.04, -0.2, FX, 36, 0.25);
    const i0 = S(t);
    for (let i = 0; i < S(0.12); i++) { const v = Math.sin((TAU * 880 * pitch * i) / SR) * Math.exp(-i / SR * 30) * 0.05; add(DELAY, i0 + i, v, v); }
  },
  whoosh(t, amt = 1) {
    const d = 0.5;
    sweep(t - 0.3, d, (u) => 300 * Math.pow(12, Math.sin(u * Math.PI)), (u) => Math.pow(Math.sin(u * Math.PI), 1.6), 0.5 * amt, 1.4, (u) => -0.8 + 1.6 * u, 0.3);
  },
  sweep(t, amt = 1) {
    sweep(t, 0.55, (u) => 400 * Math.pow(15, u), (u) => Math.sin(u * Math.PI) * u, 0.32 * amt, 1.6, (u) => u - 0.5, 0.35);
  },
  riser(t, beats = 2) {
    const d = beats * BEAT;
    sweep(t, d, (u) => 250 * Math.pow(32, u), (u) => u * u * (u < 0.985 ? 1 : (1 - u) / 0.015), 0.45, 2.5, () => 0, 0.3);
    sine(t, d, 180, 900, 0.05, 0, FX, 0, 0.3);
  },
  swell(t, beats = 1) {
    const d = beats * BEAT;
    const hp = new Biquad('hp', 3000, 0.7);
    const i0 = S(t - d);
    for (let i = 0; i < S(d); i++) {
      const u = i / S(d);
      const v = hp.run(noise()) * Math.pow(u, 3) * 0.2;
      add(FX, i0 + i, v, v);
    }
  },
  down(t) { sine(t, 0.6, 700, 70, 0.18, 0, FX, 3, 0.3); },
  shimmer(t) {
    [76, 79, 81, 84, 88, 91].forEach((m, k) => sine(t + k * 0.06, 1.8, mtof(m), mtof(m), 0.035, k % 2 ? 0.5 : -0.5, FX, 2.2, 0.8));
  },
  zip(t) { sweep(t, 0.18, (u) => 800 * Math.pow(8, u), (u) => Math.sin(u * Math.PI), 0.35, 2, (u) => -0.6 + 1.2 * u, 0.1); },
  dissolve(t) {
    for (let k = 0; k < 26; k++) {
      const tt = t + rnd() * 0.8;
      sweep(tt, 0.012, () => 3000 + rnd() * 5000, (u) => 1 - u, 0.25 * (1 - (tt - t) / 0.9), 1.5, () => rnd() * 2 - 1, 0.3);
    }
  },
  glitch(t) {
    const i0 = S(t);
    let hold = 0;
    for (let i = 0; i < S(0.28); i++) {
      if (i % 90 === 0) hold = noise();
      const seg = Math.floor(i / S(0.03));
      const on = (seg * 7919) % 3 !== 0;
      const v = on ? Math.round(hold * 6) / 6 * 0.12 * (1 - i / S(0.28)) : 0;
      add(FX, i0 + i, v, -v);
    }
  },
  scan(t, beats = 2) { sine(t, beats * BEAT, 500, 1500, 0.035, 0, FX, 0, 0.3); },
  snip(t) {
    sweep(t, 0.01, () => 7000, (u) => 1 - u, 0.6, 1, () => 0.2, 0.1);
    sweep(t + 0.035, 0.012, () => 5000, (u) => 1 - u, 0.5, 1, () => 0.2, 0.1);
  },
  servo(t, pitch = 1) {
    const i0 = S(t), len = S(0.45);
    const saw = new Saw(160 * pitch), bp = new Biquad('bp', 900, 3);
    for (let i = 0; i < len; i++) {
      const u = i / len;
      saw.f = (160 + 80 * Math.sin(u * Math.PI)) * pitch;
      const v = bp.run(saw.next()) * Math.sin(u * Math.PI) * 0.09;
      addP(FX, i0 + i, v, 0.3);
    }
  },
  thud(t) { sine(t, 0.22, 95, 50, 0.45, 0.2, FX, 16, 0.1); sweep(t, 0.05, () => 500, (u) => 1 - u, 0.4, 0.7, () => 0.2, 0.1); },
  water(t, beats = 4) {
    const d = beats * BEAT, i0 = S(t), len = S(d);
    const bp = new Biquad('bp', 1100, 2.5);
    for (let i = 0; i < len; i++) {
      const u = i / len, tt = i / SR;
      if (i % 64 === 0) bp.set('bp', 900 + 500 * Math.sin(tt * 9) + 300 * Math.sin(tt * 23.3), 2.5);
      const v = bp.run(noise()) * Math.min(1, u * 6) * Math.min(1, (1 - u) * 4) * 0.07;
      add(FX, i0 + i, v, v * 0.9);
    }
  },
  drone(t, beats = 5) {
    const d = beats * BEAT, i0 = S(t), len = S(d);
    const oscs = [new Saw(188), new Saw(193), new Saw(236)];
    const bp = new Biquad('bp', 1000, 1.2);
    for (let i = 0; i < len; i++) {
      const u = i / len, tt = i / SR;
      const x = oscs.reduce((a, o) => a + o.next(), 0) / 3;
      const trem = 0.75 + 0.25 * Math.sin(TAU * 31 * tt);
      const near = Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.05)), 1.2);
      const v = bp.run(x) * trem * near * 0.11;
      addP(FX, i0 + i, v, -0.9 + 1.8 * u);
    }
  },
  alert(t) { sine(t, 0.09, 1300, 1300, 0.1, 0, FX, 12, 0.2); sine(t + 0.11, 0.12, 980, 980, 0.1, 0, FX, 12, 0.2); },
  rover(t, beats = 5) {
    const d = beats * BEAT, i0 = S(t), len = S(d);
    const saw = new Saw(68), lp = new Biquad('lp', 380, 1.5);
    for (let i = 0; i < len; i++) {
      const u = i / len, tt = i / SR;
      saw.f = 68 + 6 * Math.sin(tt * 5);
      const v = lp.run(saw.next()) * Math.min(1, u * 5) * Math.min(1, (1 - u) * 5) * 0.08;
      addP(FX, i0 + i, v, -0.8 + 1.6 * u);
    }
  },
  spray(t) { sweep(t, 0.32, () => 5200, (u) => Math.min(1, u * 40) * Math.pow(1 - u, 2), 0.3, 0.6, () => 0.1, 0.2); },
  rumble(t, beats = 4) {
    const d = beats * BEAT, i0 = S(t), len = S(d);
    const saw = new Saw(44), lp = new Biquad('lp', 160, 1), lpn = new Biquad('lp', 220, 0.7);
    for (let i = 0; i < len; i++) {
      const u = i / len;
      const v = (lp.run(saw.next()) * 0.6 + lpn.run(noise()) * 0.8) * Math.min(1, u * 4) * Math.min(1, (1 - u) * 4) * 0.2;
      addP(FX, i0 + i, v, -0.6 + 1.2 * u);
    }
  },
  type(t, beats = 4) {
    let tt = t;
    const end = t + beats * BEAT;
    while (tt < end) {
      sweep(tt, 0.008, () => 3200 + rnd() * 1800, (u) => 1 - u, 0.22, 1.2, () => rnd() * 0.8 - 0.4, 0.05);
      tt += 0.04 + rnd() * 0.08;
    }
  },
  suck(t) { sweep(t, 0.45, (u) => 4000 * Math.pow(0.08, u), (u) => u * u, 0.4, 1.2, () => 0, 0.2); },
};

// ---------- arrangement ----------
const PROG = [
  { root: 33, notes: [57, 60, 64] }, // Am
  { root: 29, notes: [57, 60, 65] }, // F
  { root: 36, notes: [55, 60, 64] }, // C
  { root: 31, notes: [55, 59, 62] }, // G
];
const ARP = [0, 1, 2, 3, 4, 3, 2, 1, 0, 2, 1, 3, 2, 4, 3, 5];
const sceneAt = (gb) => SCENES.find((s) => gb >= s.startBeat && gb < s.startBeat + s.beats);

// pads: one chord per bar, merged across scenes whose mode wants pads
for (let bar = 0; bar * 4 < TOTAL_BEATS; bar++) {
  const gb = bar * 4;
  const sc = sceneAt(gb);
  if (!sc) continue;
  const ch = PROG[bar % 4];
  const t = gb * BEAT;
  const m = sc.music;
  if (m === 'cold') continue;
  const bright = { title: 1100, A: 1500, B: 1900, C: 1400, Q: 900, D: 1200, E: 2400, P: 2600, R: 1500, O: 1300 }[m] || 1500;
  const vel = { title: 0.9, Q: 1.1, D: 1.1, R: 1.1, O: 1.2 }[m] || 0.85;
  pad(t, 4 * BEAT, ch.notes, vel, bright);
}
// cold open drone
{
  const cold = SCENES[0];
  sine(0.2, cold.end - 0.1, 55, 55, 0.14, 0, MUSIC, 0.1, 0.2);
  sine(0.2, cold.end - 0.1, 82.4, 82.4, 0.05, 0, MUSIC, 0.1, 0.3);
}
// outro chord hold
{
  const o = SCENES.find((s) => s.id === 'outro');
  pad(o.start, o.end - o.start - 0.5, [45, 57, 60, 64, 69], 1.1, 1100);
  sine(o.start, o.end - o.start + 2, 55, 55, 0.12, 0, MUSIC, 0.35, 0.2);
}

for (let gb = 0; gb < TOTAL_BEATS; gb++) {
  const sc = sceneAt(gb);
  const m = sc.music;
  const t = gb * BEAT;
  const lb = gb - sc.startBeat; // local beat in scene
  const bar = Math.floor(gb / 4), pos = gb % 4;
  const ch = PROG[bar % 4];

  if (m === 'title' && lb >= 6) { kick(t, 0.55 + 0.1 * (lb - 6), 0.4); }
  if (m === 'A' || m === 'B' || m === 'P') {
    kick(t, pos === 0 ? 1 : 0.9);
    hat(t + BEAT / 2, m === 'A' ? 0.8 : 1, m === 'P', 0.25);
    if (m !== 'A') {
      if (pos === 1 || pos === 3) clap(t, 1);
      hat(t + BEAT / 4, 0.4, false, -0.3);
      hat(t + (3 * BEAT) / 4, 0.4, false, -0.3);
    }
    bass(t + BEAT / 2, BEAT * 0.42, ch.root, 1);
    if (m !== 'A') bass(t + BEAT * 0.75, BEAT * 0.2, ch.root + 12, 0.5);
  }
  if (m === 'C') {
    if (pos === 0) kick(t, 1);
    if (pos === 1) kick(t + BEAT / 2, 0.8);
    if (pos === 2) clap(t, 1.1);
    hat(t + BEAT / 2, 0.7, false, 0.2);
    if (pos === 0) bass(t, BEAT * 3.6, ch.root, 0.9);
  }
  if (m === 'E') {
    const k = lb / sc.beats;
    kick(t, 0.8 + 0.2 * k);
    const sub = lb >= sc.beats - 2 ? 4 : 2;
    for (let s = 0; s < sub; s++) clap(t + (s * BEAT) / sub, 0.35 + 0.6 * k);
    bass(t, BEAT * 0.45, ch.root, 0.8);
    bass(t + BEAT / 2, BEAT * 0.45, ch.root, 0.8);
  }
  if (m === 'D' || m === 'R' || m === 'Q') {
    if (pos === 0) bass(t, BEAT * 3.8, ch.root, m === 'Q' ? 0.6 : 0.7);
    if (m === 'D') hat(t + BEAT / 2, 0.35, false, 0.3);
  }
  if (m === 'P' && lb === 0) crash(t, 1.2);

  // arp
  const arpOn = { title: lb >= 2 ? 0.45 : 0, A: 0.5, B: 1, C: 0, Q: 0, D: 0.7, E: 1, P: 1.1, R: 0.6 }[m] ?? 0;
  if (arpOn > 0) {
    const tones = [...ch.notes.map((n) => n + 12), ch.notes[0] + 24, ch.notes[1] + 24, ch.notes[2] + 24];
    for (let s = 0; s < 4; s++) {
      const step = (gb * 4 + s) % 16;
      const bright = m === 'D' || m === 'title' ? 0.5 : m === 'P' ? 1.3 : 1;
      pluck(t + (s * BEAT) / 4, tones[ARP[step] % tones.length], arpOn * (s === 0 ? 1 : 0.75), s % 2 ? 0.35 : -0.35, bright);
    }
  }
}

// scene cues
for (const sc of SCENES) {
  const mod = MODS[sc.type];
  const cues = typeof mod.sfx === 'function' ? mod.sfx(sc) : mod.sfx || [];
  for (const [b, kind, amt] of cues) {
    const fn = SFX[kind];
    if (!fn) { console.warn('unknown sfx', kind); continue; }
    fn(sc.start + b * BEAT, amt);
  }
  if (sc.type === 'chapter') SFX.swell(sc.start, 1);
}
// extra transitions into the groove and the chapters that follow breakdowns
SFX.riser(SCENES.find((s) => s.id === 'title').start + 8 * BEAT, 2);
SFX.riser(SCENES.find((s) => s.id === 'question').start + 6 * BEAT, 2);

// ---------- effects ----------
function freeverb([inL, inR], room = 0.86, damp = 0.25, wet = 1) {
  const combT = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
  const apT = [556, 441, 341, 225];
  const out = bus();
  for (const [ch, spread] of [[0, 0], [1, 23]]) {
    const inp = ch ? inR : inL;
    const o = out[ch];
    const combs = combT.map((d) => ({ buf: new Float32Array(d + spread), i: 0, store: 0 }));
    const aps = apT.map((d) => ({ buf: new Float32Array(d + spread), i: 0 }));
    for (let n = 0; n < N; n++) {
      const x = inp[n] * 0.015;
      let y = 0;
      for (const c of combs) {
        const v = c.buf[c.i];
        c.store = v * (1 - damp) + c.store * damp;
        c.buf[c.i] = x + c.store * room;
        if (++c.i >= c.buf.length) c.i = 0;
        y += v;
      }
      for (const a of aps) {
        const v = a.buf[a.i];
        const z = -y + v;
        a.buf[a.i] = y + v * 0.5;
        if (++a.i >= a.buf.length) a.i = 0;
        y = z;
      }
      o[n] = y * wet;
    }
  }
  return out;
}
function pingpong([inL, inR], time, fb = 0.38) {
  const d = Math.round(time * SR);
  const out = bus();
  const bl = new Float32Array(d), br = new Float32Array(d);
  const lpL = new Biquad('lp', 3500), lpR = new Biquad('lp', 3500);
  let i = 0;
  for (let n = 0; n < N; n++) {
    const yl = bl[i], yr = br[i];
    bl[i] = lpL.run(inL[n] + inR[n] * 0.5 + yr * fb);
    br[i] = lpR.run(yl * fb);
    out[0][n] = yl; out[1][n] = yr;
    if (++i >= d) i = 0;
  }
  return out;
}

console.log('rendering reverb + delay…');
const dly = pingpong(DELAY, BEAT * 0.75);
for (let n = 0; n < N; n++) { VERB[0][n] += dly[0][n] * 0.3; VERB[1][n] += dly[1][n] * 0.3; }
const rev = freeverb(VERB, 0.86, 0.25, 4);

// ---------- mix + master ----------
const rms = ([l, r], from = 0, to = N) => { let a = 0; for (let n = from; n < to; n++) a += l[n] * l[n] + r[n] * r[n]; return (10 * Math.log10(a / (2 * (to - from)) + 1e-12)).toFixed(1); };
if (process.env.DEBUG_MIX) {
  const g0 = S(SCENES.find((s) => s.id === 'water').start), g1 = S(SCENES.find((s) => s.id === 'eco').end);
  console.log('RMS dBFS (groove section): music', rms(MUSIC, g0, g1), 'drums', rms(DRUMS, g0, g1), 'fx', rms(FX, g0, g1), 'verb', rms(rev, g0, g1), 'delay', rms(dly, g0, g1));
}
const L = new Float32Array(N), R = new Float32Array(N);
const hpL = new Biquad('hp', 28), hpR = new Biquad('hp', 28);
for (let n = 0; n < N; n++) {
  const d = duck[n];
  L[n] = hpL.run(MUSIC[0][n] * d + DRUMS[0][n] + FX[0][n] * 1.9 + rev[0][n] + dly[0][n] * 0.55);
  R[n] = hpR.run(MUSIC[1][n] * d + DRUMS[1][n] + FX[1][n] * 1.9 + rev[1][n] + dly[1][n] * 0.55);
}
// normalise to a loudness-ish target, then soft-limit peaks
const mags = [];
for (let n = 0; n < N; n += 7) mags.push(Math.max(Math.abs(L[n]), Math.abs(R[n])));
mags.sort((a, b) => a - b);
const ref = mags[Math.floor(mags.length * 0.995)] || 1;
const g = 0.75 / ref;
const drive = 1.0;
for (let n = 0; n < N; n++) {
  L[n] = Math.tanh(L[n] * g * drive) / Math.tanh(drive);
  R[n] = Math.tanh(R[n] * g * drive) / Math.tanh(drive);
}
// fade the tail
const fadeFrom = S(DURATION + TAIL - 1.5);
for (let n = fadeFrom; n < N; n++) { const k = 1 - (n - fadeFrom) / (N - fadeFrom); L[n] *= k; R[n] *= k; }

// ---------- write WAV ----------
const outDir = path.join(ROOT, 'build');
fs.mkdirSync(outDir, { recursive: true });
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8);
buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let n = 0; n < N; n++) {
  buf.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(L[n] * 32767 * 0.97))), 44 + n * 4);
  buf.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(R[n] * 32767 * 0.97))), 46 + n * 4);
}
const out = path.join(outDir, 'soundtrack.wav');
fs.writeFileSync(out, buf);
console.log(`wrote ${out} (${(N / SR).toFixed(1)} s)`);
