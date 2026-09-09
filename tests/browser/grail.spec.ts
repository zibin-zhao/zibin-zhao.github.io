import { readFileSync } from 'node:fs';
import { test, expect, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { buildArchiveLeaves, type ArchiveLeaf } from '../../src/lib/archive-content';
import { projects } from '../../src/data/projects';

const paperIds = ['nature-biotech-cas12a', 'ecg-patch-12lead', 'dna-hydrogel-oect'];
const publications = paperIds.map((id) => {
  const source = readFileSync(`src/content/publications/${id}.md`, 'utf8');
  // These canonical records use single-line quoted YAML fields. Read their source
  // values rather than keeping a second copy of the publication text in this test.
  const field = (name: string): string => {
    const match = source.match(new RegExp(`^${name}: '(.+)'$`, 'm'));
    if (!match) throw new Error(`Missing ${name} in publication ${id}`);
    return match[1];
  };
  const year = source.match(/^year: (\d+)$/m);
  if (!year) throw new Error(`Missing year in publication ${id}`);
  const links = Object.fromEntries(
    [...source.matchAll(/\b(doi|preprint|correction): '([^']+)'/g)].map((match) => [
      match[1],
      match[2],
    ]),
  );
  return {
    id,
    data: {
      title: field('title'),
      authors: field('authors'),
      venue: field('venue'),
      year: Number(year[1]),
      links,
    },
  };
});

async function activate(control: Locator, isMobile: boolean): Promise<void> {
  if (isMobile) await control.tap();
  else await control.click();
}

async function openHome(page: Page, lang: 'en' | 'zh' = 'en'): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(lang === 'zh' ? '/zh/' : '/');
  await expect(page.locator('.grail-home')).toHaveAttribute('data-paused', 'true');
  await expect(page.locator('h1')).toContainText('Zibin');
  await expect(page.locator('.orbit-card[data-work-open]')).toHaveCount(9);
}

async function expectWork(page: Page, leaf: ArchiveLeaf): Promise<Locator> {
  const dialog = page.locator('[data-work-dialog]');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveJSProperty('open', true);
  await expect(dialog).not.toHaveAccessibleName('');
  expect(await dialog.evaluate((element) => element.matches(':modal'))).toBe(true);
  await expect(dialog.locator('[data-work-detail]:visible')).toHaveCount(1);
  const detail = dialog.locator(`[data-work-detail="${leaf.id}"]`);
  await expect(detail).toBeVisible();
  for (const text of [leaf.title, leaf.kicker, leaf.summary, leaf.detail]) {
    await expect(detail).toContainText(text);
  }
  for (const link of leaf.links) {
    const target = detail.getByRole('link', { name: link.label, exact: true });
    await expect(target).toBeVisible();
    await expect(target).toHaveAttribute('href', link.href);
  }
  return detail;
}

for (const lang of ['en', 'zh'] as const) {
  test(`${lang} floating cards and paging expose all nine works with canonical content and links`, async ({
    page,
    isMobile,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await openHome(page, lang);
    const homeURL = page.url();
    await expect(page.locator('[data-work-dialog]')).toBeHidden();
    await expect(page.locator('[data-work-detail]')).toHaveCount(9);

    const leaves = buildArchiveLeaves(lang, publications);
    const opener = page.locator('.orbit-card[data-work-open="casmd"]');
    await expect(opener).not.toHaveAccessibleName('');
    await activate(opener, isMobile);
    // The mobile composition shows seven hero cards. Paging must still expose
    // all nine works, including both papers beyond those seven visible cards.
    for (let index = 0; index < leaves.length; index += 1) {
      const leaf = leaves[(index + 1) % leaves.length];
      await expectWork(page, leaf);
      await expect(page).toHaveURL(homeURL);
      await activate(page.locator('[data-work-next]'), isMobile);
    }
    await expectWork(page, leaves[1]);
    await activate(page.locator('[data-work-close]'), isMobile);
    await expect(page.locator('[data-work-dialog]')).toBeHidden();
    await expect(opener).toBeFocused();

    const destinations = await page.locator('main a').evaluateAll((links) =>
      links.map((link) => ({
        href: link.getAttribute('href'),
        protocol: (link as HTMLAnchorElement).protocol,
      })),
    );
    expect(destinations.length).toBeGreaterThan(9);
    for (const destination of destinations) {
      expect(destination.href).toBeTruthy();
      expect(destination.href).not.toBe('#');
      expect(['http:', 'https:', 'mailto:']).toContain(destination.protocol);
    }
    expect(errors).toEqual([]);
  });
}

test('modal paging preserves the selected work and Escape restores its exact card opener', async ({
  page,
  isMobile,
}) => {
  await openHome(page);
  const leaves = buildArchiveLeaves('en', publications);
  const opener = page.locator('.orbit-card[data-work-open="dlselex"]');
  await activate(opener, isMobile);
  // Focusing a partly clipped card must not pan the hero and move its hit target.
  expect(await page.locator('.grail-hero').evaluate((hero) => hero.scrollLeft)).toBe(0);
  await expectWork(page, leaves[2]);
  await activate(page.locator('[data-work-next]'), isMobile);
  await expectWork(page, leaves[3]);
  await activate(page.locator('[data-work-prev]'), isMobile);
  await expectWork(page, leaves[2]);

  // Keyboard focus must remain in the native modal while its background is inert.
  await page.locator('[data-work-close]').focus();
  for (let index = 0; index < 8; index += 1) {
    await page.keyboard.press('Tab');
    expect(
      await page
        .locator('[data-work-dialog]')
        .evaluate((dialog) => dialog.contains(document.activeElement)),
    ).toBe(true);
  }
  const results = await new AxeBuilder({ page })
    .include('[data-work-dialog]')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-work-dialog]')).toBeHidden();
  await expect(opener).toBeFocused();
});

