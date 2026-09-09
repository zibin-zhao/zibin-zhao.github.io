import { test, expect, type Page, type TestInfo } from '@playwright/test';

const gallerySelector = '.spatial-home [data-gallery-scene][data-layout="field"]';
const anchorSelector = '.spatial-home a[data-spatial-anchor]';
const artifacts = [
  'research',
  'projects',
  'singularity',
  'medit',
  'about',
  'prompts',
  'cv',
  'contact',
] as const;
type DrawCounter = { __galleryDrawCalls: number };

test.beforeEach(async ({ page }) => {
  // Count real indexed WebGL draws, including subsequent animation frames.
  await page.addInitScript(() => {
    const counter = window as unknown as DrawCounter;
    counter.__galleryDrawCalls = 0;
    if (typeof WebGL2RenderingContext === 'undefined') return;
    const drawElements = WebGL2RenderingContext.prototype.drawElements;
    WebGL2RenderingContext.prototype.drawElements = function (
      this: WebGL2RenderingContext,
      ...args: Parameters<WebGL2RenderingContext['drawElements']>
    ) {
      if (
        this.canvas instanceof HTMLCanvasElement &&
        this.canvas.classList.contains('gallery-canvas')
      ) {
        counter.__galleryDrawCalls += 1;
      }
      return drawElements.apply(this, args);
    };
  });
});

async function expectReadingFallback(page: Page): Promise<void> {
  const gallery = page.locator(gallerySelector);
  await expect(gallery).toHaveAttribute('data-state', 'fallback');
  await expect(gallery.locator('[data-scene-fallback]')).toBeVisible();
  await expect(gallery.locator('[data-scene-fallback]')).toHaveCSS('opacity', '1');
  await expect(gallery.locator('canvas')).toHaveCSS('opacity', '0');
  await expect(page.locator('[data-gallery-controls]:visible')).toHaveCount(0);
  await expect(page.locator(anchorSelector)).toHaveCount(artifacts.length);
  for (const artifact of artifacts) {
    await expect(page.locator(`[data-spatial-anchor="${artifact}"]`)).toBeVisible();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

async function expectReadyOrExplicitFallback(page: Page, testInfo: TestInfo): Promise<boolean> {
  const gallery = page.locator(gallerySelector);
  await expect(gallery).toHaveAttribute('data-state', /^(ready|fallback)$/, { timeout: 15000 });
  // Probe independently with the application's options. A renderer failure on a
  // supported machine must fail the test rather than masquerade as no WebGL.
  const supported = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2', {
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
      failIfMajorPerformanceCaveat: false,
    });
    if (!context) return false;
    context.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  });
  if (!supported) {
    testInfo.annotations.push({
      type: 'webgl-unavailable',
      description:
        'This browser rejected WebGL2 with the production options. The explicit reading fallback was verified; animated rendering was not exercised.',
    });
    await test.step('WebGL2 unavailable: verify the complete reading fallback', async () => {
      await expectReadingFallback(page);
    });
    return false;
  }
  await expect(gallery).toHaveAttribute('data-state', 'ready');
  await expect(gallery.locator('canvas')).toBeVisible();
  await expect(gallery.locator('canvas')).toHaveCSS('opacity', '1');
  await expect(gallery.locator('[data-scene-fallback]')).toHaveCSS('opacity', '0');
  await expect(page.locator('[data-gallery-motion]')).toBeVisible();
  await expect(page.locator('[data-gallery-shuffle]')).toBeVisible();
  await expect(page.locator('[data-gallery-reset]')).toBeVisible();
  expect(
    await gallery.locator('canvas').evaluate((canvas: HTMLCanvasElement) => {
      const context = canvas.getContext('webgl2');
      return Boolean(
        context &&
        !context.isContextLost() &&
        context.drawingBufferWidth > 0 &&
        context.drawingBufferHeight > 0,
      );
    }),
  ).toBe(true);
  expect(
    await page.evaluate(() => (window as unknown as DrawCounter).__galleryDrawCalls),
  ).toBeGreaterThan(0);
  return true;
}

