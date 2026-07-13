import { expect, test, type Locator, type Page } from '@playwright/test';

const motionState = (locator: Locator) => locator.evaluate((element) => {
  const style = getComputedStyle(element);
  const matrix = new DOMMatrixReadOnly(style.transform);
  return {
    angle: Math.round(Math.atan2(matrix.b, matrix.a) * 180 / Math.PI),
    shadow: style.boxShadow,
    tx: Math.round(matrix.m41),
    ty: Math.round(matrix.m42),
  };
});

const paintState = (locator: Locator) => locator.evaluate((element) => {
  const style = getComputedStyle(element);
  return {
    background: style.backgroundColor,
    border: style.borderTopColor,
    color: style.color,
    shadow: style.boxShadow,
    transitionDuration: style.transitionDuration,
  };
});

const activeState = async (page: Page, locator: Locator) => {
  const box = await locator.boundingBox();
  if (!box) throw new Error('Control has no rendered box');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(200);
  const state = await motionState(locator);
  await page.mouse.up();
  return state;
};

test('renders the homepage and switches its bilingual content', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Zibin Zhao/);
  await expect(page.locator('.hero-wordmark')).toBeVisible();
  await expect(page.locator('.hero-wordmark')).toContainText('ZIBIN');
  await expect(page.locator('.hero-wordmark')).toContainText('ZHAO');
  await expect(page.locator('.hero-formula')).toBeVisible();
  await expect(page.locator('.note-formula')).toBeHidden();

  await page.getByRole('button', { name: 'Switch language / 切换语言' }).click();

  await expect(page.locator('html')).toHaveAttribute('lang', 'zh');
  await expect(page.locator('html')).toHaveAttribute('data-lang', 'zh');
  await expect(page.locator('.collaboration-sticker .t-zh')).toHaveText('开放合作');
  await expect(page.locator('.collaboration-sticker .t-zh')).toBeVisible();
  await expect(page.locator('.research-heading .t-zh').first()).toBeVisible();
});

test('renders the three authored featured papers and every canonical link', async ({ page }) => {
  await page.goto('/#research');

  const cards = page.locator('[data-featured-paper]');
  await expect(cards).toHaveCount(3);
  await expect(cards.locator('h3')).toHaveText([
    /DNA-guided CRISPR–Cas12a effectors for programmable RNA recognition and cleavage/,
    /Structure-enhanced deep learning accelerates aptamer selection for small molecule families like steroids/,
    /Transforming ECG diagnosis: an in-depth review of transformer-based deep-learning models in cardiovascular disease detection/,
  ]);
  await expect(cards.locator('.paper-authors')).toHaveCount(3);
  await expect(cards.locator('.paper-star')).toHaveCount(3);

  const links = cards.locator('.paper-links a');
  await expect(links).toHaveCount(4);
  for (const link of await links.all()) {
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(link).toHaveAttribute('href', /^(https:\/\/doi\.org|https:\/\/github\.com|https:\/\/arxiv\.org)/);
  }
});

test('exposes the complete publication archive inside the research Index Sheet', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/research/');

  await expect(page).toHaveTitle(/Research — Zibin Zhao/);
  await expect(page.locator('.index-sheet')).toBeVisible();
  await expect(page.locator('.index-sheet .pub')).toHaveCount(9);
  const expectedTitles = [
    'Thermodynamically programmed one-pot CRISPR platform for point-of-care SNP genotyping',
    'DNA-guided CRISPR–Cas12a effectors for programmable RNA recognition and cleavage',
    'Structure-enhanced deep learning accelerates aptamer selection for small molecule families like steroids',
    'DNA-guided CRISPR/Cas effector for programmable RNA-recognition and cleavage',
    'DNA hydrogel-interfaced organic electrochemical transistor for the investigation of binding-induced conformational change of small molecule aptamers',
    'Benchtop to at-home test: amplicon-depleted CRISPR-regulated loop-mediated amplification at skin-temperature for viral load monitoring',
    'Transforming ECG diagnosis: an in-depth review of transformer-based deep-learning models in cardiovascular disease detection',
    'Skin-adherent elastomer-hydrogel patch for continuous 12-lead cardiac ambulatory monitoring during physical activities',
    'Integrating magnetic-bead-based sample extraction and molecular barcoding for the one-step pooled RT-qPCR assay of viral pathogens without retesting',
  ];
  const renderedTitles = (await page.locator('.index-sheet .pub h3').allTextContents()).map((title) => title.replace(/★$/, ''));
  expect(renderedTitles.sort()).toEqual(expectedTitles.sort());
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => document.documentElement.clientWidth),
  );
});

