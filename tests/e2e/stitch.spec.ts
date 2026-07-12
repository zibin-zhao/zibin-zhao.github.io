import { expect, test, type Locator, type Page } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';

const routes = ['/', '/about/', '/research/', '/projects/', '/cv/', '/contact/', '/prompts/'] as const;
const artifactDir = 'artifacts/stitch';

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

const expectNoHorizontalOverflow = async (page: Page) => {
  const width = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(width.scroll - width.client).toBe(0);
};

const expectVisibleFixedControls = async (page: Page) => {
  await expect(page.locator('.site-stamp')).toBeVisible();
  await expect(page.locator('.talk')).toBeVisible();
  await expect(page.locator('.footer-socials')).toBeVisible();
  await expect(page.locator('.footer-routes')).toBeVisible();
  await expect(page.locator('.draw-control')).toBeVisible();
};

const expectEndContentClearsDock = async (page: Page) => {
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
  await page.goto('/');
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
});

test('keyboard focus, canonical destinations, images, and active footer states remain intact', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await expect(page.locator('.skip-link')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('main#main-content')).toBeFocused();

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
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'networkidle' });

  const animated = page.locator([
    '.animate-parallax-slow', '.animate-parallax-fast', '.animate-float', '.blob',
    '.animate-fade-up-1', '.animate-fade-up-2', '.animate-fade-up-3', '.animate-fade-up-4',
    '.marquee span',
  ].join(','));
  expect(await animated.evaluateAll((elements) => elements.map((element) => getComputedStyle(element).animationName)))
    .toEqual(Array(await animated.count()).fill('none'));
  await expect(page.locator('.hero-formula')).toHaveCSS('transform', /matrix/);
  await expect(page.locator('.hero-formula')).toBeVisible();
  for (const card of await page.locator('.pub-card, .vibe-card').all()) await expect(card).toBeVisible();
});

test('a failed Vibe image reveals the designed fallback without hiding card content', async ({ page }) => {
  await page.route('**/stitch/casmd.png', (route) => route.abort('failed'));
  await page.goto('/#vibe', { waitUntil: 'networkidle' });

  const card = page.locator('[data-vibe-role="casmd"]');
  await expect(card.locator('.vibe-image-fallback')).toBeVisible();
  await expect(card.locator('.vibe-image-fallback')).toContainText('CasMD preview unavailable');
  await expect(card.locator('.vibe-title')).toContainText('CasMD');
  await expect(card.locator('.vibe-description')).toBeVisible();
  await expect(card.locator('.vibe-action')).toBeVisible();
});

