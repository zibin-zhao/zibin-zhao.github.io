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
