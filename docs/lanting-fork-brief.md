# Lanting: discover the work inside the writing

Date: September 9, 2026.

## Canonical direction and scope

The user requested a new fork of the personal website with an opening screen filled by the Lanting Xu. Projects, a personal introduction, and other destinations should be inserted into the writing itself. All visible Chinese typography should carry Wang Xizhi's calligraphy. Visitors discover the insertions, hover to emphasize them and reveal puzzle-like edges, then click to read the full content.

This worktree is the new, independent implementation target. The calligraphy composition supersedes the photographic lake/forest journey and earlier gallery or Grail art directions within this fork only. Preserve factual content and useful accessible behavior from the current snapshot. Do not import the prior homepage composition into this direction.

- Worktree: `/Users/zibinzhao/.codex/worktrees/34ea/personal_webpage`
- Task: `01a0858a-4d28-7e41-b362-f8a7709c678a`
- Original checkout: `/Users/zibinzhao/Desktop/Projects/personal_webpage`
- Original checkout branch at fork creation: `codex/lantingxu`
- Original HEAD: `9962637e399f774d9b7b87855fbee0a6216938f4`
- The original checkout contains extensive uncommitted work and another active task. Make implementation changes only in this fork. Verify the copied source before starting. If the fork remains detached, create a distinct `codex/` branch here without moving the source branch.

Implement and verify a local preview. No merge, push, deployment, paid asset purchase, or new credential setup is authorized by this request.

## Composition

The first viewport should feel like being close to one continuous calligraphic sheet: warm paper, black ink, natural variation in spacing and stroke density, vertical columns, and restrained seal-red details where useful. Calligraphy must fill the view while retaining believable proportions and readable strokes. Avoid repeated wallpaper tiles or stretching a scan to fit an arbitrary aspect ratio.

Insert short Chinese project cues and introduction fragments into selected columns or between phrases. Match their scale, ink, baseline irregularity, and paper treatment to the surrounding writing. At rest they should belong to the composition. The inserted words must carry meaning and link to actual work; an untouched background image with unrelated cards on top will not meet the request.

Preserve the source artwork and transcript separately. Keep an explicit content map that identifies authored insertions and their true destination so the contemporary composition is not represented as an unchanged historical transcription.

## Interaction

1. Arrival: show the full-screen calligraphic composition with a subtle invitation to explore.
2. Discovery: pointer proximity and keyboard focus bring one text fragment forward. Intensify its ink and introduce a fine, irregular puzzle or cut-paper contour around the fragment. Give the fragment a small physical lift while preserving its relation to the writing.
3. Opening: clicking the fragment expands that same paper piece into a readable content view with the true project name, existing description, source links, and actions. Keep the originating location perceptually connected to the expanded piece.
4. Return: closing the view restores the sheet, scroll position, and keyboard focus. Escape must work.
5. Assistance: include a quiet reveal/index control, provisionally described as '显影', that exposes destinations without dominating the initial composition. Do not require visitors to solve every clue or find a particular first target.

For touch, use an explicit selection/opening behavior and the reveal control; do not depend on hover. Ensure usable target areas and a clear selected state. Keep accessible HTML names and destinations, keyboard operation, reduced motion, and no-JavaScript navigation. Preserve scroll and focus behavior on mobile.

## Typography and source investigation

Treat Wang Xizhi calligraphy as a central acceptance criterion for the visible Chinese text, including inserted project words. Investigate the actual source and character coverage before scaling the page. Prefer attributable reproductions and verified glyph extraction or an appropriately licensed calligraphy font. Do not describe a modern imitation, unrelated handwriting font, or AI-generated lettering as actual Wang Xizhi characters.

Sources checked by the parent task on September 9, 2026:

- Palace Museum, *Feng Chengsu's copy of the Lanting Xu*: https://www.dpm.org.cn/collection/handwriting/228279.html . This identifies the reproduction and supplies a visual reference. It is not by itself permission to redistribute every downloaded asset.
- National Palace Museum, *Dingwu Lanting*: https://digitalarchive.npm.gov.tw/Collection/Detail/14853?dep=P . The catalog search result includes an attribution/license notice. Inspect the exact downloadable image and its terms before reuse.
- Founder, *Wang Xizhi Running Script*: https://www.foundertype.com/index.php/FontInfo/index/id/6716 . The official page identifies a GBK simplified/traditional character set and lists distinct authorization categories. This is a candidate to evaluate, not an acquired or approved license. Do not download from unverified mirrors or buy a license without authority.

If a complete suitable font cannot be sourced, continue with the sourced calligraphy and independently implement the discovery/open/close interaction. Report the specific remaining character or font limitation honestly. Do not quietly replace the all-calligraphy requirement with a generic serif font and call the result complete. Maintain true Latin project names, factual citations, and identifiers in the accessible content layer rather than inventing Chinese names for the person or scholarly records.

Save source URLs, exact artwork identity, attribution and license evidence, character coverage, and any transformations in an asset note in this fork. Reuse supported image-editing tools according to their instructions.

## Current content and behavior contracts

Live-inspected source files are authoritative over historical gallery memory. The fork snapshot's `PRODUCT.md`, `README.md`, `src/data/`, `src/content/publications/`, `src/lib/archive-content.ts`, `src/views/`, and tests describe the existing contracts.

- Preserve fourteen bilingual portfolio URLs and all six projects: CasMD, DL-SELEX, Medit, TEMPO, Singularity, and Yaos.
- Preserve the eight publication records and their exact author, title, DOI, and article/preprint relationships. This is UI work, not a scientific rewrite.
- Preserve the CV PDF, prompt stages and original English source blocks, contact destinations, and `/medit/` and `/singularity/` applications.
- Preserve real links, language continuity, native scrolling, usable reading content, and keyboard navigation. The current profile identifies the person as Zibin Zhao. Do not invent a Chinese name.

## Execution and observable checks

First build a small working calibration slice with authentic calligraphy, at least one inserted project fragment, the hover/focus contour, and opening/closing content. Inspect it at desktop and phone widths. Use that evidence to refine the material and type treatment, then finish the page without an additional approval gate unless a real source, correctness, cost, or authority decision requires it.

Use the existing Astro/data/reader layers where they help. Prefer maintainable HTML, CSS, and SVG for the interaction. Apply the new art direction coherently to the reading experience without changing canonical facts. Update this fork's product/design documentation to describe the final direction and distinguish it from the inherited nature receipts.

Run `npm run verify` and `npm run test:browser` as applicable to the changed surface. Preserve valid content, navigation, and accessibility checks; replace obsolete visual-direction assertions only when justified by the new requested behavior. Verify hover/focus, click, touch, reveal, Escape, focus return, meaningful project destinations, font loading, responsive composition, reduced motion, and no-JavaScript access. Inspect actual screenshots of the closed sheet, discovered fragment, and expanded view.

Use a preview port separate from other active personal-site tasks. Deliver the local preview URL, useful screenshots, the implementation and source notes, and actual check results. Clearly state any typography gap or untested surface. Local verification does not establish publication or a live production deployment.
