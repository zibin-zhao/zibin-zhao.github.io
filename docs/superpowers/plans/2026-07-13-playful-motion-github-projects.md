# Playful Motion and GitHub Projects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task by task, `test-driven-development` for every behavior change, and `verification-before-completion` before claiming success.

**Goal:** Replace the Beyond the Lab panel with original animated stickers, add a subtle fixed roller-coaster atmosphere, and populate project surfaces from normalized build-time GitHub data while preserving the portfolio's bilingual, accessible Stitch design.

**Architecture:** A pure TypeScript GitHub normalization layer fetches at Astro build time and falls back to a committed snapshot. Astro components consume the same `GithubProject[]` for the homepage shelf and Projects route. Sticker motion is CSS-led with one small shared parallax controller. The coaster uses a single decorative canvas, a pre-rendered track, pre-sampled path points, and one visibility-aware animation loop.

**Tech Stack:** Astro 6, TypeScript, CSS, Canvas 2D, Vitest, Playwright, GitHub REST API, built-in image generation.

## Global Constraints

- Work only in `/Users/zibinzhao/Desktop/Projects/personal_webpage/.worktrees/playful-motion-projects` until integration.
- Preserve unrelated user work and do not stage the root worktree's `.impeccable/` directory.
- Use `apply_patch` for source and documentation edits.
- Keep the website functional with JavaScript disabled and when GitHub is unavailable.
- Generate raster stickers with the built-in image generator; do not hand-draw SVG substitutes.
- Do not start a client-side GitHub request, animation library, WebGL context, audio, or rigid-body simulation.
- Every behavioral task starts with a failing targeted test and ends with that test passing.

---

## Task 1: Normalize GitHub projects at build time

**Files:**

- Create: `src/data/github-projects.ts`
- Create: `src/data/github-projects.fallback.json`
- Create: `tests/github-projects.test.ts`

### Step 1: Write failing normalization tests

Cover these cases with an injected `fetch` stub:

- Exclude forks, archived repositories, disabled repositories, `zibin-zhao.github.io`, and `handle_mutation`.
- Include an unknown future owned repository that passes the filters.
- Sort featured repositories as CasMD, DL-SELEX, Yaos, then sort the remainder by `updatedAt` descending.
- Convert language byte counts into at most three ordered stack labels, then add non-duplicate topics.
- Use the primary language when a language enrichment request fails.
- Preserve the remote repository list when only enrichment requests fail.
- Return the complete fallback snapshot when the list request fails.
- Fill missing descriptions, Chinese descriptions, demos, and featured flags from curated overrides.

Run: `npm test -- tests/github-projects.test.ts`

Expected: FAIL because the loader and fallback snapshot do not exist.

### Step 2: Commit the fallback snapshot

Add the seven approved repositories with deterministic names, descriptions, Chinese descriptions, GitHub URLs, verified homepages, primary stack labels, update dates, and featured flags. Keep the JSON free of secrets and API-only fields.

### Step 3: Implement the loader

Export:

```ts
export interface GithubProject {
  name: string;
  description: string;
  descriptionZh: string;
  githubUrl: string;
  demoUrl?: string;
  stack: string[];
  updatedAt: string;
  featured: boolean;
}

export async function getGithubProjects(options?: {
  fetch?: typeof globalThis.fetch;
  token?: string;
}): Promise<GithubProject[]>;
```

Use GitHub's owned-repository list endpoint and per-repository languages endpoint. Apply explicit timeouts, stable headers, optional bearer authentication, schema guards, and the documented fallback behavior. Do not log the token or fail the build for a network/rate-limit problem.

### Step 4: Make the tests pass

Run: `npm test -- tests/github-projects.test.ts`

Expected: PASS.

### Step 5: Commit

```bash
git add src/data/github-projects.ts src/data/github-projects.fallback.json tests/github-projects.test.ts
git commit -m "feat: normalize GitHub projects at build time"
```

---

## Task 2: Render the repository shelf and complete Projects route

**Files:**

- Create: `src/components/GithubProjectCard.astro`
- Create: `src/components/GithubProjectShelf.astro`
- Modify: `src/components/StitchVibe.astro`
- Modify: `src/components/StitchVibeCard.astro`
- Modify: `src/components/Projects.astro`
- Modify: `src/pages/projects.astro` only if the normalized data must be passed at the route boundary
- Modify: `src/content/vibe/casmd.md`
- Modify: `src/content/vibe/yaos.md`
- Create: `tests/github-project-ui.test.ts`
- Modify: `tests/stitch-foundation.test.ts`
- Modify: `tests/playful-researcher-refinement.test.ts`
- Modify: `tests/preserved-behavior.test.ts` only where the old manual-project contract is intentionally replaced