test('canonical homepage matches the source-normalized vertical density and anchors', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'canonical-768', 'Canonical geometry belongs to the 768px source-comparison project.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'networkidle' });

  const geometry = await page.evaluate(() => {
    const box = (selector: string) => {
      const rect = document.querySelector(selector)?.getBoundingClientRect();
      if (!rect) throw new Error(`Missing canonical element: ${selector}`);
      return {
        bottom: rect.bottom + scrollY,
        height: rect.height,
        left: rect.left,
        right: rect.right,
        top: rect.top + scrollY,
        width: rect.width,
      };
    };
    return {
      documentHeight: document.documentElement.scrollHeight,
      contact: box('.footer-routes a[href="/contact/"]'),
      draw: box('.draw-control'),
      footerRoutes: box('.footer-routes'),
      footerSocials: box('.footer-socials'),
      guideLeftX: (document.querySelector('.guide-left') as HTMLElement).offsetLeft,
      guideRightX: (document.querySelector('.guide-right') as HTMLElement).offsetLeft
        + (document.querySelector('.guide-right') as HTMLElement).offsetWidth,
      hero: box('.stitch-hero'),
      heroCard: box('.hero-card'),
      research: box('#research'),
      researchBanner: box('.research-heading h2'),
      researchCards: [...document.querySelectorAll('.pub-card')].map((_, index) => box(`.pub-card--${index + 1}`)),
      vibe: box('#vibe'),
      vibeCards: ['casmd', 'singularity', 'medit', 'yaos', 'zen'].map((role) => box(`[data-vibe-role="${role}"]`)),
      vibeHeading: box('#vibe > h2'),
      vibeNote: box('.lol-note'),
    };
  });

  expect(geometry.documentHeight).toBeGreaterThanOrEqual(1_980);
  expect(geometry.documentHeight).toBeLessThanOrEqual(2_180);
  expect(geometry.hero.bottom).toBeGreaterThanOrEqual(610);
  expect(geometry.hero.bottom).toBeLessThanOrEqual(680);
  expect(geometry.research.top).toBeGreaterThanOrEqual(640);
  expect(geometry.research.top).toBeLessThanOrEqual(700);
  expect(geometry.research.height).toBeGreaterThanOrEqual(420);
  expect(geometry.research.height).toBeLessThanOrEqual(580);
  expect(geometry.vibe.top).toBeGreaterThanOrEqual(1_130);
  expect(geometry.vibe.top).toBeLessThanOrEqual(1_280);
  expect(geometry.vibe.height).toBeGreaterThanOrEqual(700);
  expect(geometry.vibe.height).toBeLessThanOrEqual(900);
  expect(geometry.heroCard.width).toBeGreaterThanOrEqual(275);
  expect(geometry.heroCard.width).toBeLessThanOrEqual(310);
  expect(geometry.heroCard.left).toBeGreaterThanOrEqual(225);
  expect(geometry.heroCard.left).toBeLessThanOrEqual(255);
  expect(geometry.heroCard.top).toBeGreaterThanOrEqual(300);
  expect(geometry.heroCard.top).toBeLessThanOrEqual(330);
  expect(geometry.researchBanner.width).toBeGreaterThanOrEqual(360);
  expect(geometry.researchBanner.width).toBeLessThanOrEqual(410);
  expect(geometry.researchBanner.left).toBeGreaterThanOrEqual(10);
  expect(geometry.researchBanner.left).toBeLessThanOrEqual(30);
  expect(geometry.researchBanner.top).toBeGreaterThanOrEqual(650);
  expect(geometry.researchBanner.top).toBeLessThanOrEqual(680);
  const researchWidthRanges = [[500, 545], [410, 450], [350, 390]] as const;
  const researchLeftRanges = [[160, 185], [65, 95], [190, 215]] as const;
  const researchTopRanges = [[750, 790], [880, 925], [1_065, 1_110]] as const;
  for (let index = 0; index < geometry.researchCards.length; index += 1) {
    expect(geometry.researchCards[index].width).toBeGreaterThanOrEqual(researchWidthRanges[index][0]);
    expect(geometry.researchCards[index].width).toBeLessThanOrEqual(researchWidthRanges[index][1]);
    expect(geometry.researchCards[index].left).toBeGreaterThanOrEqual(researchLeftRanges[index][0]);
    expect(geometry.researchCards[index].left).toBeLessThanOrEqual(researchLeftRanges[index][1]);
    expect(geometry.researchCards[index].top).toBeGreaterThanOrEqual(researchTopRanges[index][0]);
    expect(geometry.researchCards[index].top).toBeLessThanOrEqual(researchTopRanges[index][1]);
  }
  expect(geometry.researchCards[2].height).toBeGreaterThanOrEqual(75);
  expect(geometry.researchCards[2].height).toBeLessThanOrEqual(105);
  expect(geometry.vibeHeading.width).toBeGreaterThanOrEqual(220);
  expect(geometry.vibeHeading.width).toBeLessThanOrEqual(260);
  expect(geometry.vibeHeading.left).toBeGreaterThanOrEqual(485);
  expect(geometry.vibeHeading.left).toBeLessThanOrEqual(510);
  expect(geometry.vibeHeading.top).toBeGreaterThanOrEqual(1_220);
  expect(geometry.vibeHeading.top).toBeLessThanOrEqual(1_250);
  expect(geometry.vibeNote.width).toBeGreaterThanOrEqual(275);
  expect(geometry.vibeNote.width).toBeLessThanOrEqual(310);
  expect(geometry.vibeNote.top).toBeGreaterThanOrEqual(1_220);
  expect(geometry.vibeNote.top).toBeLessThanOrEqual(1_250);
  const [casmd, singularity, medit, yaos, zen] = geometry.vibeCards;
  expect(casmd.left).toBeGreaterThanOrEqual(25);
  expect(casmd.left).toBeLessThanOrEqual(50);
  expect(casmd.width).toBeGreaterThanOrEqual(430);
  expect(casmd.width).toBeLessThanOrEqual(470);
  expect(casmd.top).toBeGreaterThanOrEqual(1_300);
  expect(casmd.top).toBeLessThanOrEqual(1_340);
  expect(singularity.width).toBeGreaterThanOrEqual(260);
  expect(singularity.width).toBeLessThanOrEqual(300);
  expect(singularity.left).toBeGreaterThanOrEqual(80);
  expect(singularity.left).toBeLessThanOrEqual(115);
  expect(singularity.top).toBeGreaterThanOrEqual(1_540);
  expect(singularity.top).toBeLessThanOrEqual(1_590);
  expect(medit.width).toBeGreaterThanOrEqual(260);
  expect(medit.width).toBeLessThanOrEqual(300);
  expect(medit.left).toBeGreaterThanOrEqual(380);
  expect(medit.left).toBeLessThanOrEqual(410);
  expect(medit.top).toBeGreaterThanOrEqual(1_515);
  expect(medit.top).toBeLessThanOrEqual(1_565);
  for (const card of [yaos, zen]) {
    expect(card.width).toBeGreaterThanOrEqual(250);
    expect(card.width).toBeLessThanOrEqual(295);
  }
  expect(yaos.left).toBeGreaterThanOrEqual(85);
  expect(yaos.left).toBeLessThanOrEqual(125);
  expect(zen.left).toBeGreaterThanOrEqual(375);
  expect(zen.left).toBeLessThanOrEqual(415);
  for (const card of [yaos, zen]) {
    expect(card.top).toBeGreaterThanOrEqual(1_820);
    expect(card.top).toBeLessThanOrEqual(1_880);
  }
  expect(geometry.guideLeftX).toBeCloseTo(768 * .15, 0);
  expect(geometry.guideRightX).toBeCloseTo(768 * .76, 0);
  expect(geometry.footerSocials.left).toBeGreaterThanOrEqual(20);
  expect(geometry.footerSocials.left).toBeLessThanOrEqual(30);
  expect(geometry.footerSocials.width).toBeGreaterThanOrEqual(70);
  expect(geometry.footerSocials.width).toBeLessThanOrEqual(100);
  expect(geometry.footerSocials.left + geometry.footerSocials.width).toBeLessThanOrEqual(120);
  expect(geometry.footerRoutes.left).toBeGreaterThanOrEqual(590);
  expect(geometry.footerRoutes.left).toBeLessThanOrEqual(610);
  expect(geometry.footerRoutes.width).toBeGreaterThanOrEqual(145);
  expect(geometry.footerRoutes.width).toBeLessThanOrEqual(155);
  expect(geometry.footerRoutes.height).toBeGreaterThanOrEqual(72);
  expect(geometry.footerRoutes.height).toBeLessThanOrEqual(90);
  await expect(page.locator('.footer-socials a')).toHaveCount(3);
  await expect(page.locator('.footer-routes a')).toHaveCount(6);
  for (const anchor of await page.locator('.footer-socials a, .footer-routes a').all()) await expect(anchor).toBeVisible();
  const horizontalOverlap = Math.max(0, Math.min(geometry.contact.right, geometry.draw.right) - Math.max(geometry.contact.left, geometry.draw.left));
  const verticalOverlap = Math.max(0, Math.min(geometry.contact.bottom, geometry.draw.bottom) - Math.max(geometry.contact.top, geometry.draw.top));
  expect(horizontalOverlap * verticalOverlap).toBe(0);
  expect(geometry.draw.left - geometry.contact.right).toBeGreaterThanOrEqual(4);

  await page.locator('.footer-routes a[href="/contact/"]').click();
  await expect(page).toHaveURL(/\/contact\/$/);
  await page.goto('/');
  await page.locator('.draw-control').click();
  await expect(page).toHaveURL(/\/prompts\/$/);
});

