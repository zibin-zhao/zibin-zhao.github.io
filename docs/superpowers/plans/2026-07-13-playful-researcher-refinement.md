# Playful Researcher Portfolio Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Preserve the Stitch-authored portfolio identity while making mobile/tablet typography, navigation, card interactions, closing copy, and the personal hobby story accessible and production-ready.

**Architecture:** Keep the current Astro component boundaries and ordinary-anchor progressive enhancement. Add the personal closing content to StitchVibe, make card titles supply stretched primary links, switch the shared footer to normal flow at mobile widths, and encode readable type roles through shared tokens plus component-level breakpoint rules.

**Tech Stack:** Astro 6, TypeScript, component-scoped CSS, Vitest source contracts, Playwright browser tests.

## Global Constraints

- Preserve Anton, Space Grotesk, and JetBrains Mono as the three locally loaded brand families.
- Desktop above 700px keeps the fixed dock; widths at or below 700px use a normal-flow closing dock.
- Tablet metadata/actions are at least 12px; compact non-interactive labels may be 11px.
- Mobile supporting text is at least 14px; interactive targets are at least 44×44px for coarse pointers.
- Preserve bilingual behavior, ordinary-anchor navigation, reduced motion, canonical content records, local imagery, and no-JavaScript usability.
- Homepage headings omit unexplained archive numbers; numbered supporting Index Sheets remain unchanged.
- Add no dependency, custom SVG illustration, or speculative interaction state.

---

### Task 1: Lock refinement contracts with failing tests

**Files:**
- Create: tests/playful-researcher-refinement.test.ts
- Modify: tests/browser/homepage.spec.ts

**Interfaces:**
- Consumes: Existing Astro source files and Playwright page fixtures.
- Produces: Static contracts for copy/structure/tokens and browser contracts for mobile/footer/card behavior.

- [ ] **Step 1: Write the failing source-contract test**

~~~ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const root = new URL('..', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');

describe('playful researcher refinement', () => {
  it('adds a bilingual personal close without homepage numbering', () => {
    const research = read('src/components/FeaturedResearch.astro');
    const vibe = read('src/components/StitchVibe.astro');
    expect(research).not.toContain('02 —');
    expect(vibe).not.toContain('04 —');
    expect(vibe).toContain('Side Quests');
    for (const marker of [
      'Beyond the lab', '实验室之外', 'Violin', '小提琴',
      'Chinese calligraphy', '书法', 'Psychology', '心理学', 'Buddhism', '佛学',
    ]) expect(vibe).toContain(marker);
    expect(vibe).toContain('Start a conversation');
  });

  it('uses primary card links, flow-footer CSS, and type tokens', () => {
    const research = read('src/components/FeaturedResearch.astro');
    const vibeCard = read('src/components/StitchVibeCard.astro');
    const footer = read('src/components/StitchFooterDock.astro');
    const tokens = read('src/styles/tokens.css');
    expect(research).toContain('paper-primary-link');
    expect(vibeCard).toContain('vibe-primary-link');
    expect(footer).toContain('draw-label');
    expect(footer).toMatch(/@media \(max-width: 700px\)[\s\S]*?\.stitch-footer\s*\{[^}]*position:\s*relative;/);
    expect(tokens).toContain('--text-body: 1rem;');
    expect(tokens).toContain('--text-supporting: .875rem;');
    expect(tokens).toContain('--text-meta: .75rem;');
  });
});
~~~

- [ ] **Step 2: Add failing browser requirements**

~~~ts
test('mobile footer flows after content and exposes complete 44px controls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.stitch-footer')).toHaveCSS('position', 'relative');
  const main = await page.locator('#main-content').boundingBox();
  const footer = await page.locator('.stitch-footer').boundingBox();
  if (!main || !footer) throw new Error('Mobile shell geometry missing');
  expect(footer.y).toBeGreaterThanOrEqual(main.y + main.height - 1);
  for (const target of await page.locator('.footer-pill, .draw-control').all()) {
    const box = await target.boundingBox();
    if (!box) throw new Error('Footer target missing');
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
  await expect(page.locator('.footer-routes a[href="/contact/"]')).toBeVisible();
});

test('homepage cards expose primary destinations and the bilingual personal close', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.paper-primary-link')).toHaveCount(3);
  await expect(page.locator('.vibe-primary-link')).toHaveCount(4);
  await expect(page.getByRole('heading', { name: 'Beyond the lab' })).toBeVisible();
  await page.getByRole('button', { name: 'Switch language / 切换语言' }).click();
  await expect(page.getByRole('heading', { name: '实验室之外' })).toBeVisible();
});
~~~

- [ ] **Step 3: Verify RED**

Run:

