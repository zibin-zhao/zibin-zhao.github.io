# A sheet with things to find

The original writing is the layout. The entire reproduction is rendered once, and each discovery is a transparent interaction region over an existing word or phrase. It must never remove, replace, duplicate, or rearrange the manuscript's text. Project identities appear only on discovery and in the reading layer.

## Material and type

| Token         | Value     | Role                          |
| ------------- | --------- | ----------------------------- |
| Paper         | `#e7ddc8` | The continuous sheet          |
| Reading paper | `#eee5d3` | The expanded piece            |
| Ink           | `#302a22` | Text and controls             |
| Quiet ink     | `#62523e` | Secondary reading text        |
| Seal          | `#963c29` | Discovered labels and actions |
| Fiber         | `#c8b99e` | Fine divisions                |

The manuscript displays the unmodified scan with its original ink, paper, seals, line spacing, and corrections. It receives no image filter or procedural grain overlay. Separate UI lettering uses source windows and ink separation. Reader cues quote the actual continuous source region associated with the selected entry.

Manrope retains the exact Latin project identifiers and utility text. Georgia and system Chinese serif fonts supply the extended reading layer. This fallback is explicitly a remaining typography limitation, not an authentic Wang Xizhi typeface.

## Composition and motion

The complete scan keeps its original aspect ratio at every viewport size. A native horizontal scroll region presents it at a readable height, with the first writing column visible on arrival. The outer seals and final column remain reachable. Touch, trackpad, keyboard focus, and the native scrollbar can move through the scroll; vertical scrolling reaches the complete content index and history links. No column is extracted or reflowed.

Each clue has a fine irregular SVG edge, including puzzle-like concavities. Discovery scales a continuous source crop to 1.14 around its original center over 340 ms, with a small paper shadow. The crop includes the original paper and covers the same underlying words; it never gathers characters from elsewhere. The contour has no fill, the complete source image stays fixed, and the magnifier disappears after retracting. Reveal shows only the outlines and labels. Reduced motion changes state immediately.

The header carries only the existing name, language switch, and menu. Its former central calligraphy title is removed. Below the scan, a 44 px strip holds a small scroll hint and a single-row reveal control. Transparent backgrounds and no glow keep both ends quiet. The controls scroll with the manuscript rather than floating over the content.

The native dialog opens from the originating bounding rectangle; its closing animation returns to the launcher and restores both scroll axes. There is no scroll interception, WebGL requirement, or loading gate.

## Quiet history

The footer carries a small `Past designs` / `往昔` caption and eight consecutive numbers separated by fine vertical rules. Each number represents the final recoverable version of one design family. Names and dates appear on hover or in accessible labels. Numbers wrap on narrow screens rather than forcing a wider page. This entry remains below the manuscript and complete content index.

Historical pages fill an independent viewer, bordered only by warm-paper utility strips. The upper strip carries the edition, date, return, and full-page link. The lower strip provides a short design note and numbered navigation. Its selected number remains visible on narrow screens. Each iframe retains its own fonts, layout, and motion, so historic CSS never changes the present homepage.

## Calibration and evidence

The September 10 correction removes the earlier text-replacement and column-cropping mechanism. The previous checks covered interaction, but did not catch changed wording and duplicated phrases. Every current interaction region has been reviewed against the original with adjoining characters visible. Coordinates and source identity are recorded in `src/data/lanting.ts` and `docs/lanting-assets.md`.

The browser suite covers the single complete manuscript image, absence of replacement ink and masks, original source coordinates, temporary magnification, return to the resting image, every entry, both scroll axes, touch, reduced motion, no JavaScript, and the retained portfolio contracts. Source hashing protects the reference bitmap. Current screenshots are in `artifacts/lanting-hover-2026-09-10/`; earlier receipts remain historical evidence.
