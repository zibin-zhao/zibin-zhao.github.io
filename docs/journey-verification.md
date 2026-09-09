# Continuous journey verification

September 9, 2026. Local branch: `codex/nature-free`. Environment: macOS arm64, Node 22.23.1, npm 10.9.8, Playwright 1.61.1. This receipt covers the revision following the user's feedback about disconnected sections, ordinary covers, and excess surface copy.

## Result

The accepted lake opening now leads into a continuous photographic journey. Research appears as three annotations in the fern scene. Medit and Singularity have original full-frame cover compositions, also reflected on Projects. Four further records sit along a forest trail before the personal closing scene. Full records remain available in the independent native reader.

| Check                       | Result                                                                                                                                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run verify`            | Passed formatting, ESLint, Astro check, 7 unit tests, and build. Astro reported 0 errors, 0 warnings, and 0 hints across 43 files.                                                                                        |
| `npm run test:browser`      | 74 passed, 0 failed, 0 skipped, 0 flaky in 42.0 seconds.                                                                                                                                                                  |
| Browser environments        | Chromium desktop, 1440 x 1000; Chromium Pixel 7 emulation, 390 x 844.                                                                                                                                                     |
| Preserved public behavior   | All 14 bilingual routes, locale continuity, metadata and links, keyboard and focus, native navigation, filters, clipboard success and denial, prompt downloads, 404, demo entry points, and 320 px with 200 percent text. |
| Reading                     | All 9 full records, source links, paging, direct selection, Escape, focus restoration, and application return navigation passed.                                                                                          |
| Motion and failure recovery | Actual water frame pause/resume, offscreen suspension, reduced-motion preference changes, WebGL failure, context loss, shared galaxy pause/resume, galaxy offscreen suspension, and missing 2D canvas fallback passed.    |
| Native document             | No-JavaScript navigation and real project destinations passed. Chapter anchors settle with the intended scenery fully visible.                                                                                            |
| Accessibility               | Existing route axe scans and reader scans passed WCAG A/AA tags through WCAG 2.2. This is automated coverage, not a conformance certification.                                                                            |
| Content preservation        | All 16 entries in the original SHA-256 manifest still match: five data files, eight publication records, the CV PDF, and both demo entry HTML files.                                                                      |
| Exports                     | Postcard PNG download remains 1800 x 1200. Sharing image regenerated from the built homepage at 1200 x 630.                                                                                                               |
| Visual review               | Inspected desktop and portrait compositions, the first transition, Chinese reading, full-size Medit and Singularity scenes, the forest trail, and the personal closing.                                                   |

The first 74-test run identified a low-contrast decorative duplicate of the Medit title. That redundant reflection was removed, leaving the actual title and water rings. The original route tests were not weakened. The final run passed all 74 cases.

## Evidence

- `artifacts/journey-2026-09-09/browser-results.json`: final complete passing run.
- `artifacts/journey-2026-09-09/browser-first-run.json`: the initial contrast failure.
- `artifacts/journey-2026-09-09/desktop-*.png` and `mobile-*.png`: six chapter compositions, captured after the relevant photographs decode and native anchor navigation settles.
- `artifacts/journey-2026-09-09/before.tgz`: the preceding nature version, including its source and tests.
- `artifacts/journey-2026-09-09/task.diff`: source and documentation comparison against that archive.
- `artifacts/nature-2026-09-09/content-before.sha256`: unchanged canonical content.
- `docs/nature-assets.md`: photograph provenance. All new cover graphics are code-authored; they are artwork, not screenshots of changed applications.

## Limits and delivery

Safari/WebKit, Firefox, physical phones, assistive technologies, production performance, and a fresh dependency installation were not tested. The embedded applications and the CV PDF were preserved.

Dependencies did not change in this revision. The earlier September 9 audit still applies: two moderate development-dependency entries affecting Vitest 4.1.8 and its mocker, with a failed patch attempt in npm's resolver. Details and raw output are retained in `docs/nature-verification.md` and the earlier artifact directory. No clean production-only audit is claimed.

The complete source changes were compared with the pre-revision archive and `git diff --check` passed. Unrelated pre-existing checkout changes remain intact. No commit, merge, push, deployment, or live-site verification was performed. The preview remains local.
