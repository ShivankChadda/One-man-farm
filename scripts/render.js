// Frame-accurate renderer: Playwright seeks the page to each frame's time,
// captures it over CDP and pipes JPEGs into ffmpeg. Frames are split across
// parallel workers (one browser page + one ffmpeg each), then concatenated
// and muxed with the loudness-normalised soundtrack.
//
//   node scripts/render.js                     full 1080p render → out/one-man-farm.mp4
//   node scripts/render.js --fps 15 --workers 3 --out build/preview.mp4
//   node scripts/render.js --from 18 --to 34    render a section (seconds)
//   node scripts/render.js --mux-only           re-mux new audio onto the last rendered frames
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import { serve, ROOT } from './server.js';
import { DURATION, FPS } from '../video/js/timeline.js';

const arg = (name, def) => {
  const i = process.argv.indexOf('--' + name);
  return i > 0 ? process.argv[i + 1] : def;
};
const fps = parseFloat(arg('fps', FPS));
const workers = parseInt(arg('workers', Math.max(1, Math.min(4, os.cpus().length - 1))), 10);
const from = parseFloat(arg('from', 0));
const END = DURATION + 1.5; // let the last chord ring over black
const to = Math.min(parseFloat(arg('to', END)), END);
const out = path.resolve(ROOT, arg('out', 'out/one-man-farm.mp4'));
const crf = arg('crf', '17');
const quality = parseInt(arg('jpeg', '94'), 10);
const muxOnly = process.argv.includes('--mux-only');

const f0 = Math.round(from * fps), f1 = Math.round(to * fps);
const total = f1 - f0;
const segDir = path.join(ROOT, 'build', 'segments');
const video = path.join(segDir, 'video.mp4');
if (!muxOnly) {
  fs.rmSync(segDir, { recursive: true, force: true });
  fs.mkdirSync(segDir, { recursive: true });
} else if (!fs.existsSync(video)) {
  console.error('--mux-only: no rendered frames at ' + path.relative(ROOT, video));
  process.exit(1);
}
fs.mkdirSync(path.dirname(out), { recursive: true });

const wav = path.join(ROOT, 'build', 'soundtrack.wav');
if (!fs.existsSync(wav)) {
  console.log('soundtrack missing → generating');
  spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'audio.js')], { stdio: 'inherit' });
}

if (!muxOnly) await renderFrames();

async function renderFrames() {
  console.log(`Rendering ${total} frames @ ${fps} fps (${from.toFixed(2)}s → ${to.toFixed(2)}s) with ${workers} workers`);
  const srv = await serve();
  const browser = await chromium.launch({ args: ['--disable-gpu-vsync', '--disable-frame-rate-limit'] });
  const t0 = Date.now();
  let done = 0;

  function progress() {
    const el = (Date.now() - t0) / 1000;
    const rate = done / el;
    process.stdout.write(`\r  ${done}/${total} frames  ${rate.toFixed(1)} fps  eta ${((total - done) / Math.max(rate, 0.01)).toFixed(0)}s   `);
  }

  async function worker(k, a, b) {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    page.on('pageerror', (e) => console.error(`\n[worker ${k}] page error:`, e.message));
    await page.goto(`${srv.url}/video/index.html`);
    await page.evaluate(() => window.__ready);
    const cdp = await page.context().newCDPSession(page);
    const seg = path.join(segDir, `seg-${String(k).padStart(2, '0')}.mp4`);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', crf, '-pix_fmt', 'yuv420p', '-tune', 'animation', '-r', String(fps), seg], { stdio: ['pipe', 'inherit', 'inherit'] });
    const closed = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg exited ' + c)))));
    for (let f = a; f < b; f++) {
      await page.evaluate((t) => window.__seek(t), f / fps);
      const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality, optimizeForSpeed: true });
      const buf = Buffer.from(data, 'base64');
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
      done++;
      if (done % 10 === 0) progress();
    }
    ff.stdin.end();
    await closed;
    await page.close();
    return seg;
  }

  const per = Math.ceil(total / workers);
  const jobs = [];
  for (let k = 0; k < workers; k++) {
    const a = f0 + k * per, b = Math.min(f1, a + per);
    if (a < b) jobs.push(worker(k, a, b));
  }
  const segs = await Promise.all(jobs);
  progress();
  console.log(`\n  frames done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  await browser.close();
  srv.close();

  // concat video segments
  const list = path.join(segDir, 'list.txt');
  fs.writeFileSync(list, segs.map((s) => `file '${s}'`).join('\n'));
  run(['-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', video]);
}

// two-pass loudness normalisation to -14 LUFS / -1 dBTP (linear gain)
const probe = spawnSync('ffmpeg', ['-hide_banner', '-ss', String(from), '-t', String(to - from), '-i', wav,
  '-af', 'loudnorm=I=-14:TP=-1.0:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' });
const m = JSON.parse(probe.stderr.slice(probe.stderr.lastIndexOf('{')));
const ln = `loudnorm=I=-14:TP=-1.0:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`;
const fadeOut = Math.max(0, to - from - 0.6);
run(['-i', video, '-ss', String(from), '-t', String(to - from), '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
  '-af', `${ln},alimiter=limit=0.8:attack=2:release=60:level=false,afade=t=out:st=${fadeOut.toFixed(3)}:d=0.6,aresample=48000`, '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', '-shortest', out]);
console.log(`✓ ${path.relative(ROOT, out)}  (${(fs.statSync(out).size / 1e6).toFixed(1)} MB)`);

function run(args) {
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' });
  if (r.status !== 0) { console.error('ffmpeg failed:', args.join(' ')); process.exit(1); }
}
