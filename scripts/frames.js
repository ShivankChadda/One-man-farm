// Grab frames from a page for review.
//   node scripts/frames.js --page explainer 3 12.5 40      → build/frames/<page>-t0012.50.png
//   node scripts/frames.js --page explainer --scene harvest → 6 frames across one scene
//   node scripts/frames.js --page explainer --sheet 4      → contact sheets, one frame every 4 s
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import { serve, ROOT } from './server.js';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
const page = opt('page', 'explainer');
const sceneId = opt('scene', null);
const sheet = opt('sheet', null);
const out = path.join(ROOT, 'build', 'frames');
fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(out)) if (f.endsWith('.png')) fs.unlinkSync(path.join(out, f));

const srv = await serve();
const browser = await chromium.launch();
const pg = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
pg.on('pageerror', (e) => console.error('PAGE ERROR:', e.message));
pg.on('console', (m) => m.type() === 'error' && console.error('console:', m.text()));
await pg.goto(`${srv.url}/${page}/index.html`);
await pg.waitForFunction(() => window.__ready);
await pg.evaluate(() => window.__ready);
let times = args.map(Number).filter((x) => !Number.isNaN(x));
if (sceneId) {
  const tm = JSON.parse(fs.readFileSync(path.join(ROOT, page, 'timing.json'), 'utf8'));
  const sc = tm.scenes.find((x) => x.id === sceneId);
  for (let k = 0; k < 6; k++) times.push(sc.start + ((k + 0.5) / 6) * (sc.end - sc.start));
}
if (sheet) {
  const d = await pg.evaluate(() => window.__duration);
  for (let t = +sheet / 2; t < d; t += +sheet) times.push(t);
}
const files = [];
for (const t of times) {
  await pg.evaluate((t) => window.__seek(t), t);
  const f = path.join(out, `${page}-t${t.toFixed(2).padStart(7, '0')}.png`);
  await pg.screenshot({ path: f });
  files.push(f);
}
await browser.close();
srv.close();
console.log(files.length + ' frames → build/frames');
// 2x2 grids to review quickly
for (let i = 0; i < files.length; i += 4) {
  const g = files.slice(i, i + 4);
  while (g.length < 4) g.push(g[g.length - 1]);
  const o = path.join(out, `grid-${String(i / 4).padStart(2, '0')}.png`);
  spawnSync('ffmpeg', ['-y', '-loglevel', 'error', ...g.flatMap((x) => ['-i', x]), '-filter_complex',
    '[0]scale=960:540[a];[1]scale=960:540[b];[2]scale=960:540[c];[3]scale=960:540[d];[a][b][c][d]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0', o]);
}
