// Render individual frames for review.
//   node scripts/stills.js 3.5 12 40.25        → build/stills/t-003.500.png …
//   node scripts/stills.js --scene harvestA     → 8 frames across that scene
//   node scripts/stills.js --sheet 2            → contact sheet, one frame every 2 s
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import { serve, ROOT } from './server.js';
import { SCENES, DURATION } from '../video/js/timeline.js';

const args = process.argv.slice(2);
let times = [];
let sheet = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--scene') {
    const sc = SCENES.find((s) => s.id === args[++i]);
    const n = 8;
    for (let k = 0; k < n; k++) times.push(sc.start + ((k + 0.5) / n) * (sc.end - sc.start));
  } else if (args[i] === '--sheet') {
    const step = parseFloat(args[++i] || '2');
    for (let t = step / 2; t < DURATION; t += step) times.push(t);
    sheet = step;
  } else times.push(parseFloat(args[i]));
}
if (!times.length) times = SCENES.map((s) => s.start + (s.end - s.start) * 0.7);

const out = path.join(ROOT, 'build', 'stills');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const srv = await serve();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', (e) => console.error('PAGE ERROR:', e.message));
page.on('console', (m) => m.type() === 'error' && console.error('console:', m.text()));
await page.goto(`${srv.url}/video/index.html`);
await page.evaluate(() => window.__ready);
const files = [];
for (const t of times) {
  await page.evaluate((t) => window.__seek(t), t);
  const f = path.join(out, `t-${t.toFixed(3).padStart(7, '0')}.png`);
  await page.screenshot({ path: f, type: 'png' });
  files.push(f);
  const sc = SCENES.find((s) => t >= s.start && t < s.end);
  console.log(f, sc ? `(${sc.id} +${((t - sc.start) / (60 / 120)).toFixed(2)} beats)` : '');
}
await browser.close();
srv.close();

if (sheet) {
  const cols = 5;
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-pattern_type', 'glob', '-i', path.join(out, 't-*.png'),
    '-vf', `scale=384:216,tile=${cols}x${Math.ceil(files.length / cols)}:padding=4:color=black`, '-frames:v', '1', path.join(out, 'sheet.png')]);
  if (r.status !== 0) console.error(String(r.stderr));
  else console.log(path.join(out, 'sheet.png'));
}
