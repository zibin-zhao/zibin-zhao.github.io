import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { projects } from '../../src/data/projects';
import { fragments, inkSource, sourcePixels, sourceSize } from '../../src/data/lanting';

const reader = '[data-paper-reader]';
for (const lang of ['en', 'zh'] as const) {
  test(`${lang}: every original-text entry opens its content and restores focus and scroll`, async ({
    page,
  }) => {
    // Complete journeys include WebKit's scroll and tap settling time.
    test.setTimeout(60000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(lang === 'en' ? '/' : '/zh/');
    await expect(page.locator('[data-lanting]')).toHaveAttribute('data-ready', 'true');
    await expect(page.locator('[data-fragment]')).toHaveCount(12);
    await expect(page.locator('[data-index-entry]')).toHaveCount(13);
    for (const fragment of fragments) {
      const source = page.locator(`[data-fragment="${fragment.id}"]`);
      await source.scrollIntoViewIfNeeded();
      await source.click();
      await expect(page.locator(reader)).toBeVisible();
      // Use the actual opening position after the browser aligns the tap target.
      const scroll = await page.evaluate(() => window.scrollY);
      const scrollLeft = await page
        .locator('[data-manuscript-scroll]')
        .evaluate((el) => el.scrollLeft);
      const article = page.locator(`[data-reader-entry="${fragment.entry}"]`);
      await expect(article).toBeVisible();
      await expect(page.locator('[data-reader-entry]:visible')).toHaveCount(1);
      if (fragment.entry > 0 && fragment.entry < 7) {
        const project = projects[fragment.entry - 1]!;
        await expect(page.locator('[data-reader-title]')).toHaveText(project.name);
        await expect(article.locator('.reader-summary')).toHaveText(project.summary[lang]);
        await expect(article.locator('.reader-detail')).toHaveText(project.contribution[lang]);
        await expect(article.locator('a').first()).toHaveAttribute('href', project.href);
      }
      await page.keyboard.press('Escape');
      await expect(page.locator(reader)).not.toBeVisible();
      await expect(source).toBeFocused();
      expect(await page.evaluate(() => window.scrollY)).toBeCloseTo(scroll, 0);
      expect(
        await page.locator('[data-manuscript-scroll]').evaluate((el) => el.scrollLeft),
      ).toBeCloseTo(scrollLeft, 0);
    }
  });
}

test('discovery starts hidden; proximity enlarges the ink, hover and focus reveal its label', async ({
  page,
  isMobile,
}) => {
  await page.goto('/');
  const fragment = page.locator('[data-fragment="casmd"]');
  await fragment.scrollIntoViewIfNeeded();
  await expect(fragment.locator('.fragment-caption')).toHaveCSS('opacity', '0');
  await expect(fragment.locator('.fragment-ink')).toHaveCSS('opacity', '0');
  if (!isMobile) {
    const box = (await fragment.boundingBox())!;
    await page.mouse.move(box.x - 18, box.y + box.height / 2);
    await expect(fragment).toHaveClass(/is-near/);
    await expect(fragment.locator('.fragment-ink')).toHaveCSS('opacity', '1');
    await expect(fragment.locator('.fragment-surface')).toHaveCSS(
      'transform',
      'matrix(1.14, 0, 0, 1.14, 0, 0)',
    );
    await expect(fragment.locator('.fragment-caption')).toHaveCSS('opacity', '0');
    await fragment.hover();
    await expect(fragment.locator('.fragment-caption')).toHaveCSS('opacity', '1');
    await page.mouse.move(2, 2);
  }
  await fragment.focus();
  await expect(fragment.locator('.fragment-ink')).toHaveCSS('opacity', '1');
  await expect(fragment.locator('.fragment-surface')).toHaveCSS(
    'transform',
    'matrix(1.14, 0, 0, 1.14, 0, 0)',
  );
  await expect(fragment.locator('.fragment-caption')).toHaveCSS('opacity', '1');
  await expect(page.locator('[data-reader-entry]:visible')).toHaveCount(0);
});

test('the complete original is rendered once, with transparent entries at its original positions', async ({
  page,
}) => {
  await page.goto('/zh/');
  const manuscript = page.locator('.manuscript-stage');
  const source = manuscript.locator('img');
  await expect(source).toHaveCount(1);
  await expect(source).toHaveAttribute('src', inkSource);
  await source.evaluate(async (el: HTMLImageElement) => el.decode());
  expect(
    await source.evaluate((el: HTMLImageElement) => ({
      width: el.naturalWidth,
      height: el.naturalHeight,
    })),
  ).toEqual(sourcePixels);
  // The resting manuscript stays intact. Discovery overlays quote the same source regions.
  await expect(manuscript.locator('image, .ink-text, clipPath, mask')).toHaveCount(0);
  await expect(source).toHaveCSS('filter', 'none');
  await expect(source).toHaveCSS('clip-path', 'none');
  await expect(source).toHaveCSS('transform', 'none');
  await expect(source).toHaveCSS('opacity', '1');
  const imageBox = (await source.boundingBox())!;
  expect(imageBox.width / imageBox.height).toBeCloseTo(sourcePixels.width / sourcePixels.height, 3);
  for (const fragment of fragments) {
    const target = manuscript.locator(`[data-fragment="${fragment.id}"]`);
    const box = (await target.boundingBox())!;
    expect((box.x - imageBox.x) / imageBox.width).toBeCloseTo(
      fragment.region[0] / sourceSize.width,
      3,
    );
    expect((box.y - imageBox.y) / imageBox.height).toBeCloseTo(
      fragment.region[1] / sourceSize.height,
      3,
    );
    await expect(target.locator('.fragment-ink')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(target.locator('.fragment-ink')).toHaveCSS('visibility', 'hidden');
  }
});

test('discovery enlarges the original writing around its center and restores the resting manuscript', async ({
  page,
  isMobile,
}, testInfo) => {
  await page.goto('/zh/');
  const source = page.locator('[data-fragment="casmd"]');
  const surface = source.locator('.fragment-surface');
  const ink = source.locator('.fragment-ink');
  const scroll = page.locator('[data-manuscript-scroll]');
  await source.scrollIntoViewIfNeeded();
  await page.locator('[data-manuscript-image]').evaluate((el: HTMLImageElement) => el.decode());
  const prefix = `artifacts/manuscript-discovery/hover-${testInfo.project.name}`;
  const position = await scroll.evaluate((el) => el.scrollLeft);
  const resting = (await surface.boundingBox())!;
  const before = await scroll.screenshot({ path: `${prefix}-before-ink.png` });
  if (isMobile) await source.focus();
  else await source.hover();
  await expect(ink).toHaveCSS('visibility', 'visible');
  await expect(ink).toHaveCSS('background-image', /\/lanting\/lantingxu\.jpg/);
  await expect(ink).toHaveCSS('filter', /ink-emphasis/);
  await expect(ink).toHaveCSS('box-shadow', 'none');
  await expect(surface).toHaveCSS('transform', 'matrix(1.14, 0, 0, 1.14, 0, 0)');
  await expect
    .poll(() => surface.evaluate((el) => getComputedStyle(el, '::before').opacity))
    .toBe('1');
  await expect(page.locator('[data-manuscript-image]')).toHaveCSS('transform', 'none');
  await expect(page.locator('.fragment-ink:visible')).toHaveCount(1);
  const marked = (await surface.boundingBox())!;
  expect(marked.x + marked.width / 2).toBeCloseTo(resting.x + resting.width / 2, 1);
  expect(marked.y + marked.height / 2).toBeCloseTo(resting.y + resting.height / 2, 1);
  expect(marked.width / resting.width).toBeCloseTo(1.14, 2);
  expect(marked.height / resting.height).toBeCloseTo(1.14, 2);
  await scroll.screenshot({ path: `${prefix}-active.png` });
  await page.mouse.move(2, 2);
  await page.locator('main').focus();
  await expect(ink).toHaveCSS('visibility', 'hidden');
  await expect(surface).toHaveCSS('transform', 'none');
  await expect
    .poll(() => surface.evaluate((el) => getComputedStyle(el, '::before').opacity))
    .toBe('0');
  await expect(ink).toHaveCSS('opacity', '0');
  expect(await scroll.evaluate((el) => el.scrollLeft)).toBeCloseTo(position, 1);
  const after = await scroll.screenshot({ path: `${prefix}-after-ink.png` });
  const difference = await page.evaluate(
    async ({ before, after }) => {
      async function pixels(png: string) {
        const image = new Image();
        image.src = `data:image/png;base64,${png}`;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d')!;
        context.drawImage(image, 0, 0);
        return context.getImageData(0, 0, canvas.width, canvas.height).data;
      }
      const [a, b] = await Promise.all([pixels(before), pixels(after)]);
      let maxChannelChange = 0;
      let changedPixels = 0;
      for (let i = 0; i < a.length; i += 4) {
        const delta = Math.max(
          ...[0, 1, 2].map((channel) => Math.abs(a[i + channel]! - b[i + channel]!)),
        );
        maxChannelChange = Math.max(maxChannelChange, delta);
        if (delta) changedPixels++;
      }
      return {
        sameSize: a.length === b.length,
        maxChannelChange,
        changedRatio: changedPixels / (a.length / 4),
      };
    },
    { before: before.toString('base64'), after: after.toString('base64') },
  );
  expect(difference.sameSize).toBe(true);
  // Chromium re-rasterizes a fractional crop boundary by up to two channel steps.
  // Allow that tiny edge variation, while rejecting altered ink or a remaining overlay.
  expect(difference.maxChannelChange).toBeLessThanOrEqual(2);
  expect(difference.changedRatio).toBeLessThanOrEqual(0.0001);
});

test('the original can be unrolled to its final entries without widening the page', async ({
  page,
}) => {
  await page.goto('/zh/');
  const scroll = page.locator('[data-manuscript-scroll]');
  expect(await scroll.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
  const start = await scroll.evaluate((el) => el.scrollLeft);
  expect(start).toBeLessThan(0);
  const finalEntry = page.locator('[data-fragment="tempo"]');
  await finalEntry.focus();
  await expect(finalEntry).toBeInViewport();
  expect(await scroll.evaluate((el) => el.scrollLeft)).toBeLessThan(start);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await finalEntry.click();
  await expect(page.locator('[data-reader-title]')).toHaveText('TEMPO');
  await page.locator('[data-reader-close]').click();
  await expect(finalEntry).toBeFocused();
  await expect(finalEntry).toBeInViewport();
});

test('all reading entries remain accessible, paging wraps, and dialog traps focus', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('[data-fragment="research"]').click();
  await page.locator('[data-reader-prev]').click();
  await expect(page.locator('[data-reader-title]')).toHaveText('Curriculum vitae');
  await page.locator('[data-reader-next]').click();
  await expect(page.locator('[data-reader-title]')).toHaveText('DNA-guided Cas12a');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-reader-title]')).toHaveText('CasMD');
  for (const index of [0, 7, 8, 9, 10, 11, 12]) {
    await page.locator('[data-reader-index]').click();
    await page.locator(`[data-index-entry="${index}"]`).click();
    await expect(page.locator(`[data-reader-entry="${index}"] .reader-summary`)).not.toBeEmpty();
    await expect(
      page.locator(`[data-reader-entry="${index}"] .reader-links a`).first(),
    ).toBeVisible();
  }
  const result = await new AxeBuilder({ page })
    .include(reader)
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(result.violations).toEqual([]);
  await page.locator('[data-reader-close]').focus();
  await page.keyboard.press('Shift+Tab');
  expect(await page.evaluate(() => document.activeElement?.closest('dialog') !== null)).toBe(true);
  await page.locator('[data-reader-close]').click();
  await expect(page.locator('[data-fragment="research"]')).toBeFocused();
});

test('reduced motion removes sheet transitions and touch opens directly', async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/zh/');
  const source = page.locator('[data-fragment="casmd"]');
  await source.focus();
  await expect(source.locator('.fragment-ink')).toHaveCSS('transition-duration', '0s');
  await expect(source.locator('.fragment-surface')).toHaveCSS('transition-duration', '0s');
  expect(
    await source
      .locator('.fragment-surface')
      .evaluate((el) => getComputedStyle(el, '::before').transitionDuration),
  ).toBe('0s');
  if (isMobile) await source.tap();
  else await source.click();
  await expect(page.locator('[data-reader-title]')).toHaveText('CasMD');
  expect(await page.locator(reader).evaluate((el) => el.getAnimations().length)).toBe(0);
  await page.locator('[data-reader-close]').click();
  await expect(source).toBeFocused();
});

