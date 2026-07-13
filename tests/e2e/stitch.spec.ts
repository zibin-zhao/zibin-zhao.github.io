import { expect, test, type Locator, type Page } from '@playwright/test';
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

test('reduced motion removes animation while preserving authored resting transforms', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'networkidle' });

  const animated = page.locator([
    '.animate-parallax-slow', '.animate-parallax-fast', '.animate-float', '.blob',
    '.animate-fade-up-1', '.animate-fade-up-2', '.animate-fade-up-3', '.animate-fade-up-4',
    '.marquee span',
  ].join(','));
  expect(await animated.evaluateAll((elements) => elements.map((element) => getComputedStyle(element).animationName)))
    .toEqual(Array(await animated.count()).fill('none'));
  if (testInfo.project.name === 'mobile') {
    await expect(page.locator('.hero-formula')).toBeHidden();
  } else {
    await expect(page.locator('.hero-formula')).toHaveCSS('transform', /matrix/);
    await expect(page.locator('.hero-formula')).toBeVisible();
  }
  for (const card of await page.locator('.pub-card, .vibe-card').all()) await expect(card).toBeVisible();
});

test('sticker constellation stays static and overflow-free at every authored width', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'The four authored widths are covered once in the focused mobile project.');
  await page.emulateMedia({ reducedMotion: 'reduce' });

  for (const width of [1_440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: width <= 390 ? 844 : 1_024 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await expectNoHorizontalOverflow(page);

    const constellation = page.locator('[data-sticker-constellation]');
    const figures = constellation.locator('figure');
    await expect(figures).toHaveCount(7);
    await expect(constellation.locator('figcaption')).toHaveCount(7);

    const sectionBox = await constellation.boundingBox();
    if (!sectionBox) throw new Error(`Sticker constellation did not render at ${width}px`);
    expect(sectionBox.x, `${width}px section left edge`).toBeGreaterThanOrEqual(0);
    expect(sectionBox.x + sectionBox.width, `${width}px section right edge`).toBeLessThanOrEqual(width);

    for (const figure of await figures.all()) {
      const [figureBox, imageBox, captionBox] = await Promise.all([
        figure.boundingBox(),
        figure.locator('img').boundingBox(),
        figure.locator('figcaption').boundingBox(),
      ]);
      if (!figureBox || !imageBox || !captionBox) throw new Error(`Sticker geometry was unavailable at ${width}px`);
      expect(figureBox.x, `${width}px figure left edge`).toBeGreaterThanOrEqual(sectionBox.x);
      expect(figureBox.x + figureBox.width, `${width}px figure right edge`)
        .toBeLessThanOrEqual(sectionBox.x + sectionBox.width);
      expect(captionBox.y, `${width}px caption/image separation`)
        .toBeGreaterThanOrEqual(imageBox.y + imageBox.height);
      await expect(figure).toHaveCSS('position', 'static');
    }

    const wrappers = constellation.locator('.sticker-reveal, .sticker-parallax, .sticker-drift');
    for (const wrapper of await wrappers.all()) {
      await expect(wrapper).toHaveCSS('animation-name', 'none');
      await expect(wrapper).toHaveCSS('transform', 'none');
      await expect(wrapper).toHaveCSS('opacity', '1');
    }
    expect(await constellation.evaluate((element) =>
      getComputedStyle(element).getPropertyValue('--sticker-scroll').trim(),
    )).toBe('0px');
  }
});

test('sticker motion reveals once and clamps the shared parallax property', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Runtime sticker motion is covered once in the focused mobile project.');
  await page.goto('/', { waitUntil: 'networkidle' });

  const constellation = page.locator('[data-sticker-constellation]');
  await constellation.scrollIntoViewIfNeeded();
  await expect(constellation).toHaveClass(/is-revealed/);
  const readOffset = () => constellation.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).getPropertyValue('--sticker-scroll')),
  );
  expect(Math.abs(await readOffset())).toBeLessThanOrEqual(12);

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(40);
  expect(Math.abs(await readOffset())).toBeLessThanOrEqual(12);
  await expect(constellation).toHaveClass(/is-revealed/);
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