test('artifact projection pins both guide rails at source x positions', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'canonical-768', 'Artifact projection is verified once for canonical and mobile widths.');
  await page.goto('/');
  for (const [width, height] of [[768, 2_079], [390, 4_010]] as const) {
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
    const style = (selector: string) => getComputedStyle(document.querySelector(selector) as Element);
    return {
      footerFont: parseFloat(style('.footer-pill').fontSize),
      footerHeight: parseFloat(style('.footer-pill').minHeight),
      paperLinkHeight: parseFloat(style('.paper-links a').minHeight),
      paperMetaFont: parseFloat(style('.paper-meta > span').fontSize),
      vibeFont: parseFloat(style('.vibe-description').fontSize),
    };
  });
  expect(sizing.paperMetaFont).toBeGreaterThanOrEqual(10);
  expect(sizing.vibeFont).toBeGreaterThanOrEqual(12);
  expect(sizing.footerFont).toBeGreaterThanOrEqual(9);
  expect(sizing.footerHeight).toBeGreaterThanOrEqual(24);
  expect(sizing.paperLinkHeight).toBeGreaterThanOrEqual(24);
});

test('mobile without JavaScript keeps English content and every ordinary destination', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'No-JS contract is intentionally retained once at the target mobile viewport.');
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/');

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.t-en').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Switch language / 切换语言' })).toBeHidden();
  await expect(page.locator('.footer-routes a')).toHaveCount(6);
  await expect(page.locator('.footer-socials a')).toHaveCount(3);
  await expect(page.locator('a.talk[href^="mailto:"]')).toBeVisible();
  await expect(page.locator('a.draw-control[href="/prompts/"]')).toBeVisible();
  for (const route of ['/about/', '/research/', '/projects/', '/cv/', '/contact/', '/prompts/']) {
    await expect(page.locator(`a[href="${route}"]`).first()).toBeVisible();
  }
  await page.goto('/cv/');
  await expect(page.locator('a[download][href="/cv.pdf"]')).toBeVisible();
  await page.goto('/prompts/');
  await expect(page.locator('.stagenav a')).toHaveCount(8);
  await context.close();
});

