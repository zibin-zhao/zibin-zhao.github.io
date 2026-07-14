# Playful Path and Project Categories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Attach text-free hobby badges to the homepage dashed guides, separate research projects from Vibe, refresh two covers and the personal voice, and give the existing coaster a physical speed rhythm.

**Architecture:** Extend the build-time GitHub model with explicit editorial categories, then render focused Research and Vibe collections from separate components. Move hobby visuals into the fixed homepage atmosphere with one scroll-state controller, and isolate the coaster timing curve as a pure tested function. Keep generated art as local optimized PNG assets and preserve Astro’s static rendering.

**Tech Stack:** Astro 6, TypeScript 6, Vitest, Playwright, CSS, Canvas 2D, build-time GitHub REST data, local PNG assets.

## Global Constraints

- Keep the existing roller coaster geometry, drawing, layering, pointer behavior, visibility lifecycle, and reduced-motion behavior.
- Show no visible hobby labels, captions, descriptions, headings, or dedicated hobby section.
- Render hobby badges only on the homepage, attached to both existing dashed guide lines.
- Research Projects contains CASMD, TEMPO, DL-SELEX, Cembra AI, ECG Analysing App, and curated future research repositories.
- Vibe contains only Zen, YAOS, Medit, and Singularity.
- Keep GitHub fetching at build time with an offline fallback and no client-side request.
- Use the established cream, ink green, mint, orange, and pale-blue paper-cut language.
- All DOM badge motion uses only transform and opacity and honors reduced motion.
- Preserve `.impeccable/` and all unrelated user files.

---

### Task 1: Editorial project taxonomy

**Files:**
- Modify: `src/data/github-projects.ts`
- Modify: `src/data/github-projects.fallback.json`
- Modify: `src/data/home.ts`
- Test: `tests/github-projects.test.ts`
- Test: `tests/home-selection.test.ts`

**Interfaces:**
- Produces: `ProjectCategory = 'research' | 'vibe' | 'more'` and `GithubProject.category`.
- Produces: `partitionGithubProjects(projects): { research: GithubProject[]; more: GithubProject[] }`.
- Produces: `HOME_VIBE_TITLES = ['Singularity', 'Medit', 'Yaos', 'Zen']`.

- [ ] **Step 1: Write failing category tests**

Add tests asserting that fallback and remote-normalized `CasMD`, `TEMPO`, `DL-SELEX`, `Cembra_AI`, `DL-SELEX-web-explain`, and `ECG_analysing_app` are `research`; `Yaos` is `vibe`; unknown future repositories are `more`; research order begins `CasMD`, `TEMPO`, `DL-SELEX`; and the homepage Vibe selection excludes CasMD.

- [ ] **Step 2: Verify the tests fail for missing categories**

Run: `npm test -- tests/github-projects.test.ts tests/home-selection.test.ts`

Expected: FAIL because `category`, `partitionGithubProjects`, and the new Vibe order do not exist.

- [ ] **Step 3: Add the minimal taxonomy**

Add `category` to the public interface and fallback JSON. Preserve remote repository names and URLs while filling category from curated fallback metadata:

```ts
export type ProjectCategory = 'research' | 'vibe' | 'more';

export interface GithubProject {
  // existing fields
  category: ProjectCategory;
}

export const partitionGithubProjects = (projects: readonly GithubProject[]) => ({
  research: projects.filter(({ category }) => category === 'research'),
  more: projects.filter(({ category }) => category === 'more'),
});
```

Set `FEATURED_ORDER` to `['CasMD', 'TEMPO', 'DL-SELEX']`, default unknown remote repositories to `more`, and set `HOME_VIBE_TITLES` to the four approved Vibe titles.

- [ ] **Step 4: Verify category tests pass**

Run: `npm test -- tests/github-projects.test.ts tests/home-selection.test.ts`

Expected: PASS.

### Task 2: Separate Research Projects and Vibe presentations

**Files:**
- Create: `src/components/ResearchProjectCard.astro`
- Create: `src/components/StitchResearchProjects.astro`
- Modify: `src/components/StitchVibe.astro`
- Modify: `src/components/StitchVibeCard.astro`
- Modify: `src/components/Projects.astro`
- Modify: `src/pages/index.astro`
- Delete: `src/content/vibe/casmd.md`
- Test: `tests/stitch-foundation.test.ts`
- Test: `tests/github-project-ui.test.ts`
- Test: `tests/preserved-behavior.test.ts`

