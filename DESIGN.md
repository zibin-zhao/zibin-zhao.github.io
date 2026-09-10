# A manuscript with things to find

The original writing is the layout. The visitor sees a full browser viewport of calligraphy, then discovers entry points within it. Content becomes easy to read once opened.

## Material and type

| Token         | Value     | Role                        |
| ------------- | --------- | --------------------------- |
| Paper         | `#e7ddc8` | Surrounding paper           |
| Reading paper | `#eee5d3` | Reader and inner pages      |
| Ink           | `#302a22` | Text and controls           |
| Quiet ink     | `#62523e` | Secondary text              |
| Seal          | `#963c29` | Discovered labels and links |
| Division      | `#c8b99e` | Fine rules                  |

The unmodified scan supplies all manuscript texture, ink, seals, spacing, and corrections. Do not add procedural noise, replacement lettering, or filters to the base image. Reader cues and temporary discovery overlays quote continuous regions of the original.

A single `--reading-font` in `global.css` supplies Georgia and Chinese system serif fallbacks throughout current portfolio pages. There are no Manrope font requests or monospace metadata. Actual code retains a monospace stack.

| Role                   | Default size   | Treatment                       |
| ---------------------- | -------------- | ------------------------------- |
| Page title             | 40–64 px       | Regular, Latin tracking -0.02em |
| Reader title           | 32–44 px       | Regular, Latin tracking -0.02em |
| Main prose             | 16–18 px       | Line height 1.75–1.85           |
| Metadata and utilities | 14–15 px       | Same serif stack                |
| Chinese headings       | Same hierarchy | Normal tracking                 |

The project page uses one column of divided rows, with project identity beside its description on desktop and above it on phones. There are no tall empty cards or unrelated calligraphy illustrations competing with the original manuscript.

## Composition and motion

The opening has no visible header, footer, navigation, inventory, hint, or reveal counter. The scan spans the viewport height and overflows horizontally while keeping its original aspect ratio. The right opening columns are visible on arrival. The 蘭亭 region provides a concealed index in the initial phone viewport as well.

The Highlight button restores the earlier sourced 一觀 lettering on a transparent 44 px target. It sits in the lower right, moving to the upper right in short landscape viewports. A fine underline indicates the pressed state; there is no filled button or rectangle. Its pressed state places a 50% paper veil above the base image and below the twelve ink overlays, creating a clear dark-ink emphasis without recoloring the writing. A small sourced 昔 glyph appears beside the button and opens the eight past editions. It has an accessible name and hover title but no exposed printed label. Toggling the button off restores the original view and conceals the glyph. The toggle reports its state to assistive technology and is omitted without JavaScript.

Proximity within 34 px fades in dark source ink over 220 ms and restores the earlier 114% enlargement over 340 ms with `cubic-bezier(0.2, 0.7, 0.2, 1)`. The enlargement stays centered on the source region, including on short screens where the hit area is larger than the writing. A feathered copy of the same source paper prevents doubled strokes beneath the enlarged ink. There is no raised paper shadow or region outline. The emphasis filter rejects lighter paper and red seal pixels while preserving variation within dark strokes. Hover or keyboard focus reveals a single destination note below the enlarged region. In Highlight mode, unselected entries retain their original scale and position; only the hovered or keyboard-focused entry enlarges. Exiting restores the exact underlying scan; no persistent marks or progress badges accumulate.

A plain rectangular sheet expands from the selected position over 380 ms and returns over 240 ms. It has generous margins, a persistent close control, a small source cue, and calm reading text. There is no puzzle cutout, rotation, blur, or select-box inventory. Reduced motion removes the transitions.

The discovered Contents view groups research, experiments, and personal records. Language, source attribution, and existing history links follow the index. Long indexes scroll within the reader, while the close control stays reachable.

## Navigation behavior

A first opening pushes one `#read-<id>` browser history entry. Changing records or opening Contents replaces that entry. Back, Escape, and close return to the manuscript; Forward restores the reader. A direct shared URL closes without navigating away. The older `#collection` link remains an alias for Contents.

Touch taps open content directly. Horizontal touch and trackpad panning stay native; vertical mouse-wheel movement unrolls the manuscript. Ctrl-wheel zoom is not intercepted. Keyboard users retain a skip link, focus indications, a trapped dialog, and exact focus return. No-JavaScript visitors retain direct destinations and a static index.

## Evidence

`src/data/lanting.ts` records the original coordinates, including the 蘭亭 index region. Unit tests preserve the bitmap hash and reject overlapping or out-of-bounds regions. Browser checks exercise full viewport arrival, Highlight on/off, direct access to Past versions, every entry, reading history, direct links, all indexed content, both languages, focus recovery, touch, reduced motion, aligned ink emphasis, restored pixels, and no-JavaScript access.

Current captures are stored in `artifacts/manuscript-discovery/`. Earlier dated visual receipts describe earlier interfaces and do not define this direction. Archived websites retain their independent typography and behavior.
