import { expect, test } from '@playwright/test';

test('exposes the active language and persisted target across navigation', async ({ page }) => {
  await page.goto('/');

  let toggle = page.getByRole('button', { name: 'Switch language / 切换语言' });
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(toggle).toHaveAttribute('aria-label', /English active; switch to 中文/);
  await expect(toggle.locator('.target:visible')).toHaveText('中');

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(toggle).toHaveAttribute('aria-label', /中文已启用；切换到 English/);
  await expect(toggle.locator('.target:visible')).toHaveText('EN');

  await page.goto('/about/');
  toggle = page.getByRole('button', { name: 'Switch language / 切换语言' });
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(toggle).toHaveAttribute('aria-label', /中文已启用；切换到 English/);

  await toggle.click();
  await page.goto('/research/');
  toggle = page.getByRole('button', { name: 'Switch language / 切换语言' });
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(toggle).toHaveAttribute('aria-label', /English active; switch to 中文/);
});

test('keeps the language hit target accessible without colliding at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const toggleBox = await page.getByRole('button', { name: 'Switch language / 切换语言' }).boundingBox();
  const talkBox = await page.locator('.talk').boundingBox();
  if (!toggleBox || !talkBox) throw new Error('Header controls did not render');

  expect(toggleBox.width).toBeGreaterThanOrEqual(40);
  expect(toggleBox.height).toBeGreaterThanOrEqual(40);
  expect(toggleBox.x + toggleBox.width).toBeLessThanOrEqual(talkBox.x);
  expect(talkBox.x + talkBox.width).toBeLessThanOrEqual(390);
});

test('sticker constellation keeps useful alternatives and switches every physical caption', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });

  const constellation = page.locator('[data-sticker-constellation]');
  await expect(constellation).toHaveAttribute('aria-label', /Personal interests and creative practices/);
  await expect(constellation.locator('figure')).toHaveCount(7);
  await expect(constellation.locator('img')).toHaveCount(7);
  await expect(page.getByRole('heading', { name: /Beyond the lab/i })).toHaveCount(0);

  const alternatives = await constellation.locator('img').evaluateAll((images) =>
    images.map((image) => image.getAttribute('alt') ?? ''),
  );
  expect(new Set(alternatives).size).toBe(7);
  for (const alternative of alternatives) expect(alternative.length).toBeGreaterThan(12);

  const english = constellation.locator('figcaption .t-en');
  const chinese = constellation.locator('figcaption .t-zh');
  await expect(english).toHaveCount(7);
  await expect(chinese).toHaveCount(7);
  for (const caption of await english.all()) await expect(caption).toBeVisible();
  for (const caption of await chinese.all()) await expect(caption).toBeHidden();

  await page.getByRole('button', { name: 'Switch language / 切换语言' }).click();
  for (const caption of await english.all()) await expect(caption).toBeHidden();
  for (const caption of await chinese.all()) await expect(caption).toBeVisible();
  await expect(constellation.getByText('深夜编程')).toBeVisible();
});
