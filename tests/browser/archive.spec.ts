import { test, expect, type Locator, type Page, type TestInfo } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const fieldSelector = '[data-gallery-scene][data-layout="field"]';
const viewerSelector = '[data-archive-viewer]';

test.beforeEach(async ({ page }) => {
  // The archive remains usable when ambient motion is disabled. A still scene
  // also makes the observed leaf point stable for the real canvas input test.
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

async function activate(control: Locator, isMobile: boolean): Promise<void> {
  if (isMobile) await control.tap();
  else await control.click();
}

async function openHome(page: Page, testInfo: TestInfo, lang = 'en'): Promise<boolean> {
  await page.goto(lang === 'zh' ? '/zh/' : '/');
  const field = page.locator(fieldSelector);
  await expect(field).toHaveAttribute('data-state', /^(ready|fallback)$/, {
    timeout: 20000,
  });
  // An independent context distinguishes genuine lack of WebGL from a broken
  // archive renderer. Software WebGL is supported by the production options.
  const supported = await page.evaluate(() => {
    const context = document.createElement('canvas').getContext('webgl2', {
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
      failIfMajorPerformanceCaveat: false,
    });
    if (!context) return false;
    context.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  });
  if (!supported) {
    await expect(field).toHaveAttribute('data-state', 'fallback');
    await expect(page.locator('[data-archive-open]')).toBeHidden();
    await expect(page.locator(viewerSelector)).toBeHidden();
    const categoryLinks = page.locator('.spatial-home a[data-spatial-anchor]');
    await expect(categoryLinks).toHaveCount(8);
    for (const link of await categoryLinks.all()) await expect(link).toBeVisible();
    await expect(page.locator('.mobile-menu summary')).toBeVisible();
    const reason =
      'An independent WebGL2 probe failed. The eight category links and index remain available; the nine-leaf archive requires the renderer and is not exercised.';
    testInfo.annotations.push({
      type: 'webgl-unavailable',
      description: reason,
    });
    test.skip(true, reason);
  }
  await expect(field).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('[data-archive-open]')).toBeVisible();
  return true;
}

async function expectSelection(page: Page, index: number, rendered: boolean): Promise<void> {
  const selector = page.locator(`[data-archive-select="${index}"]`);
  const title = await selector.getAttribute('data-title');
  expect(title, `Archive selector ${index} must identify its entry`).toBeTruthy();
  await expect(page.locator(viewerSelector)).toBeVisible();
  await expect(page.locator('[data-archive-title]')).toHaveText(title!);
  await expect(page.locator('[data-archive-summary]')).toHaveText(/\S/);
  await expect(page.locator('[data-archive-detail]')).toHaveText(/\S/);
  await expect(selector).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-archive-select][aria-pressed="true"]')).toHaveCount(1);
  if (rendered) {
    const field = page.locator(fieldSelector);
    await expect(field).toHaveAttribute('data-state', 'ready');
    await expect(field).toHaveAttribute('data-selected-leaf', String(index));
    await expect
      .poll(async () => Number(await field.getAttribute('data-focus-amount')))
      .toBeGreaterThan(0.95);
    await expect(field).toHaveAttribute('data-motion', 'paused');
  }
}

async function expectClosed(page: Page, rendered: boolean): Promise<void> {
  await expect(page.locator(viewerSelector)).toBeHidden();
  const focusState = await page.evaluate(() => ({
    active: document.activeElement?.outerHTML.slice(0, 300),
    hasFocus: document.hasFocus(),
    visibility: getComputedStyle(document.querySelector('[data-archive-open]')!).visibility,
  }));
  await expect(page.locator('[data-archive-open]'), JSON.stringify(focusState)).toBeFocused();
  if (rendered) {
    const field = page.locator(fieldSelector);
    await expect(field).toHaveAttribute('data-selected-leaf', 'none');
    await expect
      .poll(async () => {
        const amount = await field.getAttribute('data-focus-amount');
        return amount === null ? Infinity : Number(amount);
      })
      .toBeLessThan(0.05);
  }
}

for (const lang of ['en', 'zh']) {
  test(`${lang} archive keeps all nine entries, content, and destination links synchronized`, async ({
    page,
    isMobile,
  }, testInfo) => {
    const rendered = await openHome(page, testInfo, lang);
    const homeURL = page.url();
    await expect(page.locator(viewerSelector)).toBeHidden();
    await activate(page.locator('[data-archive-open]'), isMobile);
    await expect(page.locator(viewerSelector)).toHaveRole('region');
    await expect(page.locator(viewerSelector)).not.toHaveAccessibleName('');
    await expect(page.locator(viewerSelector)).not.toHaveAttribute('aria-modal', 'true');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('[data-archive-select]')).toHaveCount(9);
    await expectSelection(page, 0, rendered);

    for (let index = 0; index < 9; index += 1) {
      await activate(page.locator(`[data-archive-select="${index}"]`), isMobile);
      await expectSelection(page, index, rendered);
      const links = page.locator('[data-archive-links] a');
      expect(await links.count(), `Entry ${index} must retain a real destination`).toBeGreaterThan(
        0,
      );
      for (const link of await links.all()) {
        await expect(link).toBeVisible();
        await expect(link).not.toHaveAccessibleName('');
        const href = await link.getAttribute('href');
        expect(href, `Entry ${index} must not use an empty destination`).toBeTruthy();
        expect(href).not.toBe('#');
        expect(['http:', 'https:', 'mailto:']).toContain(new URL(href!, homeURL).protocol);
      }
      await expect(page).toHaveURL(homeURL);
    }
  });
}

