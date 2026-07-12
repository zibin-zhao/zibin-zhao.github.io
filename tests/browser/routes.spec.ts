import { expect, test, type Page } from '@playwright/test';
import { cv } from '../../src/data/cv';
import { profile } from '../../src/data/profile';

const publications = [
  {
    title: 'DNA-guided CRISPR–Cas12a effectors for programmable RNA recognition and cleavage',
    year: 2026,
    venue: 'Nature Biotechnology',
    authors: 'X Wu, WH Lam, Z Zhao, Y Cao, H Lin, X Feng, Y Zhai, IM Hsing',
    featured: true,
    hrefs: ['https://doi.org/10.1038/s41587-026-03120-5'],
  },
  {
    title: 'Thermodynamically programmed one-pot CRISPR platform for point-of-care SNP genotyping',
    year: 2026,
    venue: '',
    authors: 'IM Hsing, X Wu, Y Li, Y Cao, Z Zhao, H Lu, S Liang',
    featured: false,
    hrefs: [],
  },
  {
    title: 'Benchtop to at-home test: amplicon-depleted CRISPR-regulated loop-mediated amplification at skin-temperature for viral load monitoring',
    year: 2025,
    venue: 'Biosensors and Bioelectronics, 267',
    authors: 'Y Cao, H Lin, X Lu, X Wu, Y Zhu, Z Zhao, Y Li, et al.',
    featured: false,
    hrefs: ['https://doi.org/10.1016/j.bios.2024.116866'],
  },
  {
    title: 'DNA-guided CRISPR/Cas effector for programmable RNA-recognition and cleavage',
    year: 2025,
    venue: '',
    authors: 'IM Hsing, X Wu, Z Zhao, Y Cao, H Lin, X Feng',
    featured: false,
    hrefs: [],
  },
  {
    title: 'DNA hydrogel-interfaced organic electrochemical transistor for the investigation of binding-induced conformational change of small molecule aptamers',
    year: 2025,
    venue: 'ACS Applied Materials & Interfaces, 17(37)',
    authors: 'H Lin, Z Zhao, X Feng, SY Yeung, IM Hsing',
    featured: false,
    hrefs: ['https://doi.org/10.1021/acsami.5c11113'],
  },
  {
    title: 'Structure-enhanced deep learning accelerates aptamer selection for small molecule families like steroids',
    year: 2025,
    venue: 'Briefings in Bioinformatics, 26(6)',
    authors: 'Z Zhao, H Lin, HY Lau, H Chen, IM Hsing',
    featured: true,
    hrefs: [
      'https://doi.org/10.1093/bib/bbaf680',
      'https://github.com/zibin-zhao/DL-SELEX',
    ],
  },
  {
    title: 'Integrating magnetic-bead-based sample extraction and molecular barcoding for the one-step pooled RT-qPCR assay of viral pathogens without retesting',
    year: 2023,
    venue: 'Analytical Chemistry, 95(14)',
    authors: 'X Zhuang, Z Zhao, X Feng, GCY Lui, D Chan, SS Lee, IM Hsing',
    featured: false,
    hrefs: ['https://doi.org/10.1021/acs.analchem.3c00885'],
  },
  {
    title: 'Skin-adherent elastomer-hydrogel patch for continuous 12-lead cardiac ambulatory monitoring during physical activities',
    year: 2023,
    venue: 'Advanced Materials Technologies, 8(18)',
    authors: 'Y Li, Z Zhao, A Veronica, S Yu Yeung, IM Hsing',
    featured: false,
    hrefs: ['https://doi.org/10.1002/admt.202300326'],
  },
  {
    title: 'Transforming ECG diagnosis: an in-depth review of transformer-based deep-learning models in cardiovascular disease detection',
    year: 2023,
    venue: 'arXiv:2306.01249',
    authors: 'Z Zhao',
    featured: true,
    hrefs: ['https://arxiv.org/abs/2306.01249'],
  },
] as const;

const projects = [
  { title: 'CasMD', href: 'https://huggingface.co/spaces/zzhaobz/HsingMD' },
  { title: 'DL-SELEX', href: 'https://github.com/zibin-zhao/DL-SELEX' },
  { title: 'TEMPO', href: 'https://github.com/zibin-zhao/TEMPO' },
  { title: 'ECG App', href: 'https://github.com/zibin-zhao/ECG_analysing_app' },
] as const;