### Step 1: Write failing source-contract tests

Assert that:

- Both project surfaces call `getGithubProjects()` from the same module.
- The homepage shelf omits CasMD and Yaos and renders the other five current approved repositories.
- The Projects route renders all seven current approved repositories.
- GitHub cards include bilingual descriptions, stack chips, a GitHub anchor, optional demo anchor, featured treatment, and safe external-link attributes.
- CasMD and Yaos authored cards expose separate GitHub and live-demo actions.
- The old manually maintained project collection is no longer the source for `Projects.astro`.

Run: `npm test -- tests/github-project-ui.test.ts tests/stitch-foundation.test.ts tests/playful-researcher-refinement.test.ts tests/preserved-behavior.test.ts`

Expected: FAIL on the new contracts and the intentionally stale Beyond/manual-project expectations.

### Step 2: Build the shared project card and shelf

Create a semantic article card with `data-github-project`, an optional `data-featured` flag, language-aware description spans, compact stack chips, and separate 44px GitHub/demo anchors. Use the existing paper, ink, mint, blue, and orange tokens; preserve visible `:focus-visible` paint.

Create a shelf component that accepts normalized projects, removes CasMD and Yaos by repository name, and renders a two-column desktop/one-column mobile field-notes grid.

### Step 3: Integrate homepage actions and shelf

Extend `StitchVibeCard.astro` without breaking the card's primary stretched link. Ensure secondary links sit above it and remain separately focusable. Supply the verified GitHub and demo destinations for CasMD and Yaos. Place `GithubProjectShelf` after the five-card mosaic and before the sticker region placeholder.

### Step 4: Replace the Projects data source

Have `Projects.astro` load and render the normalized list. Featured entries receive a star label and stronger grid span without changing document order. Remove only imports and assumptions tied to the old project collection; keep legacy content files unless a later cleanup task explicitly authorizes deletion.

### Step 5: Make source-contract tests pass

Run the command from Step 1.

Expected: PASS.

### Step 6: Commit

```bash
git add src/components/GithubProjectCard.astro src/components/GithubProjectShelf.astro src/components/StitchVibe.astro src/components/StitchVibeCard.astro src/components/Projects.astro src/pages/projects.astro src/content/vibe/casmd.md src/content/vibe/yaos.md tests
git commit -m "feat: expand portfolio projects from GitHub"
```

---

## Task 3: Generate and prepare seven original sticker assets

**Files:**

- Create: `public/stickers/dna-ai.png`
- Create: `public/stickers/instruments.png`
- Create: `public/stickers/calligraphy.png`
- Create: `public/stickers/reading.png`
- Create: `public/stickers/psychology.png`
- Create: `public/stickers/meditation.png`
- Create: `public/stickers/coding-lab.png`

### Step 1: Define one consistent prompt system

Use one shared art direction in every prompt: original editorial cartoon sticker, thick dark-green ink outlines, tactile cream paper-cut edge, sparse screen-print texture, mint/orange/pale-blue palette, isolated centered composition, no text, no logo, no watermark, flat `#ff00ff` chroma background, no shadows touching the canvas border.

Vary only the subject and composition for the seven approved themes. Generate one subject per call so each file can be placed and animated independently.

### Step 2: Generate with the built-in image tool

For every output, record the local generated path and copy the project-bound source into a temporary working location outside `public/stickers/` until transparency is verified.

### Step 3: Remove chroma backgrounds

Run the skill helper for every generated image:

```bash
python ~/.codex/skills/.system/imagegen/scripts/remove_chroma_key.py INPUT OUTPUT --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill
```

Write final transparent PNGs to the exact `public/stickers/` paths above.

### Step 4: Inspect and validate

Use image inspection on every final PNG. Check subject integrity, transparent corners, clean edges, palette consistency, no embedded text/watermark, and enough breathing room for CSS transforms. Verify dimensions and alpha-channel presence from the command line.

If an asset fails, regenerate that subject; do not repair the illustration by drawing replacement content in code.

### Step 5: Commit

```bash
git add public/stickers
git commit -m "feat: add playful researcher sticker set"
```

---

## Task 4: Replace Beyond the Lab with the sticker constellation

**Files:**