async function drawsOverInterval(page: Page): Promise<number> {
  return page.evaluate(async () => {
    const counter = window as unknown as DrawCounter;
    const before = counter.__galleryDrawCalls;
    // This bounded sampling interval measures actual drawing, not a state label.
    await new Promise((resolve) => window.setTimeout(resolve, 200));
    return counter.__galleryDrawCalls - before;
  });
}

async function canvasObjectPoint(page: Page, artifact: string): Promise<{ x: number; y: number }> {
  const anchor = page.locator(`[data-spatial-anchor="${artifact}"]`);
  await expect(anchor).toHaveAttribute('data-object-x', /^-?\d+(\.\d+)?$/);
  await expect(anchor).toHaveAttribute('data-object-y', /^-?\d+(\.\d+)?$/);
  const point = () =>
    anchor.evaluate((element) => {
      const bounds = document
        .querySelector('.spatial-home [data-gallery-scene]')!
        .getBoundingClientRect();
      return {
        x: bounds.left + Number((element as HTMLElement).dataset.objectX),
        y: bounds.top + Number((element as HTMLElement).dataset.objectY),
      };
    });
  const beforeScroll = await point();
  await page.evaluate(({ y }) => {
    window.scrollTo({
      top: Math.max(0, window.scrollY + y - innerHeight / 2),
      behavior: 'instant',
    });
  }, beforeScroll);
  const target = await point();
  // The regression must hit the rendered canvas, not an overlapping HTML link.
  expect(
    await page.evaluate(({ x, y }) => {
      const canvas = document.querySelector('.spatial-home .gallery-canvas');
      return document.elementFromPoint(x, y) === canvas;
    }, target),
    `${artifact}'s projected mesh point must receive canvas input`,
  ).toBe(true);
  return target;
}

