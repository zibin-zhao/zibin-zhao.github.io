import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { pastDesigns, pastPath, replayPath } from '../../src/data/past-designs';

const evidence = 'artifacts/past-designs-2026-09-09/deduplicated';
const finalEditions = [
  '03-watercolor',
  '09-paths',
  '10-night',
  '12-dark',
  '13-gallery',
  '15-archive',
  '17-journey',
  '18-grail',
];

test('footer keeps all editions quiet and loads no archived site before selection', async ({
  page,
}, info) => {
  const archiveRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/past-designs/')) archiveRequests.push(request.url());
  });
  await page.goto('/zh/');
  const navigation = page.getByRole('navigation', { name: '过往网站设计' });
  await expect(navigation).not.toBeInViewport();
  await expect(navigation.getByRole('link')).toHaveCount(finalEditions.length);
  expect(
    await navigation.getByRole('link').evaluateAll((links) =>
      links.map((link) => ({
        text: link.textContent?.trim(),
        href: link.getAttribute('href'),
      })),
    ),
  ).toEqual(
    finalEditions.map((id, index) => ({ text: String(index + 1), href: pastPath(id, 'zh') })),
  );
  expect(archiveRequests).toEqual([]);
  await navigation.scrollIntoViewIfNeeded();
  await expect(navigation).toBeInViewport();
  await page.screenshot({ path: `${evidence}/${info.project.name}-footer.png` });
  await navigation.getByRole('link', { name: /^8 ·/ }).click();
  await expect(page).toHaveURL(/\/zh\/past\/18-grail\/$/);
  await expect(page.locator('h1')).toHaveText('Grail');
  await expect(page.locator('iframe')).toHaveAttribute('src', replayPath(pastDesigns[7]!, 'zh'));
});

for (const entry of pastDesigns) {
  test(`${entry.id}: restored design loads its own assets and reading content`, async ({
    page,
    baseURL,
  }, info) => {
    const errors: string[] = [];
    const failedAssets: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('response', (response) => {
      if (response.url().startsWith(baseURL!) && response.status() >= 400)
        failedAssets.push(`${response.status()} ${response.url()}`);
    });
    await page.goto(pastPath(entry.id, 'zh'));
    await expect(page.locator('h1')).toHaveText(entry.title.zh);
    const frame = await page.locator('[data-design-frame]').contentFrame();
    await expect(frame.locator('body')).toBeVisible();
    await frame.locator('body').evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        [...document.images]
          .filter((image) => image.loading !== 'lazy')
          .map((image) => image.decode().catch(() => undefined)),
      );
    });
    await expect(frame.locator('h1').first()).not.toBeEmpty();
    expect(
      await frame
        .locator('body')
        .evaluate(
          () =>
            [...document.images].filter(
              (image) =>
                image.getBoundingClientRect().top < innerHeight &&
                image.getBoundingClientRect().bottom > 0 &&
                !image.complete,
            ).length,
        ),
    ).toBe(0);
    await expect(frame.locator('[data-archive-return]')).toBeHidden();
    expect(errors).toEqual([]);
    expect(failedAssets).toEqual([]);
    await page.screenshot({
      path: `${evidence}/${info.project.name}-${entry.id}.png`,
      animations: 'disabled',
    });
    if (entry.id === '10-night') {
      // This archived page reinitializes 250ms after its initial ResizeObserver callback.
      // Let that original startup settle before exercising chapter navigation.
      await page.waitForTimeout(350);
      await frame.getByRole('button', { name: '第2章 · 研究', exact: true }).click();
      await expect(frame.locator('#act-research-title')).toBeVisible();
      await expect(frame.locator('[data-frame="1"]')).toHaveCSS('opacity', '1');
      await page.screenshot({
        path: `${evidence}/${info.project.name}-${entry.id}-reading.png`,
        animations: 'disabled',
      });
    }
    await expect(
      page.getByRole('navigation', { name: '切换历史版本' }).locator('[aria-current="page"]'),
    ).toHaveText(String(entry.number));
  });
}

test('wrapper navigation, language context, and 320px layout remain usable', async ({ page }) => {
  await page.goto('/zh/past/18-grail/');
  const navigation = page.getByRole('navigation', { name: '切换历史版本' });
  await navigation.getByRole('link', { name: '下一个版本', exact: true }).click();
  await expect(page).toHaveURL(/\/zh\/past\/03-watercolor\/$/);
  await navigation.getByRole('link', { name: '上一个版本', exact: true }).click();
  await expect(page).toHaveURL(/\/zh\/past\/18-grail\/$/);
  await page.setViewportSize({ width: 320, height: 720 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(navigation.locator('[aria-current="page"]')).toBeInViewport();
  await expect(page.getByRole('link', { name: '回到字里行间' })).toBeInViewport();
  const result = await new AxeBuilder({ page })
    .exclude('iframe')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(result.violations).toEqual([]);
  await page.getByRole('link', { name: '回到字里行间' }).click();
  await expect(page).toHaveURL(/\/zh\/$/);
  await expect(page.locator('[data-lanting]')).toBeVisible();
});

test('standalone replay and internal reading routes retain their version', async ({ page }) => {
  await page.goto('/zh/past/18-grail/');
  await page.getByRole('link', { name: '展开旧站' }).click();
  await expect(page).toHaveURL(/\/past-designs\/18-grail\/zh\/index.html$/);
  await expect(page.locator('[data-archive-return]')).toBeVisible();
  await page.locator('.mobile-menu summary').click();
  await page.locator('.mobile-menu nav').getByRole('link', { name: '项目', exact: true }).click();
  await expect(page).toHaveURL(/\/past-designs\/18-grail\/zh\/projects\/index.html$/);
  await expect(page.locator('.project-card')).toHaveCount(6);
  await page.locator('[data-archive-return]').click();
  await expect(page).toHaveURL(/\/zh\/past\/18-grail\/$/);
});

test('archive navigation and old reading survive without JavaScript', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
  const page = await context.newPage();
  await page.goto('/past/01-poster/');
  await expect(page).toHaveURL(/\/past\/03-watercolor\/$/);
  await expect(page.locator('iframe')).toBeVisible();
  await page
    .getByRole('navigation', { name: 'Choose a past design' })
    .getByRole('link', { name: '8 · Grail', exact: true })
    .click();
  await expect(page.locator('h1')).toHaveText('Grail');
  await expect(page.frameLocator('iframe').locator('h1')).not.toBeEmpty();
  await page.getByRole('link', { name: 'Open full page' }).click();
  await expect(page.locator('[data-archive-return]')).toBeVisible();
  await context.close();
});
