# Playful Researcher Portfolio Refinement

**Owner:** Zibin Zhao
**Date:** 2026-07-13
**Status:** Approved for implementation

## Objective

Refine the Stitch-authored homepage without replacing its visual source of truth. The result must retain the research-first graph-paper canvas, hard shadows, rotation, asymmetric overlaps, bilingual behavior, and fixed desktop identity while making the mobile and tablet experience legible, honest, accessible, and more personally expressive.

## Approved Direction

The voice is a playful researcher: scientific credibility comes first, and personal interests add warmth near the end of the journey. The work covers all four critique issues, with mobile usability and legibility taking priority over preserving exact small-screen geometry.

## Responsive Navigation

- Desktop above 700px keeps the fixed social rail, route rail, marquee, and Prompts control.
- At 700px and below, the footer becomes a normal-flow closing dock after the homepage content. Social and route labels wrap instead of scrolling or clipping.
- The mobile dock remains visually physical and tactile, but it must not cover hero, research, Vibe, or closing content.
- Supporting routes receive the same normal-flow mobile dock so their final content remains reachable without a permanent viewport obstruction.
- The Prompts control keeps a visible text label on mobile while retaining the red draw-disc treatment.

## Typography

- Preserve Anton for display, Space Grotesk for body copy, and JetBrains Mono for labels; these are part of the established identity.
- Tablet metadata and actions use a minimum 0.75rem (12px) size; compact secondary labels may use 0.6875rem (11px) only when they are not interactive.
- Mobile supporting body copy uses at least 0.875rem (14px). Interactive labels have a minimum 44px hit area regardless of visible text size.
- Darken the outline token enough for WCAG AA small-text contrast against the paper surface.
- Preserve composition by shortening copy and easing overlap rather than shrinking text below the floor.

## Honest Card Interaction

- Every linked research and Vibe card exposes one primary stretched link through its title and surface.
- Secondary DOI, PDF, code, or project links remain independently focusable above the stretched link.
- Card-wide hover and focus-within feedback is allowed only for cards with a primary destination.
- All interactive controls provide at least a 44×44px target for coarse pointers.
- Card semantics and source order remain unchanged; JavaScript is not required for navigation.

## Copy and Information Architecture

- Homepage section headings become visitor-facing labels without unexplained `02` and `04` numbering. Numbered Index Sheet routes keep their archive numbering.
- Replace self-conscious framing with playful but direct language: “Vibe Codings” becomes “Side Quests,” and the introductory note describes experiments built beyond core research.
- The hero keeps its collaboration status and scientific role while replacing version-status language with a human label.
- The page ends with a clear bilingual collaboration invitation instead of allowing “Coming soon” and footer reserve to define the final emotional beat.

## Beyond the Lab

Add one compact bilingual `Beyond the lab / 实验室之外` strip after the Vibe mosaic and before the collaboration close. It groups interests into three readable clusters rather than eight scattered stickers:

1. Music / 音乐 — violin, piano, guitar, drums
2. Making and reading / 书写与阅读 — Chinese calligraphy and reading
3. Inner life / 内在探索 — psychology and Buddhism

Each cluster uses one restrained text glyph as decoration plus visible English/Chinese labels. The icons are decorative (`aria-hidden`) and the text carries meaning. The strip is content, not navigation, so it does not create extra tab stops or pretend to be interactive.

## Error and Edge Handling

- Image fallbacks remain dimensionally stable and readable in both languages.
- Long publication titles, Chinese copy, and hobby labels wrap without horizontal overflow at 320px and 200% zoom.
- External links retain safe `target` and `rel` attributes.
- Reduced-motion mode preserves static composition and clear hover/focus paint changes.
- The design remains usable without JavaScript.

## Component Boundaries

- `StitchFooterDock.astro`: desktop fixed dock and mobile flow dock behavior.
- `StitchShell.astro`: bottom-reserve rules that correspond to fixed versus flow footer modes.
- `FeaturedResearch.astro`: unnumbered homepage heading, primary card links, readable tablet/mobile type.
- `StitchVibe.astro`: Side Quests framing, closing personal strip, collaboration call to action.
- `StitchVibeCard.astro`: primary stretched links, action hit areas, type floors, robust image fallback.
- `StitchHero.astro`: clearer playful status copy and small-screen decorative cleanup.
- `tokens.css`: accessible outline color and semantic type-size tokens where shared roles justify them.

## Verification

- Unit/source tests lock copy, hobby groups, semantic links, mobile flow-footer CSS, typography floors, and the accessible outline token.
- Browser tests verify no mobile dock overlap, no clipped routes, 44px targets, primary card navigation, bilingual hobby copy, image fallback behavior, and no horizontal overflow at 390px.
- Existing canonical geometry tests may be updated only where the approved legibility or footer behavior intentionally changes the contract.
- Final verification runs lint, Astro check, Vitest, production build, browser tests at desktop/768/mobile, and `git diff --check`.
