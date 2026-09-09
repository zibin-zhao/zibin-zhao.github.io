# A sheet with things to find

The writing is the layout. The page does not put a project grid over a calligraphic wallpaper. Each discovery replaces a bounded part of one vertical column, using characters gathered from the same historical reproduction. English project identities appear only on discovery and in the reading layer.

## Material and type

| Token         | Value     | Role                          |
| ------------- | --------- | ----------------------------- |
| Paper         | `#e7ddc8` | The continuous sheet          |
| Reading paper | `#eee5d3` | The expanded piece            |
| Ink           | `#302a22` | Text and controls             |
| Quiet ink     | `#62523e` | Secondary reading text        |
| Seal          | `#963c29` | Discovered labels and actions |
| Fiber         | `#c8b99e` | Fine divisions                |

Calligraphic glyphs are SVG windows onto an unmodified scan, with nested viewports that prevent adjacent characters leaking into the allotted space. The shared SVG filter separates dark ink from the scan's paper in the browser. It does not synthesize or redraw strokes. Paper grain is a light procedural overlay. A few surviving scan marks retain the material history of the reproduction.

Manrope retains the exact Latin project identifiers and utility text. Georgia and system Chinese serif fonts supply the extended reading layer. This fallback is explicitly a remaining typography limitation, not an authentic Wang Xizhi typeface.

## Composition and motion

The columns flow from right to left within each band and downward between bands. Desktop uses fourteen columns, tablet ten, and phone five. Aspect ratios remain intact. The smaller screen receives the same complete composition through ordinary vertical scrolling. The small header, gathered-character reveal control, and quiet pointer hint leave the initial writing dominant.

Each clue has a fine irregular SVG edge, including puzzle-like concavities. It lifts two degrees when approached. The native dialog opens from the originating bounding rectangle; content settles into the enlarged sheet. Its closing animation returns to the launcher. Reduced motion uses an immediate state change. There is no autonomous scene animation, scroll interception, WebGL requirement, or loading gate.

## Quiet history

The footer carries a small `Past designs` / `往昔` caption and eight consecutive numbers separated by fine vertical rules. Each number represents the final recoverable version of one design family. Names and dates appear on hover or in accessible labels. Numbers wrap on narrow screens rather than forcing a wider page. This entry remains below the manuscript and complete content index.

Historical pages fill an independent viewer, bordered only by warm-paper utility strips. The upper strip carries the edition, date, return, and full-page link. The lower strip provides a short design note and numbered navigation. Its selected number remains visible on narrow screens. Each iframe retains its own fonts, layout, and motion, so historic CSS never changes the present homepage.

## Calibration and evidence

The first calibration revealed white scan boxes and neighboring strokes leaking into glyphs. Nested clipping and ink separation corrected them. Each used glyph was inspected in a dedicated study. Cropping coordinates, insertion ranges, and source identity are recorded in `src/data/lanting.ts` and `docs/lanting-assets.md`.

The browser suite covers discovery, reveal, every entry, source links, keyboard focus, touch, scroll return, reduced motion, no JavaScript, and the retained portfolio contracts. Actual screenshots are in `artifacts/lanting-2026-09-09/`. The earlier nature receipts are historical evidence for the inherited version.
