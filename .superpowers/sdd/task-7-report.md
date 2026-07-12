# Task 7 Report: Prompts Stitch Shell

## Result

Moved `/prompts/` from its page-specific `Base` wrapper into `StitchShell active="prompts"` and `IndexSheet`. `StitchShell` remains the sole owner of `main#main-content`; the built route contains exactly one main, one h1, eight stage h2s, and one discipline h2.

`src/data/prompts.ts` is unchanged. The rendered archive preserves all 8 stages, 11 prompt blocks, 4 notes, the single after-note, and all 3 discipline items. The `.copy`, `.ptext`, `.stagenav`, and `.stage` hooks remain intact.

Clipboard enhancement preserves `navigator.clipboard.writeText` as the primary path and `document.execCommand('copy')` as fallback. Copied state now updates the accessible button label and a polite live region while retaining keyboard activation and the existing visible state. Scroll-spy is guarded when `IntersectionObserver` is unavailable, exposes `aria-current="location"`, and defers intermediate observer updates during deliberate stage navigation. Stage scroll margins clear the sticky shell/nav; no-JS retains every prompt and ordinary anchor.

The footer draw control retains its exact route and motion while exposing `aria-current="page"` on `/prompts/`.

## RED / GREEN

RED command:

`npm test -- tests/routes.test.ts tests/stitch-foundation.test.ts tests/preserved-behavior.test.ts`

- Result: 4 expected failures, 25 passing assertions.
- Causes: Prompts still used `Base`, lacked `IndexSheet`, had an unguarded observer, and the draw route lacked current-page semantics.

GREEN commands:

- `npm test -- tests/routes.test.ts tests/stitch-foundation.test.ts tests/preserved-behavior.test.ts`: 29/29 passed.
- `npx playwright test tests/browser/prompts.spec.ts`: 8/8 passed.

The first full Playwright run found one test-only issue: the legacy homepage locator searched for the old copy-button accessible name after the button correctly changed it to “Copied to clipboard.” Switching that assertion to the stable preserved `.copy` hook made the focused regression pass 1/1, then the full suite pass 29/29.

## Browser and accessibility evidence

The Prompts browser suite proves:

- HTTP 200; one `main#main-content`; one h1; 8 stage sections/h2s plus the discipline h2.
- Exact data-derived stage IDs/titles, 11 prompt texts, labels, notes, after-note, and discipline items.
- Eight ordinary stage hrefs, keyboard navigation, visible focus, active semantics, fixed-header clearance, and deliberate-click stability.
- Keyboard primary clipboard success; forced primary rejection invoking `execCommand('copy')`; visible and polite announced copied state.
- No runtime errors without `IntersectionObserver`; all content, navigation, and copying remain usable.
- No-JS preservation of all prompt content, stage links, page return, six footer routes, and draw link.
- 390px horizontal-overflow protection and fixed-dock clearance at the page end.
- Exact normal and reduced-motion draw-control resting/hover geometry remains unchanged.
- Full-suite console/pageerror, heading-order, focus, route, archive, and motion checks remain green.

## Visual inspection

Delayed full-page screenshots were captured and inspected after the authored entrance animation:

- `test-results/task7-prompts-768.png`
- `test-results/task7-prompts-390.png`

Both show the complete cream physical Index Sheet, mono metadata, numbered sticky strip, bordered/shadowed prompt cards, orange stage numbers, green discipline panel, and ordinary return control. The 768px composition retains restrained archive rotation; the 390px view resolves to a readable single column with wrapped prompt text and no clipping. The local in-app browser backend was unavailable, so the project Playwright Chromium runner produced the visual artifacts and geometry evidence.

## Full gate

Fresh commands:

- `npx playwright test`: 29/29 passed.
- `npm run lint && npm run check && npm test && npm run build`: passed.
- ESLint: 0 errors.
- Astro check: 0 errors, 0 warnings, 1 intentional `document.execCommand` deprecation hint.
- Vitest: 44/44 passed across 6 files.
- Build: 7 static pages generated, including `/prompts/`.
- Built Prompts audit: 1 main, 1 h1, 9 h2s, 8 stage cards, 11 prompt blocks.
- `git diff --check`: passed.

## Files

Created:

- `.superpowers/sdd/task-7-report.md`
- `tests/browser/prompts.spec.ts`

Modified:

- `src/pages/prompts.astro`
- `src/components/PromptBlock.astro`
- `src/components/StitchFooterDock.astro`
- `tests/routes.test.ts`
- `tests/stitch-foundation.test.ts`
- `tests/preserved-behavior.test.ts`
- `tests/browser/homepage.spec.ts`

## Self-review and concerns

`promptPack` has no diff, `package.json` has no diff, and no runtime dependency was introduced. Homepage and every Index Sheet route remain covered by the full suites. The pre-existing Task 6 report edit remains unstaged and outside this task.

No implementation blocker or content ambiguity remains. The sole retained diagnostic is the required `execCommand` deprecation hint; removing it would violate the specified fallback behavior.
