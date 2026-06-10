// HyperFrames-style deterministic renderer: one persistent headless Chrome via the
// DevTools Protocol seeks window.applyT(t) frame-by-frame, then FFmpeg encodes to MP4.
// Pure Node built-ins (Node 22+ global WebSocket/fetch) — no npm dependencies.
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const W = 1280, H = 720, FPS = 30, PORT = 9333;
const framesDir = path.join(DIR, 'frames');
rmSync(framesDir, { recursive: true, force: true });
mkdirSync(framesDir, { recursive: true });

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio',
  `--remote-debugging-port=${PORT}`, '--user-data-dir=/tmp/hfcdp-render',
  `--window-size=${W},${H}`, '--no-first-run', '--no-default-browser-check',
  '--force-device-scale-factor=1', 'about:blank',
], { stdio: 'ignore' });

for (let i = 0; i < 80; i++) { try { if ((await fetch(`http://localhost:${PORT}/json/version`)).ok) break; } catch {} await sleep(200); }
let target = null;
for (let i = 0; i < 40; i++) { try { target = (await (await fetch(`http://localhost:${PORT}/json`)).json()).find(t => t.type === 'page' && t.webSocketDebuggerUrl); if (target) break; } catch {} await sleep(200); }
if (!target) { chrome.kill(); throw new Error('no devtools page target'); }

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let _id = 0; const pending = new Map(); const waiters = [];
ws.onmessage = (ev) => { const m = JSON.parse(ev.data);
  if (m.id !== undefined && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result); }
  else if (m.method) for (const w of waiters.slice()) if (w.method === m.method) { waiters.splice(waiters.indexOf(w), 1); w.resolve(m.params); }
};
const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++_id; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
const waitEvent = (method) => new Promise((resolve) => waiters.push({ method, resolve }));

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
const loaded = waitEvent('Page.loadEventFired');
await send('Page.navigate', { url: `file://${DIR}/intro.html` });
await loaded;
await send('Runtime.evaluate', { expression: `(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.complete?1:new Promise(r=>{i.onload=i.onerror=r})));return 1;})()`, awaitPromise: true });
await sleep(200);

const DURATION = (await send('Runtime.evaluate', { expression: 'window.__DURATION' })).result.value;
const N = Math.round(DURATION * FPS);
for (let i = 0; i < N; i++) {
  await send('Runtime.evaluate', { expression: `applyT(${(i / FPS).toFixed(4)})` });
  const { data } = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: W, height: H, scale: 1 }, captureBeyondViewport: false });
  writeFileSync(path.join(framesDir, `f_${String(i).padStart(5, '0')}.png`), Buffer.from(data, 'base64'));
  if (i % 60 === 0) process.stdout.write(`  frame ${i}/${N}\n`);
}
ws.close(); chrome.kill();
console.log(`rendered ${N} frames @ ${FPS}fps`);
execFileSync('ffmpeg', ['-y', '-framerate', String(FPS), '-i', path.join(framesDir, 'f_%05d.png'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-movflags', '+faststart', path.join(DIR, '..', 'public', 'intro.mp4')], { stdio: 'ignore' });
console.log('encoded -> public/intro.mp4');
