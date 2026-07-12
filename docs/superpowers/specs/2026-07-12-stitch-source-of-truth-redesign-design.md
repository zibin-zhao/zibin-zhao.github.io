# Stitch Source-of-Truth Portfolio Redesign

**Owner:** Zibin Zhao  
**Date:** 2026-07-12  
**Status:** Approved design; awaiting written-spec review

## 1. Objective

Redesign the portfolio so the downloaded Stitch project is the single visual and motion source of truth. The homepage must reproduce the spatial proportions, negative space, rotations, overlap, hierarchy, fixed footer, imagery, and animation language shown in:

- `/Users/zibinzhao/Downloads/stitch_zibinzhao.com/screen.png`
- `/Users/zibinzhao/Downloads/stitch_zibinzhao.com/code.html`
- `/Users/zibinzhao/Downloads/stitch_zibinzhao.com/DESIGN.md`

Existing Astro content and functionality remain authoritative for factual content, working destinations, bilingual copy, collections, CV data, and Prompts behavior. They must not force the homepage back into its current long-form chapter layout.

## 2. Authority Order

When sources differ, use this order:

1. `screen.png` governs visible composition, scale, spacing, overlap, card placement, and visual hierarchy.
2. `code.html` governs animation names, timings, easing, interaction behavior, labels, and structural intent.
3. `DESIGN.md` governs tokens, typography roles, component treatment, shape language, and responsive principles.
4. Existing Astro data and content govern facts, bilingual text, URLs, publication/project completeness, downloads, and application behavior.

Do not copy production defects from the Stitch export. Tailwind CDN, Google font/icon runtime dependencies, placeholder `href="#"` links, missing reduced-motion behavior, invalid heading structure, and content-obscuring behavior are implementation artifacts rather than design requirements.

## 3. Chosen Architecture

Rebuild the Stitch composition in the existing Astro application. Do not embed `code.html`, add React, or add a Tailwind runtime.

The homepage becomes a dedicated Stitch canvas containing only the sections represented in the source:

1. Header and atmosphere
2. Hero
3. Three selected research cards
4. Vibe Codings mosaic
5. Fixed footer dock and marquee

Existing About, full Research, Projects, CV, Contact, and Prompts content move to dedicated Index Sheet routes. This preserves functionality without changing the proportions of the Stitch homepage.

## 4. Route Model

### `/`

The canonical Stitch homepage. It contains the Hero, selected Research, Vibe mosaic, header, background atmosphere, fixed footer links, social links, marquee, and draw control.

### `/about/`

A research-profile Index Sheet containing the full bilingual biography and focus areas.

### `/research/`

The complete publication archive, including all current publications, authors, venues, dates, featured state, and available DOI/PDF/code links. The homepage still displays only the three Stitch-selected publications.

### `/projects/`

The complete research-project archive for CasMD/HsingMD, DL-SELEX, TEMPO, and ECG App.

### `/cv/`

The complete bilingual CV index, skills, and downloadable `/cv.pdf`.

### `/contact/`

Email and all current social destinations.

### `/prompts/`

The existing prompt archive with all stages, copy controls, fallback clipboard behavior, sticky stage navigation, scroll-spy, and return links.

## 5. Header

Match the Stitch header rather than the current enhanced Index menu.

- Left: physical paper label `ZIBINZHAO.COM · UNFINISHED INDEX / 未完成索引`.
- Right: bilingual switch and `LET'S TALK / 联系我` button.
- No desktop Index disclosure button.
- Header is sticky as in the source and remains above decorative layers.
- Contact action uses the existing profile email.
- Language choice persists through the existing local-storage behavior on every route.
- Fonts remain locally loaded.

## 6. Canonical Homepage Composition

### 6.1 Canvas and atmosphere

- `768px` wide full-page rendering is the canonical geometry reference because it matches `screen.png`.
- The content canvas uses a warm graph-paper substrate with a 20px grid.
- Desktop and wide screens center a bounded canvas instead of stretching offsets indefinitely.
- Two vertical dashed guide lines sit at 15% from the left and 24% from the right, matching the authored Stitch values and reference image.
- Green and orange organic blobs remain behind content.
- Formula, optimization note, and punctuation annotations retain their reference positions, rotations, and opacity.

### 6.2 Hero

- Preserve the large empty research-canvas feeling before content density increases.
- `ZIBIN / ZHAO` uses the reference left-side placement, scale relationship, overlap, and color split.
- The collaboration sticker uses the reference rotation and upper-center position.
- The Bioengineering × AI card is centered lower in the hero, with the reference width, thin content padding, border, rotation, and 8px block shadow.
- Use the Stitch rollercoaster/cart image rather than the current portrait.
- Preserve the formula note near the card and the green scroll sticker beneath it.
- Existing English and Chinese role/tagline content remain functional through the language switch.

