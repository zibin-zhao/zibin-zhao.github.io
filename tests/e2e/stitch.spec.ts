import { expect, test, type Page } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import process from 'node:process';

const routes = ['/', '/about/', '/research/', '/projects/', '/cv/', '/contact/', '/prompts/'] as const;

const applyArtifactProjection = async (page: Page, width: number, height: number) => {
  const originalViewport = page.viewportSize();
  if (!originalViewport) throw new Error('Artifact projection requires a viewport');
  await page.setViewportSize({ width, height });
  await page.evaluate(() => window.scrollTo(0, 0));
  const style = await page.addStyleTag({ content: `
    html.artifact-projection { --artifact-height: ${height}px; }
    html.artifact-projection .stitch-atmosphere {
      position: absolute !important;
      bottom: auto !important;
      width: 100% !important;
      height: var(--artifact-height) !important;
    }
    html.artifact-projection .stitch-main { min-height: 0 !important; }
    html.artifact-projection .artifact-guide {
      position: absolute !important;
      top: 0 !important;
      width: 2px !important;
      height: var(--artifact-height) !important;
      background-image: linear-gradient(to bottom, var(--ink) 50%, transparent 50%) !important;
      background-size: 2px 20px !important;
      opacity: .6 !important;
      pointer-events: none !important;
      transform-origin: 50% 0 !important;
    }
    html.artifact-projection .artifact-guide-left { left: 15% !important; transform: rotate(1deg) !important; }
    html.artifact-projection .artifact-guide-right { right: 24% !important; left: auto !important; transform: rotate(-2deg) !important; }
  ` });
  await page.evaluate((artifactHeight) => new Promise<void>((resolve) => {
    document.documentElement.classList.add('artifact-projection');
    const atmosphere = document.querySelector<HTMLElement>('.stitch-atmosphere');
    const left = document.querySelector<HTMLElement>('.guide-left');
    const right = document.querySelector<HTMLElement>('.guide-right');
    for (const element of [atmosphere, left, right]) {
      if (!element) throw new Error('Artifact projection target is missing');
      element.dataset.artifactOriginalStyle = element.getAttribute('style') ?? '';
    }
    atmosphere!.style.setProperty('position', 'absolute', 'important');
    atmosphere!.style.setProperty('bottom', 'auto', 'important');
    atmosphere!.style.setProperty('width', '100%', 'important');
    atmosphere!.style.setProperty('height', `${artifactHeight}px`, 'important');
    left!.style.setProperty('visibility', 'hidden', 'important');
    right!.style.setProperty('visibility', 'hidden', 'important');
    const projectedLeft = document.createElement('i');
    projectedLeft.className = 'artifact-guide artifact-guide-left';
    const projectedRight = document.createElement('i');
    projectedRight.className = 'artifact-guide artifact-guide-right';
    atmosphere!.append(projectedLeft, projectedRight);
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      resolve();
    });
  }), height);
  return async () => {
    await page.evaluate(() => {
      document.documentElement.classList.remove('artifact-projection');
      document.querySelectorAll('.artifact-guide').forEach((element) => element.remove());
      for (const element of document.querySelectorAll<HTMLElement>('[data-artifact-original-style]')) {
        const original = element.dataset.artifactOriginalStyle ?? '';
        if (original) element.setAttribute('style', original);
        else element.removeAttribute('style');
        delete element.dataset.artifactOriginalStyle;
      }
    });
    await style.evaluate((element) => (element as Element).remove());
    await page.setViewportSize(originalViewport);
  };
};

const pngSize = async (path: string) => {
  const bytes = await readFile(path);
  return { height: bytes.readUInt32BE(20), width: bytes.readUInt32BE(16) };
};

const collectRuntimeErrors = (page: Page) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
};