const cvEntries = [...cv.education, ...cv.experience, ...cv.leadership];

const routes = [
  { path: '/about/', active: 'about', selector: '[data-focus]', attribute: 'data-focus', identities: profile.focus.map((item) => item.en) },
  { path: '/research/', active: 'research', selector: '[data-publication]', attribute: 'data-publication', identities: publications.map((item) => item.title) },
  { path: '/projects/', active: 'projects', selector: '[data-project]', attribute: 'data-project', identities: projects.map((item) => item.title) },
  { path: '/cv/', active: 'cv', selector: '[data-cv-entry]', attribute: 'data-cv-entry', identities: cvEntries.map((item) => item.title.en) },
  { path: '/contact/', active: 'contact', selector: '[data-contact-social]', attribute: 'data-contact-social', identities: profile.socials.map((item) => item.label) },
] as const;

const assertNoOverflowOrDockOverlap = async (page: Page) => {
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => document.documentElement.clientWidth),
  );
  const content = await page.locator('.index-sheet-content').boundingBox();
  const fixedControls = await page.locator('.footer-routes').boundingBox();
  if (!content || !fixedControls) throw new Error('Archive content or fixed dock did not render');
  expect(content.y + content.height).toBeLessThan(fixedControls.y - 8);
};

for (const route of routes) {
  test(`${route.path} is a complete bilingual Index Sheet`, async ({ page }) => {
    const runtimeErrors: string[] = [];
    page.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(message.text()); });
    page.on('pageerror', (error) => runtimeErrors.push(error.message));
    await page.setViewportSize({ width: 390, height: 844 });
    const response = await page.goto(route.path);
    expect(response?.status()).toBe(200);
    await expect(page.locator('main h1')).toHaveCount(1);
    const headingLevels = await page.locator('main h1, main h2, main h3, main h4, main h5, main h6').evaluateAll((headings) => (
      headings.map((heading) => Number(heading.tagName.slice(1)))
    ));
    expect(headingLevels[0]).toBe(1);
    for (let index = 1; index < headingLevels.length; index += 1) {
      expect(headingLevels[index]).toBeLessThanOrEqual(headingLevels[index - 1] + 1);
    }
    const records = page.locator(route.selector);
    await expect(records).toHaveCount(route.identities.length);
    expect(await records.evaluateAll((elements, attribute) => (
      elements.map((element) => element.getAttribute(attribute))
    ), route.attribute)).toEqual(route.identities);
    await expect(page.locator(`.footer-routes a[href="${route.path}"]`)).toHaveAttribute('aria-current', 'page');

    await page.getByRole('button', { name: 'Switch language / 切换语言' }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'zh');
    await expect(page.locator('.index-sheet-heading h1 .t-zh')).toBeVisible();
    await assertNoOverflowOrDockOverlap(page);
    expect(runtimeErrors).toEqual([]);
  });
}

test('renders complete publication metadata and featured state in deterministic order', async ({ page }) => {
  await page.goto('/research/');
  const cards = page.locator('[data-publication]');
  await expect(cards).toHaveCount(publications.length);
  const rendered = await cards.evaluateAll((elements) => elements.map((element) => ({
    title: element.querySelector('h3')?.textContent?.replace('★', '').trim(),
    year: Number(element.querySelector('.pub-meta span:first-child')?.textContent),
    venue: element.querySelector('.pub-meta span:nth-child(2)')?.textContent?.trim() ?? '',
    authors: element.querySelector('.pub-authors')?.textContent?.trim(),
    featured: element.classList.contains('pub--featured'),
  })));
  expect(rendered).toEqual(publications.map((publication) => ({
    title: publication.title,
    year: publication.year,
    venue: publication.venue,
    authors: publication.authors,
    featured: publication.featured,
  })));
  for (let index = 0; index < publications.length; index += 1) {
    await expect(cards.nth(index).locator('.pub-meta')).toBeVisible();
    await expect(cards.nth(index).locator('.pub-authors')).toBeVisible();
    if (publications[index].featured) await expect(cards.nth(index).locator('.star')).toBeVisible();
    else await expect(cards.nth(index).locator('.star')).toHaveCount(0);
    if (publications[index].venue) await expect(cards.nth(index).locator('.pub-meta span').nth(1)).toBeVisible();
    else await expect(cards.nth(index).locator('.pub-meta span')).toHaveCount(1);
  }
});

