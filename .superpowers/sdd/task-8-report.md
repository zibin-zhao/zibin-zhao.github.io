# Task 8 Report — Retained Browser Verification and `screen.png` Refinement

## Outcome

- Playwright now runs the production build plus Astro preview on dedicated `127.0.0.1:43217`; the dev server is not used for final browser verification.
- The 33 existing `tests/browser/*.spec.ts` tests remain intact and run exactly once in `regression`.
- `tests/e2e/stitch.spec.ts` runs only in `canonical-768`, `desktop`, and `mobile`. Final inventory: 78 discovered, 74 passed, 4 intentional project-specific skips.
- All seven routes return 200 with one `h1`, semantic shell landmarks, no duplicate IDs, no console/page errors, no horizontal overflow, visible fixed controls, and end content clear of the runtime dock.
- Canonical homepage density was refined from a 3716px runtime document to 2157–2178px during final measurement. The review artifact is exactly 768×2079, matching the normalized 591×1600 source ratio while keeping the runtime footer fixed.

## RED / GREEN

1. RED: the old config could not discover `tests/e2e/stitch.spec.ts` (`No tests found`). GREEN: project-scoped config discovers the regression suite once and the e2e suite only in three target viewports.
2. RED: `/research/` at 768 ended 10.8px behind the fixed dock. GREEN: footer reserve increased from 150px to 170px; all route/dock-clearance checks pass.
3. RED: forced `/stitch/casmd.png` failure had no retained contract. GREEN: request abort reveals `.vibe-image-fallback` and preserves the CasMD title, description, and action.
4. RED: canonical runtime document height was 3716px, with hero/research/Vibe at y=120/979/2033 and section heights 819/926/1417. GREEN: source-density contract passes with hero bottom 630, research y=670 and h≈565, Vibe y≈1235 and h≈743, runtime document ≈2160px, and 2079px canonical artifact.
5. RED: normalized horizontal overlay showed hero card w346, banner w477, research cards w574/475/408, and an over-wide Singularity/lower pair. GREEN: final ranges are hero card x236 w296; banner w395; research w515/427/369; Vibe heading w241; note w295; Singularity x≈92 w≈285; Medit w≈276; Yaos/Zen x≈105/388 w≈274/276.

## Production-preview browser coverage

- Regression: 33 passed.
- Canonical 768: 14 passed, 1 intentional skip (mobile-only no-JS contract).
- Desktop 1440: 13 passed, 2 intentional skips (canonical geometry and mobile-only no-JS).
- Mobile 390: 14 passed, 1 intentional skip (canonical geometry).
- Total: 74 passed, 4 skipped, 0 failed.

Coverage includes bilingual persistence, ordinary navigation, mail/social/download/stage anchors, no-JS English defaults and hidden language control, keyboard skip/focus, CV PDF response, Prompt copy/failure/stage paths, reduced-motion `animationName: none`, image natural dimensions/alts, external destinations, footer current states, semantic landmarks/headings, named controls, duplicate IDs, overflow, dock clearance, and Vibe image failure.

## Visual comparison and artifacts

Tracked artifacts:

- `artifacts/stitch/home-768-full.png` — 768×2079
- `artifacts/stitch/home-1440-full.png` — 1440×3890
- `artifacts/stitch/research-768.png` — 690×566
- `artifacts/stitch/vibe-768.png` — 690×755
- `artifacts/stitch/home-390-full.png` — 390×4010
- `artifacts/stitch/research-index-390-full.png` — 390×3543
- `artifacts/stitch/prompts-390-full.png` — 390×8865

The canonical artifact retains the 15% left and right-24% guide lines, asymmetric wordmark/card/formula/scroll grouping, green research banner and overlapping 85/70/60 roles, orange Vibe heading, LOL note, overlapping CasMD/Singularity/Medit composition, centered Yaos/Zen pair, and bottom footer dock. Animations are disabled only while capturing via reduced motion; normal-mode motion and shared transform ownership are unchanged and retained tests pass.

The fixed footer appeared across the research banner in an ordinary 768×1024 full-page capture. The artifact test now raises the capture viewport to the normalized 2079px source height and uses a normal screenshot, so the runtime remains fixed while the artifact dock appears once at the document bottom.

## Browser skill and inspection ownership

The browser-control skill was read completely before any browser work. This subagent's session had no browser backend (`agent.browsers.list()` returned `[]` after required troubleshooting), so mandatory in-app manual inspection was explicitly controller-owned rather than replaced with another manual browser. The controller connected the Codex in-app browser to production preview `http://127.0.0.1:43219/`, identified the initial 79% height mismatch, and performed normalized source/artifact comparisons that drove the canonical density and horizontal-ratio contracts. This subagent used retained Playwright and local original-resolution image inspection for reproducible checks and artifact review.

## Verification

- `npm run verify` — pass: ESLint pass; Astro check 0 errors/0 warnings (one existing `document.execCommand` deprecation hint); 44/44 Vitest; seven-route production build.
- `npm run test:browser` — pass: 74 passed, 4 intentional skips.
- `git diff --check` — pass.
- `npm audit --omit=dev` — read-only result: two existing runtime advisories (Astro high, esbuild low); fixes are available but no auto-fix or unrelated dependency upgrade was performed.

## Remaining concerns

- A no-JS broken image cannot reliably reveal a custom CSS fallback without risking successful-image coverage; the authored alt text plus all card text/action remain accessible without JavaScript, while the designed fallback is verified for normal JavaScript operation.
- The npm audit advisories remain for a separately scoped dependency update.
- `document.execCommand('copy')` remains intentionally as the compatibility fallback and produces the existing type-check deprecation hint.