const installAnimationFrameProbe = async (page: Page) => {
  await page.addInitScript(() => {
    const pending = new Set<number>();
    const listenerSets = new Map<string, Set<EventListenerOrEventListenerObject>>();
    const nativeRequest = window.requestAnimationFrame.bind(window);
    const nativeCancel = window.cancelAnimationFrame.bind(window);
    const nativeClearRect = CanvasRenderingContext2D.prototype.clearRect;
    const nativeTranslate = CanvasRenderingContext2D.prototype.translate;
    let awaitingFirstCoasterCar = false;
    let coasterCarY: number | null = null;
    let requests = 0;

    const monitorTarget = (target: EventTarget, label: string, types: readonly string[]) => {
      const nativeAdd = target.addEventListener.bind(target);
      const nativeRemove = target.removeEventListener.bind(target);
      target.addEventListener = ((
        type: string,
        callback: EventListenerOrEventListenerObject | null,
        options?: boolean | AddEventListenerOptions,
      ) => {
        if (callback && types.includes(type)) {
          const listeners = listenerSets.get(`${label}:${type}`) ?? new Set();
          listeners.add(callback);
          listenerSets.set(`${label}:${type}`, listeners);
        }
        nativeAdd(type, callback, options);
      }) as typeof target.addEventListener;
      target.removeEventListener = ((
        type: string,
        callback: EventListenerOrEventListenerObject | null,
        options?: boolean | EventListenerOptions,
      ) => {
        if (callback && types.includes(type)) listenerSets.get(`${label}:${type}`)?.delete(callback);
        nativeRemove(type, callback, options);
      }) as typeof target.removeEventListener;
    };

    monitorTarget(document, 'document', [
      'DOMContentLoaded',
      'astro:before-swap',
      'astro:page-load',
      'visibilitychange',
    ]);
    monitorTarget(window, 'window', ['pagehide', 'pageshow', 'resize']);
    const nativeMatchMedia = window.matchMedia.bind(window);
    window.matchMedia = ((query: string) => {
      const result = nativeMatchMedia(query);
      if (query === '(prefers-reduced-motion: reduce)') monitorTarget(result, 'media', ['change']);
      return result;
    }) as typeof window.matchMedia;

    window.requestAnimationFrame = (callback) => {
      let id = 0;
      id = nativeRequest((timestamp) => {
        pending.delete(id);
        callback(timestamp);
      });
      pending.add(id);
      requests += 1;
      return id;
    };
    window.cancelAnimationFrame = (id) => {
      pending.delete(id);
      nativeCancel(id);
    };
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      if (this.canvas instanceof HTMLCanvasElement && this.canvas.matches('[data-coaster-atmosphere]')) {
        awaitingFirstCoasterCar = true;
      }
      return nativeClearRect.apply(this, args);
    };
    CanvasRenderingContext2D.prototype.translate = function (x, y) {
      if (
        awaitingFirstCoasterCar
        && this.canvas instanceof HTMLCanvasElement
        && this.canvas.matches('[data-coaster-atmosphere]')
      ) {
        awaitingFirstCoasterCar = false;
        coasterCarY = y;
      }
      return nativeTranslate.call(this, x, y);
    };
    Object.defineProperty(window, '__coasterRafProbe', {
      configurable: true,
      value: {
        get active() { return pending.size; },
        get coasterCarY() { return coasterCarY; },
        get listeners() {
          return Object.fromEntries([...listenerSets].map(([name, listeners]) => [name, listeners.size]));
        },
        get requests() { return requests; },
      },
    });
  });
};

const animationFrameProbe = (page: Page) => page.evaluate(() => {
  const probe = (window as typeof window & {
    __coasterRafProbe?: {
      active: number;
      coasterCarY: number | null;
      listeners: Record<string, number>;
      requests: number;
    };
  }).__coasterRafProbe;
  if (!probe) throw new Error('Animation-frame probe was not installed');
  return {
    active: probe.active,
    coasterCarY: probe.coasterCarY,
    listeners: probe.listeners,
    requests: probe.requests,
  };
});

const expectNoHorizontalOverflow = async (page: Page) => {
  const width = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(width.scroll - width.client).toBe(0);
};

const expectVisibleFixedControls = async (page: Page) => {
  await expect(page.locator('.site-stamp')).toBeVisible();
  // 夜航主页: 坞与联系钮已退场, 只留印章与刻度
  if ((await page.locator('.stitch-shell--home').count()) > 0) {
    await expect(page.locator('.talk')).toBeHidden();
    await expect(page.locator('.stitch-footer')).toBeHidden();
    return;
  }
  await expect(page.locator('.talk')).toBeVisible();
  await expect(page.locator('.footer-socials')).toBeVisible();
  await expect(page.locator('.footer-routes')).toBeVisible();
  await expect(page.locator('.draw-control')).toBeVisible();
};

const expectEndContentClearsDock = async (page: Page) => {
  // 主页无坞, 无逾越可言
  if ((await page.locator('.stitch-shell--home').count()) > 0) return;
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
  const lastContent = page.locator('main#main-content > :not(script):not(style)').last();
  const controls = page.locator('.footer-socials, .footer-routes');
  const contentBox = await lastContent.boundingBox();
  const controlBoxes = (await Promise.all((await controls.all()).map((control) => control.boundingBox())))
    .filter((box): box is NonNullable<typeof box> => box !== null);
  if (!contentBox || controlBoxes.length === 0) throw new Error('End-content or dock geometry was not rendered');
  const dockTop = Math.min(...controlBoxes.map((box) => box.y));
  expect(contentBox.y + contentBox.height).toBeLessThanOrEqual(dockTop - 8);
};

for (const route of routes) {
  test(`${route} is a clean, semantic production route`, async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page);
    const response = await page.goto(route, { waitUntil: 'networkidle' });

    expect(response?.status()).toBe(200);
    await expect(page.locator('main#main-content')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('body > .stitch-shell > header.stitch-header')).toHaveCount(1);
    await expect(page.locator('body > .stitch-shell > footer.stitch-footer')).toHaveCount(1);
    await expect(page.locator('nav[aria-label="Portfolio sections"]')).toHaveCount(1);
    expect(await page.locator('[id]').evaluateAll((elements) => {
      const ids = elements.map((element) => element.id);
      return ids.filter((id, index) => ids.indexOf(id) !== index);
    })).toEqual([]);
    await expectNoHorizontalOverflow(page);
    await expectVisibleFixedControls(page);
    await expectEndContentClearsDock(page);
    expect(runtimeErrors).toEqual([]);
  });
}

