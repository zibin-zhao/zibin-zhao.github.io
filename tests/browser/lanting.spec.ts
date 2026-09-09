import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { projects } from '../../src/data/projects';
import { fragments } from '../../src/data/lanting';

const reader = '[data-paper-reader]';
for (const lang of ['en', 'zh'] as const) {
  test(`${lang}: every hidden insertion opens its real content and restores focus`, async ({
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
    .locator('.column-ink image')
    .first()
    .evaluate(async (el) => {
      const image = new Image();
      image.src = el.getAttribute('href')!;
      await image.decode();
    });
  const prefix = `artifacts/lanting-2026-09-09/${testInfo.project.name}`;
  await page.screenshot({ path: `${prefix}-sheet.png` });
  const source = page.locator('[data-fragment="casmd"]');
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