test('no JavaScript retains the source image, direct project links, and complete index', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('[data-reveal]')).toBeHidden();
  await expect(page.locator('[data-fragment]')).toHaveCount(12);
  await page.locator('[data-fragment="index"]').click();
  await expect(page.locator('#collection')).toBeInViewport();
  await expect(page.locator('#collection .index-group li a')).toHaveCount(13);
  await page.locator('[data-fragment="medit"]').click();
  await expect(page).toHaveURL(/\/medit\/$/);
  await context.close();
});

test('returning from the embedded application leaves the sheet usable', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-fragment="medit"]').click();
  await page.locator('[data-reader-entry="3"] a').click();
  await expect(page).toHaveURL(/\/medit\/$/);
  await page.goBack();
  await expect(page.locator(reader)).toBeVisible();
  await expect(page.locator('[data-reader-title]')).toHaveText('Medit');
  await page.locator('[data-reader-close]').click();
  await expect(page.locator(reader)).not.toBeVisible();
  await expect(page.locator('[data-fragment="medit"]')).toBeFocused();
});

test('capture the actual sheet, discovered paper, and reading layer', async ({
  page,
  isMobile,
}, testInfo) => {
  await page.goto('/zh/');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('[data-lanting]')).toHaveAttribute('data-ready', 'true');
  await page
    .locator('[data-manuscript-image]')
    .evaluate(async (el: HTMLImageElement) => el.decode());
  const prefix = `artifacts/manuscript-discovery/${testInfo.project.name}`;
  await page.screenshot({ path: `${prefix}-sheet.png` });
  if (testInfo.project.name === 'desktop') {
    const image = (await page.locator('[data-manuscript-image]').boundingBox())!;
    const scale = image.width / sourceSize.width;
    for (const {
      name,
      region: [x, y, width, height],
    } of [
      { name: 'restored-kuaiji', region: [1699, 64, 84, 290] },
      { name: 'original-universe', region: [1205, 0, 86, 411] },
    ]) {
      await page.screenshot({
        path: `${prefix}-${name}.png`,
        clip: {
          x: image.x + x! * scale,
          y: image.y + y! * scale,
          width: width! * scale,
          height: height! * scale,
        },
      });
    }
  }
  const source = page.locator('[data-fragment="casmd"]');
  await source.scrollIntoViewIfNeeded();
  if (isMobile) await source.focus();
  else await source.hover();
  await expect(source.locator('.fragment-ink')).toHaveCSS('opacity', '1');
  await page.screenshot({ path: `${prefix}-discovered.png` });
  await source.click();
  await expect(page.locator('[data-reader-title]')).toHaveText('CasMD');
  await expect
    .poll(() =>
      page
        .locator(reader)
        .evaluate((el) => el.getAnimations().filter((a) => a.playState === 'running').length),
    )
    .toBe(0);
  await page.screenshot({ path: `${prefix}-reading.png` });
  await page.locator('[data-reader-close]').click();
  await expect(page.locator(reader)).not.toBeVisible();
  await page.locator('[data-fragment="index"]').click();
  await expect(page.locator('[data-reader-title]')).toHaveText('目次');
  await expect
    .poll(() =>
      page
        .locator(reader)
        .evaluate((el) => el.getAnimations().filter((a) => a.playState === 'running').length),
    )
    .toBe(0);
  await page.screenshot({ path: `${prefix}-index.png` });
});
