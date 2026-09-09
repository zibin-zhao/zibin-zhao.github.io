import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { test as base, expect, type Page } from '@playwright/test';

type Version = 'baseline' | 'current';
type RequestRecord = { version: Version; path: string };
type DemoServer = {
  origin: string;
  setVersion: (version: Version) => void;
  requests: RequestRecord[];
};

const publicRoot = resolve('public/medit');
const fixtureRoot = resolve('tests/fixtures/medit-9962637');
const versions = {
  baseline: {
    index: readFileSync(`${fixtureRoot}/index.html.fixture`, 'utf8'),
    worker: readFileSync(`${fixtureRoot}/sw.js.fixture`, 'utf8'),
  },
  current: {
    index: readFileSync(`${publicRoot}/index.html`, 'utf8'),
    worker: readFileSync(`${publicRoot}/sw.js`, 'utf8'),
  },
};
const revision = (version: Version) =>
  createHash('md5').update(versions[version].index).digest('hex');
const pageTitle = (version: Version) =>
  versions[version].index.match(/<title>([^<]+)<\/title>/)![1];
const assetPaths = [
  ...new Set([...versions.current.worker.matchAll(/\{url:"([^"]+)"/g)].map((match) => match[1])),
];

const contentTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.webmanifest': 'application/manifest+json',
};

const test = base.extend<{ demo: DemoServer }>({
  demo: async ({ browserName }, use) => {
    let version: Version = 'current';
    const requests: RequestRecord[] = [];
    const server = createServer((request, response) => {
      const url = new URL(request.url!, 'http://127.0.0.1');
      requests.push({ version, path: `${url.pathname}${url.search}` });
      const relative = url.pathname === '/medit/' ? 'index.html' : url.pathname.slice(7);
      const path = resolve(publicRoot, relative);
      if (!url.pathname.startsWith('/medit/') || !path.startsWith(`${publicRoot}${sep}`)) {
        response.writeHead(404).end();
        return;
      }
      try {
        const body =
          relative === 'index.html'
            ? versions[version].index
            : relative === 'sw.js'
              ? versions[version].worker
              : readFileSync(path);
        response.writeHead(200, {
          'Content-Type': contentTypes[extname(path)] ?? 'application/octet-stream',
          'Cache-Control': 'no-store',
        });
        response.end(body);
      } catch {
        response.writeHead(404).end();
      }
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string')
      throw new Error(`Missing local ${browserName} test port`);
    try {
      await use({
        origin: `http://127.0.0.1:${address.port}`,
        requests,
        setVersion(next) {
          version = next;
        },
      });
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  },
});

test.beforeEach(async ({ context }) => {
  // Fonts and weather are optional remote services. The shipped local app and
  // worker run unmodified, without requiring those services for cache evidence.
  await context.route('https://**/*', (route) => route.abort());
});

async function waitForControl(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller?.state))
    .toBe('activated');
}

async function precache(page: Page) {
  return page.evaluate(async () => {
    const names = (await caches.keys()).filter((name) => name.startsWith('workbox-precache'));
    const entries = await Promise.all(
      names.map(async (name) => {
        const cache = await caches.open(name);
        const requests = await cache.keys();
        return Promise.all(
          requests.map(async (request) => {
            const url = new URL(request.url);
            return {
              cache: name,
              path: url.pathname.replace(/^\/medit\//, ''),
              revision: url.searchParams.get('__WB_REVISION__'),
              body: url.pathname.endsWith('/index.html')
                ? await (await cache.match(request))!.text()
                : undefined,
            };
          }),
        );
      }),
    );
    return entries.flat();
  });
}

async function expectCachedVersion(page: Page, version: Version): Promise<void> {
  // clientsClaim can fire before Workbox finishes its activation cleanup.
  // Wait for that lifecycle step, then require exactly one current document.
  await expect
    .poll(async () =>
      (await precache(page))
        .filter((entry) => entry.path === 'index.html')
        .map((entry) => entry.revision),
    )
    .toEqual([revision(version)]);
  const entries = await precache(page);
  expect(entries.map((entry) => entry.path).sort()).toEqual([...assetPaths].sort());
  const documents = entries.filter((entry) => entry.path === 'index.html');
  expect(documents).toHaveLength(1);
  expect(documents[0].revision).toBe(revision(version));
  expect(documents[0].body).toBe(versions[version].index);
}

async function storedDraft(page: Page): Promise<unknown> {
  return page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const open = indexedDB.open('medit');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const database = open.result;
          const transaction = database.transaction('settings');
          const get = transaction.objectStore('settings').get('draft');
          get.onsuccess = () => resolve(get.result?.value);
          get.onerror = () => reject(get.error);
          transaction.oncomplete = () => database.close();
        };
      }),
  );
}