### 6.3 Featured Research

The homepage renders exactly three featured publications in the Stitch geometry:

1. Nature Biotechnology card: widest card, right offset, circular orange index marker.
2. Briefings in Bioinformatics card: narrower left card, overlaps the first card vertically.
3. ECG transformer review: compact dashed card centered below.

Use current collection data and links. The section banner uses the large Anton treatment, green fill, rotated placement, and green hard shadow shown in the reference. A separate `Selected work / 代表性成果` annotation stays beside the banner.

### 6.4 Vibe Codings

The Vibe section uses the exact source order and mosaic roles:

1. CasMD: large image-led primary card.
2. Singularity: dark-green image-led overlapping card.
3. Medit: text-led card without the current large screenshot.
4. Yaos: compact lower-left card.
5. Zen / Zende: compact lower-right dashed card.

The opening `LOL` note and orange `04 — Vibe Codings` banner use the source positions and proportions. Current factual links and bilingual content remain authoritative even when card copy differs from the Stitch mockup.

Use the exact Stitch imagery. Prefer downloading verified images into `public/stitch/`; if downloading is not possible, retain the verified source URL with intrinsic dimensions, alt text, and a designed fallback.

## 7. Fixed Footer Dock

Restore the complete Stitch footer composition:

- Bottom-left stack: GitHub, Hugging Face, Scholar.
- Bottom-right group: About, Research, Projects, Vibe, CV, Contact.
- Bottom marquee: `molecules ↔ models ↔ small habits ↔ field notes ↔ tools for care`.
- Bottom-right red draw control: opens `/prompts/` and has an accessible text label.

Working destinations:

- About → `/about/`
- Research → `/research/`
- Projects → `/projects/`
- Vibe → `/#vibe`
- CV → `/cv/`
- Contact → `/contact/`
- Draw → `/prompts/`

The footer remains fixed on desktop because that is part of the source composition. Page content reserves enough bottom space that links and cards are never hidden behind it.

## 8. Stitch Motion Contract

All Stitch motion is required in normal mode. Do not substitute current or newly invented effects.

### Background movement

- `.animate-parallax-slow`: `20s linear infinite alternate` on the slow drift line.
- `.animate-parallax-fast`: `15s linear infinite alternate` on the fast drift line.
- `.animate-float`: `6s ease-in-out infinite` for floating annotations.
- `.blob`: `morph 8s ease-in-out infinite both alternate`.

### Content entry

- `fadeUp`: from `opacity: 0; translateY(20px) scale(.95)` to visible/resting state.
- Duration: `.6s ease-out`.
- Stagger delays: `.1s`, `.2s`, `.3s`, `.4s`.

### Interactions

- Primary buttons: `.15s ease` physical press; shadow collapses and control translates `4px, 4px`.
- Publication hover: `.3s cubic-bezier(.25, .8, .25, 1)`; shadow grows to 8px, card moves `-4px, -4px`, and rotates to `1deg`.
- Publication search mark scales to `1.2` and changes accent on hover.
- Footer label hover: `glitch-skew .3s cubic-bezier(.25, .46, .45, .94) infinite`.
- Marquee: `20s linear infinite` moving the complete tape text across the viewport.
- Draw control rotates from `-12deg` to `12deg` on hover.

### Motion accessibility

`prefers-reduced-motion: reduce` provides a static version of the same composition:

- Drift lines and annotations remain in their resting positions.
- Blobs retain a single shape.
- Entry content is immediately visible.
- Marquee remains readable as a static tape.
- Hover/press controls retain visible state changes without animated travel.

This fallback does not change the required normal-mode motion contract.

## 9. Index Sheet Design

The independent pages use the same Stitch header, atmosphere, footer dock, grid, typography, strokes, rotations, and motion vocabulary.

They do not attempt to duplicate the homepage mosaic. Each page is one large physical index sheet or archive arrangement optimized for its content:

- About: researcher dossier with focus chips and bilingual biography.
- Research: staggered evidence archive, with featured cards first and remaining papers as compact dashed records.
- Projects: four experiment boards in an asymmetric 12-column layout.
- CV: chronological paper index plus a skills/download block.
- Contact: dark-green high-contrast contact poster with social labels.
- Prompts: long-form archive with square stage cards and restrained offsets.

All Index Sheet pages reserve footer space and expose a visible route back to the homepage.

## 10. Responsive Behavior

### Canonical and desktop

- `768px` full-page output must closely match `screen.png`.
- At wider sizes, keep a centered bounded canvas and scale spacing conservatively.
- Preserve the reference's asymmetric offsets rather than converting cards into an even grid.

### Tablet