~~~bash
npm test -- tests/playful-researcher-refinement.test.ts
npx playwright test tests/browser/homepage.spec.ts --project=regression --grep "mobile footer flows|homepage cards expose"
~~~

Expected: Vitest fails because the copy, classes, tokens, and footer rule do not exist. Playwright fails because the footer is fixed and the personal close/primary links do not exist.

---

### Task 2: Implement the playful close and honest card links

**Files:**
- Modify: src/components/StitchHero.astro
- Modify: src/components/FeaturedResearch.astro
- Modify: src/components/StitchVibe.astro
- Modify: src/components/StitchVibeCard.astro

**Interfaces:**
- Consumes: Publication/Vibe records, profile.email, and T.astro bilingual rendering.
- Produces: paper-primary-link, vibe-primary-link, beyond-lab, collaboration-close, and direct bilingual content.

- [ ] **Step 1: Clarify hero and homepage section copy**

Use:

~~~astro
<p class="hero-thesis"><T en="AI for molecules, minds, and everyday wellbeing." zh="用人工智能探索分子、心灵与日常健康。" /></p>
<span><T en="Curious by training · playful by nature" zh="以好奇为业 · 以玩心为伴" /></span>
~~~

Render Research & Publications without 02 —. Replace 04 — Vibe Codings and LOL with Side Quests / 支线探索 and an After hours / 研究之外 field note.

- [ ] **Step 2: Add primary research links**

For each paper, filter available links and use the first as the primary destination:

~~~astro
<h3>
  <a class="paper-primary-link" href={primaryHref} target="_blank" rel="noopener noreferrer">
    {paper.title}{paper.featured && <span class="paper-star" aria-label="Featured">★</span>}
  </a>
</h3>
~~~

Give the anchor an absolute inset pseudo-element and keep paper-links at position: relative; z-index: 2 so secondary actions remain clickable.

- [ ] **Step 3: Add primary Vibe links**

Wrap linked Vibe title content in vibe-primary-link, preserving target/rel for external URLs. Use the same stretched-link technique and keep vibe-action above it.

- [ ] **Step 4: Add the personal strip and collaboration close**

~~~astro
<section class="beyond-lab" aria-labelledby="beyond-lab-title">
  <h3 id="beyond-lab-title"><T en="Beyond the lab" zh="实验室之外" /></h3>
  <div class="interest-groups">
    <article><span aria-hidden="true">♫</span><h4><T en="Music" zh="音乐" /></h4><p><T en="Violin · Piano · Guitar · Drums" zh="小提琴 · 钢琴 · 吉他 · 架子鼓" /></p></article>
    <article><span aria-hidden="true">筆</span><h4><T en="Making and reading" zh="书写与阅读" /></h4><p><T en="Chinese calligraphy · Reading" zh="书法 · 阅读" /></p></article>
    <article><span aria-hidden="true">◌</span><h4><T en="Inner life" zh="内在探索" /></h4><p><T en="Psychology · Buddhism" zh="心理学 · 佛学" /></p></article>
  </div>
</section>
~~~

Follow it with a bilingual collaboration prompt and ordinary mailto anchor using profile.email.

- [ ] **Step 5: Verify GREEN for source contracts**

Run:

~~~bash
npm test -- tests/playful-researcher-refinement.test.ts tests/stitch-foundation.test.ts tests/preserved-behavior.test.ts
~~~

Expected: all targeted source contracts pass after updating only superseded homepage wording assertions.

---

### Task 3: Adapt the footer and typography system

**Files:**
- Modify: src/styles/tokens.css
- Modify: src/components/StitchFooterDock.astro
- Modify: src/layouts/StitchShell.astro
- Modify: src/components/StitchHeader.astro
- Modify: src/components/StitchHero.astro
- Modify: src/components/FeaturedResearch.astro
- Modify: src/components/StitchVibe.astro
- Modify: src/components/StitchVibeCard.astro

**Interfaces:**
- Consumes: Existing color/font/motion tokens.
- Produces: semantic type tokens, readable outline, mobile flow-footer CSS, and coarse-pointer target rules.

- [ ] **Step 1: Add semantic type and contrast tokens**

~~~css
--outline: #59625b;
--text-body: 1rem;
--text-supporting: .875rem;
--text-meta: .75rem;
--text-action: .75rem;
--tracking-utility: .04em;
~~~

Use --muted instead of --outline for meaningful muted copy when outline is only structural.

- [ ] **Step 2: Convert the mobile footer to normal flow**

