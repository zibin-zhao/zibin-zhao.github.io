import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { pastDesigns, pastPath } from '../../src/data/past-designs';

test('arrival fills the viewport with original writing and keeps its index concealed', async ({
  page,
}) => {
  await page.goto('/zh/');
  const manuscript = page.locator('[data-manuscript-scroll]');
  const box = (await manuscript.boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(box.x).toBe(0);
  expect(box.y).toBe(0);
  expect(box.width).toBeCloseTo(viewport.width, 0);
  expect(box.height).toBeCloseTo(viewport.height, 0);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(viewport.height);
  await expect(page.locator('.site-header, .site-footer, [data-found-count], select')).toHaveCount(
    0,
  );
  await expect(page.getByRole('button')).toHaveCount(1);
  await expect(page.locator('[data-reveal]')).toBeInViewport();
  await expect(page.locator('[data-reveal]')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('[data-reveal]')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(page.locator('[data-reveal]')).toHaveCSS('border-width', '0px');
  await expect(page.locator('[data-reveal] .ink-glyph')).toHaveCount(2);
  await expect(page.locator('[data-past-entry]')).toBeHidden();
  await expect(page.locator('[data-paper-reader]')).toBeHidden();
  await expect(page.locator('[data-fragment="index"]')).toBeInViewport();
  await expect(page.locator('[data-fragment="index"] .fragment-caption')).toHaveCSS('opacity', '0');
});

for (const lang of ['en', 'zh'] as const) {
  test(`${lang}: one highlight control reveals all entries and a direct route to past versions`, async ({
    page,
    request,
    isMobile,
  }, testInfo) => {
    const archiveRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/past-designs/')) archiveRequests.push(request.url());
    });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(lang === 'en' ? '/' : '/zh/');
    const reveal = page.locator('[data-reveal]');
    if (isMobile) await reveal.tap();
    else await reveal.click();
    await expect(reveal).toHaveAttribute('aria-pressed', 'true');
    for (const caption of await page.locator('.fragment-caption').all())
      await expect(caption).toHaveCSS('opacity', '0');
    await expect(page.locator('.fragment-ink:visible')).toHaveCount(12);
    for (const surface of await page.locator('.fragment-surface').all())
      await expect(surface).toHaveCSS('transform', 'none');
    await expect(page.locator('.fragment-edge, .fragment-magnifier')).toHaveCount(0);
    const past = page.locator('[data-past-entry]');
    await expect(past).toBeInViewport();
    await expect(past).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(past).toHaveAttribute('aria-label', lang === 'en' ? 'Past versions' : '往昔');
    await expect(past.locator('.ink-glyph')).toHaveCount(1);
    await expect(page.getByRole('button')).toHaveCount(1);
    const evidence = `artifacts/manuscript-discovery/hover-${testInfo.project.name}-${lang}`;
    await page.screenshot({ path: `${evidence}.png` });
    const index = page.locator('[data-fragment="index"]');
    if (isMobile) await index.tap();
    else {
      await index.hover();
      await expect(index.locator('.fragment-surface')).toHaveCSS(
        'transform',
        'matrix(1.14, 0, 0, 1.14, 0, 0)',
      );
      for (const surface of await page
        .locator('[data-fragment]:not([data-fragment="index"]) .fragment-surface')
        .all())
        await expect(surface).toHaveCSS('transform', 'none');
      await page.screenshot({ path: `${evidence}-highlight-hover.png` });
      await index.locator('.fragment-caption').click();
    }
    await expect(page.locator('[data-reader-entry][data-entry-id="index"]')).toBeVisible();
    await page.locator('[data-reader-close]').click();
    await expect(reveal).toHaveAttribute('aria-pressed', 'true');
    await past.click();
    await expect(page.locator('[data-reader-title]')).toHaveText(
      lang === 'en' ? 'Past versions' : '往昔',
    );
    await expect(page.locator('.past-version-list a')).toHaveCount(pastDesigns.length);
    await expect(page.locator('.reader-navigation')).toBeHidden();
    expect(archiveRequests).toEqual([]);
    for (const entry of pastDesigns) {
      await expect(
        page.locator(`.past-version-list a[href="${pastPath(entry.id, lang)}"]`),
      ).toContainText(entry.title[lang]);
      expect((await request.get(pastPath(entry.id, lang))).status()).toBe(200);
    }
    await page.screenshot({ path: `${evidence}-past.png` });
    const result = await new AxeBuilder({ page })
      .include('[data-paper-reader]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(result.violations).toEqual([]);
    await page.goBack();
    await expect(page.locator('[data-paper-reader]')).toBeHidden();
    await expect(past).toBeFocused();
    await expect(reveal).toHaveAttribute('aria-pressed', 'true');
    await page.goForward();
    await expect(page.locator('[data-reader-title]')).toHaveText(
      lang === 'en' ? 'Past versions' : '往昔',
    );
    await page.locator('.past-version-list a').last().click();
    await expect(page).toHaveURL(new RegExp(pastPath(pastDesigns.at(-1)!.id, lang) + '$'));
    await page.goBack();
    await expect(page.locator('[data-reader-entry][data-entry-id="past"]')).toBeVisible();
    await page.locator('[data-reader-close]').click();
    await expect(past).toBeFocused();
    await reveal.click();
    await expect(reveal).toHaveAttribute('aria-pressed', 'false');
    await expect(past).toBeHidden();
    for (const caption of await page.locator('.fragment-caption').all())
      await expect(caption).toHaveCSS('opacity', '0');
  });
}

test('a shared past-versions view closes to a reachable highlight control at enlarged text', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/#read-past');
  await page.addStyleTag({ content: 'html { font-size: 200%; }' });
  await expect(page.locator('html')).toHaveCSS('font-size', '32px');
  await expect(page.locator('[data-reader-title]')).toHaveText('Past versions');
  expect(
    await page.locator('[data-paper-reader]').evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBe(true);
  const firstVersion = page.locator('.past-version-list a').first();
  const name = (await firstVersion.locator('span').first().boundingBox())!;
  const date = (await firstVersion.locator('time').boundingBox())!;
  expect(date.y).toBeGreaterThanOrEqual(name.y + name.height);
  await page.locator('.past-version-list a').last().scrollIntoViewIfNeeded();
  await expect(page.locator('[data-reader-close]')).toBeInViewport();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-past-entry]')).toBeFocused();
  await expect(page.locator('[data-past-entry]')).toBeInViewport();
  await expect(page.locator('[data-reveal]')).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('[data-reveal]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-past-entry]')).toBeHidden();
});