test('preserves authored research widths, offsets, rotations, and overlap at 768px', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#research');

  const stack = page.locator('.research-stack');
  const slots = page.locator('.fade-slot');
  const cards = page.locator('.pub-card');
  const stackBox = await stack.boundingBox();
  const boxes = await Promise.all([0, 1, 2].map((index) => slots.nth(index).boundingBox()));
  if (!stackBox || boxes.some((box) => !box)) throw new Error('Research geometry was not rendered');
  const [first, second, third] = boxes as NonNullable<(typeof boxes)[number]>[];

  expect(first.width / stackBox.width).toBeCloseTo(.85, 1);
  expect(second.width / stackBox.width).toBeCloseTo(.70, 1);
  expect(third.width / stackBox.width).toBeCloseTo(.60, 1);
  expect(first.x).toBeGreaterThan(second.x);
  expect(third.x).toBeGreaterThan(second.x);
  expect(second.y).toBeLessThan(first.y + first.height);
  expect(await motionState(cards.nth(0))).toMatchObject({ angle: -1 });
  expect(await motionState(cards.nth(1))).toMatchObject({ angle: 2 });
  expect(await motionState(cards.nth(2))).toMatchObject({ angle: -3 });
  await expect(cards.nth(0)).toHaveCSS('border-top-style', 'solid');
  await expect(cards.nth(1)).toHaveCSS('border-top-style', 'solid');
  await expect(cards.nth(2)).toHaveCSS('border-top-style', 'dashed');
});

test('keeps the asymmetric research stack legible without overflow at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#research');

  await expect(page.locator('[data-featured-paper]')).toHaveCount(3);
  for (const card of await page.locator('[data-featured-paper]').all()) await expect(card).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => document.documentElement.clientWidth),
  );
  const widths = await page.locator('.fade-slot').evaluateAll((slots) => slots.map((slot) => slot.getBoundingClientRect().width));
  expect(widths[0]).toBeGreaterThan(widths[1]);
  expect(widths[1]).toBeGreaterThan(widths[2]);

  const headerBox = await page.locator('.stitch-header').boundingBox();
  const headingBox = await page.locator('.research-heading').boundingBox();
  if (!headerBox || !headingBox) throw new Error('Anchor clearance geometry was not rendered');
  expect(headingBox.y).toBeGreaterThanOrEqual(headerBox.y + headerBox.height + 12);
});

test('renders canonical Vibe content, assets, and action semantics', async ({ page }) => {
  await page.goto('/#vibe');

  const cards = page.locator('[data-vibe-role]');
  await expect(cards).toHaveCount(5);
  await expect(cards.locator('.vibe-title')).toHaveText(['CasMD', 'Singularity奇点', 'Medit静处', 'Yaos药师法门 · 养生', 'Zen禅德 · Zende']);
  await expect(cards.locator('.vibe-description .t-en')).toHaveCount(5);
  await expect(cards.locator('.vibe-description .t-zh')).toHaveCount(5);
  await expect(cards.nth(0).locator('img')).toHaveAttribute('src', '/stitch/casmd.png');
  await expect(cards.nth(1).locator('img')).toHaveAttribute('src', '/stitch/singularity.png');
  expect(await cards.locator('img').evaluateAll((images) => images.map((image) => (image as HTMLImageElement).naturalWidth))).toEqual([512, 512]);
  await expect(cards.locator('.vibe-image')).toHaveCount(2);
  await expect(cards.nth(2).locator('.vibe-image')).toHaveCount(0);
  await expect(cards.nth(4)).toHaveCSS('border-top-style', 'dashed');
  await expect(cards.nth(4).locator('a')).toHaveCount(0);
  await expect(cards.nth(4).locator('.vibe-coming-soon')).toBeVisible();
  await expect(cards.locator('a.vibe-action')).toHaveCount(4);
  await expect(cards.nth(0).locator('a.vibe-action')).toHaveAttribute('target', '_blank');
  await expect(cards.nth(0).locator('a.vibe-action')).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(cards.nth(1).locator('a.vibe-action')).not.toHaveAttribute('target', '_blank');
  await expect(cards.nth(3).locator('a.vibe-action')).toHaveAttribute('target', '_blank');
});

