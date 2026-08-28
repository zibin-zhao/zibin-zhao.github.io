import { expect, test, type Locator, type Page } from '@playwright/test';
import { promptPack } from '../../src/data/prompts';

const promptTexts = promptPack.stages.flatMap((stage) => stage.blocks.map((block) => block.text));
const promptLabels = promptPack.stages.flatMap((stage) => stage.blocks.map((block) => block.label).filter(Boolean));
const stageNotes = promptPack.stages.map((stage) => stage.note).filter(Boolean);

const motionState = (locator: Locator) => locator.evaluate((element) => {
  const style = getComputedStyle(element);
  const matrix = new DOMMatrixReadOnly(style.transform);
  return {
    angle: Math.round(Math.atan2(matrix.b, matrix.a) * 180 / Math.PI),
    tx: Math.round(matrix.m41),
    ty: Math.round(matrix.m42),
  };
});

const collectRuntimeErrors = (page: Page) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
};

test('renders the complete Prompt Pack as one semantic Index Sheet', async ({ page }) => {
  const runtimeErrors = collectRuntimeErrors(page);
  const response = await page.goto('/prompts/');

  expect(response?.status()).toBe(200);
  await expect(page.locator('main#main-content')).toHaveCount(1);
  await expect(page.locator('main h1')).toHaveCount(1);
  await expect(page.locator('.stage')).toHaveCount(promptPack.stages.length);
  await expect(page.locator('.stage h2')).toHaveCount(promptPack.stages.length);
  await expect(page.locator('.discipline h2')).toHaveText(promptPack.disciplineTitle);
  await expect(page.locator('.ptext')).toHaveCount(promptTexts.length);
  await expect(page.locator('.plabel')).toHaveText(promptLabels as string[]);
  await expect(page.locator('.note')).toHaveText(stageNotes as string[]);
  await expect(page.locator('.after')).toHaveText([`↳ ${promptPack.stages.find((stage) => stage.afterNote)?.afterNote}`]);
  await expect(page.locator('.discipline li')).toHaveText(promptPack.discipline);

  expect(await page.locator('.stage').evaluateAll((stages) => stages.map((stage) => stage.id))).toEqual(
    promptPack.stages.map((stage) => `stage-${stage.num}`),
  );
  expect(await page.locator('.stage h2').allTextContents()).toEqual(promptPack.stages.map((stage) => stage.title));
  expect(await page.locator('.ptext').allTextContents()).toEqual(promptTexts);
  expect(runtimeErrors).toEqual([]);
});

test('stage navigation keeps deliberate selection active and clears the fixed shell', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/prompts/');
  const links = page.locator('.stagenav a');
  await expect(links).toHaveCount(promptPack.stages.length);
  expect(await links.evaluateAll((anchors) => anchors.map((anchor) => anchor.getAttribute('href')))).toEqual(
    promptPack.stages.map((stage) => `#stage-${stage.num}`),
  );

  const finalLink = links.last();
  await finalLink.focus();
  await expect(finalLink).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#stage-8$/);
  await expect(finalLink).toHaveAttribute('aria-current', 'location');
  await expect(finalLink).toHaveClass(/active/);
  await expect.poll(() => page.evaluate(() => {
    const target = document.querySelector('#stage-8');
    const nav = document.querySelector('.stagenav');
    if (!target || !nav) return false;
    return target.getBoundingClientRect().top >= nav.getBoundingClientRect().bottom - 2;
  })).toBe(true);
  await page.waitForTimeout(600);
  await expect(finalLink).toHaveAttribute('aria-current', 'location');
});

test('keyboard copy uses the primary clipboard path and announces completion', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: (text: string) => {
          (window as typeof window & { copiedPrompt?: string }).copiedPrompt = text;
          return Promise.resolve();
        },
      },
    });
  });
  await page.goto('/prompts/');

  const copy = page.locator('.copy').first();
  await copy.focus();
  await expect(copy).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(copy).toHaveClass(/copied/);
  await expect(copy).toHaveAttribute('aria-label', 'Copied to clipboard');
  await expect(page.locator('.copy-feedback').first()).toHaveText('Copied to clipboard');
  expect(await page.evaluate(() => (window as typeof window & { copiedPrompt?: string }).copiedPrompt)).toBe(promptTexts[0]);
});

test('clipboard rejection uses execCommand fallback and retains copied state', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error('forced primary failure')) },
    });
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: (command: string) => {
        (window as typeof window & { fallbackCommand?: string }).fallbackCommand = command;
        return true;
      },
    });
  });
  await page.goto('/prompts/');

  const copy = page.locator('.copy').first();
  await copy.click();
  expect(await page.evaluate(() => (window as typeof window & { fallbackCommand?: string }).fallbackCommand)).toBe('copy');
  await expect(copy).toHaveClass(/copied/);
  await expect(page.locator('.copy-feedback').first()).toHaveText('Copied to clipboard');
});