- Create: `src/components/StickerConstellation.astro`
- Create: `src/scripts/sticker-motion.ts`
- Modify: `src/components/StitchVibe.astro`
- Modify: `src/styles/stitch-motion.css`
- Create: `tests/sticker-constellation.test.ts`
- Modify: `tests/browser/language-accessibility.spec.ts`
- Modify: `tests/e2e/stitch.spec.ts`

### Step 1: Write failing sticker contract tests

Assert that:

- `StitchVibe.astro` no longer contains `.beyond-lab`, `Beyond the lab`, or the old interest-group markup.
- Exactly seven sticker figures point to project-local PNG files and provide useful English alt text.
- Every sticker has English and Chinese physical captions.
- Nested reveal/parallax and drift wrappers are present.
- The motion module uses one `requestAnimationFrame` update path and does not set layout properties.
- Reduced-motion CSS disables reveal, parallax, hover, and idle keyframes.

Run: `npm test -- tests/sticker-constellation.test.ts tests/stitch-foundation.test.ts tests/playful-researcher-refinement.test.ts`

Expected: FAIL because the old panel remains and the constellation does not exist.

### Step 2: Build the semantic constellation

Render a normal-flow `<section>` with seven `<figure>` elements, explicit image dimensions, `loading="lazy"`, `decoding="async"`, bilingual captions, and per-item CSS custom properties for depth, angle, duration, and delay. Avoid a visible “Beyond the Lab” heading; provide an accessible section label.

### Step 3: Add restrained motion

Use IntersectionObserver to add the reveal state once. Use one passive scroll listener, one queued animation frame, and one shared CSS property for parallax. Clamp authored movement to 12px. Idle drift uses transform only and remains within 8px. Do not create per-sticker scroll listeners.

### Step 4: Integrate and remove old styles

Insert the constellation after `GithubProjectShelf`. Delete obsolete panel markup/styles. Add responsive authored placements that remain in normal flow at 1440, 768, 390, and 320px. Ensure no caption/image overlap and no horizontal overflow.

### Step 5: Add browser coverage

Verify alt text, language switching, useful captions, reduced-motion resting geometry, and no overflow. Update stale visual-geometry assertions to target the new shelf/constellation composition rather than deleted Beyond markup.

### Step 6: Run targeted tests and commit

```bash
npm test -- tests/sticker-constellation.test.ts tests/stitch-foundation.test.ts tests/playful-researcher-refinement.test.ts
npx playwright test tests/browser/language-accessibility.spec.ts tests/e2e/stitch.spec.ts --project=mobile --grep "sticker|reduced motion|overflow"
git add src/components/StickerConstellation.astro src/components/StitchVibe.astro src/scripts/sticker-motion.ts src/styles/stitch-motion.css tests
git commit -m "feat: replace beyond panel with sticker constellation"
```

Expected: targeted tests PASS.

---

## Task 5: Add the responsive roller-coaster atmosphere

**Files:**

- Create: `src/lib/coaster-path.ts`
- Create: `src/scripts/coaster.ts`
- Create: `src/components/RollerCoasterAtmosphere.astro`
- Modify: `src/components/StitchAtmosphere.astro`
- Modify: `src/layouts/StitchShell.astro` only if the atmosphere's stacking boundary requires it
- Create: `tests/coaster-path.test.ts`
- Create: `tests/coaster-atmosphere.test.ts`
- Modify: `tests/e2e/stitch.spec.ts`

### Step 1: Write failing path unit tests

Test pure helpers for:

- A sampled vertical S-curve starts above and ends below the viewport.
- Progress wraps cleanly from values below zero or above one.
- `pointAtProgress` returns finite coordinates and tangent angles at the endpoints and midpoint.
- Train car offsets remain on the sampled path.
- Mobile configuration uses one car/fewer sleepers and desktop uses two cars.

Run: `npm test -- tests/coaster-path.test.ts`

Expected: FAIL because the helper does not exist.

### Step 2: Implement pure path geometry

Keep browser globals out of `coaster-path.ts`. Export typed configuration and sampling helpers that can be covered deterministically in Vitest.

### Step 3: Write failing atmosphere contract tests

Assert that the component renders one fixed, pointer-free, `aria-hidden` canvas; imports one controller; caps device-pixel ratio at 1.5; uses an offscreen canvas; respects `visibilitychange`; and does not start requestAnimationFrame under reduced motion.

### Step 4: Implement the canvas controller

Pre-render track rails/sleepers into the offscreen buffer on resize. On each normal-motion frame, copy the buffer and draw the train at the sampled progress. Use a 22-second duration, pause on hidden documents, resume without a time jump, and clean up listeners/frames during Astro page lifecycle events. Park the train when reduced motion is active.

