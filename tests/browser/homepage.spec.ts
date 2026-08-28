import { expect, test, type Page } from '@playwright/test';

const frame = (page: Page, index: number) => page.locator(`.deck-frame[data-frame="${index}"]`);
// 航海日志: 当前章回刻度上的数字
const cur = (page: Page) => page.locator('.deck-tick.is-here .tick-num');

test('renders the night deck; the homepage is honestly monolingual', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Zibin Zhao/);
  await expect(frame(page, 0)).toBeVisible();
  // 门厅即画: 无交互元素, 亦不署名
  await expect(page.locator('#deck-canvas')).toBeVisible();
  await expect(frame(page, 0).locator('a, button')).toHaveCount(0);
  await expect(frame(page, 0).locator('.hall-sign')).toHaveCount(0);

  // 首页锁定中文单语: 文档语言即中文, 失效的语言开关已撤下
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh');
  await expect(page.locator('html')).toHaveAttribute('data-lang', 'zh');
  await expect(page.locator('.langtoggle')).toBeHidden();

  // 双语开关在档案子页照常工作
  await page.goto('/about/');
  const toggle = page.getByRole('button', { name: 'Switch language / 切换语言' });
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh');
  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('wheel advances exactly one act per gesture', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(4000);

  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(2600);
  await expect(cur(page)).toHaveText('02');

  await page.mouse.wheel(0, 4000);
  await page.waitForTimeout(2600);
  await expect(cur(page)).toHaveText('03');

  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(2600);
  await expect(cur(page)).toHaveText('04');

  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(2600);
  await expect(cur(page)).toHaveText('03');
});

test('the research frame lists the three authored papers', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    document.querySelectorAll('.deck-frame').forEach((el) => {
      el.classList.toggle('is-active', el.getAttribute('data-frame') === '1');
    });
  });

  const rows = page.locator('[data-frame="1"] .pub-row');
  await expect(rows).toHaveCount(3);
  const titles = await rows.locator('.pub-title').allTextContents();
  expect(titles[0]).toMatch(/DNA-guided CRISPR–Cas12a effectors/);
  expect(titles[1]).toMatch(/Structure-enhanced deep learning/);
  expect(titles[2]).toMatch(/Transforming ECG diagnosis/);
  for (const row of await rows.all()) {
    await expect(row).toHaveAttribute('target', '_blank');
    await expect(row).toHaveAttribute('href', /^(https:\/\/doi\.org|https:\/\/github\.com|https:\/\/arxiv\.org)/);
  }
  await expect(page.locator('[data-frame="1"] .act-more')).toHaveAttribute('href', '/research/');
});

test('the made-things frame lists the canonical research tools', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    document.querySelectorAll('.deck-frame').forEach((el) => {
      el.classList.toggle('is-active', el.getAttribute('data-frame') === '2');
    });
  });

  const cards = page.locator('[data-frame="2"] .make-card');
  await expect(cards).toHaveCount(6);
  expect(await cards.evaluateAll((cards) => cards.map((card) => card.getAttribute('data-project')))).toEqual([
    'CasMD',
    'TEMPO',
    'DL-SELEX',
    'Cembra_AI',
    'DL-SELEX-web-explain',
    'ECG_analysing_app',
  ]);
  for (const card of await cards.all()) {
    await expect(card).toHaveAttribute('href', /^https:\/\//);
    await expect(card.locator('.make-name')).toBeVisible();
  }
  await expect(page.locator('[data-frame="2"] .act-more')).toHaveAttribute('href', '/projects/');
});

test('the after-hours frame carries the four night motifs', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    document.querySelectorAll('.deck-frame').forEach((el) => {
      el.classList.toggle('is-active', el.getAttribute('data-frame') === '3');
    });
  });

  const cards = page.locator('[data-frame="3"] .vibe-card');
  await expect(cards).toHaveCount(4);
  expect(await cards.evaluateAll((cards) => cards.map((card) => card.getAttribute('data-vibe-art-card')))).toEqual([
    'singularity',
    'medit',
    'yaos',
    'zen',
  ]);
  await expect(cards.locator('.vibe-name')).toHaveText(['Singularity', 'Medit', 'Yaos', 'Zen']);
  await expect(frame(page, 3).locator('.vibe-soon')).toBeVisible();
  const zen = cards.nth(3);
  await expect(zen.locator('.c-go, a')).toHaveCount(0);
});

test('the coda frame exposes mail, socials, and archive destinations', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    document.querySelectorAll('.deck-frame').forEach((el) => {
      el.classList.toggle('is-active', el.getAttribute('data-frame') === '4');
    });
  });

  const coda = frame(page, 4);
  await expect(coda.locator('.deck-mail')).toHaveAttribute('href', /^mailto:zibin\.zhao@connect\.ust\.hk$/);
  await expect(coda.locator('.deck-socials a')).toHaveCount(5);
  await expect(coda.locator('.deck-links a[href="/contact/"]')).toBeVisible();
  await expect(coda.locator('.deck-links a[href="/night/"]')).toBeVisible();
});