test('canonical homepage keeps the readable tablet sticker composition and authored anchors', async ({ page }, testInfo) => {
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
      collaborationClose: box('.collaboration-close'),
      contact: box('.footer-routes a[href="/contact/"]'),
      draw: box('.draw-control'),
      footerRoutes: box('.footer-routes'),
      footerSocials: box('.footer-socials'),
      guideLeftX: (document.querySelector('.guide-left') as HTMLElement).offsetLeft,
      guideRightX: (document.querySelector('.guide-right') as HTMLElement).offsetLeft
        + (document.querySelector('.guide-right') as HTMLElement).offsetWidth,
      githubShelf: box('.github-project-shelf'),
      hero: box('.stitch-hero'),
      heroCard: box('.hero-card'),
      research: box('#research'),
      researchBanner: box('.research-heading h2'),
      researchCards: [...document.querySelectorAll('.pub-card')].map((_, index) => box(`.pub-card--${index + 1}`)),
      vibe: box('#vibe'),
      vibeCards: ['casmd', 'singularity', 'medit', 'yaos', 'zen'].map((role) => box(`[data-vibe-role="${role}"]`)),
      vibeHeading: box('#vibe > h2'),
      vibeNote: box('.field-note'),
      stickerConstellation: box('[data-sticker-constellation]'),
    };
  });

  expect(geometry.documentHeight).toBeGreaterThanOrEqual(5_600);
  expect(geometry.documentHeight).toBeLessThanOrEqual(5_680);
  expect(geometry.hero.bottom).toBeGreaterThanOrEqual(740);
  expect(geometry.hero.bottom).toBeLessThanOrEqual(800);
  expect(geometry.research.top).toBeGreaterThanOrEqual(790);
  expect(geometry.research.top).toBeLessThanOrEqual(840);
  expect(geometry.research.height).toBeGreaterThanOrEqual(760);
  expect(geometry.research.height).toBeLessThanOrEqual(820);
  expect(geometry.vibe.top).toBeGreaterThanOrEqual(1_640);
  expect(geometry.vibe.top).toBeLessThanOrEqual(1_710);
  expect(geometry.vibe.height).toBeGreaterThanOrEqual(3_730);
  expect(geometry.vibe.height).toBeLessThanOrEqual(3_800);
  expect(geometry.heroCard.width).toBeGreaterThanOrEqual(370);
  expect(geometry.heroCard.width).toBeLessThanOrEqual(410);
  expect(geometry.heroCard.left).toBeGreaterThanOrEqual(180);
  expect(geometry.heroCard.left).toBeLessThanOrEqual(205);
  expect(geometry.heroCard.top).toBeGreaterThanOrEqual(315);
  expect(geometry.heroCard.top).toBeLessThanOrEqual(345);
  expect(geometry.researchBanner.width).toBeGreaterThanOrEqual(320);
  expect(geometry.researchBanner.width).toBeLessThanOrEqual(350);
  expect(geometry.researchBanner.left).toBeGreaterThanOrEqual(10);
  expect(geometry.researchBanner.left).toBeLessThanOrEqual(30);
  expect(geometry.researchBanner.top).toBeGreaterThanOrEqual(795);
  expect(geometry.researchBanner.top).toBeLessThanOrEqual(825);
  const researchWidthRanges = [[530, 550], [440, 460], [380, 400]] as const;
  const researchLeftRanges = [[150, 175], [55, 75], [180, 200]] as const;
  const researchTopRanges = [[895, 930], [1_095, 1_125], [1_370, 1_400]] as const;
  for (let index = 0; index < geometry.researchCards.length; index += 1) {
    expect(geometry.researchCards[index].width).toBeGreaterThanOrEqual(researchWidthRanges[index][0]);
    expect(geometry.researchCards[index].width).toBeLessThanOrEqual(researchWidthRanges[index][1]);
    expect(geometry.researchCards[index].left).toBeGreaterThanOrEqual(researchLeftRanges[index][0]);
    expect(geometry.researchCards[index].left).toBeLessThanOrEqual(researchLeftRanges[index][1]);
    expect(geometry.researchCards[index].top).toBeGreaterThanOrEqual(researchTopRanges[index][0]);
    expect(geometry.researchCards[index].top).toBeLessThanOrEqual(researchTopRanges[index][1]);
  }
  expect(geometry.researchCards[2].height).toBeGreaterThanOrEqual(210);
  expect(geometry.researchCards[2].height).toBeLessThanOrEqual(235);
  expect(geometry.vibeHeading.width).toBeGreaterThanOrEqual(150);
  expect(geometry.vibeHeading.width).toBeLessThanOrEqual(180);
  expect(geometry.vibeHeading.left).toBeGreaterThanOrEqual(560);
  expect(geometry.vibeHeading.left).toBeLessThanOrEqual(590);
  expect(geometry.vibeHeading.top).toBeGreaterThanOrEqual(1_640);
  expect(geometry.vibeHeading.top).toBeLessThanOrEqual(1_690);
  expect(geometry.vibeNote.width).toBeGreaterThanOrEqual(285);
  expect(geometry.vibeNote.width).toBeLessThanOrEqual(305);
  expect(geometry.vibeNote.top).toBeGreaterThanOrEqual(1_660);
  expect(geometry.vibeNote.top).toBeLessThanOrEqual(1_710);
  const [casmd, singularity, medit, yaos, zen] = geometry.vibeCards;
  expect(casmd.left).toBeGreaterThanOrEqual(25);
  expect(casmd.left).toBeLessThanOrEqual(50);
  expect(casmd.width).toBeGreaterThanOrEqual(430);
  expect(casmd.width).toBeLessThanOrEqual(470);
  expect(casmd.top).toBeGreaterThanOrEqual(1_790);
  expect(casmd.top).toBeLessThanOrEqual(1_840);
  expect(singularity.width).toBeGreaterThanOrEqual(280);
  expect(singularity.width).toBeLessThanOrEqual(300);
  expect(singularity.left).toBeGreaterThanOrEqual(80);
  expect(singularity.left).toBeLessThanOrEqual(105);
  expect(singularity.top).toBeGreaterThanOrEqual(2_140);
  expect(singularity.top).toBeLessThanOrEqual(2_190);
  expect(medit.width).toBeGreaterThanOrEqual(275);
  expect(medit.width).toBeLessThanOrEqual(290);
  expect(medit.left).toBeGreaterThanOrEqual(385);
  expect(medit.left).toBeLessThanOrEqual(405);
  expect(medit.top).toBeGreaterThanOrEqual(2_120);
  expect(medit.top).toBeLessThanOrEqual(2_170);
  for (const card of [yaos, zen]) {
    expect(card.width).toBeGreaterThanOrEqual(270);
    expect(card.width).toBeLessThanOrEqual(290);
  }
  expect(yaos.left).toBeGreaterThanOrEqual(85);
  expect(yaos.left).toBeLessThanOrEqual(125);
  expect(zen.left).toBeGreaterThanOrEqual(375);
  expect(zen.left).toBeLessThanOrEqual(415);
  for (const card of [yaos, zen]) {
    expect(card.top).toBeGreaterThanOrEqual(2_570);
    expect(card.top).toBeLessThanOrEqual(2_610);
  }
  expect(geometry.githubShelf.top).toBeGreaterThan(Math.max(yaos.bottom, zen.bottom) + 40);
  expect(geometry.stickerConstellation.top).toBeGreaterThan(geometry.githubShelf.bottom + 40);
  expect(geometry.collaborationClose.top).toBeGreaterThan(geometry.stickerConstellation.bottom + 20);
  expect(geometry.guideLeftX).toBeCloseTo(768 * .15, 0);
  expect(geometry.guideRightX).toBeCloseTo(768 * .76, 0);
  expect(geometry.footerSocials.left).toBeGreaterThanOrEqual(20);
  expect(geometry.footerSocials.left).toBeLessThanOrEqual(30);
  expect(geometry.footerSocials.height).toBeGreaterThanOrEqual(40);
  expect(geometry.footerSocials.height).toBeLessThanOrEqual(52);
  expect(geometry.footerRoutes.right).toBeGreaterThanOrEqual(740);
  expect(geometry.footerRoutes.right).toBeLessThanOrEqual(750);
  expect(geometry.footerRoutes.height).toBeGreaterThanOrEqual(40);
  expect(geometry.footerRoutes.height).toBeLessThanOrEqual(52);
  const tabletRailStyles = await page.locator('.footer-socials, .footer-routes').evaluateAll((rails) => rails.map((rail) => {
    const style = getComputedStyle(rail);
    return { flexWrap: style.flexWrap, overflowX: style.overflowX };
  }));
  expect(tabletRailStyles).toEqual([
    { flexWrap: 'nowrap', overflowX: 'visible' },
    { flexWrap: 'nowrap', overflowX: 'visible' },
  ]);
  await expect(page.locator('.footer-socials a')).toHaveCount(3);
  await expect(page.locator('.footer-routes a')).toHaveCount(6);
  for (const anchor of await page.locator('.footer-socials a, .footer-routes a').all()) await expect(anchor).toBeVisible();
  const horizontalOverlap = Math.max(0, Math.min(geometry.contact.right, geometry.draw.right) - Math.max(geometry.contact.left, geometry.draw.left));
  const verticalOverlap = Math.max(0, Math.min(geometry.contact.bottom, geometry.draw.bottom) - Math.max(geometry.contact.top, geometry.draw.top));
  expect(horizontalOverlap * verticalOverlap).toBe(0);
  if (verticalOverlap > 0) {
    const horizontalGap = geometry.contact.right <= geometry.draw.left
      ? geometry.draw.left - geometry.contact.right
      : geometry.contact.left - geometry.draw.right;
    expect(horizontalGap).toBeGreaterThanOrEqual(4);
  }

  await page.locator('.footer-routes a[href="/contact/"]').click();
  await expect(page).toHaveURL(/\/contact\/$/);
  await page.goto('/');
  await page.locator('.draw-control').click();
  await expect(page).toHaveURL(/\/prompts\/$/);
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

