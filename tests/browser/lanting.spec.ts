import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { projects } from '../../src/data/projects';
import { fragments, inkSource, sourcePixels, sourceSize } from '../../src/data/lanting';

const reader = '[data-paper-reader]';
for (const lang of ['en', 'zh'] as const) {
  test(`${lang}: every original-text entry opens its content and restores focus and scroll`, async ({
    page,
  }) => {
    // Eleven complete journeys include WebKit's scroll and tap settling time.
    test.setTimeout(60000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(lang === 'en' ? '/' : '/zh/');
    await expect(page.locator('[data-lanting]')).toHaveAttribute('data-ready', 'true');
    await expect(page.locator('[data-fragment]')).toHaveCount(11);
    await expect(page.locator('[data-reader-select] option')).toHaveCount(13);
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
    await expect(page.locator('[data-found-count]')).toHaveText('11 / 11');
  });
}

test('discovery starts hidden, proximity and focus expose the cut edge, reveal toggles all', async ({
  page,
  isMobile,
}) => {
  await page.goto('/');
  const fragment = page.locator('[data-fragment="casmd"]');
  await fragment.scrollIntoViewIfNeeded();
  await expect(fragment.locator('.fragment-caption')).toHaveCSS('opacity', '0');
  await expect(fragment.locator('.fragment-edge')).toHaveCSS('opacity', '0');
  if (!isMobile) {
    const box = (await fragment.boundingBox())!;
    await page.mouse.move(box.x - 18, box.y + box.height / 2);
    await expect(fragment).toHaveClass(/is-near/);
    await expect(fragment.locator('.fragment-edge')).toHaveCSS('opacity', '1');
    await page.mouse.move(2, 2);
  }
  await fragment.focus();
  await expect(fragment.locator('.fragment-edge')).toHaveCSS('opacity', '1');
  await page.locator('[data-reveal]').click();
  await expect(page.locator('[data-lanting]')).toHaveAttribute('data-revealed', 'true');
  for (const item of await page.locator('.fragment-caption').all())
    await expect(item).toHaveCSS('opacity', '1');
  await page.locator('[data-reveal]').click();
  await expect(page.locator('[data-reveal]')).toHaveAttribute('aria-pressed', 'false');
});

test('the complete original is rendered once, with transparent entries at its original positions', async ({
  page,
}) => {
  await page.goto('/zh/');
  const manuscript = page.locator('[data-manuscript]');
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
  // A second ink layer or a text-shaped hole would reintroduce replacement/duplication.
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
    await expect(target.locator('.fragment-edge path')).toHaveCSS('fill', 'none');
  }
  await page.locator('[data-reveal]').click();
  await expect(source).toHaveCSS('transform', 'none');
  await expect(manuscript.locator('image, .ink-text, clipPath, mask')).toHaveCount(0);
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
    await page.locator('[data-reader-select]').selectOption(String(index));
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
  await expect(page.locator('[data-fragment]')).toHaveCount(11);
  await expect(page.locator('[data-index-entry]')).toHaveCount(13);
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
  await expect(page.locator(reader)).not.toBeVisible();
  await page.locator('[data-fragment="medit"]').click();
  await expect(page.locator('[data-reader-title]')).toHaveText('Medit');
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
  const prefix = `artifacts/lanting-fidelity-2026-09-10/${testInfo.project.name}`;
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
  await expect(source.locator('.fragment-edge')).toHaveCSS('opacity', '1');
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
  await page.locator('[data-reveal]').click();
  await expect(page.locator('[data-lanting]')).toHaveAttribute('data-revealed', 'true');
  await page.screenshot({ path: `${prefix}-revealed.png`, fullPage: true });
});