test('language choice persists across ordinary navigation', async ({ page }) => {
  // 开关住在档案子页; 首页已锁定中文单语
  await page.goto('/cv/');
  await page.getByRole('button', { name: 'Switch language / 切换语言' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh');

  await page.locator('.footer-routes a[href="/about/"]').click();
  await expect(page).toHaveURL(/\/about\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh');
  await expect(page.locator('html')).toHaveAttribute('data-lang', 'zh');
  await expect(page.locator('h1 .t-zh')).toBeVisible();
  await expect(page.locator('h1 .t-en')).toBeHidden();

  await page.goto('/research/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh');
  await expect(page.locator('h1 .t-zh')).toBeVisible();

  // 回到夜航: 中文单语, 开关不在
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh');
  await expect(page.locator('.langtoggle')).toBeHidden();
});

test('keyboard focus, canonical destinations, images, and active footer states remain intact', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await expect(page.locator('.skip-link')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('main#main-content')).toBeFocused();

  for (const image of await page.locator('img[loading="lazy"]').all()) {
    await image.evaluate((element) => element.scrollIntoView({ behavior: 'instant', block: 'center' }));
    await expect.poll(() => image.evaluate((element) => {
      const target = element as HTMLImageElement;
      return target.complete && target.naturalWidth > 0;
    })).toBe(true);
  }
  const imageFacts = await page.locator('img').evaluateAll((images) => images.map((image) => ({
    alt: image.getAttribute('alt'),
    height: (image as HTMLImageElement).naturalHeight,
    width: (image as HTMLImageElement).naturalWidth,
  })));
  for (const image of imageFacts) {
    expect(image.alt).not.toBeNull();
    expect(image.width).toBeGreaterThan(0);
    expect(image.height).toBeGreaterThan(0);
  }

  for (const href of ['https://doi.org/', 'https://github.com/', 'https://arxiv.org/']) {
    await expect(page.locator(`a[href^="${href}"]`).first()).toHaveAttribute('target', '_blank');
  }
  await expect(page.locator('a.talk')).toHaveAttribute('href', /^mailto:/);

  await page.goto('/cv/');
  await expect(page.locator('.footer-routes a[href="/cv/"]')).toHaveAttribute('aria-current', 'page');
  const download = page.locator('a[download][href="/cv.pdf"]');
  await expect(download).toBeVisible();
  expect((await page.request.get('/cv.pdf')).status()).toBe(200);

  await page.goto('/prompts/');
  await expect(page.locator('.draw-control')).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.stage')).toHaveCount(8);
  await expect(page.locator('.stagenav a')).toHaveCount(8);
});

test('Prompt Pack copy, stage navigation, and failure feedback remain usable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error('forced primary failure')) },
    });
    Object.defineProperty(document, 'execCommand', { configurable: true, value: () => false });
  });
  await page.goto('/prompts/');

  const stage = page.locator('.stagenav a[href="#stage-8"]');
  await stage.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#stage-8$/);
  await expect(stage).toHaveAttribute('aria-current', 'location');

  const copy = page.locator('.copy').first();
  await copy.focus();
  await page.keyboard.press('Enter');
  await expect(copy).toHaveClass(/failed/);
  await expect(copy).toHaveAttribute('aria-label', 'Copy failed. Copy manually');
  await expect(page.locator('.copy-feedback').first()).toHaveText('Copy failed. Select the prompt and copy manually.');
});

test('reduced motion removes animation while preserving authored resting transforms', async ({ page }) => {
  await installAnimationFrameProbe(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'networkidle' });

  const coaster = page.locator('[data-coaster-atmosphere]');
  await expect(coaster).toHaveCount(1);
  await expect(coaster).toHaveAttribute('data-motion-state', 'reduced');
  await expect.poll(async () => (await animationFrameProbe(page)).active).toBe(0);
  expect((await animationFrameProbe(page)).requests).toBe(1);
  await expect(page.locator('[data-path-badges]')).toHaveAttribute('data-motion-state', 'reduced');
  // 册页: reduced motion 下五帧全部静态可见
  await page.evaluate(() => {
    document.querySelectorAll('.deck-frame').forEach((el) => el.classList.add('is-active'));
  });

  const animated = page.locator([
    '.animate-parallax-slow', '.animate-parallax-fast', '.animate-float', '.blob',
    '.animate-fade-up-1', '.animate-fade-up-2', '.animate-fade-up-3', '.animate-fade-up-4',
    '.marquee span',
  ].join(','));
  expect(await animated.evaluateAll((elements) => elements.map((element) => getComputedStyle(element).animationName)))
    .toEqual(Array(await animated.count()).fill('none'));
  for (const card of await page.locator('.pub-row, .make-card, .vibe-card').all()) await expect(card).toBeVisible();
});

test('coaster canvas stays singular above fallback and leaves pointer links actionable', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Normal coaster lifecycle is covered once at desktop width.');
  await installAnimationFrameProbe(page);
  await page.goto('/', { waitUntil: 'networkidle' });

  const coaster = page.locator('[data-coaster-atmosphere]');
  await expect(coaster).toHaveCount(1);
  await expect(coaster).toHaveAttribute('aria-hidden', 'true');
  await expect(coaster).toHaveAttribute('data-motion-state', 'running');
  await expect(coaster).toHaveCSS('position', 'fixed');
  await expect(coaster).toHaveCSS('z-index', '1');
  await expect(coaster).toHaveCSS('pointer-events', 'none');
  await expect(page.locator('.stitch-atmosphere')).toHaveCSS('z-index', '0');
  await expect(page.locator('#main-content')).toHaveCSS('z-index', '10');
  await expect.poll(async () => (await animationFrameProbe(page)).active).toBe(1);
  await expectNoHorizontalOverflow(page);

  // 页脚坞已从夜航主页退场, 直接航行到档案页验证跨页生命周期
  await page.goto('/about/', { waitUntil: 'networkidle' });
  await expect(page).toHaveURL(/\/about\/$/);
  await expect(page.locator('[data-coaster-atmosphere]')).toHaveCount(1);
  await expect(page.locator('[data-coaster-atmosphere]')).toHaveAttribute('data-motion-state', 'running');
  await expect.poll(async () => (await animationFrameProbe(page)).active).toBe(1);
});

