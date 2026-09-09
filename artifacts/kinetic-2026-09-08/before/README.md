# Zibin Zhao

A bilingual personal website built with Astro and Three.js. The current local design is an open 3D collection of research, software, music, a miniature railway, and personal objects. Eight linked artifacts provide entry points; the Index provides direct navigation to all seven portfolio pages. Interior routes open as reading sheets over the spatial background.

The production address is [zibinzhao.com](https://zibinzhao.com/). A local redesign or successful build does not establish that production has changed.

## Development

Use Node 22.13 or newer in a supported even-numbered release.

```sh
npm ci
npm run dev
```

## Quality checks

```sh
npm run verify
npm run test:browser
npm audit
```

`verify` runs Prettier checking, ESLint, Astro type checking, Vitest, and the static build. Browser tests build and start their own local preview, check both locales at desktop and mobile sizes, scan accessibility, and exercise navigation, project filters, clipboard recovery, downloads, and text resizing. Install the browser once with `npx playwright install chromium` if required. Tests disable machine proxy variables in their own process because their server is on loopback. Astro 7's documented foreground setting lets Playwright manage the test server independently of a developer preview.

Run these checks against the current source and inspect the rendered result. Existing receipts under `docs/` describe their dated snapshots; they are not a pass result for subsequent changes. Automated accessibility scans do not certify conformance. WebGL appearance and speed depend on the browser, GPU, viewport, and motion preferences; local checks do not establish performance on every device or production field metrics.

See the [September 7 spatial verification receipt](docs/spatial-verification.md) for the current redesign's browser coverage, preserved content, visual artifacts, and measured mobile startup limits.

## Content and design

- [PRODUCT.md](PRODUCT.md): audience, scope, acceptance criteria, and authority.
- [DESIGN.md](DESIGN.md): current visual and interaction system.
- `src/lib/i18n.ts`: English and Chinese routes, labels, and page descriptions.
- `src/views/`: page content, built through `src/pages/[...route].astro`.
- `src/components/`: shared navigation, work cards, publications, and clipboard UI.
- `src/components/GalleryScene.astro`, `src/scripts/gallery-scene.ts`, and `src/styles/spatial.css`: the 3D field, projected artifact links, motion controls, and reading-sheet layout.
- `src/data/projects.ts`: curated work, links, and attributed contributions. Builds do not call GitHub.
- `src/content/publications/`: journal records and the standalone preprint. Keep earlier versions linked to the version of record.
- `src/data/cv.ts` and `src/data/prompts.ts`: CV entries and original English prompt text.
- [Content evidence ledger](docs/content-verification.md): sources and the boundaries of verification.

English routes are canonical at `/`, `/research/`, and similar paths. Chinese routes use `/zh/`. The language switch always links to the same page in the other language. No locale storage or client-side redirect is required.

The portfolio contains six projects, seven journal articles, one standalone preprint, and eight prompt stages with eleven original English prompt blocks. Keep the factual records and public destinations intact when changing their presentation.

The homepage supports dragging, another-angle and reset controls, and pause/resume. Reduced-motion preference starts the scene paused. HTML links and the native Index remain the navigation layer when JavaScript or WebGL is unavailable. Interior reading uses ordinary document scrolling.

## Images and exports

Astro builds responsive WebP images from `src/assets/`. Medit and Singularity previews are screenshots from their actual interfaces. The spatial field adds original local geometry, materials, and generated shadow textures. These objects are visual metaphors; they do not represent verified molecular structures or simulated application interfaces.

The export utility uses the installed Playwright package and accepts only a localhost or `127.0.0.1` preview URL. By default it writes both `public/cv.pdf` and `public/og.png`:

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 43219
node tools/generate-exports.mjs http://127.0.0.1:43219
npm run build
```

To refresh only the sharing image and leave the existing CV PDF untouched:

```sh
node tools/generate-exports.mjs http://127.0.0.1:43219 --og-only
```

The sharing export captures the real homepage at 1200 by 630 pixels, preserving its scene, labels, navigation, and controls. It fits the complete spatial field to that frame, starts with reduced motion, and waits for fonts, preview images, and an explicit scene `ready` or `fallback` state. A scene that remains loading makes the export fail instead of recording an unfinished view. The command reports whether it captured WebGL or the fallback; inspect that distinction when reviewing the result.

Review every generated CV page and the sharing image. Check text, reading order, page breaks, clipping, and the captured field before treating the export as complete. The CV uses the same content as the web page, plus print-specific styling. Do not maintain a separate duplicate CV template.

## Embedded applications

`public/medit/` and `public/singularity/` are separately built applications. The portfolio only curates their entry links and previews. When changing Medit's precached HTML, update its `index.html` revision in `sw.js` and test an existing-client update plus offline reload. Never describe a fresh-install-only check as update coverage.

## Deployment

The existing GitHub Pages workflow runs on pushes to `main`. This redesign currently authorizes local work and verification only. Production publication requires explicit authority. When an authorized change is successfully merged into `main`, push `main` to `origin`, allow deployment to propagate, and verify the live site separately. Historical design documents are superseded by the current product and design definitions.