test('Medit first installation precaches the current entry and launches offline', async ({
  page,
  context,
  demo,
}, testInfo) => {
  await page.goto(`${demo.origin}/medit/`);
  await expect(page).toHaveTitle(pageTitle('current'));
  await expect(page.locator('#root')).not.toBeEmpty();
  await waitForControl(page);
  await expectCachedVersion(page, 'current');

  await context.setOffline(true);
  const offline = await page.goto(`${demo.origin}/medit/?offline=first-install#/write`);
  expect(offline?.status()).toBe(200);
  expect(offline?.fromServiceWorker()).toBe(true);
  await expect(page).toHaveTitle(pageTitle('current'));
  await expect(page.locator('meta[name="viewport"]')).not.toHaveAttribute(
    'content',
    /maximum-scale|user-scalable=no/,
  );
  await expect(page.getByRole('textbox', { name: 'Journal entry' })).toBeVisible();
  await expectCachedVersion(page, 'current');
  await testInfo.attach('medit-install-offline', {
    body: JSON.stringify({
      source: 'public/medit',
      indexRevision: revision('current'),
      precachedPaths: assetPaths,
      offlineResponseFromServiceWorker: offline?.fromServiceWorker(),
      requests: demo.requests,
    }),
    contentType: 'application/json',
  });
});

test('Medit upgrades an existing controlled client and retains its draft offline', async ({
  page,
  context,
  demo,
}, testInfo) => {
  demo.setVersion('baseline');
  await page.goto(`${demo.origin}/medit/#/write`);
  await expect(page).toHaveTitle(pageTitle('baseline'));
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /maximum-scale/);
  await waitForControl(page);
  await expectCachedVersion(page, 'baseline');
  const draft = `Local cache upgrade regression: ${testInfo.project.name}`;
  await page.getByRole('textbox', { name: 'Journal entry' }).fill(draft);
  await expect.poll(() => storedDraft(page)).toBe(draft);

  demo.setVersion('current');
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    const previous = navigator.serviceWorker.controller;
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error('Worker did not claim the old client')),
        15000,
      );
      const changed = () => {
        if (navigator.serviceWorker.controller === previous) return;
        clearTimeout(timeout);
        navigator.serviceWorker.removeEventListener('controllerchange', changed);
        resolve();
      };
      navigator.serviceWorker.addEventListener('controllerchange', changed);
      registration.update().catch(reject);
    });
  });
  await expectCachedVersion(page, 'current');
  expect(revision('current')).not.toBe(revision('baseline'));
  expect(
    demo.requests.filter((request) => request.version === 'current').map((request) => request.path),
  ).toContain('/medit/index.html');

  await context.setOffline(true);
  const offline = await page.goto(`${demo.origin}/medit/?offline=upgraded-client#/write`);
  expect(offline?.status()).toBe(200);
  expect(offline?.fromServiceWorker()).toBe(true);
  await expect(page).toHaveTitle(pageTitle('current'));
  await expect(page.locator('meta[name="viewport"]')).not.toHaveAttribute(
    'content',
    /maximum-scale|user-scalable=no/,
  );
  await expect(page.getByRole('textbox', { name: 'Journal entry' })).toHaveValue(draft);
  expect(await storedDraft(page)).toBe(draft);
  await expectCachedVersion(page, 'current');
  await testInfo.attach('medit-upgrade-offline', {
    body: JSON.stringify({
      baselineCommit: '9962637',
      baselineIndexRevision: revision('baseline'),
      currentIndexRevision: revision('current'),
      offlineResponseFromServiceWorker: offline?.fromServiceWorker(),
      draftPreserved: true,
      requests: demo.requests,
    }),
    contentType: 'application/json',
  });
});
