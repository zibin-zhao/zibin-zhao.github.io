import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { pages, pathFor } from '../../src/lib/i18n';
import { promptPack } from '../../src/data/prompts';

for (const lang of ['en', 'zh'] as const) {
  for (const name of pages) {
    test(`${lang} ${name}: readable route, metadata, links, and accessibility`, async ({
      page,
      request,
    }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      const route = pathFor(name, lang);
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator('html')).toHaveAttribute('lang', lang === 'en' ? 'en' : 'zh-CN');
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        `https://zibinzhao.com${route}`,
      );
      await expect(page.locator('.language-link')).toHaveAttribute(
        'href',
        pathFor(name, lang === 'en' ? 'zh' : 'en'),
      );
      expect(await page.locator('meta[name="description"]').getAttribute('content')).toBeTruthy();
      await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(3);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(
        await page
          .locator('main a')
          .evaluateAll((links) => links.every((link) => Boolean(link.getAttribute('href')))),
      ).toBe(true);
      const localLinks = await page
        .locator('a[href^="/"]')
        .evaluateAll((links) => [
          ...new Set(links.map((link) => link.getAttribute('href')!.split('#')[0]).filter(Boolean)),
        ]);
      for (const link of localLinks) expect((await request.get(link)).status(), link).toBe(200);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(
        results.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.map((n) => n.target),
        })),
      ).toEqual([]);
      expect(errors).toEqual([]);
      if (name === 'about') {
        const education = page.getByRole('complementary');
        for (const school of lang === 'en'
          ? ['The Hong Kong University of Science and Technology', 'University of Melbourne']
          : ['香港科技大学', '墨尔本大学']) {
          await expect(education).toContainText(school);
        }
      }
    });
  }
}

test('language survives a full navigation journey', async ({ page }) => {
  await page.goto('/research/');
  await page.locator('.language-link').click();
  await expect(page).toHaveURL(/\/zh\/research\/$/);
  await page.locator('.mobile-menu summary').click();
  await page.locator('.mobile-menu nav').getByRole('link', { name: '项目', exact: true }).click();
  await expect(page).toHaveURL(/\/zh\/projects\/$/);
  await page.locator('.language-link').click();
  await expect(page).toHaveURL(/\/projects\/$/);
});

test('native navigation and prompt disclosure work without JavaScript', async ({
  browser,
  isMobile,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: isMobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:43217/zh/');
  await expect(page.locator('h1')).toContainText('Zibin');
  await page.locator('.mobile-menu summary').click();
  await page.locator('.mobile-menu nav').getByRole('link', { name: '研究', exact: true }).click();
  await expect(page).toHaveURL(/\/zh\/research\/$/);
  await page.goto('http://127.0.0.1:43217/zh/prompts/');
  await page.locator('#step-8 summary').click();
  await expect(page.locator('#step-8 .prompt-text')).toBeVisible();
  await expect(page.locator('[data-copy-target]:visible')).toHaveCount(0);
  await context.close();
});

test('keyboard navigation has a skip link and recoverable collection index', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  await page.locator('.mobile-menu summary').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.mobile-menu')).toHaveAttribute('open', '');
  await page.keyboard.press('Escape');
  await expect(page.locator('.mobile-menu')).not.toHaveAttribute('open', '');
  await expect(page.locator('.mobile-menu summary')).toBeFocused();
});

test('project filters expose matching work and announce the result', async ({ page }) => {
  await page.goto('/projects/');
  await page.getByRole('button', { name: 'Everyday tools', exact: true }).click();
  await expect(page.locator('.project-card:visible')).toHaveCount(2);
  await expect(page.locator('#medit')).toBeVisible();
  await expect(page.locator('#yaos')).toBeVisible();
  await expect(page.locator('#filter-status')).toHaveText('Showing 2 projects');
  await page.getByRole('button', { name: 'Research', exact: true }).click();
  await expect(page.locator('.project-card:visible')).toHaveCount(3);
  await page.getByRole('button', { name: 'All work', exact: true }).click();
  await expect(page.locator('.project-card:visible')).toHaveCount(6);
});

test('prompt and email copy exact source text using the browser clipboard', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/prompts/');
  await page.locator('[data-copy-target="prompt-0-0"]').click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    promptPack.stages[0].blocks[0].text,
  );
  await expect(page.locator('#step-1 [role="status"]').first()).toHaveText('Prompt copied.');
  await page.goto('/contact/');
  await page.getByRole('button', { name: 'Copy email address' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    'zibin.zhao@connect.ust.hk',
  );
});

test('clipboard rejection selects text and explains manual recovery', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('Permission denied')) },
    });
  });
  await page.goto('/zh/prompts/');
  await page.locator('[data-copy-target="prompt-0-0"]').click();
  await expect(page.locator('#step-1 [role="status"]').first()).toContainText('手动复制');
  expect(await page.evaluate(() => window.getSelection()?.toString())).toBe(
    promptPack.stages[0].blocks[0].text,
  );
  await page.goto('/zh/contact/');
  await page.getByRole('button', { name: '复制邮箱' }).click();
  await expect(page.getByRole('status')).toContainText('手动复制');
});

test('prompt links open the correct step and downloads contain every prompt', async ({
  page,
  request,
}) => {
  await page.goto('/prompts/#step-8');
  await expect(page.locator('#step-8')).toHaveAttribute('open', '');
  await page.locator('.prompt-toc a[href="#step-5"]').click();
  await expect(page.locator('#step-5')).toHaveAttribute('open', '');
  const response = await request.get('/prompt-pack.txt');
  expect(response.status()).toBe(200);
  const text = await response.text();
  for (const stage of promptPack.stages)
    for (const block of stage.blocks) expect(text).toContain(block.text);
});

test('all pages reflow at 320 px with 200 percent text', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  for (const name of pages) {
    await page.goto(pathFor(name, 'zh'));
    await page.addStyleTag({ content: 'html { font-size: 200%; }' });
    const overflow = await page.evaluate(() => ({
      actual: document.documentElement.scrollWidth,
      expected: innerWidth,
    }));
    expect(overflow.actual, name).toBeLessThanOrEqual(overflow.expected);
    await page.locator('.site-footer').scrollIntoViewIfNeeded();
    await expect(page.getByRole('contentinfo').getByRole('navigation')).toBeInViewport();
  }
});

test('native reading survives landscape resize and reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#research');
  await expect(page.locator('#research-title')).toBeInViewport();
  await page.setViewportSize({ width: 844, height: 390 });
  await page.locator('.site-footer').scrollIntoViewIfNeeded();
  await expect(page.getByRole('contentinfo').getByRole('navigation')).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('404 and public demo entry points provide recovery and allow zoom', async ({
  page,
  request,
}) => {
  const response = await page.goto('/this-page-does-not-exist/');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This path ends here.');
  await page.getByRole('link', { name: 'Back to home' }).click();
  await expect(page).toHaveURL(/43217\/$/);
  await expect(page.locator('a[href*="/night/"]')).toHaveCount(0);
  for (const removedRoute of ['/night/', '/zh/night/']) {
    expect((await request.get(removedRoute)).status()).toBe(404);
  }
  const sitemap = await (await request.get('/sitemap-0.xml')).text();
  expect(sitemap).not.toContain('/night/');
  expect(sitemap.match(/<loc>/g)).toHaveLength(14);
  for (const route of ['/medit/', '/singularity/']) {
    const html = await (await request.get(route)).text();
    expect(html).not.toMatch(/maximum-scale|user-scalable=no/);
  }
});
