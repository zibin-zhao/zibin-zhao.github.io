// One-off: headless-Chrome screenshot of the Yaos calendar view via DevTools Protocol.
// Pure Node built-ins (Node 22+). Usage: node tools/shot-yaos.mjs <url> <out.png>
import { spawn, execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const URL = process.argv[2] || 'https://zibin-zhao.github.io/Yaos/';
const OUT = process.argv[3] || '/tmp/yaos.png';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const W = 1440, H = 1080, PORT = 9344;

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio',
  `--remote-debugging-port=${PORT}`, '--user-data-dir=/tmp/yaos-shot',
  `--window-size=${W},${H}`, '--no-first-run', '--no-default-browser-check',
  '--force-device-scale-factor=2', 'about:blank',
], { stdio: 'ignore' });

try {
  for (let i = 0; i < 80; i++) { try { if ((await fetch(`http://localhost:${PORT}/json/version`)).ok) break; } catch { /* Chrome may still be starting. */ } await sleep(200); }
  let target = null;
  for (let i = 0; i < 40; i++) { try { target = (await (await fetch(`http://localhost:${PORT}/json`)).json()).find(t => t.type === 'page' && t.webSocketDebuggerUrl); if (target) break; } catch { /* DevTools may still be starting. */ } await sleep(200); }
  if (!target) throw new Error('no devtools page target');

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let _id = 0; const pending = new Map(); const waiters = [];
  ws.onmessage = (ev) => { const m = JSON.parse(ev.data);
    if (m.id !== undefined && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); if (m.error) p.reject(new Error(JSON.stringify(m.error))); else p.resolve(m.result); }
    else if (m.method) for (const w of waiters.slice()) if (w.method === m.method) { waiters.splice(waiters.indexOf(w), 1); w.resolve(m.params); }
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++_id; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
  const waitEvent = (method) => new Promise((resolve) => waiters.push({ method, resolve }));

  await send('Page.enable');
  await send('Runtime.enable');
  const loaded = waitEvent('Page.loadEventFired');
  await send('Page.navigate', { url: URL });
  await loaded;
  await sleep(1500);

  // Click the 日历 (calendar) nav tab — match an element whose OWN trimmed text is exactly 日历/Calendar.
  const clicked = await send('Runtime.evaluate', {
    expression: `(() => {
      const cands = [...document.querySelectorAll('a,button,[role="tab"],li,span,div')]
        .filter(e => e.offsetParent !== null && /^(日历|Calendar)$/i.test((e.textContent || '').trim()));
      // prefer the deepest (most specific) clickable
      const el = cands.sort((a,b) => (b.compareDocumentPosition(a) & 8 ? 1 : -1))[0] || cands[0];
      if (!el) return { ok:false };
      (el.closest('a,button,[role="tab"],li') || el).click();
      return { ok:true, tag: el.tagName, n: cands.length };
    })()`,
    returnByValue: true,
  });
  console.log('calendar tab clicked:', JSON.stringify(clicked.result.value));
  await sleep(1500);

  // Verify a calendar grid actually rendered (look for a month label like 2026 + many day cells).
  const view = await send('Runtime.evaluate', {
    expression: `(() => {
      const txt = document.body.innerText;
      const hasMonth = /(一月|二月|三月|四月|五月|六月|七月|八月|九月|十月|十一月|十二月|January|February)/.test(txt) && /20\\d\\d/.test(txt);
      const cells = document.querySelectorAll('[class*="day"],[class*="cell"],td').length;
      return { hasMonth, cells };
    })()`,
    returnByValue: true,
  });
  console.log('view check:', JSON.stringify(view.result.value));
  await sleep(800);

  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(OUT, Buffer.from(data, 'base64'));
  console.log('saved', OUT);
  ws.close();
} finally {
  chrome.kill();
  try { execSync('pkill -f yaos-shot 2>/dev/null'); } catch { /* The process may already be gone. */ }
}