test('spatial field renders WebGL when supported and fits the configured viewport', async ({
  page,
  isMobile,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  if (await expectReadyOrExplicitFallback(page, testInfo)) {
    await expect(page.locator(gallerySelector)).toHaveAttribute('data-mode', 'field');
    await expect(page.locator(gallerySelector)).toHaveAttribute('data-view', '0');
  }
  await expect(page.locator('.spatial-home')).toBeVisible();
  expect(page.viewportSize()?.width).toBe(isMobile ? 390 : 1440);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

for (const lang of ['en', 'zh'] as const) {
  test(`${lang} spatial artifacts preserve all destinations and usable projected positions`, async ({
    page,
    isMobile,
  }, testInfo) => {
    await page.goto(lang === 'en' ? '/' : '/zh/');
    const rendered = await expectReadyOrExplicitFallback(page, testInfo);
    await expect(page.locator(anchorSelector)).toHaveCount(artifacts.length);
    for (const artifact of artifacts) {
      const link = page.locator(`[data-spatial-anchor="${artifact}"]`);
      const sharedApplication = artifact === 'medit' || artifact === 'singularity';
      const prefix = lang === 'zh' && !sharedApplication ? '/zh' : '';
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', `${prefix}/${artifact}/`);
      await expect(link).not.toHaveAccessibleName('');
      if (rendered && !isMobile) {
        await expect(link).toHaveAttribute('data-projected', 'true');
        await expect(link).toBeInViewport({ ratio: 1 });
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.locator('[data-spatial-anchor="research"]').click();
    await expect(page).toHaveURL(new RegExp(`${lang === 'zh' ? '/zh' : ''}/research/$`));
  });
}

test('shuffle changes the installation viewpoint and reset restores its initial view', async ({
  page,
  isMobile,
}, testInfo) => {
  // A still scene makes the projection comparison independent of ambient motion.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  if (!(await expectReadyOrExplicitFallback(page, testInfo))) return;
  const gallery = page.locator(gallerySelector);
  await expect(gallery).toHaveAttribute('data-view', '0');
  const positions = () =>
    page.locator(anchorSelector).evaluateAll((links) =>
      links.map((link) => {
        const bounds = link.getBoundingClientRect();
        return { x: bounds.x, y: bounds.y };
      }),
    );
  const initial = await positions();
  await page.locator('[data-gallery-shuffle]').click();
  await expect(gallery).toHaveAttribute('data-view', '1');
  if (!isMobile) {
    await expect
      .poll(async () => {
        const changed = await positions();
        return changed.some(
          (point, i) => Math.hypot(point.x - initial[i].x, point.y - initial[i].y) > 8,
        );
      })
      .toBe(true);
  }
  await page.locator('[data-gallery-shuffle]').click();
  await expect(gallery).toHaveAttribute('data-view', '2');
  await page.locator('[data-gallery-reset]').click();
  await expect(gallery).toHaveAttribute('data-view', '0');
  if (!isMobile) {
    await expect
      .poll(async () => {
        const reset = await positions();
        return Math.max(
          ...reset.map((point, i) => Math.hypot(point.x - initial[i].x, point.y - initial[i].y)),
        );
      })
      .toBeLessThanOrEqual(6);
  }
  await expect(gallery).toHaveAttribute('data-motion', 'paused');
});

test('clicking a real scene object navigates through the canvas raycaster', async ({
  page,
  isMobile,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  if (!(await expectReadyOrExplicitFallback(page, testInfo))) return;
  // The mobile About caption overlaps its record. The orbit's center stone is
  // exposed there; both points lie inside actual pickable meshes.
  const artifact = isMobile ? 'singularity' : 'about';
  const point = await canvasObjectPoint(page, artifact);
  if (isMobile) await page.touchscreen.tap(point.x, point.y);
  else await page.mouse.click(point.x, point.y);
  await expect(page).toHaveURL(new RegExp(`/${artifact}/$`));
});

test('dragging a real scene object rotates the field without opening its link', async ({
  page,
  isMobile,
  context,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  if (!(await expectReadyOrExplicitFallback(page, testInfo))) return;
  const initialURL = page.url();
  const artifact = isMobile ? 'singularity' : 'about';
  const point = await canvasObjectPoint(page, artifact);
  const anchor = page.locator(`[data-spatial-anchor="${artifact}"]`);
  const initialObjectX = Number(await anchor.getAttribute('data-object-x'));
  const canvas = page.locator(`${gallerySelector} canvas`);
  const deltaX = point.x > page.viewportSize()!.width / 2 ? -64 : 64;
  const initialDraws = await page.evaluate(
    () => (window as unknown as DrawCounter).__galleryDrawCalls,
  );
  await page.evaluate(() => {
    const state = window as unknown as { __artifactClicks: number };
    state.__artifactClicks = 0;
    document.addEventListener(
      'click',
      (event) => {
        if ((event.target as Element | null)?.closest('a[data-spatial-anchor]')) {
          state.__artifactClicks += 1;
        }
      },
      true,
    );
  });
  if (isMobile) {
    // Chromium's real touch input exercises pointerType=touch and pan-y handling.
    const session = await context.newCDPSession(page);
    try {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: point.x, y: point.y, id: 1 }],
      });
      await expect(canvas).toHaveAttribute('data-dragging', 'true');
      for (let step = 1; step <= 4; step += 1) {
        await session.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x: point.x + (deltaX * step) / 4, y: point.y, id: 1 }],
        });
      }
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } finally {
      await session.detach();
    }
  } else {
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await expect(canvas).toHaveAttribute('data-dragging', 'true');
    await page.mouse.move(point.x + deltaX, point.y, { steps: 4 });
    await page.mouse.up();
  }
  await expect(canvas).toHaveAttribute('data-dragging', 'false');
  await expect
    .poll(() => page.evaluate(() => (window as unknown as DrawCounter).__galleryDrawCalls))
    .toBeGreaterThan(initialDraws);
  await expect
    .poll(async () => Math.abs(Number(await anchor.getAttribute('data-object-x')) - initialObjectX))
    .toBeGreaterThan(1);
  expect(
    await page.evaluate(() => (window as unknown as { __artifactClicks: number }).__artifactClicks),
  ).toBe(0);
  await expect(page).toHaveURL(initialURL);
  await expect(page.locator(gallerySelector)).toHaveAttribute('data-motion', 'paused');
});