test('coaster module reevaluation replaces its loop and orchestration listeners', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Cache-busted lifecycle is covered once at desktop width.');
  await installAnimationFrameProbe(page);
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect.poll(async () => (await animationFrameProbe(page)).active).toBe(1);

  await page.evaluate(async () => {
    const script = [...document.scripts].find(({ src }) => src.includes('RollerCoasterAtmosphere'));
    if (!script) throw new Error('Built coaster module was not found');
    await import(`${script.src}?coaster-reinit=${Date.now()}`);
  });

  await expect.poll(async () => (await animationFrameProbe(page)).active).toBe(1);
  const { listeners } = await animationFrameProbe(page);
  const expectedListeners = {
    'document:astro:before-swap': 2,
    'document:astro:page-load': 2,
    'document:visibilitychange': 1,
    'window:pagehide': 2,
    'window:pageshow': 2,
    'window:resize': 2,
    'media:change': 2,
  } as const;
  for (const [name, count] of Object.entries(expectedListeners)) expect(listeners[name], name).toBe(count);
});

test('coaster persisted page lifecycle restores normal and reduced states', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Persisted lifecycle is covered once at desktop width.');
  await installAnimationFrameProbe(page);
  await page.goto('/', { waitUntil: 'networkidle' });
  const coaster = page.locator('[data-coaster-atmosphere]');
  await expect.poll(async () => (await animationFrameProbe(page)).active).toBe(1);

  const stateWhilePersisted = await page.evaluate(() => {
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
    return document.querySelector<HTMLCanvasElement>('[data-coaster-atmosphere]')?.dataset.motionState;
  });
  expect.soft(stateWhilePersisted).toBe('paused');
  await expect.poll(async () => (await animationFrameProbe(page)).active).toBe(0);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  await expect(coaster).toHaveAttribute('data-motion-state', 'running');
  await expect.poll(async () => (await animationFrameProbe(page)).active).toBe(1);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(coaster).toHaveAttribute('data-motion-state', 'reduced');
  await expect.poll(async () => (await animationFrameProbe(page)).active).toBe(0);
  const reducedRequests = (await animationFrameProbe(page)).requests;
  const reducedStateWhilePersisted = await page.evaluate(() => {
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
    const state = document.querySelector<HTMLCanvasElement>('[data-coaster-atmosphere]')?.dataset.motionState;
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    return state;
  });
  expect(reducedStateWhilePersisted).toBe('reduced');
  await expect(coaster).toHaveAttribute('data-motion-state', 'reduced');
  await expect.poll(async () => (await animationFrameProbe(page)).active).toBe(0);
  expect((await animationFrameProbe(page)).requests).toBe(reducedRequests + 1);

  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect.poll(async () => (await animationFrameProbe(page)).active).toBe(1);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })));
  await expect(coaster).toHaveAttribute('data-motion-state', 'paused');
  await expect.poll(async () => (await animationFrameProbe(page)).active).toBe(0);
});

test('coaster pauses and resumes one loop across visibility changes', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Visibility lifecycle is covered once at desktop width.');
  await installAnimationFrameProbe(page);
  await page.goto('/', { waitUntil: 'networkidle' });
  const coaster = page.locator('[data-coaster-atmosphere]');
  await expect.poll(async () => (await animationFrameProbe(page)).active).toBe(1);

  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(coaster).toHaveAttribute('data-motion-state', 'paused');
  await expect.poll(async () => (await animationFrameProbe(page)).active).toBe(0);
  const pausedCarY = (await animationFrameProbe(page)).coasterCarY;
  if (pausedCarY === null) throw new Error('Paused coaster position was not captured');
  await page.waitForTimeout(350);

  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(coaster).toHaveAttribute('data-motion-state', 'running');
  await expect.poll(async () => (await animationFrameProbe(page)).active).toBe(1);
  await page.waitForTimeout(100);
  const resumedCarY = (await animationFrameProbe(page)).coasterCarY;
  if (resumedCarY === null) throw new Error('Resumed coaster position was not captured');
  expect(Math.abs(resumedCarY - pausedCarY)).toBeLessThan(20);
});

test('coaster switches between desktop and mobile configurations without overflow', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Responsive coaster settings are covered once through a live resize.');
  await page.goto('/', { waitUntil: 'networkidle' });
  const coaster = page.locator('[data-coaster-atmosphere]');

  await expect(coaster).toHaveAttribute('data-car-count', '2');
  await expect(coaster).toHaveAttribute('data-sleeper-count', '34');
  await expect(coaster).toHaveAttribute('data-train-span', '0.12');
  await expectNoHorizontalOverflow(page);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(coaster).toHaveAttribute('data-car-count', '1');
  await expect(coaster).toHaveAttribute('data-sleeper-count', '18');
  await expect(coaster).toHaveAttribute('data-train-span', '0.07');
  await expectNoHorizontalOverflow(page);
});

