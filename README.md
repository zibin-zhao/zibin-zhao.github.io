# Zibin Zhao, between the lines

A bilingual Astro portfolio with a full-viewport Lanting Xu discovery interface. Original words respond to exploration and open a book-like reading sheet. One Highlight button, lettered with the earlier sourced 一觀 glyphs, brings out hidden words in dark ink while the surroundings soften. A small sourced 昔 glyph provides access to Past versions only while Highlight is active. Names appear individually on hover or keyboard focus. Contents and language controls are also discovered inside the 蘭亭 words.

Production address: [zibinzhao.com](https://zibinzhao.com/). Merges into `main` are published through the existing [GitHub Pages workflow](https://github.com/zibin-zhao/zibin-zhao.github.io/actions/workflows/deploy.yml).

## Development

Use Node 22.13 or newer in a supported even-numbered release.

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 43235
npm run verify
npm run test:browser
```

Static verification runs formatting, lint, Astro checks, unit tests, and the build. Browser tests use a separate preview on port 43229. Run the build first. Install test browsers with `npx playwright install chromium webkit` if needed. The final tests exercise desktop Chromium, phone Chromium, and the calligraphic interface in phone WebKit.

## Implementation

- `src/views/Home.astro`: the intact manuscript, thirteen server-rendered reading records, and the Past versions list.
- `src/components/ReadingIndex.astro`: the discovered Contents view and no-JavaScript fallback.
- `src/components/InkText.astro`: collected-character UI lettering outside the manuscript.
- `src/data/lanting.ts`: source dimensions and twelve original-word interaction regions.
- `src/styles/lanting.css`: the scroll viewport, transparent contours, discovery, and reading.
- `src/scripts/lanting.ts`: Highlight, proximity, mouse-wheel panning, reader history, transitions, and focus restoration.
- `src/lib/archive-content.ts`, `src/data/`, and `src/content/publications/`: retained factual content.

See [product direction](PRODUCT.md), [design](DESIGN.md), [source notes](docs/lanting-assets.md), and [current verification](docs/manuscript-discovery-verification.md). Earlier dated archives describe previous implementations.

## Past designs

On the homepage, Highlight reveals a small 昔 glyph that opens all eight design families by name and date. Its accessible name and hover title identify Past versions. The discovered index and inner-page footers also retain their numbered history links. Each family is represented by its final recoverable revision. The original eighteen snapshots have been consolidated, from the watercolor portrait to the Grail design. Each edition can be browsed inside a simple viewer or opened as its own page. English and Chinese archive routes retain a return to the current site. Historical words remain part of the historical design.

`tools/past-designs.json` is the edition catalog. `tools/archive_past_designs.py` restores sources in the ignored `.worktrees/past-designs/` directory and exports static replays into `public/past-designs/`. The normal site build uses those retained exports and does not rebuild every historical source. Archive assets load only when an edition is opened.

See [the archive inventory and recovery notes](docs/past-designs.md) for exact commits, snapshot recipes, dependency setup, adjustments, and verification evidence.

## Content and typography

Fourteen bilingual portfolio routes, six projects, seven journal articles and one standalone preprint, eight prompt stages, eleven original prompt blocks, CV PDF, contact destinations, and both embedded apps are retained. Without JavaScript the entry anchors keep their real destinations and the full index remains available.

Calligraphy uses a public-domain reproduction of Feng Chengsu's copy after Wang Xizhi. The resting manuscript renders that image once, without text masks, rearranged columns, replacement lettering, or color filters. Its existing words, spacing, corrections, and seals stay in place. Highlight uses source-aligned ink overlays with a reversible paper veil underneath. Approaching, hovering, or focusing a word temporarily enlarges it to 114% with stronger ink and softly blended source paper, then restores the original view on exit. Separate UI controls and reading cues also use source windows. The reading layer uses one Georgia and Chinese system serif stack throughout. Font availability determines the exact fallback on each operating system. Handwriting remains confined to the original image and its source cues.

The September 10 source-fidelity correction supersedes the earlier gathered-character manuscript. See [the audit and regression checks](docs/lanting-fidelity.md).

## Release workflow

The current production CV PDF and embedded application bundles are preserved. The sharing image is captured from the Lanting homepage. Before a release, run the static and browser checks, merge into `main`, push `main`, and verify the resulting GitHub Pages deployment and live routes. The dated local verification documents describe the checks completed before publication.