Expose a small `data-motion-state` value (`running`, `paused`, or `reduced`) on the canvas for browser verification; do not expose internal timing APIs globally.

### Step 5: Integrate the stacking layer

Place the canvas behind readable content and above the graph-paper layer. Retain the existing atmosphere as the fallback. Apply desktop and mobile opacity/car/sleeper settings without making the track a foreground border.

### Step 6: Add browser coverage

Verify one canvas, `pointer-events: none`, reduced-motion static state, normal-motion running state, pause/resume on visibility changes, no duplicate loops after navigation, and unchanged pointer interaction on representative links.

### Step 7: Run targeted tests and commit

```bash
npm test -- tests/coaster-path.test.ts tests/coaster-atmosphere.test.ts
npx playwright test tests/e2e/stitch.spec.ts --project=desktop --grep "coaster|reduced motion|pointer"
git add src/lib/coaster-path.ts src/scripts/coaster.ts src/components/RollerCoasterAtmosphere.astro src/components/StitchAtmosphere.astro src/layouts/StitchShell.astro tests
git commit -m "feat: add subtle roller coaster atmosphere"
```

Expected: targeted tests PASS.

---

## Task 6: Verify integration, responsive visuals, and production build

**Files:**

- Modify: `tests/browser/homepage.spec.ts`
- Modify: `tests/browser/routes.spec.ts`
- Modify: `tests/e2e/stitch.spec.ts`
- Update: deterministic visual artifacts produced by `npm run test:visual:update`
- Modify: `.github/workflows/deploy.yml` if and only if the build does not already receive `GITHUB_TOKEN`
- Modify: `README.md` or project docs only if the build-time data behavior needs operator documentation

### Step 1: Add end-to-end repository assertions

Cover:

- Five authored Side Quest cards plus five non-duplicated shelf cards on the homepage.
- All seven normalized repositories on `/projects/` in the approved order.
- Verified GitHub/demo destinations and safe external-link attributes.
- No-JavaScript navigation and project anchors.
- No horizontal overflow/footer collision at 1440, 768, 390, and 320px.

### Step 2: Verify build credentials without coupling local builds to a token

Inspect `.github/workflows/deploy.yml`. Pass `${{ secrets.GITHUB_TOKEN }}` as a build environment value only if it is absent. Confirm the fallback still allows `npm run build` with no token and no network.

### Step 3: Run the full verification suite

```bash
npm run verify
npm run test:browser
git diff --check
```

Expected: lint, Astro checks, all Vitest tests, production build, and the full Playwright matrix PASS.

### Step 4: Update and inspect visual artifacts

Run:

```bash
npm run test:visual:update
```

Inspect the full homepage and affected Vibe/Projects captures at desktop, tablet, and mobile widths. Check hierarchy, contrast, sticker edge quality, caption collisions, coaster restraint, footer clearance, and motion density. If the track competes with text, lower opacity before changing content surfaces.

### Step 5: Request code review and address only verified issues

Use the `requesting-code-review` skill after the suite is green. Review the final diff for fallback correctness, secret handling, duplicated animation loops, focus order, semantic labeling, and accidental deletion of unrelated work. Re-run affected tests after each correction.

### Step 6: Commit the verified integration

```bash
git add .github/workflows/deploy.yml src public/stickers tests docs
git commit -m "feat: make the portfolio more playful and project-rich"
git status --short --branch
```

Expected: a clean feature branch except for intentional ignored files.

---

## Task 7: Integrate, publish, and verify production

### Step 1: Re-check main before integration

Confirm `main` and `origin/main` have not advanced unexpectedly and that the root worktree contains no overlapping user edits. Do not include `.impeccable/`.

### Step 2: Merge the feature branch

From the root worktree, merge `codex/playful-motion-projects` into `main` without rewriting user history. Resolve only scoped conflicts, then run `npm run verify` on the merged tree.

### Step 3: Push main

Following `AGENTS.md`, push `main` to `origin` after the successful merge.

### Step 4: Verify deployment and live site

Watch the GitHub Pages deployment to completion. After propagation, load `https://zibinzhao.com/` and `https://zibinzhao.com/projects/`. Verify the seven project entries, local sticker assets, coaster canvas, navigation, and absence of console/network errors on desktop and mobile widths.

### Step 5: Report the exact result

Report the merge commit, pushed branch, test totals, deployment result, and live URLs. If deployment or propagation fails, report the observed failure and keep investigating within the authorized scope.