- Maintain the 12-column relationships where cards remain legible.
- Reduce overlap only when it would cover interactive content.
- Preserve rotation, hard shadows, annotations, and footer identity.

### Mobile

- Use a controlled single-column stream while keeping the original card order.
- Preserve modest rotation and intentional overlap between adjacent cards.
- Convert footer navigation and social labels into horizontally scrollable physical-label rails above the marquee.
- Respect `env(safe-area-inset-bottom)`.
- Maintain at least 40px clustered targets and prevent horizontal page overflow.

## 11. Component Boundaries

- `StitchShell.astro`: shared header, atmosphere, footer dock, metadata, and page bottom reserve.
- `StitchHeader.astro`: site label, language toggle, and contact action.
- `StitchAtmosphere.astro`: guide lines, blobs, floating annotations, and decorative motion.
- `StitchFooterDock.astro`: navigation, social links, marquee, and draw control.
- `StitchHero.astro`: homepage hero composition only.
- `FeaturedResearch.astro`: three-card homepage research composition sourced from the collection.
- `StitchVibe.astro`: five-card homepage mosaic sourced from the Vibe collection.
- `IndexSheet.astro`: shared surface and page-title treatment for supporting routes.
- Existing data/content modules remain separate from layout components.

Component-specific CSS may define geometry, but shared colors, fonts, strokes, shadows, motion timing, safe areas, and breakpoints belong in semantic tokens/shared styles.

## 12. Data and Interaction Flow

- Astro collections are loaded at build time and sorted deterministically.
- Homepage research selects the three named featured records by stable content identity rather than array position alone.
- Homepage Vibe maps named records to fixed visual roles so future collection additions do not silently alter the canonical mosaic.
- Index Sheet routes render complete collections.
- The language switch changes `data-lang`, updates the document language, and persists the choice.
- Prompts copy and scroll-spy remain scoped to `/prompts/`.
- All footer, social, download, mail, and project actions are real links and work without JavaScript.

## 13. Failure and Progressive-Enhancement Behavior

- The English version is usable when JavaScript is unavailable.
- Navigation, external links, mail, CV download, and all routes remain ordinary anchors.
- CSS animations may run without JavaScript; essential content never depends on an observer to become visible.
- Broken or unavailable images retain card dimensions and show a designed fallback.
- Missing optional publication links are omitted without leaving empty action regions.
- Fixed footer content never intercepts the main canvas outside its visible controls.

## 14. Accessibility and Performance

- Preserve one `h1` per page, logical heading levels, landmarks, skip links, and keyboard order.
- Text and non-text focus indicators meet WCAG AA/non-text contrast requirements.
- Decorative layers are `aria-hidden` and `pointer-events: none`.
- External links use safe `rel` values.
- Images define width/height to prevent layout shift and use lazy loading below the fold.
- Use local Fontsource packages and local images where possible.
- Animate transform/opacity rather than layout properties.
- Keep decorative node counts fixed and small.

## 15. Tooling and Verification

Add production-quality checks that the current repository lacks:

- Astro type checking through `astro check`.
- ESLint with Astro/TypeScript support.
- Existing Vitest suite plus new deterministic tests for homepage selection/order, route links, motion contract, semantic structure, and no-JS visibility.
- Astro production build.
- `git diff --check`.

Browser verification covers:

- `/`, `/about/`, `/research/`, `/projects/`, `/cv/`, `/contact/`, `/prompts/`.
- Canonical `768px` full-page screenshot comparison with `screen.png`.
- Wide desktop, tablet, and `390px` mobile.
- Bilingual switching and persistence.
- Footer and social destinations.
- Contact mail action and CV download.
- Prompts copy, fallback copy, stage links, and scroll-spy.
- Normal Stitch animations and reduced-motion behavior.
- Keyboard operation, focus visibility, headings, landmarks, image loading, console errors, failed requests, and horizontal overflow.

## 16. Release Workflow

Implement on an isolated `codex/` feature branch. Use incremental commits and review gates. After all automated/browser checks and whole-branch review pass:

1. Merge into `main`.
2. Re-run tests, lint, type checking, and build on merged `main`.
3. Push `main` to `origin`.
4. Wait for GitHub Pages deployment.
5. Verify the live homepage and every supporting route.

## 17. Explicit Non-Goals

- Do not preserve the current long homepage chapter sequence.
- Do not preserve the current Index disclosure menu.
- Do not keep the current portrait in the hero.
- Do not add motion that is absent from Stitch.
- Do not add React, Tailwind runtime/CDN, Google font runtime dependencies, or Material Symbols runtime dependencies.
- Do not alter scientific claims, publication metadata, project destinations, CV facts, or social destinations merely to match mockup placeholder copy.