test('preserves authored Vibe geometry, overlap, and rotation at 768px', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#vibe');

  const mosaic = page.locator('.vibe-mosaic');
  const slots = page.locator('.vibe-mosaic > .fade-slot');
  const cards = page.locator('[data-vibe-role]');
  const mosaicBox = await mosaic.boundingBox();
  const boxes = await Promise.all([0, 1, 2].map((index) => slots.nth(index).boundingBox()));
  const cardBoxes = await Promise.all([0, 1, 2].map((index) => cards.nth(index).boundingBox()));
  if (!mosaicBox || boxes.some((box) => !box) || cardBoxes.some((box) => !box)) throw new Error('Vibe geometry was not rendered');
  const [casmd, singularity, medit] = boxes as NonNullable<(typeof boxes)[number]>[];
  const [casmdCard, singularityCard, meditCard] = cardBoxes as NonNullable<(typeof cardBoxes)[number]>[];

  expect(casmd.width / mosaicBox.width).toBeCloseTo(8 / 12, 1);
  expect(singularity.width / mosaicBox.width).toBeCloseTo(6 / 12, 1);
  expect(medit.width / mosaicBox.width).toBeCloseTo(5 / 12, 1);
  expect(singularity.x).toBeGreaterThan(casmd.x);
  expect(singularityCard.y).toBeLessThan(casmdCard.y + casmdCard.height);
  expect(medit.x).toBeGreaterThan(singularity.x);
  expect(meditCard.y).toBeLessThan(singularityCard.y + singularityCard.height);
  for (const [index, angle] of [1, -2, 3, -1, 2].entries()) {
    expect(await motionState(cards.nth(index))).toMatchObject({ angle });
  }
});

test('keeps Vibe source order, bounded overlap, and anchor clearance at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#vibe');

  const cards = page.locator('[data-vibe-role]');
  expect(await cards.evaluateAll((elements) => elements.map((element) => element.getAttribute('data-vibe-role')))).toEqual(
    ['casmd', 'singularity', 'medit', 'yaos', 'zen'],
  );
  const boxes = await cards.evaluateAll((elements) => elements.map((element) => {
    const box = element.getBoundingClientRect();
    return { bottom: box.bottom, left: box.left, right: box.right, top: box.top };
  }));
  for (let index = 1; index < boxes.length; index += 1) {
    expect(boxes[index].top).toBeGreaterThan(boxes[index - 1].top);
    expect(boxes[index].top).toBeGreaterThan(boxes[index - 1].bottom - 70);
  }
  for (const box of boxes) {
    expect(box.left).toBeGreaterThanOrEqual(0);
    expect(box.right).toBeLessThanOrEqual(390);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

  const headerBox = await page.locator('.stitch-header').boundingBox();
  const vibeBox = await page.locator('#vibe').boundingBox();
  if (!headerBox || !vibeBox) throw new Error('Vibe anchor clearance geometry was not rendered');
  expect(vibeBox.y).toBeGreaterThanOrEqual(headerBox.y + headerBox.height + 12);
});

test('keeps keyboard navigation, CV destination, and Prompts behavior usable', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await expect(page.locator('.skip-link')).toBeVisible();
  await expect(page.locator('.footer-routes a[href="/cv/"]')).toBeVisible();

  await page.goto('/prompts/');
  await expect(page).toHaveURL(/\/prompts\/$/);
  await expect(page.locator('main h1')).toHaveCount(1);
  await expect(page.locator('.stage')).toHaveCount(8);
  await expect(page.locator('.stage h2')).toHaveCount(8);
  const copy = page.locator('.copy').first();
  await copy.click();
  await expect(copy).toHaveClass(/copied/);
});

