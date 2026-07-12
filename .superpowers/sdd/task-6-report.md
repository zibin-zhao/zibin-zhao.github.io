# Task 6 Report: Index Sheet Routes

## Result

Created `/about/`, `/projects/`, `/cv/`, and `/contact/` and retained `/research/` as complete Index Sheet routes. Every route uses `StitchShell`, `IndexSheet`, and its canonical renderer. Page files contain no copied collection or profile data.

Exact route mapping:

| Route | Sheet | Bilingual title | Active key | Renderer |
| --- | --- | --- | --- | --- |
| `/about/` | 01 | About / 关于 | `about` | `About` |
| `/research/` | 02 | Research & Publications / 研究与论文 | `research` | `PubList` |
| `/projects/` | 03 | Projects / 项目 | `projects` | `Projects` |
| `/cv/` | 05 | CV / 简历 | `cv` | `CvTimeline` |
| `/contact/` | 06 | Contact / 联系 | `contact` | `Contact` |

## Completeness invariants

- About: 4/4 focus identities.
- Research: 9/9 publication identities, including all authors, venues, years, featured state, and 8 canonical outbound links.
- Projects: 4/4 records and links: CasMD, DL-SELEX, TEMPO, ECG App.
- CV: 5/5 entries, 6/6 English notes with bilingual counterparts, 5/5 skills, and `/cv.pdf` download.
- Contact: canonical email, 5/5 social links, and 7/7 contact index links.
- No renderer uses truncating `slice()` or a featured-only route filter.

## RED / GREEN

RED command: `npm test -- tests/routes.test.ts`

- Result: 6 expected failures.
- Causes: four routes did not exist, About had no observable focus identity marker, and the first Research shell-title contract was over-specific.
- The Research contract was corrected before implementation: the existing approved document title is `Research — Zibin Zhao`; `Research & Publications` is the Index Sheet h1.

GREEN commands:

- `npm test -- tests/routes.test.ts tests/pubs.test.ts`: 12/12 passed.
- `npx playwright test tests/browser/routes.spec.ts`: 9/9 passed.

Browser coverage proves five HTTP 200 responses, one main h1, no skipped heading levels, correct active route, bilingual switching, English no-JS anchors, exact rendered identity arrays, exact outbound href arrays with external `target`/`rel`, Contact links, `/cv.pdf` download/HTTP 200, 390px overflow protection, fixed-dock clearance, and no console/page errors.

### Reviewer-gap hardening

The initial browser suite asserted marker counts but its publication/project safety loops did not first prove exact nonzero link sets. The strengthened suite now compares the live DOM with authoritative arrays for:

- all 4 About focus identities;
- all 9 publications in deterministic rendered order, including title, year, venue, authors, and visible featured state;
- all 4 project identities and canonical hrefs;
- all 5 CV entry identities and all 5 skills;
- the canonical Contact email, all 5 social identities/hrefs, and all 7 index identities/hrefs;
- exactly 8 publication hrefs and 4 project hrefs, with `_blank` and `noopener noreferrer` on every known element.

Hardening RED command: `npx playwright test tests/browser/routes.spec.ts --grep '/about/'`

- Deliberately filtered the rendered About locator to omit `Diagnostics` without changing production code.
- Result: expected 4 exact identities, received 3. The focused test failed at the new exact-count assertion.
- Restored the full locator, then `npx playwright test tests/browser/routes.spec.ts` passed 9/9.

## Visual inspection

Production-build screenshots are in `test-results/task6-visual/`:

- `about-768.png`, `about-390.png`
- `research-768.png`, `research-390.png`
- `projects-768.png`, `projects-390.png`
- `cv-768.png`, `cv-390.png`
- `contact-768.png`, `contact-390.png`

All ten views were inspected. The first pass exposed duplicate inherited Section banners; they were removed visually while retaining an accessible h2 bridge beneath each Index Sheet h1. Final views retain clear Anton hierarchy, Space Grotesk body copy, mono metadata, cream physical sheets, 2px ink/dashed rules, 4px/6px block shadows, bounded rotation, single-column mobile layouts, readable links, and no horizontal clipping. The fixed dock does not cover final content at scroll end.

## Full gate

Command: `npm run lint && npm run check && npm test && npm run build && npm run test:browser`

- ESLint: passed.
- Astro check: 0 errors, 0 warnings, 1 existing deprecation hint for the intentionally preserved `document.execCommand('copy')` fallback in Prompts.
- Vitest: 41/41 passed across 6 files.
- Build: 7 static pages generated, including all five Index Sheet routes.
- Playwright: 21/21 passed, including all homepage Stitch composition/motion gates and the strengthened route suite.

## Files

Created:

- `src/pages/about.astro`
- `src/pages/projects.astro`
- `src/pages/cv.astro`
- `src/pages/contact.astro`
- `tests/routes.test.ts`
- `tests/browser/routes.spec.ts`

Modified:

- `src/components/Section.astro`
- `src/components/IndexSheet.astro`
- `src/components/About.astro`
- `src/components/PubList.astro`
- `src/components/ProjectCard.astro`
- `src/components/CvTimeline.astro`
- `src/components/Contact.astro`

## Concerns

No Task 6 blocker or data ambiguity remains. The sole diagnostic note is the pre-existing Prompts clipboard fallback deprecation hint, which is protected by existing behavior contracts and is outside this task.