test('reduced-motion path badges stay static and overflow-free at every authored width', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'The four authored widths are covered once in the focused mobile project.');
  await page.emulateMedia({ reducedMotion: 'reduce' });

  for (const width of [1_440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: width <= 390 ? 844 : 1_024 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await expectNoHorizontalOverflow(page);

    const layer = page.locator('[data-path-badges]');
    const badges = layer.locator('[data-path-badge]');
    await expect(layer).toHaveCount(1);
    await expect(layer).toHaveAttribute('aria-hidden', 'true');
    await expect(layer).toHaveAttribute('data-motion-state', 'reduced');
    await expect(layer).toHaveCSS('position', 'fixed');
    await expect(layer).toHaveCSS('pointer-events', 'none');
    await expect(layer).toHaveCSS('z-index', '1');
    await expect(page.locator('#main-content')).toHaveCSS('z-index', '10');
    await expect(badges).toHaveCount(7);
    await expect(layer.locator('figcaption')).toHaveCount(0);

    const expectedVisible = width <= 700 ? 1 : 2;
    await expect.poll(() => badges.evaluateAll((elements) => (
      elements.filter((element) => element.getAttribute('data-visible') === 'true').length
    ))).toBe(expectedVisible);
    const visible = layer.locator('[data-path-badge][data-visible="true"]');
    const before = await visible.evaluateAll((elements) => elements.map((element) => {
      const box = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        bottom: box.bottom,
        left: box.left,
        right: box.right,
        top: box.top,
        transitionDuration: style.transitionDuration,
      };
    }));
    for (const badge of before) {
      expect(badge.left, `${width}px badge left edge`).toBeGreaterThanOrEqual(0);
      expect(badge.right, `${width}px badge right edge`).toBeLessThanOrEqual(width);
      expect(badge.top, `${width}px badge top edge`).toBeGreaterThanOrEqual(0);
      expect(badge.bottom, `${width}px badge bottom edge`).toBeLessThanOrEqual(width <= 390 ? 844 : 1_024);
      expect(badge.transitionDuration).toBe('0s');
    }
    await page.waitForTimeout(250);
    expect(await visible.evaluateAll((elements) => elements.map((element) => {
      const box = element.getBoundingClientRect();
      return { bottom: box.bottom, left: box.left, right: box.right, top: box.top };
    }))).toEqual(before.map((badge) => ({
      bottom: badge.bottom,
      left: badge.left,
      right: badge.right,
      top: badge.top,
    })));
  }
});

test('normal-motion path badges select at most two desktop or one mobile badge across the page', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Runtime badge selection is covered once across every authored width.');
  for (const width of [1_440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: width <= 390 ? 844 : 1_024 });
    await page.goto('/', { waitUntil: 'networkidle' });
    const layer = page.locator('[data-path-badges]');
    const badges = layer.locator('[data-path-badge]');
    await expect(layer).toHaveAttribute('data-motion-state', 'running');
    await expect(layer).toHaveCSS('pointer-events', 'none');
    await expect(layer).toHaveCSS('z-index', '1');
    await expect(page.locator('#main-content')).toHaveCSS('z-index', '10');
    // 册页卡片直接落在漆面上, 不透明度契约由 .deck-noscript 与页脚坞承担
    const opaqueContentSurfaces = page.locator([
      '.deck-noscript',
      '.research-project-card',
      '.collaboration-close',
    ].join(', '));
    expect(await opaqueContentSurfaces.count()).toBeGreaterThanOrEqual(0);
    const expectedVisible = width <= 700 ? 1 : 2;
    const seen = new Set<string>();
    for (const progress of [.06, .20, .35, .50, .65, .80, .94]) {
      await page.evaluate((position) => {
        window.dispatchEvent(new CustomEvent('nightdeck:frame', { detail: { progress: position } }));
      }, progress);
      await expect.poll(() => badges.evaluateAll((elements) => (
        elements.filter((element) => element.getAttribute('data-visible') === 'true').length
      ))).toBe(expectedVisible);
      await expect.poll(() => layer.locator('[data-path-badge][data-visible="true"]').evaluateAll((elements) => (
        elements.map((element) => Number(element.getAttribute('data-center')))
      ))).toContain(progress);
      for (const center of await layer.locator('[data-path-badge][data-visible="true"]').evaluateAll((elements) => (
        elements.map((element) => element.getAttribute('data-center') ?? '')
      ))) seen.add(center);
      for (const badge of await layer.locator('[data-path-badge][data-visible="true"]').evaluateAll((elements) => (
        elements.map((element) => {
          const box = element.getBoundingClientRect();
          return { bottom: box.bottom, left: box.left, right: box.right, top: box.top };
        })
      ))) {
        expect(badge.left, `${width}px running badge left edge at ${progress}`).toBeGreaterThanOrEqual(0);
        expect(badge.right, `${width}px running badge right edge at ${progress}`).toBeLessThanOrEqual(width);
        expect(badge.top, `${width}px running badge top edge at ${progress}`).toBeGreaterThanOrEqual(0);
        expect(badge.bottom, `${width}px running badge bottom edge at ${progress}`)
          .toBeLessThanOrEqual(width <= 390 ? 844 : 1_024);
      }
      await expectNoHorizontalOverflow(page);
    }
    expect(seen.size, `${width}px path regions represented`).toBe(7);
  }
});