~~~css
@media (max-width: 700px) {
  .stitch-footer {
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
    padding: 16px 12px 0;
    pointer-events: auto;
  }
  .footer-socials,
  .footer-routes {
    position: static;
    width: 100%;
    flex-wrap: wrap;
    overflow: visible;
  }
  .footer-socials { grid-column: 1 / -1; }
  .footer-routes { grid-column: 1; }
  .draw-control { position: static; width: auto; min-width: 44px; min-height: 44px; }
  .footer-decoration { grid-column: 1 / -1; }
}
~~~

Expose draw-label only in mobile mode and reduce mobile stitch-main bottom padding because the footer no longer overlays it.

- [ ] **Step 3: Replace tiny role values**

Use text-body for prose, text-supporting for authors/supporting copy, and text-meta/text-action for metadata, tags, and actions. Keep decorative formulas as documented exceptions. Increase card height or reduce overlap when copy grows.

- [ ] **Step 4: Add honest interaction states and target floors**

~~~css
@media (pointer: coarse) {
  .paper-links a,
  .vibe-action,
  .footer-pill,
  .draw-control { min-height: 44px; }
}
~~~

Use focus-within alongside hover, keep visible global focus, and use loaded JetBrains Mono 500 instead of synthetic 700 for action labels.

- [ ] **Step 5: Verify targeted browser and unit behavior**

Run:

~~~bash
npm test -- tests/playful-researcher-refinement.test.ts tests/reviewer-fidelity.test.ts tests/stitch-foundation.test.ts
npx playwright test tests/browser/homepage.spec.ts --project=regression --grep "mobile footer flows|homepage cards expose"
~~~

Expected: all targeted tests pass.

---

### Task 4: Reconcile visual contracts and polish

**Files:**
- Modify as evidence requires: tests/e2e/stitch.spec.ts
- Modify as evidence requires: component files from Tasks 2–3
- Refresh only for intentional geometry changes: artifacts/stitch/*.png

**Interfaces:**
- Consumes: Completed responsive implementation and source-comparison tests.
- Produces: Verified desktop, 768px, mobile, reduced-motion, no-JavaScript, and image-failure behavior.

- [ ] **Step 1: Run the complete browser suite**

Run: npm run test:browser

Expected: behavior tests pass. Geometry assertions may fail only where readable type and flow footer intentionally alter prior measurements.

- [ ] **Step 2: Fix implementation defects before expectations**

Non-negotiable requirements: no horizontal overflow, complete route visibility, no footer overlap, 44px coarse-pointer targets, readable type floors, safe external attributes, bilingual close, no-JavaScript navigation, and reduced-motion static composition.

- [ ] **Step 3: Capture and inspect fresh screenshots**

Run: npm run test:visual:update

Inspect home-1440-full.png, home-768-full.png, and home-390-full.png for hierarchy, clipping, excessive blank space, and design-system drift. Update geometry expectations only after the implementation matches the approved specification.

- [ ] **Step 4: Re-run the typography scan**

~~~bash
node /Users/zibinzhao/.codex/skills/impeccable/scripts/detect.mjs --json --scope type src
rg -n "font-size:\s*(7|7\.5|8|8\.5|9|10)px" src/components/StitchHero.astro src/components/FeaturedResearch.astro src/components/StitchVibe.astro src/components/StitchVibeCard.astro src/components/StitchFooterDock.astro
~~~

Expected: no unresolved meaningful homepage text below the approved floors. Decorative aria-hidden values may remain and are named as exceptions.

- [ ] **Step 5: Run full verification**

~~~bash
npm run verify
npm run test:browser
git diff --check
~~~

Expected: every command exits 0 with no failures.

---

### Task 5: Commit, merge, push, and verify production

**Files:**
- Stage only this plan/spec, intended source/tests, and intentional refreshed screenshots.

**Interfaces:**
- Consumes: Fully verified feature branch.
- Produces: A commit merged into main, pushed to origin/main, with the live site checked after deployment propagation.

- [ ] **Step 1: Review scope**

Run: git status -sb, git diff --stat, and git diff --check.

Expected: only implementation, tests, plan/spec, and intentional visual artifacts changed.

- [ ] **Step 2: Commit the feature branch**

~~~bash
git add docs/superpowers/specs/2026-07-13-playful-researcher-refinement-design.md docs/superpowers/plans/2026-07-13-playful-researcher-refinement.md src tests artifacts/stitch
git commit -m "feat: refine playful researcher portfolio"
~~~

- [ ] **Step 3: Merge and verify the merged result**

From the main checkout, update main, merge codex/portfolio-refinement, and run npm run verify plus the focused browser suite.

- [ ] **Step 4: Push main**

Run: git push origin main

Expected: origin/main advances to the merged commit.

- [ ] **Step 5: Verify production after propagation**

Confirm the repository public URL returns the new Side Quests/Beyond the lab content and that its mobile page has no fixed footer obstruction.