test('the featured project stage switches real project text and destinations', async ({
  page,
  isMobile,
}) => {
  await openHome(page, 'zh');
  await expect(page.locator('[data-feature-select]')).toHaveCount(6);
  await expect(page.locator('[data-feature-select="casmd"]')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  for (const project of projects) {
    const control = page.locator(`[data-feature-select="${project.id}"]`);
    await activate(control, isMobile);
    await expect(control).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-feature-select][aria-pressed="true"]')).toHaveCount(1);
    await expect(page.locator('[data-feature-panel]:visible')).toHaveCount(1);
    const panel = page.locator(`[data-feature-panel="${project.id}"]`);
    await expect(panel).toBeVisible();
    await expect(panel).toContainText(project.name);
    await expect(panel).toContainText(project.summary.zh);
    const destination = panel.locator(`a[href="${project.href}"]`);
    await expect(destination).toBeVisible();
    await expect(destination).not.toHaveAccessibleName('');
  }
});

test('motion defaults to the device preference and remains under visitor control', async ({
  page,
  browser,
  baseURL,
  isMobile,
}) => {
  await openHome(page);
  const root = page.locator('.grail-home');
  const toggle = page.locator('[data-motion-toggle]');
  const artwork = page.locator('.card-face').first();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(artwork).toHaveCSS('animation-name', 'none');
  await activate(toggle, isMobile);
  await expect(root).toHaveAttribute('data-paused', 'false');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(artwork).toHaveCSS('animation-name', 'card-bob');
  await expect(artwork).toHaveCSS('animation-duration', '8s');
  await activate(toggle, isMobile);
  await expect(root).toHaveAttribute('data-paused', 'true');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(artwork).toHaveCSS('animation-name', 'none');

  // A new visitor with no motion reduction preference gets the animated landing.
  const context = await browser.newContext({ reducedMotion: 'no-preference' });
  try {
    const animatedPage = await context.newPage();
    await animatedPage.goto(baseURL!);
    await expect(animatedPage.locator('.grail-home')).toHaveAttribute('data-paused', 'false');
    await expect(animatedPage.locator('[data-motion-toggle]')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  } finally {
    await context.close();
  }
});

test('floating works remain native destinations without JavaScript', async ({
  browser,
  baseURL,
  isMobile,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    reducedMotion: 'reduce',
    isMobile,
    hasTouch: isMobile,
    viewport: isMobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
  });
  try {
    const page = await context.newPage();
    await page.goto(`${baseURL}/zh/`);
    await expect(page.locator('.orbit-card[data-work-open]')).toHaveCount(9);
    for (const leaf of buildArchiveLeaves('zh', publications)) {
      const card = page.locator(`.orbit-card[data-work-open="${leaf.id}"]`);
      await expect(card).toHaveAttribute('href', /^(https:\/\/|\/(?:zh\/)?)/);
      await expect(card).toContainText(leaf.title);
    }
    const medit = page.locator('.orbit-card[data-work-open="medit"]');
    const destination = await medit.getAttribute('href');
    await activate(medit, isMobile);
    await expect(page).toHaveURL(new URL(destination!, `${baseURL}/zh/`).href);
    await expect(page).toHaveTitle(/Medit/);
  } finally {
    await context.close();
  }
});

test('returning from an embedded app restores a closed and usable collection', async ({
  page,
  isMobile,
}) => {
  await openHome(page);
  const opener = page.locator('.orbit-card[data-work-open="casmd"]');
  await activate(opener, isMobile);
  await activate(page.locator('[data-work-next]'), isMobile);
  await activate(page.locator('[data-work-next]'), isMobile);
  await expectWork(page, buildArchiveLeaves('en', publications)[3]);
  await page.locator('[data-work-detail="medit"] a[href="/medit/"]').click();
  await expect(page).toHaveURL(/\/medit\/$/);
  await page.goBack();
  await expect(page.locator('[data-work-dialog]')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('');
  await activate(opener, isMobile);
  await expectWork(page, buildArchiveLeaves('en', publications)[1]);
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-work-dialog]')).toBeHidden();
  await expect(opener).toBeFocused();
});
