import { expect, test, type Page } from '@playwright/test';

const routes = [
  { path: '/about/', active: 'about', count: 4, selector: '[data-focus]' },
  { path: '/research/', active: 'research', count: 9, selector: '[data-publication]' },
  { path: '/projects/', active: 'projects', count: 4, selector: '[data-project]' },
  { path: '/cv/', active: 'cv', count: 5, selector: '[data-cv-entry]' },
  { path: '/contact/', active: 'contact', count: 5, selector: '[data-contact-social]' },
] as const;

const assertNoOverflowOrDockOverlap = async (page: Page) => {
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => document.documentElement.clientWidth),
  );
  const content = await page.locator('.index-sheet-content').boundingBox();
  const fixedControls = await page.locator('.footer-routes').boundingBox();
  if (!content || !fixedControls) throw new Error('Archive content or fixed dock did not render');
  expect(content.y + content.height).toBeLessThan(fixedControls.y - 8);
};

for (const route of routes) {
  test(`${route.path} is a complete bilingual Index Sheet`, async ({ page }) => {
    const runtimeErrors: string[] = [];
    page.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(message.text()); });
    page.on('pageerror', (error) => runtimeErrors.push(error.message));
    await page.setViewportSize({ width: 390, height: 844 });
    const response = await page.goto(route.path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('main h1')).toHaveCount(1);
    const headingLevels = await page.locator('main h1, main h2, main h3, main h4, main h5, main h6').evaluateAll((headings) => (
      headings.map((heading) => Number(heading.tagName.slice(1)))
    ));
    expect(headingLevels[0]).toBe(1);
    for (let index = 1; index < headingLevels.length; index += 1) {
      expect(headingLevels[index]).toBeLessThanOrEqual(headingLevels[index - 1] + 1);
    }
    await expect(page.locator(route.selector)).toHaveCount(route.count);
    await expect(page.locator(`.footer-routes a[href="${route.path}"]`)).toHaveAttribute('aria-current', 'page');

    await page.getByRole('button', { name: 'Switch language / 切换语言' }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh');
    await expect(page.locator('.index-sheet-heading h1 .t-zh')).toBeVisible();
    await assertNoOverflowOrDockOverlap(page);
    expect(runtimeErrors).toEqual([]);
  });
}

test('project, publication, contact and CV actions preserve their semantics', async ({ page }) => {
  await page.goto('/projects/');
  await expect(page.locator('[data-project]')).toHaveCount(4);
  for (const link of await page.locator('a[data-project]').all()) {
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  }

  await page.goto('/research/');
  for (const link of await page.locator('[data-publication] .pub-links a').all()) {
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  }

  await page.goto('/contact/');
  await expect(page.locator('.contact-record a[href="mailto:zibin.zhao@connect.ust.hk"]')).toBeVisible();
  await expect(page.locator('[data-contact-social]')).toHaveCount(5);
  await expect(page.locator('.footer-index a')).toHaveCount(7);
  for (const link of await page.locator('[data-contact-social]').all()) {
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  }

  await page.goto('/cv/');
  const download = page.locator('a[download][href="/cv.pdf"]');
  await expect(download).toBeVisible();
  await expect(download).toHaveAttribute('download', '');
  expect((await page.request.get('/cv.pdf')).status()).toBe(200);
});

test('all archive routes keep ordinary English anchors without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  for (const route of routes) {
    const response = await page.goto(route.path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('button', { name: 'Switch language / 切换语言' })).toBeHidden();
    await expect(page.locator('.index-sheet-heading h1 .t-en')).toBeVisible();
    await expect(page.locator('.footer-routes a')).toHaveCount(6);
    for (const anchor of await page.locator('.footer-routes a').all()) await expect(anchor).toBeVisible();
    await assertNoOverflowOrDockOverlap(page);
  }

  await context.close();
});
