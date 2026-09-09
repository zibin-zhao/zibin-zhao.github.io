# Spatial redesign verification

September 7, 2026. Local preview: `http://127.0.0.1:43220/zh/`.

## Delivered surface

The canonical homepage is one open spatial field with eight interactive artifacts, a miniature railway, dragging, alternate viewpoints, reset, and motion controls. Interior routes use reading sheets. This supersedes the earlier vertical homepage and three-room calibration. `PRODUCT.md` and `DESIGN.md` describe the current implementation.

The checkout already contained an extensive uncommitted rebuild. This receipt covers the spatial changes, not every difference from Git HEAD. Task-start snapshots are retained in `artifacts/gallery-2026-09-07/before/`.

## Checks

- `npm run verify`: passed formatting, ESLint, Astro checks for 41 files with zero diagnostics, seven unit tests, and the 15-page static build. The build retains a warning about the Three.js bundle exceeding 500 kB before compression.
- Full browser run: 48 of 48 page/content checks passed. Three spatial failures exposed drifting desktop link targets and a mobile drag that held object centers still. These were fixed in the implementation.
- Complete spatial rerun: 22 of 22 passed, with no skips, retries, or WebGL-unavailable annotations. Tests counted real WebGL draw calls and exercised canvas raycasting, mouse/touch dragging, viewpoint reset, motion preferences, keyboard access, and explicit no-WebGL/no-JavaScript fallbacks.
- Final initialization, canvas interaction, and bilingual homepage accessibility checks after reducing environment-map cost: 10 of 10 passed. Results are recorded in `browser-final.log` and `browser-results.json`.
- `npm audit --omit=dev` and a full `npm audit` passed with zero reported vulnerabilities. The full audit was retried without machine proxy variables after a TLS connection failure.
- `git diff --check` passed.

The page checks cover both languages, desktop and mobile, native navigation, project filters, exact clipboard contents and denial recovery, downloads, 404 recovery, landscape layout, and 320 px width with 200% text. Automated accessibility checks do not certify conformance.

## Performance observation

Lighthouse 13.4.1, Headless Chrome 152 on this Mac, simulated mobile networking and 4x CPU slowdown, local production build:

| Metric                               | Result          |
| ------------------------------------ | --------------- |
| Performance                          | 69              |
| Accessibility / best practices / SEO | 100 / 100 / 100 |
| First contentful paint               | 2.0 s           |
| Largest contentful paint             | 2.8 s           |
| Total blocking time                  | 1,390 ms        |
| Cumulative layout shift              | 0               |

The earlier run measured performance 46 and total blocking time 5,410 ms. Reducing environment-map generation to 64 pixels for software rendering and 128 for mobile hardware reduced the measured startup cost; desktop hardware retains 256. Software rendering also uses fewer geometry subdivisions, smaller shadows, and adaptive pixel ratio. No animation was disabled or delayed to change the measurement window.

Mobile startup still has measurable blocking cost. These lab results do not establish frame rate or responsiveness on physical phones, Safari, or production. No physical-device performance test was performed.

## Content and artifacts

All 16 task-start hashes matched: five data files, eight publication records, the existing CV PDF, and the two embedded application entry HTML files. The six projects, seven journal articles, one preprint, eight prompt stages, and eleven prompt bodies remain intact. This is a preservation check, not a fresh scientific verification.

The sharing image was captured from the actual local WebGL homepage at 1200 by 630 pixels and normalized to PNG encoding. The existing CV PDF was preserved. The updated export utility was checked statically; its PDF export path was not rerun.

Evidence is under `artifacts/gallery-2026-09-07/`: content hashes, full and spatial browser reports, final smoke report, static verification log, Lighthouse JSON/HTML, and desktop/mobile screenshots. The sampled visual review includes the spatial homepage, the research reading sheet, and an expanded mobile prompt.

## Publication boundary

No commit, merge, push, or production deployment was performed. The existing public domain was not replaced. The embedded applications' internal flows and service-worker upgrades were not retested because this task did not change them.
