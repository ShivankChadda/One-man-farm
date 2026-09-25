// Renders explainer/styleframe.html to explainer/styleframe.png
import path from 'node:path';
import { chromium } from 'playwright';
import { serve, ROOT } from '../scripts/server.js';

const srv = await serve();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', (e) => console.error('page error:', e.message));
await page.goto(`${srv.url}/explainer/styleframe.html`);
await page.waitForFunction(() => window.__ready);
await page.evaluate(() => window.__ready);
const out = path.join(ROOT, 'explainer', 'styleframe.png');
await page.screenshot({ path: out });
await browser.close();
srv.close();
console.log(out);
