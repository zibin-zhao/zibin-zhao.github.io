# Grail fork verification, 2026-09-09

## Delivered surface

Independent worktree: `/Users/zibinzhao/.codex/worktrees/027f/personal_webpage`.
Local production preview: `http://localhost:43222/zh/` and `http://localhost:43222/`.
The source checkout and original preview at port 43220 were not edited or stopped. No merge, push or deployment was performed.

## Checks and evidence

- `npm run verify`: passes. Formatting and ESLint pass; Astro checks 48 files with zero errors, warnings or hints; 7 unit tests pass; static build produces 15 pages including 404.
- New Grail browser suite: 14/14 pass across desktop Chromium and emulated mobile touch, in 15.6 seconds. Canonical result: `artifacts/grail-2026-09-09/browser-results.json`.
- Existing site browser suite: 48/48 pass in the second complete run. This covers both locales, all routes, source links, metadata, axe scans, native no-JavaScript navigation, prompt disclosures/copy/download, clipboard rejection recovery, project filters, keyboard navigation, 320 px enlarged text and landscape. Evidence: `browser-second-pass.json`; three old Grail interaction failures in that file were subsequently corrected and passed in the final Grail run.
- Total unique browser cases passed across these runs: 62. This is not a claim of one final combined 62-case run. The last Chinese mobile type-size adjustment was verified visually and by the final static checks.
- Source preservation: 28/28 protected files match the original checkout by SHA-256. Includes factual data, publication records, CV PDF and the complete local application bundles. Evidence: `content-integrity.json`.
- Manual in-app browser review: desktop 1280×720, mobile 390×844, and landscape 844×390. Inspected landing, actual card opening, readable details, closing, featured stage, Chinese type wrapping and overflow. Screenshots are stored beside these results.
- `git diff --check`: passes for tracked changes. The extensive inherited uncommitted redesign is preserved separately from this fork's new Grail changes.

## Behavior verified

All nine records have actual source text and links. Opening does not leave the homepage; previous/next wraps the full collection. Keyboard focus stays in the native dialog and returns to the exact card. Internal application navigation followed by browser back closes the dialog, releases the scroll lock and permits reopening.

Six project selectors update the real artwork, title, summary and destination. System reduced motion starts paused. Explicit Play produces `card-bob` with an eight-second duration; Pause produces no animation. Native work links navigate without JavaScript.

The initial touch failures were traced to two distinct browser behaviors: `overflow:hidden` created a horizontally scrollable clipped hero, and the transparent 3D parent plane intercepted negative-depth cards. `overflow:clip` and explicit container/card pointer targeting fix both. Front and reverse card navigation pass on desktop and emulated touch.

## Boundaries

This is a local CSS 3D interpretation of Grail, with authored SVG motifs and an open-font alternative. It is not a copy of Grail's proprietary 3D models or page source. No physical iPhone/Safari, Firefox, Lighthouse or production performance test was run. The existing CV and social share export assets were preserved rather than regenerated. Historical archive/gallery test files remain excluded because their old visual interface is no longer active.