test('keeps required shell anchors visible without JavaScript at 390px', async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto('/');

  await expect(page.getByRole('button', { name: 'Switch language / 切换语言' })).toBeHidden();
  await expect(page.locator('.site-stamp .stamp-compact')).toBeVisible();
  await expect(page.locator('.site-stamp .stamp-wide')).toBeHidden();
  await expect(page.locator('a.talk[href^="mailto:"]')).toBeVisible();
  await expect(page.locator('.footer-socials a')).toHaveCount(3);
  for (const social of await page.locator('.footer-socials a').all()) await expect(social).toBeVisible();
  await expect(page.locator('.footer-routes a')).toHaveCount(6);
  for (const route of await page.locator('.footer-routes a').all()) await expect(route).toBeVisible();
  await expect(page.locator('a.draw-control[href="/prompts/"]')).toBeVisible();
  await expect(page.locator('.footer-routes a[href="/cv/"]')).toBeVisible();
  await page.locator('.scroll-sticker').click();
  await expect(page).toHaveURL(/#research$/);
  await expect(page.locator('#research')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => document.documentElement.clientWidth),
  );

  await context.close();
});

test('applies exact normal-mode button and draw interactions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');

  expect(await motionState(page.locator('.hero-formula'))).toMatchObject({ angle: 12, tx: 0, ty: 0 });
  await expect(page.locator('.hero-formula-motion')).toHaveCSS('animation-name', 'float');
  await expect(page.locator('.hero-formula-motion')).toHaveCSS('animation-duration', '6s');

  const talk = page.locator('.talk');
  const talkActive = await activeState(page, talk);
  expect(talkActive).toMatchObject({ angle: 0, shadow: 'none', tx: 4, ty: 4 });
  expect(await motionState(page.locator('.talk-angle'))).toMatchObject({ angle: -2, tx: 0, ty: 0 });

  const draw = page.locator('.draw-control');
  await draw.hover();
  await page.waitForTimeout(200);
  expect(await motionState(draw)).toMatchObject({ angle: 12, tx: 0, ty: 0 });
});

test('keeps reduced-motion geometry static while retaining immediate interaction feedback', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  expect(await motionState(page.locator('.hero-formula'))).toMatchObject({ angle: 12, tx: 0, ty: 0 });
  await expect(page.locator('.hero-formula-motion')).toHaveCSS('animation-name', 'none');

  const talk = page.locator('.talk');
  const talkResting = await motionState(talk);
  const talkRestingPaint = await paintState(talk);
  expect(talkResting).toMatchObject({ angle: 0, tx: 0, ty: 0 });
  expect((await activeState(page, talk))).toEqual(talkResting);
  const talkBox = await talk.boundingBox();
  if (!talkBox) throw new Error('Talk control has no rendered box');
  await page.mouse.move(talkBox.x + talkBox.width / 2, talkBox.y + talkBox.height / 2);
  await page.mouse.down();
  const talkActivePaint = await paintState(talk);
  await page.mouse.up();
  expect(talkActivePaint.transitionDuration).toBe('0s');
  expect(talkActivePaint).not.toEqual(talkRestingPaint);
  expect(await motionState(page.locator('.talk-angle'))).toMatchObject({ angle: -2, tx: 0, ty: 0 });

  const draw = page.locator('.draw-control');
  const drawResting = await motionState(draw);
  const drawDisc = draw.locator('.draw-disc');
  const drawRestingPaint = await paintState(drawDisc);
  expect(drawResting).toMatchObject({ angle: -12, tx: 0, ty: 0 });
  await draw.hover();
  expect(await motionState(draw)).toEqual(drawResting);
  expect(await paintState(drawDisc)).not.toEqual(drawRestingPaint);

  const footerPill = page.locator('.footer-routes .footer-pill').first();
  const footerResting = await motionState(footerPill);
  const footerRestingPaint = await paintState(footerPill);
  await footerPill.hover();
  expect(await motionState(footerPill)).toMatchObject({
    angle: footerResting.angle,
    tx: footerResting.tx,
    ty: footerResting.ty,
  });
  expect(await paintState(footerPill)).not.toEqual(footerRestingPaint);

  const publication = page.locator('.pub-card').first();
  const publicationResting = await motionState(publication);
  const icon = publication.locator('.magnify-icon');
  const iconRestingPaint = await paintState(icon);
  await publication.hover();
  expect(await motionState(publication)).toMatchObject({
    angle: publicationResting.angle,
    tx: publicationResting.tx,
    ty: publicationResting.ty,
  });
  expect(await paintState(icon)).not.toEqual(iconRestingPaint);

  const vibeCard = page.locator('.vibe-card').first();
  const vibeResting = await motionState(vibeCard);
  const vibeRestingPaint = await paintState(vibeCard);
  await vibeCard.hover();
  expect(await motionState(vibeCard)).toMatchObject({
    angle: vibeResting.angle,
    tx: vibeResting.tx,
    ty: vibeResting.ty,
  });
  expect(await paintState(vibeCard)).not.toEqual(vibeRestingPaint);
});