**Interfaces:**
- Consumes: `partitionGithubProjects()` and `HOME_VIBE_TITLES` from Task 1.
- Produces: `<ResearchProjectCard project image? />` with `data-research-project` and stable optional 16:9 cover.
- Produces: `<StitchResearchProjects />` homepage section outside `#vibe`.

- [ ] **Step 1: Write failing structure tests**

Assert homepage order is `FeaturedResearch`, `StitchResearchProjects`, `StitchVibe`; `StitchVibe` has exactly four authored roles and imports neither GitHub shelf nor hobby constellation; Projects renders non-overlapping Research, Vibe, and More from GitHub groups; and no Vibe source file contains CasMD.

- [ ] **Step 2: Verify the structure tests fail**

Run: `npm test -- tests/stitch-foundation.test.ts tests/github-project-ui.test.ts tests/preserved-behavior.test.ts`

Expected: FAIL because Research Projects is not a separate homepage collection and CasMD is still in Vibe.

- [ ] **Step 3: Build the Research card and homepage collection**

`ResearchProjectCard.astro` renders bilingual descriptions, up to three stack chips, GitHub and optional demo actions, and the CASMD art when `image` is provided:

```astro
<article class="research-project-card" data-research-project={project.name} data-featured={project.featured}>
  {image && <img src={image.src} alt={image.alt} width="1024" height="576" loading="lazy" decoding="async" />}
  <h3>{project.name}</h3>
  <p class="t-en">{project.description}</p>
  <p class="t-zh">{project.descriptionZh}</p>
  <!-- stack and ordinary anchor actions -->
</article>
```

`StitchResearchProjects.astro` fetches once at build time, takes the research partition, and renders CASMD first with `/stitch/casmd-cartoon.png`, followed by TEMPO and the remaining research cards.

- [ ] **Step 4: Simplify Vibe and the complete Projects route**

Remove CasMD, `GithubProjectShelf`, and `StickerConstellation` from Vibe. Keep Singularity, Medit, Yaos, and Zen in an asymmetric four-card mosaic. Rename the section heading to `Vibe / 随性实验`. On `/projects`, render Research cards, the four authored Vibe cards, and only the `more` partition in the final GitHub list.

- [ ] **Step 5: Verify structure tests pass**

Run: `npm test -- tests/stitch-foundation.test.ts tests/github-project-ui.test.ts tests/preserved-behavior.test.ts`

Expected: PASS.

### Task 3: Homepage dashed-guide hobby badges

**Files:**
- Create: `src/components/PathBadges.astro`
- Create: `src/scripts/path-badges.ts`
- Modify: `src/components/StitchAtmosphere.astro`
- Modify: `src/layouts/StitchShell.astro`
- Delete: `src/components/StickerConstellation.astro`
- Delete: `src/scripts/sticker-motion.ts`
- Test: `tests/sticker-constellation.test.ts`
- Test: `tests/stitch-foundation.test.ts`

**Interfaces:**
- Produces: `<PathBadges />` with seven `data-path-badge` visuals, `data-guide="left|right"`, and one visually hidden interests list.
- Produces: one page-lifecycle-safe scroll controller that activates no more than two desktop badges or one mobile badge.

- [ ] **Step 1: Replace legacy tests with failing path-badge contracts**

Assert `StitchShell` passes `home` into `StitchAtmosphere`; only home renders PathBadges; seven images have empty visual alt text inside an `aria-hidden` layer; the hidden bilingual list contains all interests; no figcaption or visible label exists; and the script uses one scheduled animation frame with scroll, resize, Astro swap, pagehide, and reduced-motion cleanup.

- [ ] **Step 2: Verify the badge tests fail**

Run: `npm test -- tests/sticker-constellation.test.ts tests/stitch-foundation.test.ts`

Expected: FAIL because the old dedicated constellation still exists.

- [ ] **Step 3: Build the fixed badge layer**

