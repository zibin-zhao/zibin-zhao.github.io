# Nature experience verification

September 9, 2026. Local implementation on `codex/nature-free`, verified on macOS arm64 with Node 22.23.1 and npm 10.9.8. This receipt supersedes earlier scene receipts for the current presentation only.

## Result

The foggy lake, responsive water, fern close-up, project previews, personal closing scene, native reader, and postcard download are implemented. The old mechanical scene is removed from active source. This is a locally verified portfolio, not a production release.

| Check                  | Actual result                                                                                                                                                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run verify`       | Passed formatting, ESLint, Astro check, 7 unit tests, and the static build. Astro reported 0 errors, 0 warnings, and 0 hints across 40 files.                                                                                                                |
| `npm run test:browser` | 70 passed, 0 failed, 0 skipped, 0 flaky in 45.8 seconds. Chromium desktop at 1440 x 1000 and Pixel 7 emulation at 390 x 844.                                                                                                                                 |
| Public behavior        | All 14 bilingual portfolio routes; metadata and links; language continuity; keyboard and focus; native menu; project filters; exact clipboard contents and denial recovery; prompt links and download; 404; demo entry points; 320 px with 200 percent text. |
| Nature behavior        | All 9 complete records; previous/next and selection; Escape and focus restoration; no JavaScript navigation; no WebGL; context loss; actual pause and offscreen frame suspension; reduced motion and preference changes; application return navigation.      |
| Accessibility          | Existing route scans and new reader scans passed their axe checks using WCAG A/AA tags through WCAG 2.2. This is automated coverage, not a conformance certification.                                                                                        |
| Postcard               | Downloaded and decoded PNG header: 1800 x 1200. Visual artifact includes the photographer credit.                                                                                                                                                            |
| Share preview          | Regenerated `public/og.png` using the production build and inspected its 1200 x 630 composition.                                                                                                                                                             |
| Content preservation   | All 16 pre-change SHA-256 checks passed: five data files, eight publication records, CV PDF, and the two demo entry HTML files.                                                                                                                              |
| Diff                   | Task changes compared with the pre-change source archive; `git diff --check` passed. Unrelated changes already present in the checkout were retained.                                                                                                        |

The first browser run exposed a pale legacy background in the About index. The second exposed reduced text contrast during section fades. The About background now uses the forest palette, and text remains fully opaque during its gentle positional entrance. The original route tests were retained without weakening their assertions.

Desktop and portrait images for the lake, research, work, and personal scene are in `artifacts/nature-2026-09-09/`. Screenshot capture checks that each section's lazy images have loaded before saving. In-app inspection also confirmed the loaded fern, Chinese mobile layout, complete reader, and interior pages.

## Dependency and coverage limits

The September 9 full `npm audit` reported two moderate entries, `vitest` and `@vitest/mocker`, for the same [redirect-mock path traversal advisory](https://github.com/advisories/GHSA-82fw-gwwq-j7x9). These are development dependencies at 4.1.8. Updating to the registry's patched 4.1.11 failed in npm's dependency resolver with `Cannot read properties of null (reading 'edgesOut')`, including a lockfile-only attempt. No upgrade landed. The production-only audit request also failed at the registry endpoint, so this receipt does not claim a clean independent production audit. Raw audit output is retained with the visual artifacts.

Safari/WebKit, Firefox, physical phones, assistive technologies, production performance, and a fresh `npm ci` were not tested in this task. Existing embedded applications were not rebuilt; their internal workflows and service-worker migrations are outside this presentation change. The existing CV PDF was preserved rather than regenerated.

No commit, merge, push, deployment, or live-site verification was performed. The local preview is available while its Astro preview process remains running.

## Retained evidence

- `artifacts/nature-2026-09-09/browser-results.json`: the complete 70-test passing run.
- `artifacts/nature-2026-09-09/browser-first-run.json` and `browser-second-run.json`: failures that prompted the fixes above.
- `artifacts/nature-2026-09-09/content-before.sha256`: canonical content checksum manifest.
- `artifacts/nature-2026-09-09/before.tgz` and `before-status.txt`: source recovery and the pre-existing checkout state.
- `artifacts/nature-2026-09-09/task.diff`: source and documentation comparison against that archive. Binary photo sources and export backups are retained separately.
- `docs/nature-assets.md`: image sources, license, and source hashes.