test('mobile footer flows after content and exposes complete 44px controls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });

  await expect(page.locator('.stitch-footer')).toHaveCSS('position', 'relative');
  const main = await page.locator('#main-content').boundingBox();
  const footer = await page.locator('.stitch-footer').boundingBox();
  if (!main || !footer) throw new Error('Mobile shell geometry missing');
  expect(footer.y).toBeGreaterThanOrEqual(main.y + main.height - 1);

  for (const target of await page.locator('.footer-pill, .draw-control').all()) {
    const box = await target.boundingBox();
    if (!box) throw new Error('Footer target missing');
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.width).toBeGreaterThanOrEqual(44);
  }

  await expect(page.locator('.footer-routes a[href="/contact/"]')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('homepage cards expose primary destinations and the bilingual personal close', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });

  await expect(page.locator('.paper-primary-link')).toHaveCount(3);
  await expect(page.locator('.vibe-primary-link')).toHaveCount(4);
  await expect(page.getByRole('heading', { name: 'Beyond the lab' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Start a conversation/ })).toHaveAttribute('href', /^mailto:/);

  await page.locator('[data-vibe-role="singularity"]').click({ position: { x: 20, y: 20 } });
  await expect(page).toHaveURL(/\/singularity\/$/);
  await page.goBack({ waitUntil: 'networkidle' });

  await page.getByRole('button', { name: 'Switch language / 切换语言' }).click();
  await expect(page.getByRole('heading', { name: '实验室之外' })).toBeVisible();
  await expect(page.getByText('心理学 · 佛学')).toBeVisible();
});

test('tablet and mobile retain readable supporting type and complete action targets', async ({ page }) => {
  for (const viewport of [{ width: 768, height: 1024 }, { width: 390, height: 844 }, { width: 320, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/', { waitUntil: 'networkidle' });

    for (const selector of ['.hero-card > p:not(.hero-thesis)', '.paper-authors', '.vibe-description']) {
      const sizes = await page.locator(selector).evaluateAll((elements) =>
        elements.map((element) => Number.parseFloat(getComputedStyle(element).fontSize)),
      );
      expect(Math.min(...sizes), selector + ' at ' + viewport.width + 'px').toBeGreaterThanOrEqual(14);
    }

    for (const selector of ['.paper-links a', '.vibe-action', '.footer-pill']) {
      const facts = await page.locator(selector).evaluateAll((elements) =>
        elements.map((element) => {
          const style = getComputedStyle(element);
          const target = element as HTMLElement;
          return {
            fontSize: Number.parseFloat(style.fontSize),
            height: target.offsetHeight,
            width: target.offsetWidth,
          };
        }),
      );
      for (const fact of facts) {
        expect(fact.fontSize, selector + ' font at ' + viewport.width + 'px').toBeGreaterThanOrEqual(12);
        expect(fact.height, selector + ' height at ' + viewport.width + 'px').toBeGreaterThanOrEqual(44);
        expect(fact.width, selector + ' width at ' + viewport.width + 'px').toBeGreaterThanOrEqual(44);
      }
    }

    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
  }
});

test('homepage reflows at a 200%-scale 320px CSS viewport', async ({ browser }) => {
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    viewport: { width: 320, height: 844 },
  });
  const page = await context.newPage();
  await page.goto('/', { waitUntil: 'networkidle' });
  expect(await page.evaluate(() => window.innerWidth)).toBe(320);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await context.close();
});
