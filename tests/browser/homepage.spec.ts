import { expect, test } from '@playwright/test';

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
