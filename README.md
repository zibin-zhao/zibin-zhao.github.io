# Zibin Zhao

A bilingual personal website built with Astro. The design follows [Grail](https://grail-app.com/): a black, oversized serif opening, floating double-sided work cards, lilac project stage and editorial content index. Each work opens real research or project content with working source links. The original orange mechanical archive trial is preserved in its separate source checkout.

Production is [zibinzhao.com](https://zibinzhao.com/). GitHub Pages builds and deploys the site when `main` is pushed, through `.github/workflows/deploy.yml`.

## Development

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 43222
```

Use Node 22.13 or newer in a supported even-numbered release. The fork uses a separate port from the original preview at 43220.

```sh
npm run verify
npm run test:browser -- --reporter=line
```

`verify` runs formatting, ESLint, Astro checking, seven unit tests and the static build. Browser tests use port 43218 and cover desktop/mobile content, both languages, real work details, paging, focus recovery, project selection, native navigation, accessibility scans, clipboard recovery, downloads, filters and narrow layouts. Previous archive/gallery tests remain historical files excluded by the current configuration.

## Canonical content

- `src/data/projects.ts`: six actual projects, localized text, contribution and destinations.
- `src/content/publications/`: seven journal papers and one independent preprint, with version relationships preserved.
- `src/data/cv.ts`, `src/data/profile.ts`: CV, identity and contact sources.
- `src/data/prompts.ts`: eight stages containing eleven unchanged English prompt blocks.
- `src/lib/i18n.ts`: fourteen page URLs and same-page language switching.
- `public/medit/`, `public/singularity/`: preserved local applications.

The home uses nine selected records through `buildArchiveLeaves`; this existing mapper supplies exact source content to the new cards, dialog and expandable index. Full publications, projects, CV, about, contact and prompts remain on their ordinary bilingual routes.

## Design and verification

See [DESIGN.md](DESIGN.md), [reference observations](docs/grail-design.md), [fork brief](docs/grail-fork-brief.md), [local verification](docs/grail-verification.md) and [release checks](docs/grail-release.md). Older archive and kinetic receipts describe earlier snapshots.

The new hero uses CSS perspective, authored SVG card artwork and native HTML rather than loading the previous Three.js scene. Fonts are self-hosted. Medit and Singularity previews use their actual application images. No Grail proprietary artwork, model, branding or code is bundled.

The 1200 × 630 social preview and two-page CV PDF are generated from the current build with `node tools/generate-exports.mjs http://127.0.0.1:43222`. Export checks include PDF reading order and rendered-page inspection. Local automated scans and browser checks do not establish behavior on every physical device; deployment and live verification are separate steps.