for (const primaryPath of ['absent', 'rejected'] as const) {
  test(`${primaryPath} clipboard plus false fallback reports manual-copy failure`, async ({ page }) => {
    await page.addInitScript((path) => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: path === 'absent'
          ? undefined
          : { writeText: () => Promise.reject(new Error('forced primary failure')) },
      });
      Object.defineProperty(document, 'execCommand', {
        configurable: true,
        value: () => false,
      });
    }, primaryPath);
    await page.goto('/prompts/');

    const copy = page.locator('.copy').first();
    await copy.click();
    await expect(copy).toHaveClass(/failed/);
    await expect(copy).not.toHaveClass(/copied/);
    await expect(copy).toHaveAttribute('aria-label', 'Copy failed. Copy manually');
    await expect(copy.locator('.lbl-failed')).toBeVisible();
    await expect(page.locator('.copy-feedback').first()).toHaveText('Copy failed. Select the prompt and copy manually.');
    await expect(copy).not.toHaveClass(/failed/, { timeout: 2000 });
    await expect(copy).toHaveAttribute('aria-label', 'Copy prompt to clipboard');
    await expect(copy.locator('.lbl-copy')).toBeVisible();
    await expect(page.locator('.copy-feedback').first()).toHaveText('');
  });
}

test('throwing fallback reports failure without page errors and always removes its textarea', async ({ page }) => {
  const runtimeErrors = collectRuntimeErrors(page);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: () => { throw new Error('forced fallback failure'); },
    });
  });
  await page.goto('/prompts/');

  const copy = page.locator('.copy').first();
  await copy.click();
  await expect(copy).toHaveClass(/failed/);
  await expect(copy).not.toHaveClass(/copied/);
  await expect(copy).toHaveAttribute('aria-label', 'Copy failed. Copy manually');
  await expect(copy.locator('.lbl-failed')).toBeVisible();
  await expect(page.locator('.copy-feedback').first()).toHaveText('Copy failed. Select the prompt and copy manually.');
  await expect(page.locator('textarea')).toHaveCount(0);
  expect(runtimeErrors).toEqual([]);
});

test('repeated copy activation restarts reset timing from the latest result', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: () => Promise.resolve() },
    });
  });
  await page.goto('/prompts/');

  const copy = page.locator('.copy').first();
  const feedback = page.locator('.copy-feedback').first();
  await copy.click();
  await page.waitForTimeout(1100);
  await copy.click();
  await page.waitForTimeout(600);
  await expect(copy).toHaveClass(/copied/);
  await expect(copy).toHaveAttribute('aria-label', 'Copied to clipboard');
  await expect(feedback).toHaveText('Copied to clipboard');

  await expect(copy).not.toHaveClass(/copied/, { timeout: 1500 });
  await expect(copy).not.toHaveClass(/failed/);
  await expect(copy).toHaveAttribute('aria-label', 'Copy prompt to clipboard');
  await expect(copy.locator('.lbl-copy')).toBeVisible();
  await expect(feedback).toHaveText('');
});

test('missing IntersectionObserver leaves content and ordinary navigation usable', async ({ page }) => {
  const runtimeErrors = collectRuntimeErrors(page);
  await page.addInitScript(() => {
    Object.defineProperty(window, 'IntersectionObserver', { configurable: true, value: undefined });
  });
  await page.goto('/prompts/');

  await expect(page.locator('.stage')).toHaveCount(promptPack.stages.length);
  await expect(page.locator('.ptext')).toHaveCount(promptTexts.length);
  await expect(page.locator('.stagenav')).toBeVisible();
  const stageSix = page.locator('.stagenav a[href="#stage-6"]');
  await stageSix.click();
  await expect(page).toHaveURL(/#stage-6$/);
  await expect(stageSix).toHaveAttribute('aria-current', 'location');
  expect(runtimeErrors).toEqual([]);
});

test('no-JS Prompts keeps all content, stage anchors, and footer links', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const response = await page.goto('/prompts/');

  expect(response?.status()).toBe(200);
  await expect(page.locator('main#main-content')).toHaveCount(1);
  await expect(page.locator('.stage')).toHaveCount(promptPack.stages.length);
  await expect(page.locator('.ptext')).toHaveCount(promptTexts.length);
  await expect(page.locator('.stagenav a')).toHaveCount(promptPack.stages.length);
  await expect(page.locator('.foot .home[href="/"]')).toBeVisible();
  await expect(page.locator('.footer-routes a')).toHaveCount(7);
  await expect(page.locator('.draw-control[href="/prompts/"]')).toBeVisible();
  await page.locator('.stagenav a[href="#stage-8"]').click();
  await expect(page).toHaveURL(/#stage-8$/);
  await context.close();
});

test('390px layout has no overflow, reserves the dock, and marks the draw route current', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/prompts/');
  await expect(page.locator('.draw-control')).toHaveAttribute('aria-current', 'page');
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => document.documentElement.clientWidth),
  );
  const content = await page.locator('.foot').boundingBox();
  const fixedControls = await page.locator('.footer-routes').boundingBox();
  if (!content || !fixedControls) throw new Error('Prompt footer or fixed dock did not render');
  expect(content.y + content.height).toBeLessThan(fixedControls.y - 8);
});

test('Prompts retains exact normal and reduced draw-control motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/prompts/');
  const draw = page.locator('.draw-control');
  expect(await motionState(draw)).toMatchObject({ angle: -12, tx: 0, ty: 0 });
  await draw.hover();
  await page.waitForTimeout(200);
  expect(await motionState(draw)).toMatchObject({ angle: 12, tx: 0, ty: 0 });

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  const reducedDraw = page.locator('.draw-control');
  const resting = await motionState(reducedDraw);
  expect(resting).toMatchObject({ angle: -12, tx: 0, ty: 0 });
  await reducedDraw.hover();
  expect(await motionState(reducedDraw)).toEqual(resting);
});