Use the existing seven PNGs and authored centers `[0.06, 0.20, 0.35, 0.50, 0.65, 0.80, 0.94]`. Alternate guides and use per-badge CSS variables for size, viewport top, and tilt. The controller computes normalized document progress, selects the nearest one on widths at or below 700px and nearest two above 700px, then sets `data-visible="true|false"`. The visual wrapper stays pointer-free and behind `.stitch-main`.

- [ ] **Step 4: Add accessible names without visible copy**

Render one `.sr-only` bilingual list containing DNA and AI, music, Chinese calligraphy, reading, psychology, meditation and Buddhism, and coding experiments. Keep visual images decorative to avoid duplicated announcements.

- [ ] **Step 5: Verify the badge tests pass**

Run: `npm test -- tests/sticker-constellation.test.ts tests/stitch-foundation.test.ts`

Expected: PASS.

### Task 4: Physical coaster timing

**Files:**
- Modify: `src/lib/coaster-path.ts`
- Modify: `src/scripts/coaster.ts`
- Test: `tests/coaster-path.test.ts`
- Test: `tests/coaster-atmosphere.test.ts`

**Interfaces:**
- Produces: `coasterMotionProgress(linearProgress: number): number`.
- Consumes: existing `wrapProgress()` and the unchanged 22-second controller loop.

- [ ] **Step 1: Write failing timing tests**

Sample `coasterMotionProgress()` at 2,000 points and assert wrapped range `[0, 1)`, strict monotonicity within a cycle, loop continuity, a sampled derivative above `0.45`, a sampled maximum above `1.6`, and visible variation between minimum and maximum speed. Assert the controller calls the new timing function.

- [ ] **Step 2: Verify the timing tests fail**

Run: `npm test -- tests/coaster-path.test.ts tests/coaster-atmosphere.test.ts`

Expected: FAIL because the timing function is not exported or used.

- [ ] **Step 3: Implement the continuous periodic timing curve**

Use the integral of a positive periodic speed curve so position and speed both join seamlessly:

```ts
const TAU = Math.PI * 2;
const PRIMARY_SWING = .45;
const SECONDARY_SWING = .3;
const SECONDARY_PHASE = 4.2;

export const coasterMotionProgress = (linearProgress: number): number => {
  const time = wrapProgress(linearProgress);
  const primary = -(PRIMARY_SWING / TAU) * (Math.cos(TAU * time) - 1);
  const secondary = -(SECONDARY_SWING / (TAU * 2))
    * (Math.cos((TAU * 2 * time) + SECONDARY_PHASE) - Math.cos(SECONDARY_PHASE));
  return time + primary + secondary;
};
```

Apply it only where elapsed time becomes train progress. Do not change track samples, train rendering, parking, pause/resume, or canvas configuration.

- [ ] **Step 4: Verify timing tests pass**

Run: `npm test -- tests/coaster-path.test.ts tests/coaster-atmosphere.test.ts`

Expected: PASS.

### Task 5: Warm personal voice, one-entry experience, and AI skill

**Files:**
- Modify: `src/components/About.astro`
- Modify: `src/components/CvTimeline.astro`
- Modify: `src/data/cv.ts`
- Modify: `src/data/profile.ts`
- Modify: `src/layouts/Base.astro`
- Test: `tests/routes.test.ts`
- Test: `tests/playful-researcher-refinement.test.ts`

**Interfaces:**
- Produces: visible timeline with one `PhD @ HKUST` entry.
- Produces: `cv.skills` beginning with `AI` alongside existing engineering skills.

- [ ] **Step 1: Write failing copy and CV tests**

Assert the visible timeline maps only `cv.education[0]`, renders `PhD @ HKUST`, and omits candidate/co-founder/leadership wording. Assert `AI` is in the core skill array. Assert story/profile copy includes building random useful and unnecessary things, trains, games, design, AI, biology, and `doing a PhD at HKUST`, with no `PhD candidate` phrase in About, profile, or Base metadata.

- [ ] **Step 2: Verify the copy tests fail**

Run: `npm test -- tests/routes.test.ts tests/playful-researcher-refinement.test.ts`

Expected: FAIL on the old formal dossier, five-entry timeline, and missing AI skill.

- [ ] **Step 3: Apply the approved voice and factual metadata**

Use the approved English story verbatim and a warm Chinese adaptation. Change the dossier code to `CURIOSITY FILE / ACTIVE`. Update tagline/value proposition to curious-builder language while keeping AI, biology, and diagnostics discoverable. Use `PhD Researcher in Bioengineering` for structured metadata and avoid wording that implies completion.

