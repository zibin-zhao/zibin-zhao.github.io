import { expect, test, type Locator, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const routes = ['/', '/about/', '/research/', '/projects/', '/cv/', '/contact/', '/prompts/'] as const;
const artifactDir = 'artifacts/stitch';

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
        top: rect.top + scrollY,
        width: rect.width,
      };
    };
    return {
      documentHeight: document.documentElement.scrollHeight,
      footerRoutes: box('.footer-routes'),
      footerSocials: box('.footer-socials'),
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
  expect(geometry.researchBanner.width).toBeGreaterThanOrEqual(360);
  expect(geometry.researchBanner.width).toBeLessThanOrEqual(410);
  const researchWidthRanges = [[500, 545], [410, 450], [350, 390]] as const;
  for (let index = 0; index < geometry.researchCards.length; index += 1) {
    expect(geometry.researchCards[index].width).toBeGreaterThanOrEqual(researchWidthRanges[index][0]);
    expect(geometry.researchCards[index].width).toBeLessThanOrEqual(researchWidthRanges[index][1]);
  }
  expect(geometry.vibeHeading.width).toBeGreaterThanOrEqual(220);
  expect(geometry.vibeHeading.width).toBeLessThanOrEqual(260);
  expect(geometry.vibeNote.width).toBeGreaterThanOrEqual(275);
  expect(geometry.vibeNote.width).toBeLessThanOrEqual(310);
  expect(geometry.vibeNote.top).toBeGreaterThanOrEqual(1_220);
  expect(geometry.vibeNote.top).toBeLessThanOrEqual(1_250);
  const [casmd, singularity, medit, yaos, zen] = geometry.vibeCards;
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

  const capture = async (name: string, locator?: Locator, sourceHeight?: number) => {
    const path = `${artifactDir}/${name}`;
    if (locator) await locator.screenshot({ animations: 'disabled', path });
    else {
      const viewport = page.viewportSize();
      if (!viewport) throw new Error('Artifact viewport was not available');
      const documentHeight = sourceHeight ?? await page.evaluate(() => document.documentElement.scrollHeight);
      await page.setViewportSize({ width: viewport.width, height: documentHeight });
      const footer = await page.locator('.footer-decoration').boundingBox();
      if (!footer) throw new Error('Artifact footer was not rendered');
      expect(Math.abs(Math.round(footer.y + footer.height) - documentHeight)).toBeLessThanOrEqual(16);
      await page.screenshot({ animations: 'disabled', fullPage: false, path });
    }
  };

  if (testInfo.project.name === 'canonical-768') {
    await capture('home-768-full.png', undefined, 2_079);
    await capture('research-768.png', page.locator('#research'));
    await capture('vibe-768.png', page.locator('#vibe'));
  } else if (testInfo.project.name === 'desktop') {
    await capture('home-1440-full.png');
  } else if (testInfo.project.name === 'mobile') {
    await capture('home-390-full.png');
    await page.setViewportSize(originalViewport);
    await page.goto('/research/', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await capture('research-index-390-full.png');
    await page.setViewportSize(originalViewport);
    await page.goto('/prompts/', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await capture('prompts-390-full.png');
  }
});