test('revealed ink stays aligned and individual labels open content in short landscape', async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/zh/');
  await page.locator('[data-reveal]').click();
  for (const fragment of await page.locator('[data-fragment]').all()) {
    const entry = await fragment.getAttribute('data-entry');
    const label = fragment.locator('.fragment-caption');
    await fragment.scrollIntoViewIfNeeded();
    const proportions = await fragment.evaluate((el) => {
      const manuscript = document.querySelector('[data-manuscript-image]')!.getBoundingClientRect();
      const surface = el.querySelector('.fragment-surface')!.getBoundingClientRect();
      return {
        actual: surface.width / manuscript.width,
        expected: Number((el as HTMLElement).style.getPropertyValue('--crop-width')),
      };
    });
    expect(proportions.actual).toBeCloseTo(proportions.expected, 4);
    if (isMobile) await fragment.tap();
    else {
      await fragment.hover();
      await expect(label).toHaveCSS('opacity', '1');
      await label.click();
    }
    await expect(page.locator(`[data-reader-entry="${entry}"]`)).toBeVisible();
    await page.locator('[data-reader-close]').click();
    await expect(page.locator('[data-paper-reader]')).toBeHidden();
  }
  await expect(page.locator('[data-reveal]')).toBeInViewport();
  await expect(page.locator('[data-past-entry]')).toBeInViewport();
});