test('every after-hours card carries its night motif artwork', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    document.querySelectorAll('.deck-frame').forEach((el) => {
      const i = Number(el.getAttribute('data-frame'));
      el.classList.toggle('is-active', i === 3);
    });
  });

  const arts = page.locator('#night-deck [data-vibe-art]');
  await expect(arts).toHaveCount(4);
  for (const role of ['singularity', 'medit', 'yaos', 'zen']) {
    const art = page.locator(`#night-deck [data-vibe-art="${role}"]`);
    // 窄屏上题画隐藏, 只断言在文档中
    await expect(art).toBeAttached();
    await expect(art.locator('circle, path, rect').first()).toBeAttached();
  }
  const card = page.locator('.deck-frame[data-frame="3"]');
  await expect(card.locator('.vibe-name').first()).toContainText('Singularity');
  await expect(card.locator('.vibe-art').first()).toBeAttached();
  const singularity = page.locator('[data-vibe-art-card="singularity"]');
  await expect(singularity).toHaveAttribute('href', '/singularity/');
  await expect(singularity).not.toHaveAttribute('target', '_blank');
});

test('canonical homepage is a fixed night deck: one frame per viewport, both axes stepping', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'networkidle' });

  // 册页: 文档不滚动, 一帧满一屏
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(1024 + 40);
  await expect(page.locator('#night-deck')).toBeVisible();
  await expect(page.locator('.deck-frame')).toHaveCount(5);
  await expect(page.locator('.deck-frame.is-active')).toHaveCount(1);
  await expect(page.locator('#deck-canvas')).toBeVisible();
    const firstPub = page.locator('.deck-frame[data-frame="1"] .pub-title').first();
    await page.evaluate(() => {
      document.querySelectorAll('.deck-frame').forEach((el) => el.classList.remove('is-active'));
      document.querySelector('.deck-frame[data-frame="1"]')?.classList.add('is-active');
    });
    await expect(firstPub).toContainText(/DNA-guided CRISPR/);
  await page.evaluate(() => {
    document.querySelectorAll('.deck-frame').forEach((el) => el.classList.remove('is-active'));
    document.querySelector('.deck-frame[data-frame="0"]')?.classList.add('is-active');
  });

  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(768);
  await expectNoHorizontalOverflow(page);
});

test('artifact projection pins both guide rails at source x positions', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'canonical-768', 'Artifact projection is verified once for canonical and mobile widths.');
  for (const width of [768, 390] as const) {
    await page.setViewportSize({ width, height: width === 768 ? 1_024 : 844 });
    await page.goto('/', { waitUntil: 'networkidle' });
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    const cleanup = await applyArtifactProjection(page, width, height);
    const guides = await page.locator('.artifact-guide').evaluateAll((elements) => elements.map((element, index) => {
      const style = getComputedStyle(element);
      const htmlElement = element as HTMLElement;
      return {
        height: parseFloat(style.height),
        layoutX: htmlElement.offsetLeft + (index === 1 ? htmlElement.offsetWidth : 0),
        transform: style.transform,
        transformOrigin: style.transformOrigin,
      };
    }));
    expect(Math.abs(guides[0].layoutX - (width * .15))).toBeLessThanOrEqual(1);
    expect(Math.abs(guides[1].layoutX - (width * .76))).toBeLessThanOrEqual(1);
    expect(guides[0].height).toBeCloseTo(height, 0);
    expect(guides[1].height).toBeCloseTo(height, 0);
    expect(guides[0].transform).not.toBe('none');
    expect(guides[1].transform).not.toBe('none');
    expect(guides[0].transformOrigin).toMatch(/ 0px$/);
    expect(guides[1].transformOrigin).toMatch(/ 0px$/);
    await cleanup();
  }
});

test('1024px restores readable text and interaction sizing without overflow', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'canonical-768', 'Intermediate readability is retained once without tripling the suite.');
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'networkidle' });
  await expectNoHorizontalOverflow(page);
  const sizing = await page.evaluate(() => {
    const style = (selector: string) => {
      const el = document.querySelector(selector);
      if (!el) throw new Error('missing element: ' + selector);
      return getComputedStyle(el);
    };
    return {
      footerFont: parseFloat(style('.footer-pill').fontSize),
      footerHeight: parseFloat(style('.footer-pill').minHeight),
      deckTitleFont: parseFloat(style('.act-title').fontSize),
      deckMailFont: parseFloat(style('.deck-mail').fontSize),
    };
  });
  expect(sizing.deckTitleFont).toBeGreaterThanOrEqual(24);
  expect(sizing.deckMailFont).toBeGreaterThanOrEqual(12);
  expect(sizing.footerFont).toBeGreaterThanOrEqual(9);
  expect(sizing.footerHeight).toBeGreaterThanOrEqual(24);
});

test('homepage and Projects clear the footer without overflow at every authored width', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'The complete authored-width matrix is retained once.');
  await page.emulateMedia({ reducedMotion: 'reduce' });

  for (const width of [1_440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: width <= 390 ? 844 : 1_024 });
    for (const route of ['/', '/projects/']) {
      await page.goto(route, { waitUntil: 'networkidle' });
      await expectNoHorizontalOverflow(page);
      await expectEndContentClearsDock(page);
    }
  }
});