test('Contact and draw controls remain disjoint and actionable at every footer tier', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'canonical-768', 'Footer-tier geometry is retained once across representative widths.');
  for (const width of [390, 600, 768, 1_024, 1_440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.goto('/', { waitUntil: 'networkidle' });
    await expectNoHorizontalOverflow(page);
    await expect(page.locator('.footer-routes a')).toHaveCount(6);
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
      await page.goto('/');
      await page.locator('.draw-control').click();
      await expect(page).toHaveURL(/\/prompts\/$/);
      await page.goto('/');
    }
  }

  await page.locator('.footer-routes a[href="/contact/"]').click();
  await expect(page).toHaveURL(/\/contact\/$/);
  await page.goto('/');
  await page.locator('.draw-control').click();
  await expect(page).toHaveURL(/\/prompts\/$/);
});

test('mobile without JavaScript keeps English content and every ordinary destination', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'No-JS contract is intentionally retained once at the target mobile viewport.');
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/');

  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.site-stamp .stamp-compact')).toBeVisible();
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
      const size = await pngSize(path);
      expect(size).toEqual({ height: documentHeight, width: viewport.width });
      if (testInfo.project.name === 'canonical-768') {
        const finalClose = await page.locator('.collaboration-close').boundingBox();
        const dockBoxes = await Promise.all([
          page.locator('.footer-socials').boundingBox(),
          page.locator('.footer-routes').boundingBox(),
        ]);
        if (!finalClose || dockBoxes.some((box) => !box)) throw new Error('Canonical artifact clearance geometry was unavailable');
        const dockTop = Math.min(...dockBoxes.map((box) => box!.y));
        expect(finalClose.y + finalClose.height).toBeLessThanOrEqual(dockTop - 8);
      }
      return documentHeight;
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
    const canonicalHeight = await captureFull('home-768-full.png');
    expect(canonicalHeight).toBeGreaterThanOrEqual(5_600);
    expect(canonicalHeight).toBeLessThanOrEqual(5_680);
    await captureSection('research-768.png', page.locator('#research'), {
      bottom: page.locator('.pub-card--3'),
      capBefore: page.locator('#vibe > h2'),
      top: page.locator('.research-heading h2'),
    });
    await captureSection('vibe-768.png', page.locator('#vibe'), {
      after: page.locator('.pub-card--3'),
      bottom: page.locator('.collaboration-close'),
      top: page.locator('#vibe > h2'),
    });
    const researchSize = await pngSize(`${artifactDir}/research-768.png`);
    const vibeSize = await pngSize(`${artifactDir}/vibe-768.png`);
    expect(researchSize.width).toBeGreaterThanOrEqual(720);
    expect(researchSize.height).toBeGreaterThanOrEqual(800);
    expect(researchSize.height).toBeLessThanOrEqual(880);
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
