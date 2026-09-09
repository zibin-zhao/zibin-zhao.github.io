# Grail release checks, 2026-09-09

## Release scope

The user approved the current Grail interpretation and explicitly requested deployment and push on September 9. This authorizes publication of the reviewed fork and supersedes the local-only boundary in the earlier fork brief and verification receipt.

GitHub Pages builds `.github/workflows/deploy.yml` after a push to `main`, with Node 22 and the committed npm lockfile. The configured production origin is `https://zibinzhao.com/`; `public/CNAME` agrees. The original mechanical archive checkout remains separate.

This release contains the inherited content rebuild and the new Grail interface. The current content model has six projects, seven journal articles and one separate preprint. It is not a claim that every historical GitHub shelf entry remains individually listed. Publication identity corrections are documented in `content-verification.md`.

## Export verification

`tools/generate-exports.mjs` now renders the actual CSS 3D hero and current CV route. The social image is a 1200 × 630 PNG, visually checked for the complete title, nine cards and footer actions. The CV is a tagged, two-page A4 PDF; both rendered pages were inspected for clipping, overlap, missing glyphs and orphan headings. All 69 print-DOM text fragments appear in the PDF in source reading order.

An export-only print rule keeps the introduction first in extracted PDF text. The CV factual source and the approved website layout are unchanged by this export correction.

## Browser regression

A clean `npm ci` completed successfully. The final `npm run verify` passed formatting, ESLint, Astro checks on 48 files with zero errors or warnings, seven unit tests and a 15-page production build.

The complete current browser suite passed 66/66 tests in 41.5 seconds, with the final CV and social image present in the build. Desktop Chromium and emulated mobile touch cover the Grail cards, real details, focus recovery, project switching, reduced motion, both locales, navigation, filters, downloads, clipboard behavior, accessibility scans, no-JavaScript navigation and narrow layouts.

Four of those tests exercise the unmodified Medit application and real service worker on isolated local origins. Fresh installation launches offline. A controlled client using the public source from commit `9962637` updates to the current worker, removes the old HTML cache revision and retains a draft entered through the application after reopening offline. The retained HTML is required to match the released entry point byte for byte.

## Performance and dependency checks

Lighthouse 13.4.1 ran on September 9 against the production build at `http://127.0.0.1:43222/zh/`, using its default mobile simulation, Chromium for Testing from Playwright build 1228, Node 22.23.1 and macOS arm64. Performance, accessibility, best practices and SEO each scored 100. FCP and LCP were 1.4 seconds, total blocking time 0 ms, and cumulative layout shift 0.001. These are local lab measurements, not production field metrics or accessibility certification.

Dependency audit checks were attempted on September 9. The first production-only `npm audit --omit=dev --json` returned zero vulnerabilities. The final clean installation reported two moderate vulnerabilities. The complete audit did not produce a valid detailed report: npm's registry rejected its quick-audit request as retired, and other attempts failed at TLS connection setup. A repeated production-only request also encountered the registry rejection. Consequently, this release does not claim a completed clean audit of all development dependencies.

## Evidence and publication

Local release evidence is retained under `artifacts/grail-release-2026-09-09/`, including Lighthouse reports, export verification and browser regression logs. Historical local evidence remains under `artifacts/grail-2026-09-09/`. Machine-specific reports and network error bodies are not published in this source commit.

The deployment run and live checks are separate from these preflight results. Successful publication requires a successful GitHub Pages run for the pushed commit, followed by checks of the live bilingual homepages, working card details, routes and release assets. Browser emulation does not establish behavior on every physical device or external application's complete workflow.
