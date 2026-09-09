# Follow a curiosity

Canonical direction for the September 9, 2026 Grail fork. This replaces the orange mechanical archive composition in this worktree. The original checkout and preview remain separate.

## Reference and adaptation

[Grail](https://grail-app.com/) was inspected in the in-app browser on desktop and mobile. Its black opening, oversized serif headline, floating two-sided cards, lilac transitions, editorial typography and selectable centerpiece guide the composition. The personal site substitutes real research, software and interests for Grail's quests and totems. The reference's proprietary typography, models, artwork and branding are not bundled.

The opening shows the name across the viewport and nine work cards in perspective. White fronts expose real titles and concise source text. Patterned backs use authored motifs related to each work. The hero follows pointer and scroll input; subtle card movement can be paused. The next large typography leads into a lilac project stage, a light expandable work index, and a black contact ending.

## Tokens

- Black `#000000`, white `#f6f5f2`, lilac `#e9c8f2`.
- Artwork uses olive `#514b30`, cobalt `#294fe5`, and ochre `#dfc458` with red `#ad3b26`.
- Self-hosted Bodoni Moda is the display face; Manrope supplies readable copy. Chinese display uses Songti/serif fallbacks.
- Spacious display type and varied scale carry the composition. Avoid adding uniform marketing tiles or invented achievements.

## Content and interaction

Every hero card is a native link enhanced into a modal work reader. The reader includes exact source text, contribution or authors, all source links, previous/next, keyboard arrows, close and Escape. Focus wraps within the modal and returns to its exact opener. Modifier clicks retain normal browser link behavior.

The six-project stage changes its artwork, title, description and destination on selection. The work index uses native details and exposes all nine entries without JavaScript. The complete portfolio retains fourteen bilingual page URLs, six projects, seven journal articles, one independent preprint, eight prompt stages and eleven original prompt blocks. Public Medit and Singularity applications are preserved.

The card art is symbolic decoration, not scientific evidence. Medit and Singularity previews are actual application screenshots. No new bibliographic claims, contribution claims, metrics or sequence data are authored for this redesign.

## Responsive and motion behavior

Mobile retains a readable central work card with surrounding cards, and the complete collection below. Two outer cards are omitted from the mobile hero composition; all nine remain available through the reader and native index. Hover effects apply only to hover-capable pointing devices. Navigation, modal controls and links retain visible keyboard focus.

CSS 3D transforms keep text crisp without a homepage WebGL dependency. Card surfaces animate independently of their link hit areas. Reduced motion disables continuous movement and starts the pause control in its paused state. Native navigation, expandable index entries and prompt disclosures work without JavaScript. The enhanced modal and project selector require JavaScript.

## Implementation

- `src/views/Home.astro`: semantic home content, perspective work links, project stage, native index and dialog.
- `src/components/WorkArtwork.astro`: nine authored front/back SVG families.
- `src/styles/grail.css`: current visual system and responsive overrides.
- `src/scripts/grail.ts`: input-driven depth, motion preference, project selection and modal lifecycle.
- `src/lib/archive-content.ts`: reused canonical source mapping. Its historical name does not imply the old visual direction.
- `src/layouts/SiteLayout.astro`: common metadata and current navigation, without the old WebGL backdrop.

Old archive components and receipts remain historical files and are not imported by the current layout/home. Browser configuration excludes those obsolete visual tests and retains the full content/route/accessibility suite plus the new Grail behavior suite. See `docs/grail-verification.md` for actual results and limits.