test('capture deterministic source-comparison artifacts', async ({ page }, testInfo) => {
  await mkdir(artifactDir, { recursive: true });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const originalViewport = page.viewportSize();
  if (!originalViewport) throw new Error('Original artifact viewport was not available');

  const captureFull = async (name: string, sourceHeight?: number) => {
    const path = `${artifactDir}/${name}`;
    const viewport = page.viewportSize();
    if (!viewport) throw new Error('Artifact viewport was not available');
    const documentHeight = sourceHeight ?? await page.evaluate(() => document.documentElement.scrollHeight);
    const cleanup = await applyArtifactProjection(page, viewport.width, documentHeight);
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
      expect(guides[0].height).toBeCloseTo(documentHeight, 0);
      expect(guides[1].height).toBeCloseTo(documentHeight, 0);
      expect(guides[0].transformOrigin).toMatch(/ 0px$/);
      expect(guides[1].transformOrigin).toMatch(/ 0px$/);
      const footer = await page.locator('.footer-decoration').boundingBox();
      if (!footer) throw new Error('Artifact footer was not rendered');
      expect(Math.abs(Math.round(footer.y + footer.height) - documentHeight)).toBeLessThanOrEqual(16);
      await page.screenshot({ animations: 'disabled', fullPage: false, path });
    } finally {
      await cleanup();
    }
  };

  const captureSection = async (
    name: string,
    locator: Locator,
    bounds: { after?: Locator; bottom: Locator; capBefore?: Locator; top: Locator },
    horizontalMargin = 32,
    verticalMargin = 20,
  ) => {
    const path = `${artifactDir}/${name}`;
    const box = await locator.boundingBox();
    const topBox = await bounds.top.boundingBox();
    const bottomBox = await bounds.bottom.boundingBox();
    const capBeforeBox = await bounds.capBefore?.boundingBox();
    const afterBox = await bounds.after?.boundingBox();
    const viewport = page.viewportSize();
    if (!box || !topBox || !bottomBox || !viewport) throw new Error(`Section geometry was unavailable for ${name}`);
    const pageY = Math.max(0, Math.floor(Math.min(box.y, topBox.y) - verticalMargin));
    let pageBottom = Math.ceil(bottomBox.y + bottomBox.height + verticalMargin);
    if (capBeforeBox) pageBottom = Math.min(pageBottom, Math.floor(capBeforeBox.y - 4));
    if (afterBox) expect(pageY).toBeGreaterThanOrEqual(Math.ceil(afterBox.y + afterBox.height + 4));
    if (capBeforeBox) expect(pageBottom).toBeLessThanOrEqual(Math.floor(capBeforeBox.y - 4));
    const clip = {
      x: Math.max(0, Math.floor(box.x - horizontalMargin)),
      pageY,
      width: Math.min(viewport.width, Math.ceil(box.x + box.width + horizontalMargin))
        - Math.max(0, Math.floor(box.x - horizontalMargin)),
      height: pageBottom - pageY,
    };
    const fixedLayers = page.locator('.stitch-header, .stitch-footer');
    await fixedLayers.evaluateAll((elements) => {
      for (const element of elements) (element as HTMLElement).style.visibility = 'hidden';
    });
    try {
      await page.setViewportSize({ width: viewport.width, height: Math.max(viewport.height, clip.height) });
      await page.evaluate((pageY) => window.scrollTo(0, pageY), clip.pageY);
      const scrollY = await page.evaluate(() => window.scrollY);
      for (const layer of await fixedLayers.all()) await expect(layer).toBeHidden();
      await page.screenshot({
        animations: 'disabled',
        clip: { x: clip.x, y: clip.pageY - scrollY, width: clip.width, height: clip.height },
        path,
      });
    } finally {
      await fixedLayers.evaluateAll((elements) => {
        for (const element of elements) (element as HTMLElement).style.removeProperty('visibility');
      });
      await page.setViewportSize(viewport);
      await page.evaluate(() => window.scrollTo(0, 0));
    }
  };

  if (testInfo.project.name === 'canonical-768') {
    await captureFull('home-768-full.png', 2_079);
    await captureSection('research-768.png', page.locator('#research'), {
      bottom: page.locator('.pub-card--3'),
      capBefore: page.locator('#vibe > h2'),
      top: page.locator('.research-heading h2'),
    });
    await captureSection('vibe-768.png', page.locator('#vibe'), {
      after: page.locator('.pub-card--3'),
      bottom: page.locator('.vibe-lower'),
      top: page.locator('#vibe > h2'),
    });
    const researchSize = await pngSize(`${artifactDir}/research-768.png`);
    const vibeSize = await pngSize(`${artifactDir}/vibe-768.png`);
    expect(researchSize.width).toBeGreaterThanOrEqual(720);
    expect(researchSize.height).toBeGreaterThanOrEqual(540);
    expect(researchSize.height).toBeLessThanOrEqual(600);
    expect(vibeSize.width).toBeGreaterThanOrEqual(720);
    expect(vibeSize.height).toBeGreaterThanOrEqual(790);
  } else if (testInfo.project.name === 'desktop') {
    await captureFull('home-1440-full.png');
  } else if (testInfo.project.name === 'mobile') {
    await captureFull('home-390-full.png');
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