test('browser Back closes a leaf in place, Forward restores it, and close preserves the prior route', async ({
  page,
}) => {
  await page.goto('/contact/');
  await page.locator('.sheet-close').click();
  const source = page.locator('[data-fragment="casmd"]');
  await source.scrollIntoViewIfNeeded();
  await source.click();
  const scroll = await page.locator('[data-manuscript-scroll]').evaluate((el) => el.scrollLeft);
  await expect(page).toHaveURL(/\/#read-casmd$/);
  await page.goBack();
  await expect(page).toHaveURL(/43229\/$/);
  await expect(page.locator('[data-paper-reader]')).toBeHidden();
  await expect(source).toBeFocused();
  expect(
    await page.locator('[data-manuscript-scroll]').evaluate((el) => el.scrollLeft),
  ).toBeCloseTo(scroll, 0);
  await page.goForward();
  await expect(page.locator('[data-reader-title]')).toHaveText('CasMD');
  await page.locator('[data-reader-index]').click();
  await page.locator('[data-index-entry="4"]').click();
  await expect(page).toHaveURL(/\/#read-tempo$/);
  await page.locator('[data-reader-close]').click();
  await expect(page.locator('[data-paper-reader]')).toBeHidden();
  await expect(source).toBeFocused();
  expect(
    await page.locator('[data-manuscript-scroll]').evaluate((el) => el.scrollLeft),
  ).toBeCloseTo(scroll, 0);
  await page.goBack();
  await expect(page).toHaveURL(/\/contact\/$/);
});

test('a shared reader URL closes locally without navigating away', async ({ page }) => {
  await page.goto('/zh/#read-tempo');
  await expect(page.locator('[data-reader-title]')).toHaveText('TEMPO');
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/zh\/$/);
  await expect(page.locator('[data-paper-reader]')).toBeHidden();
  await expect(page.locator('[data-fragment="tempo"]')).toBeFocused();
  await expect(page.locator('[data-fragment="tempo"]')).toBeInViewport();
});

test('the discovered index has keyboard access, language continuity, and no accessibility violations', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('[data-fragment="index"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-reader-title]')).toHaveText('Contents');
  await expect
    .poll(() =>
      page
        .locator('[data-paper-reader]')
        .evaluate(
          (el) =>
            el.getAnimations().filter((animation) => animation.playState === 'running').length,
        ),
    )
    .toBe(0);
  const result = await new AxeBuilder({ page })
    .include('[data-paper-reader]')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(result.violations).toEqual([]);
  await page.locator('[data-reader-close]').focus();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('.past-design-links a').last()).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-reader-close]')).toBeFocused();
  await page.locator('.language-link').click();
  await expect(page).toHaveURL(/\/zh\/#read-index$/);
  await expect(page.locator('[data-reader-title]')).toHaveText('目次');
});

test('a mouse wheel traverses the original columns without scrolling the page', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'Desktop mouse interaction; touch entry journeys are covered separately.');
  await page.goto('/');
  const scroll = page.locator('[data-manuscript-scroll]');
  const initial = await scroll.evaluate((el) => el.scrollLeft);
  await page.mouse.move(720, 500);
  await page.mouse.wheel(0, 400);
  await expect.poll(() => scroll.evaluate((el) => el.scrollLeft)).toBeLessThan(initial - 300);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test('reading pages use one coherent type stack with readable supporting text', async ({
  page,
}) => {
  for (const route of [
    '/projects/',
    '/zh/research/',
    '/zh/about/',
    '/cv/',
    '/prompts/',
    '/contact/',
  ]) {
    await page.goto(route);
    const result = await page.evaluate(() => {
      const elements = [
        ...document.querySelectorAll<HTMLElement>(
          'main h1, main h2, main h3, main p, main a, main button, main pre',
        ),
      ].filter((el) => el.getClientRects().length && !el.classList.contains('sr-only'));
      return elements.map((el) => {
        const style = getComputedStyle(el);
        return {
          text: el.textContent?.trim().slice(0, 45),
          font: style.fontFamily,
          size: parseFloat(style.fontSize),
        };
      });
    });
    expect(new Set(result.map((el) => el.font)).size, route).toBe(1);
    expect(
      result.filter((el) => el.size < 14),
      route,
    ).toEqual([]);
  }
});
