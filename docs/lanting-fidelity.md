# Lanting manuscript fidelity correction

Date: September 10, 2026. Baseline: `4d0f1ea40c203fd316e224d51466ddb5d0c7cf64`.

## Reported defects and cause

The previous renderer cut holes into selected column images and inserted separately collected characters. This replaced original wording near `會稽山陰` with `與人`. It also placed a second `宇宙之大` lower in a column that already contained the phrase. Fixed-width column windows and responsive rearrangement could clip or separate neighboring strokes. Retaining the untouched source file alone did not preserve the rendered manuscript.

The earlier interaction checks did not test this textual fidelity requirement. This correction removes the replacement mechanism rather than adjusting individual false phrases.

## Corrected rendering

The entire 4513 x 1480 reproduction is rendered once, without a color filter, mask, column extraction, reordering, or added lettering. Native horizontal scrolling preserves the original arrangement at a readable scale. The opening text is aligned into view; the outside seals and the end of the manuscript remain reachable.

Eleven transparent links overlay words already present at their original coordinates. Their puzzle contours have no fill. Hover, focus, and reveal never move or redraw the ink. Selecting a link opens the existing thirteen-record reader. Its cue quotes the actual source region, and closing restores both vertical page position and horizontal manuscript position.

Each entry region was inspected with its adjoining characters visible. The mapping and contextual phrases are recorded in [the source note](lanting-assets.md). The source scan is authoritative; the separate reference transcript represents another copy and is not used to redraw the text.

## Regression protections

- SHA-256 equality with the original reproduction: `b2cb481ea097d5fc8188389f787eb9b45369d8ad0489e02b17a80d9697a2eb54`.
- One complete visible image, original aspect ratio, and no extra ink images, collected-character elements, masks, or clip paths inside the manuscript.
- Transparent contours aligned to the source coordinates, with distinct, non-overlapping source regions.
- Keyboard access to the far end of the scroll, without horizontal overflow of the page itself.
- All eleven entries, thirteen reader records, both scroll positions, focus return, touch, reduced motion, no JavaScript, and existing portfolio contracts.

The originals, region study, screenshots, logs, and verification receipts are retained locally in `artifacts/lanting-fidelity-2026-09-10/`. Current browser JSON is written to `artifacts/browser/latest.json`, so subsequent runs do not replace an older dated report.

## Verification results

`npm run verify` passed formatting, ESLint, Astro checks, nine unit tests, and the static build. Astro reported zero errors, zero warnings, and one existing hint in the historical-viewer test. The build retains fourteen current portfolio routes, sixteen edition viewers, and twenty compatibility redirects.

The complete browser run passed 118 cases with no skips, failures, or retries: desktop Chromium, phone Chromium, and phone WebKit. Actual captures include the restored `會稽山陰` region, the single original `宇宙之大` passage, the opening view, discovery, and the reader. The source hash and canonical portfolio data, CV, apps, and eight archived exports remain unchanged. The sharing image was regenerated from the corrected production preview.

These checks establish local rendering and browser behavior. Release status and live verification are recorded separately in the local publication receipt.