test('motion control stops actual animation draws and can resume them', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  if (!(await expectReadyOrExplicitFallback(page, testInfo))) return;
  const gallery = page.locator(gallerySelector);
  const motion = page.locator('[data-gallery-motion]');
  await expect(gallery).toHaveAttribute('data-motion', 'running');
  await expect.poll(() => drawsOverInterval(page)).toBeGreaterThan(0);
  await motion.click();
  await expect(gallery).toHaveAttribute('data-motion', 'paused');
  await expect(motion).toHaveAttribute('aria-pressed', 'true');
  await expect(motion).toHaveAccessibleName('Play motion');
  // A camera already responding to the pointer is allowed to settle after pause.
  await expect.poll(() => drawsOverInterval(page), { timeout: 8000 }).toBe(0);
  expect(await drawsOverInterval(page)).toBe(0);
  await motion.click();
  await expect(gallery).toHaveAttribute('data-motion', 'running');
  await expect(motion).toHaveAttribute('aria-pressed', 'false');
  await expect(motion).toHaveAccessibleName('Pause motion');
  await expect.poll(() => drawsOverInterval(page)).toBeGreaterThan(0);
});

test('reduced motion initially renders a still scene and honors later preference changes', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/zh/');
  if (!(await expectReadyOrExplicitFallback(page, testInfo))) return;
  const gallery = page.locator(gallerySelector);
  const motion = page.locator('[data-gallery-motion]');
  await expect(gallery).toHaveAttribute('data-motion', 'paused');
  await expect(motion).toHaveAttribute('aria-pressed', 'true');
  await expect(motion).toHaveAccessibleName('开启动效');
  await expect.poll(() => drawsOverInterval(page), { timeout: 8000 }).toBe(0);
  await page.locator('[data-gallery-shuffle]').click();
  await expect(gallery).toHaveAttribute('data-view', '1');
  await expect(gallery).toHaveAttribute('data-motion', 'paused');
  await gallery.scrollIntoViewIfNeeded();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(gallery).toHaveAttribute('data-motion', 'running');
  await expect(motion).toHaveAccessibleName('暂停动效');
  await expect.poll(() => drawsOverInterval(page)).toBeGreaterThan(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(gallery).toHaveAttribute('data-motion', 'paused');
  await expect.poll(() => drawsOverInterval(page), { timeout: 8000 }).toBe(0);
});

test('no WebGL exposes the fallback and preserves native artifact navigation', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      contextId: string,
      ...args: unknown[]
    ) {
      if (contextId === 'webgl2') return null;
      return Reflect.apply(original, this, [contextId, ...args]);
    } as typeof original;
  });
  await page.goto('/zh/');
  await expectReadingFallback(page);
  expect(await page.evaluate(() => (window as unknown as DrawCounter).__galleryDrawCalls)).toBe(0);
  await page.locator('[data-spatial-anchor="research"]').click();
  await expect(page).toHaveURL(/\/zh\/research\/$/);
  await expect(page.locator('h1')).toBeVisible();
  await page.goto('/zh/');
  await expectReadingFallback(page);
  await page.locator('[data-spatial-anchor="projects"]').click();
  await expect(page).toHaveURL(/\/zh\/projects\/$/);
  await expect(page.locator('#medit')).toBeVisible();
  expect(errors).toEqual([]);
});