test('binds every project and per-publication action to its canonical href and safety attributes', async ({ page }) => {
  await page.goto('/projects/');
  const projectLinks = page.locator('a[data-project]');
  await expect(projectLinks).toHaveCount(projects.length);
  expect(await projectLinks.evaluateAll((links) => links.map((link) => ({
    title: link.getAttribute('data-project'),
    href: link.getAttribute('href'),
    target: link.getAttribute('target'),
    rel: link.getAttribute('rel'),
  })))).toEqual(projects.map((project) => ({ ...project, target: '_blank', rel: 'noopener noreferrer' })));

  await page.goto('/research/');
  const publicationCards = page.locator('[data-publication]');
  await expect(publicationCards).toHaveCount(publications.length);
  await expect(publicationCards.locator('.pub-links a')).toHaveCount(8);
  expect(await publicationCards.evaluateAll((cards) => cards.map((card) => ({
    title: card.getAttribute('data-publication'),
    links: [...card.querySelectorAll('.pub-links a')].map((link) => ({
      href: link.getAttribute('href'),
      target: link.getAttribute('target'),
      rel: link.getAttribute('rel'),
    })),
  })))).toEqual(publications.map((publication) => ({
    title: publication.title,
    links: publication.hrefs.map((href) => ({
      href,
      target: '_blank',
      rel: 'noopener noreferrer',
    })),
  })));
});

test('renders every CV skill and complete contact index from canonical data', async ({ page }) => {
  await page.goto('/contact/');
  await expect(page.locator(`.contact-record a[href="mailto:${profile.email}"]`)).toBeVisible();
  const socialLinks = page.locator('[data-contact-social]');
  await expect(socialLinks).toHaveCount(profile.socials.length);
  expect(await socialLinks.evaluateAll((links) => links.map((link) => ({
    label: link.getAttribute('data-contact-social'),
    href: link.getAttribute('href'),
    target: link.getAttribute('target'),
    rel: link.getAttribute('rel'),
  })))).toEqual(profile.socials.map((social) => ({
    label: social.label,
    href: social.href,
    target: '_blank',
    rel: 'noopener noreferrer',
  })));
  const contactIndex = page.locator('.footer-index a');
  await expect(contactIndex).toHaveCount(profile.navLinks.length);
  expect(await contactIndex.evaluateAll((links) => links.map((link) => ({
    href: link.getAttribute('href'),
    label: link.querySelector('.t-en')?.textContent,
  })))).toEqual(profile.navLinks.map((link) => ({ href: link.href, label: link.en })));
  for (let index = 0; index < profile.navLinks.length; index += 1) {
    await expect(contactIndex.nth(index).locator('.t-en')).toBeVisible();
  }

  await page.goto('/cv/');
  expect(await page.locator('[data-cv-entry]').evaluateAll((entries) => (
    entries.map((entry) => entry.getAttribute('data-cv-entry'))
  ))).toEqual(cvEntries.map((entry) => entry.title.en));
  await expect(page.locator('.cv-tools .chip')).toHaveText(cv.skills);
  const download = page.locator('a[download][href="/cv.pdf"]');
  await expect(download).toBeVisible();
  await expect(download).toHaveAttribute('download', '');
  expect((await page.request.get('/cv.pdf')).status()).toBe(200);
});

test('all archive routes keep ordinary English anchors without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  for (const route of routes) {
    const response = await page.goto(route.path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('button', { name: 'Switch language / 切换语言' })).toBeHidden();
    await expect(page.locator('.index-sheet-heading h1 .t-en')).toBeVisible();
    await expect(page.locator('.footer-routes a')).toHaveCount(6);
    for (const anchor of await page.locator('.footer-routes a').all()) await expect(anchor).toBeVisible();
    await assertNoOverflowOrDockOverlap(page);
  }

  await context.close();
});