test('the chapter log is clickable and the shore lamp remembers its keeper', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(3200);

  // 刻度直达: 一击到联络
  await page.locator('.deck-tick[data-tick="4"]').click();
  await page.waitForTimeout(2200);
  await expect(cur(page)).toHaveText('05');
  await expect(frame(page, 4)).toBeVisible();
  await expect(frame(page, 0)).toBeHidden();

  // 留灯: 点亮并存档, 回访仍在
  const lamp = page.locator('#deck-lamp');
  await expect(lamp).toBeVisible();
  await lamp.click();
  await expect(lamp).toHaveClass(/is-lit/);
  await expect(lamp).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#deck-lamp-note')).toBeVisible();
  await page.reload();
  await page.waitForTimeout(1600);
  // 重载后停在门厅: 灯的点亮状态已在, 跳回联络章再看注释
  await expect(page.locator('#deck-lamp')).toHaveClass(/is-lit/);
  await page.locator('.deck-tick[data-tick="4"]').click();
  await page.waitForTimeout(2200);
  await expect(page.locator('#deck-lamp-note')).toBeVisible();
});

test('the gate frame is wordless and the night voyage stays reachable', async ({ page }) => {
  await page.goto('/');
  await expect(frame(page, 0).locator('a, button')).toHaveCount(0);
  await expect(page.locator('.deck-progress')).toBeVisible();
  // 完整夜航由末帧与页脚承担
  await page.goto('/night/', { waitUntil: 'networkidle' });
  await expect(page).toHaveURL(/\/night\/$/);
  await page.goto('/');
  await expect(page.locator('.footer-routes a[href="/night/"]')).toHaveCount(1);
});

test('keeps keyboard navigation, CV destination, and Prompts behavior usable', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await expect(page.locator('.footer-routes a[href="/cv/"]')).toHaveCount(1);

  await page.goto('/prompts/');
  await expect(page).toHaveURL(/\/prompts\/$/);
  await expect(page.locator('main h1')).toHaveCount(1);
  await expect(page.locator('.stage')).toHaveCount(8);
  const copy = page.locator('.copy').first();
  await copy.click();
  await expect(copy).toHaveClass(/copied/);
});

test('keeps required shell anchors usable without JavaScript at 390px', async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto('/');

  await expect(page.locator('.site-stamp .stamp-compact')).toBeVisible();
  // 夜航主页无页脚坞与联系钮: 去向由 deck-noscript 承担
  await expect(page.locator('.stitch-footer')).toBeHidden();
  await expect(page.locator('.footer-routes a')).toHaveCount(7);
  // 画笔圆钮住在页脚坞里, 随坞一并退场
  await expect(page.locator('a.draw-control[href="/prompts/"]')).toBeAttached();
  await expect(page.locator('.deck-noscript')).toBeVisible();
  await expect(page.locator('.deck-noscript a[href="/research/"]')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

  await page.locator('.deck-noscript a[href="/projects/"]').click();
  await expect(page).toHaveURL(/\/projects\/$/);
  const researchCards = page.locator('[data-research-project]');
  await expect(researchCards).toHaveCount(6);

  await context.close();
});

test('mobile night deck carries its own navigation, footer hidden', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });

  // 主页无页脚坞: 帧甲自带导航
  await expect(page.locator('.stitch-footer')).toBeHidden();
  await expect(page.locator('.deck-progress')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('night type stays readable at every authored width', async ({ page }) => {
  for (const viewport of [{ width: 768, height: 1024 }, { width: 390, height: 844 }, { width: 320, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.goto('/', { waitUntil: 'networkidle' });

    for (const selector of ['.pub-title', '.make-desc', '.act-title']) {
      const sizes = await page.locator(selector).evaluateAll((elements) =>
        elements.map((element) => Number.parseFloat(getComputedStyle(element).fontSize)),
      );
      expect(sizes.length, selector + ' rendered at ' + viewport.width + 'px').toBeGreaterThan(0);
      expect(Math.min(...sizes), selector + ' at ' + viewport.width + 'px').toBeGreaterThanOrEqual(12);
    }

    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
  }
});

test('homepage reflows at a 200%-scale 320px CSS viewport', async ({ browser }) => {
  const context = await browser.newContext({
    deviceScaleFactor: 2,
    viewport: { width: 320, height: 844 },
  });
  const page = await context.newPage();
  await page.goto('/', { waitUntil: 'networkidle' });
  expect(await page.evaluate(() => window.innerWidth)).toBe(320);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await context.close();
});