- [ ] **Step 4: Simplify the timeline and add AI**

Render only the first education item with the visible heading `PhD @ HKUST / 博士研究 @ 香港科技大学`; keep the complete CV data and PDF intact. Set skills to `['AI', 'Python', 'C', 'MATLAB', 'LabVIEW', 'SolidWorks']`.

- [ ] **Step 5: Verify copy and CV tests pass**

Run: `npm test -- tests/routes.test.ts tests/playful-researcher-refinement.test.ts`

Expected: PASS.

### Task 6: Cohesive CASMD and Singularity covers

**Files:**
- Create: `public/stitch/casmd-cartoon.png`
- Create: `public/stitch/singularity-cartoon.png`
- Modify: `src/components/StitchResearchProjects.astro`
- Modify: `src/components/StitchVibe.astro`
- Test: `tests/tooling.test.ts`
- Test: `tests/github-project-ui.test.ts`

**Interfaces:**
- Produces: local opaque PNG covers at 1024×576 and 1024×768.

- [ ] **Step 1: Write failing asset-reference tests**

Assert the Research section references `/stitch/casmd-cartoon.png`, Vibe references `/stitch/singularity-cartoon.png`, both files exist with non-empty PNG payloads, and the old cover paths are not rendered.

- [ ] **Step 2: Verify the asset tests fail**

Run: `npm test -- tests/tooling.test.ts tests/github-project-ui.test.ts`

Expected: FAIL because the new files do not exist and components still reference old art.

- [ ] **Step 3: Generate and optimize both covers**

Use the current covers only as subject references and the existing `dna-ai.png` and `coding-lab.png` as style references. Generate flat, text-free, hand-drawn covers with thick ink-green outlines, cream paper, mint, orange, pale blue, and subtle printed texture. Inspect the outputs, crop with ImageMagick to the exact dimensions, and strip metadata.

- [ ] **Step 4: Wire the new assets and verify**

Run: `npm test -- tests/tooling.test.ts tests/github-project-ui.test.ts`

Expected: PASS.

### Task 7: Responsive browser verification and cleanup

**Files:**
- Modify: `tests/browser/homepage.spec.ts`
- Modify: `tests/browser/routes.spec.ts`
- Modify: `tests/browser/language-accessibility.spec.ts`
- Modify: `tests/e2e/stitch.spec.ts`
- Modify: `docs/quality-gates.md` only if the existing command list is stale

**Interfaces:**
- Consumes: all rendered components and motion contracts from Tasks 1–6.

- [ ] **Step 1: Update browser expectations before production fixes**

Assert separate homepage Research and Vibe regions, correct membership and no duplication, route categories, one-entry CV, AI skill, hidden badge accessibility, desktop maximum two badges, mobile maximum one, reduced-motion static badge geometry, and the existing singular pointer-free coaster canvas.

- [ ] **Step 2: Run targeted browser tests and observe failures**

Run: `npm run build && npm run test:browser -- tests/browser/homepage.spec.ts tests/browser/routes.spec.ts tests/browser/language-accessibility.spec.ts tests/e2e/stitch.spec.ts`

Expected: any remaining failures identify responsive or lifecycle mismatches in the new implementation.

- [ ] **Step 3: Make only the CSS/testability fixes required by those failures**

Keep 44px action targets, no horizontal overflow at 1440, 768, 390, and 320px, readable bilingual copy, opaque card surfaces, and pointer-free background layers. Do not alter the approved categories or coaster geometry to satisfy a snapshot.

- [ ] **Step 4: Run the complete verification gate**

Run: `npm run lint && npm run check && npm test && GITHUB_PROJECTS_OFFLINE=1 npm run build && npm run test:browser && git diff --check`

Expected: all commands exit 0 with no test failures, type errors, lint errors, overflow failures, or diff whitespace errors.

- [ ] **Step 5: Inspect final visuals and commit**

Inspect fresh full-page desktop, tablet, and mobile screenshots for badge/card collisions, hierarchy, cover cohesion, and motion density. Stage only the approved implementation, tests, plan, and generated covers. Leave `.impeccable/` untouched. Commit with `feat: refine playful project journey`.
