import { chromium } from '@playwright/test';
import process from 'node:process';
import { URL } from 'node:url';

const args = process.argv.slice(2);
const ogOnly = args.includes('--og-only');
const positional = args.filter((argument) => !argument.startsWith('--'));
if (args.some((argument) => argument.startsWith('--') && argument !== '--og-only'))
  throw new Error('Usage: node tools/generate-exports.mjs [local-preview-url] [--og-only]');
if (positional.length > 1) throw new Error('Provide only one local preview URL.');
const baseURL = (positional[0] ?? 'http://127.0.0.1:43222').replace(/\/$/, '');
const previewURL = new URL(baseURL);
if (
  !['http:', 'https:'].includes(previewURL.protocol) ||
  !['127.0.0.1', 'localhost'].includes(previewURL.hostname)
)
  throw new Error('Use a local preview URL.');

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  if (!ogOnly) {
    await page.goto(baseURL + '/cv/', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => {
      const walker = document.createTreeWalker(document.body, 4);
      while (walker.nextNode())
        walker.currentNode.textContent =
          walker.currentNode.textContent?.replace(/[\u2011\u2013\u2014]/g, '-') ?? '';
    });
    // Keep the introduction first in PDF text extraction as well as on the page.
    await page.addStyleTag({
      content: '@media print { .page-intro { position: static; } }',
    });
    await page.pdf({
      path: 'public/cv.pdf',
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', right: '17mm', bottom: '18mm', left: '17mm' },
      tagged: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate:
        '<div style="font:8px Arial;color:#53635c;width:100%;padding:0 17mm;display:flex;justify-content:space-between"><span>Zibin Zhao | Curriculum vitae</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>',
    });
  }

  await page.goto(baseURL + '/', { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    await document.fonts.ready;
    // Images in later, hidden project panels intentionally remain lazy-loaded.
    await Promise.all(
      [...document.querySelectorAll('.grail-hero img')].map((image) => image.decode()),
    );
  });
  // Fit the current CSS 3D hero to the sharing frame using its existing DOM and poses.
  await page.addStyleTag({
    content: `
      .grail-hero { min-height: 0; height: 520px; max-height: none; }
      .grail-hero .card-field { inset: 140px 7% 140px; }
    `,
  });
  await page.waitForFunction(
    () => {
      const hero = document.querySelector('.grail-home .grail-hero');
      const bounds = hero?.getBoundingClientRect();
      const cards = hero?.querySelectorAll('.orbit-card');
      return (
        bounds?.width === 1200 &&
        bounds.bottom === 630 &&
        cards?.length === 9 &&
        [...cards].every((card) => card.getBoundingClientRect().height > 0)
      );
    },
    undefined,
    { timeout: 15000 },
  );
  await page.screenshot({ path: 'public/og.png', animations: 'disabled', fullPage: false });
  console.log(
    `Generated ${ogOnly ? 'public/og.png' : 'public/cv.pdf and public/og.png'} from the local site (Grail CSS 3D hero, nine works, 1200 x 630).`,
  );
} finally {
  await browser.close();
}
