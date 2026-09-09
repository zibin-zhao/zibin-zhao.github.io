# Lanting local verification

Date: September 9, 2026.

## Delivered surface

The independent `codex/lanting-paper` branch in worktree `34ea` contains a local calligraphic prototype. The source sheet fills the opening. Eleven gathered-character insertions lead to thirteen reading records, with proximity and focus discovery, puzzle contours, a reveal control, paper expansion, paging, and return to the originating position.

Local preview: <http://127.0.0.1:43228/zh/>. Browser regression preview: port 43229. Production was not updated.

The fork inherited extensive uncommitted source changes. A diff against HEAD therefore includes work that predates Lanting. Selected fork-entry files are retained in `artifacts/lanting-2026-09-09/before.tgz`; the superseded nature modules removed from this fork are retained in `inherited-nature-source.tgz`. The original checkout was not edited by this implementation.

## Checks and evidence

| Check                                 | Result                                                                                                                                      | Evidence                                                                      |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Formatting, ESLint, Astro diagnostics | Passed; 0 errors, 0 warnings, 0 hints                                                                                                       | `../artifacts/lanting-2026-09-09/verify.log`                                  |
| Unit tests                            | 7 passed in 2 files                                                                                                                         | Same log                                                                      |
| Static build                          | 15 pages, including 14 bilingual portfolio routes and the 404 page; prompt text export also built                                           | Same log                                                                      |
| Desktop Chromium                      | 32 passed                                                                                                                                   | `browser-results-before-webkit-install.json`                                  |
| Phone Chromium                        | 32 passed                                                                                                                                   | Same report                                                                   |
| Phone WebKit                          | 8 passed across the initial run and targeted traversal rerun                                                                                | `webkit-results-before-timeout-adjustment.json` and `webkit-journeys-run.log` |
| Task diff review                      | Reviewed changed layout, source windows, sheet, interaction, shared UI, documentation, and relevant test changes; `git diff --check` passed | Local review                                                                  |

Browser evidence paths in this table are relative to `artifacts/lanting-2026-09-09/`. The original all-browser run completed its 64 Chromium cases, then encountered an absent WebKit executable. Installing the project-matched WebKit version resolved that launch problem. The next WebKit run passed six cases; the English and Chinese traversal cases exhausted the default 30-second budget while making progress through their eleven complete open/close journeys. Their budget was changed to 60 seconds, with all behavior assertions retained. Formatting and ESLint were checked again for that test-only change.

Both targeted traversal cases then passed. The [combined result](../artifacts/lanting-2026-09-09/verification-summary.json) records 72 passing outcomes: 32 desktop Chromium, 32 phone Chromium, and 8 phone WebKit. It takes the latest outcome per case across the retained reports, and is not presented as one uninterrupted run. It also retains hashes of the checked implementation files. Earlier launch errors and timeout results remain available in their original logs.

The complete traversal checks compare actual canonical summaries, contributions, project URLs, one-visible-record state, exact opening scroll position after browser tap alignment, return focus, and discovery count. Other checks cover concealed initial captions, pointer proximity on desktop, keyboard discovery, reveal toggling, all thirteen reading entries, previous/next wrapping, selection, focus containment, Escape, reduced motion, direct touch opening, no-JavaScript links, and returning from Medit.

Retained site checks exercise route metadata, language continuity, required links, accessibility checks, keyboard navigation, publication filtering, clipboard success and denial, exact prompt downloads, 320-pixel width with 200% text, landscape resize, the 404 page, and embedded application routes. These checks preserve six projects and eight publication records without rewriting their scientific content.

Runtime versions inspected locally: Node 22.23.1, Astro 7.3.1, Playwright 1.61.1, and axe-core Playwright integration 4.13.0. Browser contexts are desktop Chromium, Pixel 7 emulation at 390 x 844 CSS pixels, and iPhone 13 WebKit emulation.

## Visual inspection

Actual browser screenshots, rather than design mockups, were inspected for the opening composition, discovered CasMD insertion, and expanded reading paper. Desktop, phone Chromium, and phone WebKit captures are retained:

- [Desktop, discovered insertion](../artifacts/lanting-2026-09-09/desktop-discovered.png)
- [Desktop, reading paper](../artifacts/lanting-2026-09-09/desktop-reading.png)
- [Phone, opening](../artifacts/lanting-2026-09-09/mobile-sheet.png)
- [Phone WebKit, opening](../artifacts/lanting-2026-09-09/webkit-phone-sheet.png)
- [Phone WebKit, reading paper](../artifacts/lanting-2026-09-09/webkit-phone-reading.png)

The calibration corrected solid photographic boxes, leakage from neighboring glyphs, a misidentified character window, low-contrast secondary text, and a focus boundary issue. The final source windows are in `glyph-map.json` and `src/data/lanting.ts`. `glyph-study-first-pass.html` is an earlier inspection artifact, not the final map.

## Typography and remaining limits

The local artwork is an attributable public-domain reproduction of Feng Chengsu's copy after Wang Xizhi. Its SHA-256 remains `b2cb481ea097d5fc8188389f787eb9b45369d8ad0489e02b17a80d9697a2eb54`. The twenty-one mapped source characters supply all selected display cues. The rearranged composition and inserted phrases are contemporary authorship. See [source and licensing evidence](lanting-assets.md).

The requirement for every Chinese character throughout the site to use Wang Xizhi lettering remains partial. Long reading text, the complete index, and navigation use system serif typography; Latin names retain their real identifiers. A complete suitable font license or a larger verified, legally usable character source is still needed. No commercial font was downloaded or purchased.

This receipt establishes local behavior and inspected rendering only. Physical iOS hardware, a formal performance budget, external project workflows, and production deployment were not verified. The CV PDF, embedded app bundles, and inherited social sharing image were retained. No merge, push, or deployment was performed.