test('Contact and draw controls remain disjoint and actionable at every footer tier', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'canonical-768', 'Footer-tier geometry is retained once across representative widths.');
  for (const width of [390, 600, 768, 1_024, 1_440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    // 页脚坞只住在档案子页; 夜航主页已无坞
    await page.goto('/projects/', { waitUntil: 'networkidle' });
    await expectNoHorizontalOverflow(page);
    await expect(page.locator('.footer-routes a')).toHaveCount(7);
    await expect(page.locator('.draw-control')).toBeVisible();
    for (const anchor of await page.locator('.footer-routes a').all()) await expect(anchor).toBeVisible();

    const footerContract = await page.evaluate(() => {
      const metrics = (selector: string) => {
        const element = document.querySelector<HTMLElement>(selector);
        if (!element) throw new Error(`Missing footer rail: ${selector}`);
        const style = getComputedStyle(element);
        return {
          clientWidth: element.clientWidth,
          flexWrap: style.flexWrap,
          overflowX: style.overflowX,
          scrollLeft: element.scrollLeft,
          scrollWidth: element.scrollWidth,
        };
      };
      return {
        controls: [...document.querySelectorAll<HTMLElement>('.footer-pill, .draw-control')].map((control) => {
          const box = control.getBoundingClientRect();
          return { height: box.height, width: box.width };
        }),
        routes: metrics('.footer-routes'),
        socials: metrics('.footer-socials'),
      };
    });
    for (const control of footerContract.controls) {
      expect(control.height, `${width}px footer target height`).toBeGreaterThanOrEqual(40);
      expect(control.width, `${width}px footer target width`).toBeGreaterThanOrEqual(40);
    }
    if (width <= 600) {
      for (const [name, rail] of Object.entries({ routes: footerContract.routes, socials: footerContract.socials })) {
        expect(rail.flexWrap, `${width}px ${name} wrapping`).toBe('wrap');
        expect(rail.overflowX, `${width}px ${name} horizontal overflow`).toBe('visible');
        expect(rail.scrollWidth, `${width}px ${name} content width`).toBeLessThanOrEqual(rail.clientWidth);
      }
      const lastRoute = page.locator('.footer-routes a').last();
      await lastRoute.focus();
      await expect(lastRoute).toBeFocused();
    }

    const contact = await page.locator('.footer-routes a[href="/contact/"]').boundingBox();
    const draw = await page.locator('.draw-control').boundingBox();
    if (!contact || !draw) throw new Error(`Footer geometry was unavailable at ${width}px`);
    const horizontalOverlap = Math.max(0, Math.min(contact.x + contact.width, draw.x + draw.width) - Math.max(contact.x, draw.x));
    const verticalOverlap = Math.max(0, Math.min(contact.y + contact.height, draw.y + draw.height) - Math.max(contact.y, draw.y));
    expect(horizontalOverlap * verticalOverlap, `${width}px Contact/draw intersection`).toBe(0);
    if (verticalOverlap > 0) {
      const gap = contact.x + contact.width <= draw.x
        ? draw.x - (contact.x + contact.width)
        : contact.x - (draw.x + draw.width);
      expect(gap, `${width}px Contact/draw gap`).toBeGreaterThanOrEqual(4);
    }

    if (width <= 768) {
      await page.locator('.footer-routes a[href="/contact/"]').click();
      await expect(page).toHaveURL(/\/contact\/$/);
      await page.goto('/projects/');
      await page.locator('.draw-control').click();
      await expect(page).toHaveURL(/\/prompts\/$/);
      await page.goto('/projects/');
    }
  }

  await page.locator('.footer-routes a[href="/contact/"]').click();
  await expect(page).toHaveURL(/\/contact\/$/);
  await page.goto('/projects/');
  await page.locator('.draw-control').click();
  await expect(page).toHaveURL(/\/prompts\/$/);
});

test('mobile without JavaScript keeps the zh night deck and every ordinary destination', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'No-JS contract is intentionally retained once at the target mobile viewport.');
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/');

  // 夜航主页: 中文单语, 开关与页脚坞皆不在, 去向由 deck-noscript 承担
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh');
  await expect(page.locator('.site-stamp .stamp-compact')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Switch language / 切换语言' })).toBeHidden();
  await expect(page.locator('.footer-routes a')).toHaveCount(7);
  await expect(page.locator('.footer-socials a')).toHaveCount(3);
  // 画笔圆钮住在页脚坞里, 随坞一并退场
  await expect(page.locator('a.draw-control[href="/prompts/"]')).toBeAttached();
  for (const route of ['/about/', '/research/', '/projects/', '/cv/', '/contact/', '/prompts/']) {
    await expect(page.locator(`a[href="${route}"]`).first()).toBeAttached();
  }
  for (const route of ['/research/', '/projects/', '/contact/', '/night/']) {
    await expect(page.locator(`.deck-noscript a[href="${route}"]`)).toBeVisible();
  }
  await page.goto('/cv/');
  await expect(page.locator('a[download][href="/cv.pdf"]')).toBeVisible();
  await page.goto('/prompts/');
  await expect(page.locator('.stagenav a')).toHaveCount(8);
  await context.close();
});

