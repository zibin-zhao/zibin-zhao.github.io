# Manuscript discovery verification

September 10, 2026. Local implementation on `codex/manuscript-discovery`, starting from production source `92745b6`.

## Result

The desktop homepage fills the browser viewport with the original manuscript. Header, footer, hints, progress counter, and exposed inventory are removed. Twelve original-word regions open thirteen portfolio records and a discovered Contents view. Reading pages use one serif typography system, with compact project rows. The single Highlight control restores the earlier sourced 一觀 lettering. It keeps the entry ink clear while the surrounding writing softens; region boxes, raised paper shadows, vermilion coloring, and the simultaneous label inventory are removed. The approached or hovered word now restores the earlier 114% enlargement with stronger ink and blended source paper. Past versions is concealed behind a small sourced 昔 glyph that appears only while Highlight is active.

The source bitmap, factual data, fourteen bilingual portfolio routes, CV PDF, prompt source text, embedded apps, and archive contents are preserved.

## Initial discovery checks

- `npm run verify`: passed formatting, lint, Astro check, all 9 unit tests, and the production build. Astro reported no errors or warnings and one inherited non-blocking TypeScript hint in the archive test.
- Initial full browser suite: 132 passed, 5 failed, 2 intentionally skipped desktop-wheel checks on phone profiles. Failures identified residual inline font sizes and an accessibility scan started during the opening transition.
- After removing the residual inline sizes and waiting for the reader animation to settle, all 5 failed cases passed. All 14 affected bilingual reading-page and enlarged-text reflow cases also passed.
- Combined coverage: 137 passing browser cases and 2 phone-inapplicable wheel cases. This combines the initial run with targeted corrective runs; it is not a claim that the first run was entirely green.
- Chromium desktop, Chromium phone, and WebKit phone exercised source fidelity, every entry, actual content, index access, direct links, history, language, focus, reduced motion, and no JavaScript. Existing application and archive contracts also passed.
- Additional visual review covered seven current routes in desktop Chromium, desktop WebKit, and a narrow Chromium viewport. No page errors or document-width overflow were observed. The homepage had no font requests. Chromium's platform-font inspection of the mixed-language About paragraph returned Georgia and Songti SC.

## Earlier Highlight and Past versions follow-up

- `npm run verify` passed again after the follow-up: formatting, lint, Astro check, all 9 unit tests, and the build. The same inherited archive-test hint remains.
- The first two home-focused runs covered 60 and 63 cases. The second exposed three short-landscape failures where transparent neighboring word regions intercepted label clicks. Removing the stacking boundary in Highlight mode makes the visible label receive the click. All twelve labels now open their own entries in each of the three browser profiles.
- The final 14 targeted cases passed. They cover both languages, Highlight on/off, clickable labels, all eight localized edition destinations, no archive asset requests before selection, browser Back/Forward, return from an edition, direct `#read-past`, keyboard focus, reader accessibility scans, landscape, and text reflow.
- Reflow checks now wait for an actual computed root font size of 32 px before measuring layout. At 320 px with 200% text, edition names and dates occupy separate rows, the reader stays within the viewport, and close and discovery controls remain reachable. The seven current Chinese routes also passed the updated reflow check in desktop and phone Chromium.
- Taking the latest result for each case across these staged runs gives 63 passed, 0 failed, and 2 intentionally skipped phone wheel checks. This is focused follow-up coverage, not a new full-suite run.
- Actual renders were inspected for desktop, phone, short landscape, and enlarged text. The original bitmap hash and retained public assets are unchanged.

`artifacts/manuscript-discovery/highlight-verification.json` records those combined cases and raw reports. `highlight-static.log` contains that static pipeline. Captures with the `highlight-` prefix describe the earlier boxed-control design and are superseded by the current `ink-` captures.

## Integrated ink and concealed history refinement

The user rejected the boxed controls and disjointed emphasis, then found the vermilion calibration unclear and the printed history link too exposed. The current implementation uses the original 一觀 control, dark source ink with a reversible paper veil, one destination note at a time, and a small 昔 history glyph. The new history glyph was checked against 每覽昔人 in the source; its crop is recorded in `src/data/lanting.ts` and `docs/lanting-assets.md`.

