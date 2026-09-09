# Past designs

Updated locally on September 9, 2026, in `codex/lanting-paper`.

The archive presents eight design families. Each family uses its final recoverable revision. This replaces the original eighteen-snapshot selection, which exposed multiple stages of the same design. The current Lanting design remains the return destination.

## Selection and consolidation

The selection follows the visual direction and development sequence. A different portrait, paper treatment, or added interaction within the same direction does not create another numbered version. The spatial gallery remains separate from the leaf-turning instrument because their composition and primary interaction differ.

Dates identify the final captured revision or source snapshot. Original snapshot IDs remain stable for asset provenance; visible numbering is consecutive from one to eight.

| No. | Design           | Original snapshots | Final snapshot  | Date       | Canonical input                                   |
| --- | ---------------- | ------------------ | --------------- | ---------- | ------------------------------------------------- |
| 1   | Watercolor       | 1, 2, 3            | `03-watercolor` | 2026-07-01 | Git `7989978dad71bb6cc3a6f1054feb7e726d1e12fb`    |
| 2   | Paper playground | 4, 5, 6, 7, 8, 9   | `09-paths`      | 2026-07-14 | Git `678958b12903344aff75edbcd54e34d3af5b4d03`    |
| 3   | Night voyage     | 10                 | `10-night`      | 2026-08-29 | Git `9962637e399f774d9b7b87855fbee0a6216938f4`    |
| 4   | Dark collection  | 11, 12             | `12-dark`       | 2026-09-05 | Kinetic baseline plus gallery-before snapshots    |
| 5   | Open collection  | 13                 | `13-gallery`    | 2026-09-07 | Kinetic-before source snapshot                    |
| 6   | Turning leaves   | 14, 15             | `15-archive`    | 2026-09-08 | Nature-before source archive                      |
| 7   | Lakeside journey | 16, 17             | `17-journey`    | 2026-09-09 | Journey-before source plus Lanting-entry overlays |
| 8   | Grail            | 18                 | `18-grail`      | 2026-09-09 | Git `b0576ba502248e6fa0f03725a250ea7598a54de8`    |

Four selected editions come from Git revisions, and four from saved source snapshots. The Git history was checked through `b0576ba`; the selected Git revisions are the final captured website versions before their respective visual direction changed. The inventory does not claim to recover deleted work for which no source remains.

Exact snapshot inputs:

- Dark collection: `artifacts/kinetic-2026-09-08/before/` plus `artifacts/gallery-2026-09-07/before/`.
- Open collection: `artifacts/kinetic-2026-09-08/before/`.
- Turning leaves: `artifacts/nature-2026-09-09/before.tgz`.
- Lakeside journey: `artifacts/journey-2026-09-09/before.tgz`, then `artifacts/lanting-2026-09-09/inherited-nature-source.tgz` and `artifacts/lanting-2026-09-09/before.tgz`.

The earlier eighteen-entry catalog is preserved in `artifacts/past-designs-2026-09-09/deduplicated/original-catalog.json`. Ten superseded generated websites were moved from `public/past-designs/` into that artifact directory's `superseded-exports/`. Original Git revisions, source snapshots, screenshots, and per-edition export manifests remain intact.

## Placement and behavior

The footer contains a small `Past designs` / `往昔` row with `1 | 2 | ... | 8`. Accessible labels and hover titles carry the final edition's name and date. The row sits below the manuscript and complete index; archive assets load only after selection.

Each number opens `/past/<edition>/` or `/zh/past/<edition>/`. A separate iframe displays the restored site's fonts, layout, motion, and reading pages. Utility strips provide previous/next versions, the date, a full-page option, and return to the current portfolio. The selected number remains visible on narrow screens. Navigation works without JavaScript.

The twenty former English and Chinese viewer URLs redirect to their family's final version. For example, `/zh/past/01-poster/` now opens `/zh/past/03-watercolor/`. This also keeps the previously shared archive link useful. Superseded snapshots no longer appear in either navigation list or the public replay directory.

Only one old site is loaded at a time. The selected exports contain 393 files, including 93 HTML files, totaling 26,149,818 bytes. The normal homepage does not preload them.

## Recovery and export

`tools/past-designs.json` is the selected catalog. Each entry's `supersedes` list maps earlier viewer URLs to the final version. `tools/archive_past_designs.py` prepares isolated source copies under `.worktrees/past-designs/` and exports selected replays into `public/past-designs/`. Regular builds use those retained exports and do not need historical dependencies.

To regenerate the archive, prepare two isolated runtimes. Use `package.json` and `package-lock.json` from Git `9962637` for `.worktrees/past-designs/legacy-runtime/`, and from `b0576ba` for `modern-runtime/`. Run `npm ci --ignore-scripts --no-audit --no-fund` inside each runtime. The retained exports were built with legacy Astro 6.4.8 and modern Astro 7.3.1. The current application's dependencies were not changed for recovery.

```sh
python3 tools/archive_past_designs.py
python3 tools/archive_past_designs.py --only 15-archive
python3 tools/archive_past_designs.py --only 15-archive --export-only
npm run verify
npm run test:browser -- past-designs.spec.ts --project=desktop --project=mobile
```

The helper replaces its selected generated source and export directories. Original source archives remain authoritative. Each retained `*-export.json` records source and output hashes. The original source check for the kinetic and turning-leaf versions remains in `artifacts/past-designs-2026-09-09/source-recovery-check.json`.

Export adjustments are limited to the static namespace and archive context. Local assets and pages use edition-specific URLs with explicit `index.html` entry files. Replays have noindex metadata and a standalone return link; current-production canonical/alternate links are removed. The return link hides when embedded. Existing Medit and Singularity apps remain current shared destinations. Legacy GitHub loaders use their captured offline fallback where supported.

Historical wording is preserved. External destinations may have changed. This archive does not revalidate historical factual or scientific claims. Viewer pages and redirects are excluded from the current fourteen-URL sitemap.

## Verification

Current consolidation evidence is retained under `artifacts/past-designs-2026-09-09/deduplicated/`. The pre-consolidation reports remain in the parent directory and describe the previous eighteen-entry selection.

Local verification passes formatting, ESLint, Astro diagnostics, seven unit tests, and the 31-page build. Twenty additional redirect files map the former viewers to their final editions. The static check verified 1,587 local references with no missing files, and all selected historical export hashes remain unchanged.

The latest outcomes for all 28 distinct browser cases pass: twelve desktop Chromium cases, twelve mobile Chromium cases, and four iPhone WebKit navigation smoke cases. Coverage includes the eight consecutively numbered final editions, selected homepage assets, previous/next wrapping, return links, standalone reading, no-JavaScript navigation, and narrow-screen layout. The full former-URL mapping is checked statically; an earlier portrait URL is also followed in the no-JavaScript browser case. Desktop and mobile footer captures were visually inspected. Desktop footer spacing keeps the final numbers clear of the fixed discovery controls.

The first night-voyage chapter check raced the original page's 250ms resize initialization. The test now allows that startup to settle before clicking, and the focused desktop and mobile checks pass. The original historical script is unchanged. Its initial trace and all test reports are retained, with the latest case inventory in `verification-summary.json`.

Automated accessibility checks cover the new viewer, excluding historical iframe content. WebKit coverage does not encompass all eight historical sites. No claim is made about every old interaction or external destination.

No merge, push, or deployment was performed.
