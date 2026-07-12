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
  await expect(page.locator('.hero-name')).toBeVisible();
  await expect(page.locator('.hero-name')).toContainText('ZIBIN');
  await expect(page.locator('.hero-name')).toContainText('ZHAO');

  await page.getByRole('button', { name: 'Switch language / 切换语言' }).click();

  await expect(page.locator('html')).toHaveAttribute('lang', 'zh');
  await expect(page.locator('html')).toHaveAttribute('data-lang', 'zh');
  await expect(page.locator('.collab .t-zh')).toHaveText('开放合作');
  await expect(page.locator('.collab .t-zh')).toBeVisible();
});

test('keeps keyboard navigation, CV download, and Prompts behavior usable', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await expect(page.locator('.skip-link')).toBeVisible();
  const download = page.locator('a.download[href="/cv.pdf"]');
  await expect(download).toBeVisible();
  await expect(download).toHaveAttribute('download', '');

  await page.goto('/prompts/');
  await expect(page).toHaveURL(/\/prompts\/$/);
  await expect(page.locator('.prompt-hero > h1')).toHaveCount(1);
  await expect(page.locator('.stage')).toHaveCount(8);
  await expect(page.locator('.stage h2')).toHaveCount(8);
  const copy = page.getByRole('button', { name: 'Copy prompt to clipboard' }).first();
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
  await expect(page.locator('.site-stamp .t-en')).toBeVisible();
  await expect(page.locator('.site-stamp .t-zh')).toBeHidden();
  await expect(page.locator('a.talk[href^="mailto:"]')).toBeVisible();
  await expect(page.locator('.footer-socials a')).toHaveCount(3);
  for (const social of await page.locator('.footer-socials a').all()) await expect(social).toBeVisible();
  await expect(page.locator('.footer-routes a')).toHaveCount(6);
  for (const route of await page.locator('.footer-routes a').all()) await expect(route).toBeVisible();
  await expect(page.locator('a.draw-control[href="/prompts/"]')).toBeVisible();
  const download = page.locator('a.download[href="/cv.pdf"]');
  await expect(download).toBeVisible();
  await expect(download).toHaveAttribute('download', '');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => document.documentElement.clientWidth),
  );

  await context.close();
});

test('applies exact normal-mode button and draw interactions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');

  const talk = page.locator('.talk');
  const talkActive = await activeState(page, talk);
  expect(talkActive).toMatchObject({ angle: 0, shadow: 'none', tx: 4, ty: 4 });
  expect(await motionState(page.locator('.talk-angle'))).toMatchObject({ angle: -2, tx: 0, ty: 0 });

  const draw = page.locator('.draw-control');
  await draw.hover();
  await page.waitForTimeout(200);
  expect(await motionState(draw)).toMatchObject({ angle: 12, tx: 0, ty: 0 });
});

test('keeps button and draw resting geometry invariant under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  const talk = page.locator('.talk');
  const talkResting = await motionState(talk);
  expect(talkResting).toMatchObject({ angle: 0, tx: 0, ty: 0 });
  expect(await activeState(page, talk)).toEqual(talkResting);
  expect(await motionState(page.locator('.talk-angle'))).toMatchObject({ angle: -2, tx: 0, ty: 0 });

  const draw = page.locator('.draw-control');
  const drawResting = await motionState(draw);
  expect(drawResting).toMatchObject({ angle: -12, tx: 0, ty: 0 });
  await draw.hover();
  expect(await motionState(draw)).toEqual(drawResting);
});