Calibration removed paper grain from the emphasis layer and kept it registered to the source even when the minimum touch target exceeds the visible character. Touch checks caught a keyboard-returned note covering an adjacent entry; coarse-pointer notes now let taps reach the underlying character. The existing reading history, eight past editions, no-JavaScript fallback, and reduced-motion behavior remain part of the focused checks.

Final verification passed `npm run verify`, including all 9 unit tests, with zero Astro errors or warnings and the same inherited archive-test hint. The complete focused home suite finished with 61 passed, 0 failed, and 2 phone-inapplicable wheel skips across desktop Chromium, phone Chromium, and phone WebKit. The authoritative receipt is `ink-verification.json`, with `ink-browser-verified.json` and `ink-static.log` as raw evidence. Interrupted calibration runs are retained separately and are not counted as passing verification.

Actual desktop, phone, and short-landscape renders are recorded in `ink-visual-review.json`, with no page errors or document overflow in those captures. A desktop on/off comparison returned byte-identical screenshots, a zero-opacity veil, no visible ink overlays, a concealed history glyph, and an unfiltered base image. This is recorded in `ink-restoration.json`. Current visual references are `ink-desktop-rest.png`, `ink-desktop-highlight.png`, `ink-phone-highlight.png`, and `ink-desktop-note.png`.

## Restored hover feedback

The accepted Highlight and concealed history design is retained. Proximity, hover, and keyboard focus restore the earlier 114% enlargement over 340 ms, with stronger ink. A feathered source-paper layer prevents doubled strokes and follows the surrounding paper veil during Highlight. Only the active word enlarges; the remaining highlighted entries keep their original scale. Notes clear enlarged tall regions while retaining their earlier spacing below short regions so adjacent entries remain clickable. Reduced motion removes every added transition.

The final `npm run verify` passed formatting, lint, Astro check, all 9 unit tests, and the build, with zero Astro errors or warnings and the same inherited hint. The complete focused home suite passed 61 cases with 2 phone-inapplicable wheel skips across desktop Chromium, phone Chromium, and phone WebKit. An earlier interrupted calibration exposed a note covering the adjacent CV entry; that run is retained as `hover-browser-initial.json` and is excluded from passing results. The final raw report is `hover-browser.json`.

Additional desktop Chromium and WebKit captures confirmed one enlarged word during Highlight, matching paper tint, no page errors, and no document overflow. Both browsers returned byte-identical resting screenshots after hover ended. The source image hash remains unchanged. `hover-visual-review.json` records those checks; `hover-verification.json` is the current receipt. Final visual references include `hover-chromium-desktop-active.png`, `hover-chromium-desktop-highlight.png`, `hover-webkit-desktop-highlight.png`, and `hover-mobile-active.png`. Earlier calibration captures are not the current visual target.

## Evidence and reproduction

Local screenshots and raw runs are under `artifacts/manuscript-discovery/`. `verification.json` explains how the three test reports are combined; `visual-review.json` records the additional route and font checks. `static-verification.log` records the final static pipeline.

```sh
npm run verify
npm run test:browser
# Focused follow-up coverage, after a build:
npm run test:browser -- tests/browser/lanting.spec.ts tests/browser/discovery.spec.ts
npm run test:browser -- tests/browser/discovery.spec.ts tests/browser/site.spec.ts --grep 'highlight|past-versions|200 percent'
ASTRO_PREVIEW_BACKGROUND=0 npm run preview -- --host 127.0.0.1 --port 43235 --ignore-lock
```

Preview: `http://127.0.0.1:43235/zh/`.

## Scope

The original manuscript is byte-for-byte unchanged. The initial 蘭亭 index region was visually checked against the original scan. Automated accessibility checks cover the tested states; no screen-reader certification or physical-device claim is made. Chinese system font fallback may differ on other operating systems. Firefox was not included.

This work is local. No merge, push, or production deployment was performed, and no live-site verification of these changes is claimed. The original working directory and its unrelated changes are preserved.
