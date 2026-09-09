# Local rebuild verification

Date: 2026-09-05. Mode: Execute, ready for owner review. Branch: `codex/portfolio-rebuild`, based on `9962637`. This is the current verification receipt for the revised design. It replaces the first draft's receipt, archived at `artifacts/rebuild-2026-09-05/verification-first-draft.md`.

Preview: [Chinese](http://127.0.0.1:43219/zh/) and [English](http://127.0.0.1:43219/). These are local URLs on this computer.

## Current result

The owner rejected the first illustrated draft as too template-like and chose to integrate the nocturnal character throughout the website. The current site uses a dark green background, ordinary reading scales, direct first-person copy, a work index, and actual application screenshots. The separate Night destination, generated landscape, decorative project placeholders, and repeated contact banners have been removed.

Seven destinations have English and Chinese routes: Home, Research, Projects, About, CV, Contact, and Prompts. There are fourteen portfolio URLs plus a recovery page. Both removed Night URLs return 404 and are absent from navigation and the sitemap.

The seven journal records and standalone preprint retain the bibliographic verification from the first rebuild. All eight publication source files are byte-identical to the archived first draft, and all eleven original English prompt bodies still match their original source. Education in the About sidebar is rendered from the existing CV data.

## Current checks

Evidence below is in `artifacts/refinement-2026-09-05/`.

| Check                                | Result                                                                                                                 | Evidence                                                           |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `npm run verify`                     | Formatting, ESLint, Astro checks, unit tests, and build passed                                                         | `verify.log`                                                       |
| Astro check                          | 0 errors, 0 warnings, 0 hints                                                                                          | `verify.log`                                                       |
| Vitest                               | 7 tests passed in 2 files                                                                                              | `verify.log`                                                       |
| `npm run test:browser`               | 48 tests passed in 15.0 seconds                                                                                        | `browser.log`, `browser-results.json`                              |
| Static build                         | 15 HTML pages including 404; 14 portfolio URLs in the sitemap                                                          | `verify.log`, browser sitemap assertion                            |
| Removed Night destination            | Both routes return 404; no navigation or sitemap entries; source and generated landscape absent                        | Browser checks, `content-integrity.json`                           |
| Responsive reading                   | Both locales, desktop and mobile; all seven pages at 320 px and 200% text; landscape and reduced motion                | Browser checks                                                     |
| Keyboard and progressive enhancement | Skip link, mobile menu recovery, no-JavaScript navigation, and prompt disclosure passed                                | Browser checks                                                     |
| Copy and download                    | Real clipboard, denied-access recovery, prompt anchor navigation, and all prompt download contents passed              | Browser checks                                                     |
| Content preservation                 | 11 prompt strings and all 8 publication records unchanged                                                              | `content-integrity.json`                                           |
| Native touch scrolling               | Chromium touch gesture scrolled the document by 605 px                                                                 | `visual-checks.json`                                               |
| Visual review                        | Home, Projects, Research, About, Contact, Prompts, and web CV; no page errors or horizontal overflow in eight captures | `visual-checks.json`, page screenshots                             |
| Exports                              | Current 1200 x 630 sharing image and two-page A4 CV; both PDF pages visually inspected                                 | `public/og.png`, `public/cv.pdf`, `cv-page-1.png`, `cv-page-2.png` |

Browser checks use Chromium at 1440 x 1000 and mobile emulation at 390 x 844. The route checks include axe WCAG A/AA tags through WCAG 2.2. A long English paper-title word initially overflowed at 200% text; emergency wrapping fixed it. Visual review also caught an omitted school name in the About sidebar; both institutions now have explicit browser assertions. Automated accessibility passes do not certify conformance or replace assistive-technology testing.

Tools: Node 22.23.1, Astro 7.3.1, Playwright 1.61.1, Lighthouse 13.4.1, and Poppler PDF rendering. No new dependencies were introduced in this refinement.

## Local mobile Lighthouse

URL: `http://127.0.0.1:43219/`. Timestamp: `2026-09-05T10:21:09.763Z`. Lighthouse 13.4.1 attached to a Playwright-launched Chromium browser, with mobile simulation and the built site served locally.

| Metric                   | Result    |
| ------------------------ | --------- |
| Performance              | 100 / 100 |
| Accessibility            | 100 / 100 |
| Best practices           | 100 / 100 |
| SEO                      | 100 / 100 |
| First contentful paint   | 1.05 s    |
| Largest contentful paint | 1.20 s    |
| Total blocking time      | 0 ms      |
| Cumulative layout shift  | 0.0003    |
| Total transferred bytes  | 50,537    |

The scored report has no runtime error or run warnings. Reports: `lighthouse-mobile.report.json` and `lighthouse-mobile.report.html`. These are local lab measurements, not production field data. The later About-only content repair did not change the measured homepage.

## Retained evidence and limits

- The dependency lockfile and embedded applications were not changed in this refinement. The same-date clean offline install, zero-vulnerability dependency audit, embedded-app pinch zoom, and Medit existing-client offline update are retained evidence under `artifacts/rebuild-2026-09-05/`; they were not rerun as if they were new results.
- Safari/WebKit remains untested because the prior browser-download attempts failed with a TLS connection reset. Physical devices, screen readers, search-engine indexing, social-network preview refresh, and actual email delivery were not tested.
- Full embedded-application workflows and native PWA installation were not exhaustively tested. Research checks establish bibliographic identity and attribution, not independent validation of scientific results. See the [content evidence ledger](content-verification.md).
- The earlier source draft is archived in `artifacts/rebuild-2026-09-05/first-draft-source.tar.gz`. The original audit and unrelated untracked `src/styles/global 2.css` were left untouched.
- No commit, push, merge, deployment, credential change, or third-party message was made. The live domain still serves its previous deployment.
- These checks establish behavior, content preservation, and readability. Whether the result feels personal remains an owner judgment.