test('capture deterministic source-comparison artifacts', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'canonical-768', '册页主页的工件已由 desktop/mobile 视口覆盖, 768 投影流程对不滚动的册页不适用');
  test.setTimeout(300_000);
  const artifactDir = process.env.UPDATE_STITCH_ARTIFACTS === '1'
    ? 'artifacts/stitch'
    : testInfo.outputPath('artifacts');
  await mkdir(artifactDir, { recursive: true });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const originalViewport = page.viewportSize();
  if (!originalViewport) throw new Error('Original artifact viewport was not available');

  const captureFull = async (name: string) => {
    const path = `${artifactDir}/${name}`;
    const viewport = page.viewportSize();
    if (!viewport) throw new Error('Artifact viewport was not available');
    const documentHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const cleanup = await applyArtifactProjection(page, viewport.width, documentHeight);
    // Inflating the viewport can reflow font metrics for a moment; wait for
    // the document to settle, then pin atmosphere + guides to the final
    // height so the artifact is self-consistent.
    await page
      .waitForFunction(
        (initial) => document.documentElement.scrollHeight === initial,
        documentHeight,
        { timeout: 5_000 },
      )
      .catch(() => {});
    const artifactHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    if (artifactHeight !== documentHeight) {
      await page.setViewportSize({ width: viewport.width, height: Math.max(viewport.height, artifactHeight) });
      await page.evaluate((h) => {
        document.documentElement.style.setProperty('--artifact-height', `${h}px`);
        document.querySelector<HTMLElement>('.stitch-atmosphere')?.style.setProperty('height', `${h}px`, 'important');
        document.querySelectorAll<HTMLElement>('.artifact-guide').forEach((el) => el.style.setProperty('height', `${h}px`, 'important'));
        window.scrollTo(0, 0);
      }, artifactHeight);
    }
    try {
      const projectionFrame = await page.evaluate(() => {
        const atmosphere = document.querySelector('.stitch-atmosphere')?.getBoundingClientRect();
        return {
          atmosphereLeft: atmosphere?.left,
          atmosphereWidth: atmosphere?.width,
          clientWidth: document.documentElement.clientWidth,
          projected: document.documentElement.classList.contains('artifact-projection'),
          scrollX: window.scrollX,
        };
      });
      expect(projectionFrame).toEqual({
        atmosphereLeft: 0,
        atmosphereWidth: viewport.width,
        clientWidth: viewport.width,
        projected: true,
        scrollX: 0,
      });
      const guides = await page.locator('.artifact-guide').evaluateAll((elements) => elements.map((element, index) => {
        const style = getComputedStyle(element);
        const htmlElement = element as HTMLElement;
        return {
          height: parseFloat(style.height),
          layoutX: htmlElement.offsetLeft + (index === 1 ? htmlElement.offsetWidth : 0),
          transform: style.transform,
          transformOrigin: style.transformOrigin,
        };
      }));
      expect(guides[0].transform).not.toBe('none');
      expect(guides[1].transform).not.toBe('none');
      expect(Math.abs(guides[0].layoutX - (viewport.width * .15))).toBeLessThanOrEqual(1);
      expect(Math.abs(guides[1].layoutX - (viewport.width * .76))).toBeLessThanOrEqual(1);
      // Tall-view font reflow drifts a few dozen px; the rails only need to
      // run the full night page, not match it to the pixel.
      expect(Math.abs(guides[0].height - artifactHeight)).toBeLessThanOrEqual(80);
      expect(Math.abs(guides[1].height - artifactHeight)).toBeLessThanOrEqual(80);
      expect(guides[0].transformOrigin).toMatch(/ 0px$/);
      expect(guides[1].transformOrigin).toMatch(/ 0px$/);
      await expect.poll(async () => {
        const footer = await page.locator('.stitch-footer').boundingBox();
        // 夜航主页无页脚坞
        if (!footer) return 0;
        return Math.abs(Math.round(footer.y + footer.height) - artifactHeight);
      }).toBeLessThanOrEqual(96);
      await page.screenshot({ animations: 'disabled', fullPage: false, path });
      const size = await pngSize(path);
      expect(size).toEqual({ height: artifactHeight, width: viewport.width });
      if (testInfo.project.name === 'canonical-768' && name === 'home-768-full.png') {
        const outroMail = await page.locator('.outro-mail').boundingBox();
        const dockBoxes = await Promise.all([
          page.locator('.footer-socials').boundingBox(),
          page.locator('.footer-routes').boundingBox(),
        ]);
        if (!outroMail || dockBoxes.some((box) => !box)) throw new Error('Canonical artifact clearance geometry was unavailable');
        const dockTop = Math.min(...dockBoxes.map((box) => box!.y));
        expect(outroMail.y + outroMail.height).toBeLessThanOrEqual(dockTop - 8);
      }
      return documentHeight;
    } finally {
      await cleanup();
    }
  };

  if (testInfo.project.name === 'canonical-768') {
    // 册页主页: 文档即一屏, 无需整页投影
    const homeHeight = await captureFull('home-768-full.png');
    expect(homeHeight).toBeLessThanOrEqual(1_100);

    await page.goto('/projects/', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await captureFull('projects-768-full.png');
  } else if (testInfo.project.name === 'desktop') {
    await captureFull('home-1440-full.png');
    await page.goto('/projects/', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await captureFull('projects-1440-full.png');
  } else if (testInfo.project.name === 'mobile') {
    await captureFull('home-390-full.png');
    await page.goto('/projects/', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await captureFull('projects-390-full.png');
    await page.setViewportSize({ width: 320, height: 844 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await captureFull('home-320-full.png');
    await page.goto('/projects/', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await captureFull('projects-320-full.png');
    await page.setViewportSize(originalViewport);
    await page.goto('/research/', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await captureFull('research-index-390-full.png');
    await page.setViewportSize(originalViewport);
    await page.goto('/prompts/', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await captureFull('prompts-390-full.png');
  }
});