test('next and previous archive controls change the selected entry without leaving home', async ({
  page,
  isMobile,
}, testInfo) => {
  const rendered = await openHome(page, testInfo);
  const homeURL = page.url();
  await activate(page.locator('[data-archive-open]'), isMobile);
  await expectSelection(page, 0, rendered);
  await activate(page.locator('[data-archive-next]'), isMobile);
  await expectSelection(page, 1, rendered);
  await activate(page.locator('[data-archive-next]'), isMobile);
  await expectSelection(page, 2, rendered);
  await activate(page.locator('[data-archive-prev]'), isMobile);
  await expectSelection(page, 1, rendered);
  await expect(page).toHaveURL(homeURL);
});

test('Escape and the close button restore the original archive launcher focus', async ({
  page,
  isMobile,
}, testInfo) => {
  const rendered = await openHome(page, testInfo);
  const launcher = page.locator('[data-archive-open]');
  await activate(launcher, isMobile);
  await expectSelection(page, 0, rendered);
  await page.locator('[data-archive-select="3"]').focus();
  await page.keyboard.press('Enter');
  await expectSelection(page, 3, rendered);
  await page.keyboard.press('Escape');
  await expectClosed(page, rendered);

  await activate(launcher, isMobile);
  await expectSelection(page, 0, rendered);
  await activate(page.locator('[data-archive-select="6"]'), isMobile);
  await expectSelection(page, 6, rendered);
  await activate(page.locator('[data-archive-close]'), isMobile);
  await expectClosed(page, rendered);
});

test('selecting a leaf opens its archive content instead of navigating to research', async ({
  page,
  isMobile,
}, testInfo) => {
  const rendered = await openHome(page, testInfo);
  const homeURL = page.url();
  let selectedIndex: number;
  if (isMobile) {
    await test.step('Use the native archive selector with touch input', async () => {
      await activate(page.locator('[data-archive-open]'), isMobile);
      await activate(page.locator('[data-archive-select="4"]'), isMobile);
    });
    selectedIndex = 4;
  } else {
    await test.step('Hit an observed visible leaf surface through the actual canvas', async () => {
      await expect
        .poll(() => page.locator('[data-archive-select][data-leaf-x][data-leaf-y]').count())
        .toBeGreaterThan(0);
    });
    const target = await page.locator('[data-archive-select]').evaluateAll((buttons) => {
      const canvas = document.querySelector('.spatial-home .gallery-canvas');
      const field = document.querySelector('[data-gallery-scene][data-layout="field"]');
      if (!canvas || !field) return null;
      const bounds = field.getBoundingClientRect();
      for (const button of buttons) {
        const element = button as HTMLElement;
        if (!element.hasAttribute('data-leaf-x') || !element.hasAttribute('data-leaf-y')) continue;
        const localX = Number(element.dataset.leafX);
        const localY = Number(element.dataset.leafY);
        if (!Number.isFinite(localX) || !Number.isFinite(localY)) continue;
        const x = bounds.left + localX;
        const y = bounds.top + localY;
        if (document.elementFromPoint(x, y) !== canvas) continue;
        return { x, y, index: Number(element.dataset.archiveSelect) };
      }
      return null;
    });
    expect(target, 'A projected visible leaf point must receive canvas input').not.toBeNull();
    selectedIndex = target!.index;
    await page.mouse.click(target!.x, target!.y);
  }
  await expectSelection(page, selectedIndex, rendered);
  await expect(page).toHaveURL(homeURL);
  await page.keyboard.press('Escape');
  await expectClosed(page, rendered);
});

test('changing the selected entry changes the actual artwork and keeps the reader accessible', async ({
  page,
  isMobile,
}, testInfo) => {
  const rendered = await openHome(page, testInfo);
  await activate(page.locator('[data-archive-open]'), isMobile);
  await expectSelection(page, 0, rendered);
  const mask = [
    '.archive-viewer',
    '.archive-launch',
    '.archive-hover',
    '.field-identity',
    '.field-controls',
    '.field-instructions',
    '.spatial-artifact',
    '.site-header',
    '.site-footer',
  ].map((selector) => page.locator(selector));
  const canvas = page.locator(`${fieldSelector} canvas`);
  const first = await canvas.screenshot({ mask });
  await activate(page.locator('[data-archive-select="5"]'), isMobile);
  await expectSelection(page, 5, rendered);
  const second = await canvas.screenshot({ mask });
  // Both frames are still and all HTML content is masked. The physical leaf must change.
  expect(first.equals(second)).toBe(false);
  const results = await new AxeBuilder({ page })
    .include(viewerSelector)
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});

test('returning from a work restores a usable collection', async ({ page, isMobile }, testInfo) => {
  const rendered = await openHome(page, testInfo);
  await activate(page.locator('[data-archive-open]'), isMobile);
  await activate(page.locator('[data-archive-select="3"]'), isMobile);
  await expectSelection(page, 3, rendered);
  await page.locator('[data-archive-links] a[href="/medit/"]').click();
  await expect(page).toHaveURL(/\/medit\/$/);
  await page.goBack();
  await expect(page.locator(fieldSelector)).toHaveAttribute('data-state', 'ready');
  await expect(page.locator(viewerSelector)).toBeHidden();
  await activate(page.locator('[data-archive-open]'), isMobile);
  await expectSelection(page, 0, rendered);
  await activate(page.locator('[data-archive-close]'), isMobile);
  await expectClosed(page, rendered);
});
