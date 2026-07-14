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

test('keeps one bilingual interest list available without exposing decorative badge copy', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });

  const badgeLayer = page.locator('[data-path-badges]');
  const interestList = page.locator('ul.sr-only[aria-label="Personal interests / 个人兴趣"]');
  await expect(badgeLayer).toHaveAttribute('aria-hidden', 'true');
  await expect(badgeLayer.locator('[data-path-badge]')).toHaveCount(7);
  await expect(badgeLayer.locator('img[alt=""]')).toHaveCount(7);
  await expect(badgeLayer.locator('figcaption, [class*="caption"], [class*="label"]')).toHaveCount(0);
  await expect(interestList).toHaveCount(1);
  expect(await interestList.evaluate((element) => {
    const style = getComputedStyle(element);
    const box = element.getBoundingClientRect();
    return {
      height: box.height,
      overflow: style.overflow,
      position: style.position,
      width: box.width,
    };
  })).toEqual({ height: 1, overflow: 'hidden', position: 'absolute', width: 1 });
  await expect(interestList.locator('li')).toHaveText([
    'DNA and AI / DNA 与 AI',
    'Music / 音乐',
    'Chinese calligraphy / 中国书法',
    'Reading / 阅读',
    'Psychology / 心理学',
    'Meditation and Buddhism / 冥想与佛学',
    'Coding experiments / 编程实验',
  ]);
  await expect(page.getByRole('heading', { name: /Beyond the lab/i })).toHaveCount(0);

  await page.getByRole('button', { name: 'Switch language / 切换语言' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh');
  await expect(interestList).toHaveCount(1);
  await expect(badgeLayer.locator('[data-path-badge]')).toHaveCount(7);
});

test('renders each decorative badge as a paper-tab attachment on its dashed guide', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/', { waitUntil: 'networkidle' });

  const badges = page.locator('[data-path-badges] [data-path-badge]');
  await expect(badges).toHaveCount(7);
  const contracts = await badges.evaluateAll((elements) => elements.map((element) => {
    const badge = element as HTMLElement;
    const box = badge.getBoundingClientRect();
    const guide = badge.dataset.guide;
    const guideX = guide === 'left' ? innerWidth * .15 : innerWidth * .76;
    const style = getComputedStyle(badge);
    const tab = getComputedStyle(badge, '::before');
    return {
      background: tab.backgroundColor,
      content: tab.content,
      guideAttached: box.left <= guideX && box.right >= guideX,
      imageCount: badge.querySelectorAll('img.path-badge-image').length,
      pointerEvents: style.pointerEvents,
      tabHeight: Number.parseFloat(tab.height),
      tabPosition: tab.position,
      tabWidth: Number.parseFloat(tab.width),
      transitionProperty: style.transitionProperty,
    };
  }));

  for (const contract of contracts) {
    expect(contract).toEqual({
      background: 'rgb(255, 250, 224)',
      content: '""',
      guideAttached: true,
      imageCount: 1,
      pointerEvents: 'none',
      tabHeight: 22,
      tabPosition: 'absolute',
      tabWidth: 34,
      transitionProperty: 'opacity, transform',
    });
  }
});

for (const width of [390, 320]) {
  test(`${width}px keeps each narrow badge beside its guide with the painted tab bridging the gap`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/', { waitUntil: 'networkidle' });

    for (const fixture of [
      { center: .06, guide: 'left' },
      { center: .20, guide: 'right' },
    ] as const) {
      await page.evaluate((progress) => {
        const range = document.documentElement.scrollHeight - innerHeight;
        scrollTo({ top: Math.round(range * progress), behavior: 'instant' });
      }, fixture.center);
      const badge = page.locator(`[data-path-badge][data-center="${fixture.center}"]`);
      await expect(badge).toHaveAttribute('data-visible', 'true');

      const geometry = await badge.evaluate((element, expectedGuide) => {
        const badgeElement = element as HTMLElement;
        const badgeBox = badgeElement.getBoundingClientRect();
        const guide = document.querySelector<HTMLElement>(`.guide-${expectedGuide}`);
        if (!guide) throw new Error(`Missing ${expectedGuide} dashed guide`);
        const guideX = expectedGuide === 'left'
          ? guide.offsetLeft
          : guide.offsetLeft + guide.offsetWidth;
        const tab = getComputedStyle(badgeElement, '::before');
        const probe = document.createElement('span');
        Object.assign(probe.style, {
          blockSize: tab.blockSize,
          borderBottom: tab.borderBottom,
          borderLeft: tab.borderLeft,
          borderRight: tab.borderRight,
          borderTop: tab.borderTop,
          bottom: tab.bottom,
          boxSizing: tab.boxSizing,
          display: tab.display,
          inlineSize: tab.inlineSize,
          left: tab.left,
          position: tab.position,
          right: tab.right,
          top: tab.top,
          transform: tab.transform,
          transformOrigin: tab.transformOrigin,
        });
        badgeElement.append(probe);
        const tabBox = probe.getBoundingClientRect();
        probe.remove();

        return {
          badgeBesideGuide: expectedGuide === 'left'
            ? badgeBox.left >= guideX
            : badgeBox.right <= guideX,
          tabIntersectsGuide: tabBox.left <= guideX && tabBox.right >= guideX,
        };
      }, fixture.guide);

      expect(geometry).toEqual({ badgeBesideGuide: true, tabIntersectsGuide: true });
    }
  });
}