test('native keyboard controls move the viewpoint and activate artifact links', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  const rendered = await expectReadyOrExplicitFallback(page, testInfo);
  if (rendered) {
    await page.locator('[data-gallery-shuffle]').focus();
    await page.keyboard.press('Space');
    await expect(page.locator(gallerySelector)).toHaveAttribute('data-view', '1');
    await page.locator('[data-gallery-reset]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator(gallerySelector)).toHaveAttribute('data-view', '0');
    await page.locator('[data-gallery-motion]').focus();
    await page.keyboard.press('Space');
    await expect(page.locator(gallerySelector)).toHaveAttribute('data-motion', 'paused');
  }
  const link = page.locator('[data-spatial-anchor="about"]');
  await expect(link).toBeVisible();
  await link.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/about\/$/);
  await expect(page.locator('h1')).toBeVisible();
});

test('all artifact links and reading destinations remain available without JavaScript', async ({
  browser,
  isMobile,
}, testInfo) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL: testInfo.project.use.baseURL,
    viewport: isMobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
  });
  try {
    const page = await context.newPage();
    await page.goto('/zh/');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator(anchorSelector)).toHaveCount(artifacts.length);
    for (const artifact of artifacts) {
      await expect(page.locator(`[data-spatial-anchor="${artifact}"]`)).toBeVisible();
    }
    await expect(page.locator('[data-gallery-controls]:visible')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.locator('[data-spatial-anchor="prompts"]').click();
    await expect(page).toHaveURL(/\/zh\/prompts\/$/);
    await page.locator('#step-8 summary').click();
    await expect(page.locator('#step-8 .prompt-text')).toBeVisible();
  } finally {
    await context.close();
  }
});

test('the instrument changes its rendered geometry and can reopen with reduced motion', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  if (!(await expectReadyOrExplicitFallback(page, testInfo))) return;
  const gallery = page.locator(gallerySelector);
  const toggle = page.locator('[data-gallery-open]');
  await expect(toggle).toHaveAccessibleName('Close the instrument');
  await expect(gallery).toHaveAttribute('data-openness', '1.000');
  await expect.poll(() => drawsOverInterval(page)).toBe(0);
  const masks = [
    page.locator(anchorSelector),
    page.locator('.field-controls'),
    page.locator('.field-instructions'),
    page.locator('.field-identity'),
    page.locator('.site-header'),
    page.locator('.site-footer'),
  ];
  const before = await gallery.locator('canvas').screenshot({ mask: masks });
  await toggle.click();
  await expect(toggle).toHaveAccessibleName('Open the instrument');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(gallery).toHaveAttribute('data-openness', '0.000');
  await expect.poll(() => drawsOverInterval(page)).toBe(0);
  const after = await gallery.locator('canvas').screenshot({ mask: masks });
  // UI is masked and ambient motion is paused, so the actual artwork must change.
  expect(before.equals(after)).toBe(false);
  await toggle.click();
  await expect(gallery).toHaveAttribute('data-openness', '1.000');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(gallery).toHaveAttribute('data-motion', 'paused');
});

test('losing an active WebGL context preserves the readable collection', async ({
  page,
}, testInfo) => {
  await page.goto('/zh/');
  if (!(await expectReadyOrExplicitFallback(page, testInfo))) return;
  const lost = await page
    .locator(`${gallerySelector} canvas`)
    .evaluate((canvas: HTMLCanvasElement) => {
      const extension = canvas.getContext('webgl2')?.getExtension('WEBGL_lose_context');
      if (!extension) return false;
      extension.loseContext();
      return true;
    });
  expect(lost).toBe(true);
  await expectReadingFallback(page);
  await page.locator('[data-spatial-anchor="projects"]').click();
  await expect(page).toHaveURL(/\/zh\/projects\/$/);
});
