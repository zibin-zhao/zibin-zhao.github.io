# Stitch Lab-Notebook Portfolio Redesign

**Owner:** Zibin Zhao  
**Date:** 2026-07-12  
**Status:** Approved for implementation planning

## 1. Goal

Redesign the complete Astro portfolio using the attached Stitch page and screenshot as the visual reference. The result should feel like a neo-brutalist bioengineering lab notebook: warm graph paper, condensed poster typography, physical paper cards, dark-green ink, restrained green and orange accents, and intentionally offset composition.

The redesign must preserve the existing site's full content and behavior: About, Research, Projects, Vibe, CV, Contact, the Prompts page, bilingual switching, content collections, external links, downloadable CV, accessibility, responsive layouts, tests, and production deployment workflow.

## 2. Implementation Direction

Use the Stitch export as a visual blueprint, not as production source code. Rebuild the design through the existing Astro components and data collections. Do not embed the generated Tailwind CDN page or duplicate content into a second template.

This approach preserves the current maintainable content model while reproducing the reference's defining composition, typography, color system, borders, hard shadows, staggered cards, and annotations.

## 3. Visual System

### Foundation

- Use a warm cream substrate close to `#fffae0` with a 20px graph-paper grid.
- Use `#003322` as the primary ink for text, borders, and hard shadows.
- Use pale specimen green near `#a2d39c` for active labels and primary actions.
- Use orange near `#ffb95f` sparingly for section flags and numbered markers.
- Add a very subtle paper/noise treatment that never lowers text contrast.
- Keep corners square. Depth comes from 2–3px strokes and solid offset shadows, not blur.

### Typography

- Use Anton for the oversized name and major numbered chapter titles.
- Use Space Grotesk for body copy and card headings.
- Use JetBrains Mono for labels, dates, tags, metadata, and annotations.
- Provide local or package-based font loading so the page does not depend on Google Fonts at runtime.
- Keep Chinese text on a legible CJK system fallback and avoid condensed display treatment for long Chinese copy.

### Composition

- Desktop uses a controlled 12-column composition with bounded offsets, mild rotations, and occasional overlap.
- Spacing and offsets align to the 20px background grid where practical.
- Mobile becomes one readable column while retaining small rotations, labels, borders, and hard shadows.
- Decorative shapes and annotations never overlap required text or controls.

## 4. Navigation and Hero

The top interface uses two physical label groups rather than one full-width navigation bar:

- Left: `ZIBINZHAO.COM · UNFINISHED INDEX / 未完成索引`.
- Right: language switch and `LET'S TALK / 联系我` mail action.
- Chapter links remain available through an accessible compact navigation pattern and a closing index near the footer.

The hero follows the Stitch composition:

- Oversized, stacked `ZIBIN` and `ZHAO` wordmark at the left.
- A tilted `OPEN TO COLLABORATION / 开放合作` sticker.
- A centered physical introduction card with `Bioengineering × AI`, bilingual supporting copy, status metadata, and a small specimen image.
- Use the attached Stitch image URL when appropriate, with dimensions, meaningful alt text, lazy/eager loading chosen by viewport priority, and a styled fallback if the remote image fails.
- Remove the current empty experiment-holder copy.
- Avoid the current 180vh sticky collapse; the hero should occupy roughly one intentional viewport and flow naturally into the chapters.

## 5. Homepage Chapters

Existing Astro collections and data modules remain the single source of truth. No factual content is invented, dropped, or copied into layout components.

### 01 — About / 关于

Present the biography as a slightly tilted researcher dossier. Keep the full English and Chinese bios, research-focus tags, and current anchor. Body copy remains regularly aligned inside the card.

### 02 — Research & Publications / 研究与论文

Use the reference's stacked evidence-card treatment:

- Featured publications get larger solid-border cards, numbered circular markers, venue/year strips, and visible action links.
- Remaining publications use compact archive cards with dashed or lighter borders.
- Preserve chronological sorting, all authors, venue metadata, featured markers, and every available DOI/PDF/code/scholar link.
- Card offsets may alternate on desktop but return to a single full-width sequence on mobile.

### 03 — Projects & Demos / 项目与演示

Render the existing project collection as experiment boards. Cards may vary modestly in width, accent, and rotation while keeping title, description, tags, and outbound action consistently discoverable. Existing project imagery is preferred; missing imagery receives an intentional schematic/experiment fallback rather than a blank rectangle.

### 04 — Vibe Codings / 随性编程

This section most closely follows the Stitch reference. Preserve CasMD, Singularity, Medit, Yaos, Zen, and the intentional open slot. Use existing local screenshots first; the attached remote source may supplement them when it represents the correct project. Cards form a staggered desktop collage and a normal mobile stack.

### 05 — CV / 简历

Use a vertical indexed résumé strip with clear dates, organizations, roles, notes, skills, and the existing CV download. The visual treatment may be playful, but scanning order remains conventional.

### 06 — Contact / 联系

Finish with a high-contrast dark-green closing poster containing the email action and all existing social destinations. Place the chapter index in normal document flow near this ending rather than using a fixed footer that can obscure content.

## 6. Prompts Page

Keep the existing Prompts route and functionality. Apply the same substrate, typography, stroke, shadow, button, label, focus, and bilingual rules, but use a calmer single-column archive layout instead of forcing the homepage collage onto long prompt content.

## 7. Motion and Interaction

Replace the current magic-pencil cursor, trail, and click particles with the reference's quieter interaction system:

- Low-amplitude drifting vertical guide lines and decorative notes.
- Slow floating annotations and background blobs with bounded movement.
- Short press-like transforms for buttons and cards: hard shadows collapse as elements move into the page.
- Small staggered entry reveals using only opacity and transform.
- No essential content or navigation depends on animation or JavaScript.

Under `prefers-reduced-motion: reduce`, disable drifting, floating, parallax, and staggered movement while leaving every element visible. Coarse-pointer devices use native cursor/tap behavior.

## 8. Component Boundaries

- `Base.astro` owns document metadata, font loading, the global paper surface, and shared decorations.
- `Nav.astro` owns the index label, language switch, contact action, and accessible compact chapter navigation.
- `Hero.astro` owns only the hero composition and its semantic content.
- `Section.astro` exposes chapter-number, label, tone, and layout variants without owning collection data.
- `PubList.astro`, `Projects.astro`, `Vibe.astro`, and `CvTimeline.astro` map their existing data into focused presentation components.
- `ProjectCard.astro` and `VibeCard.astro` own image fallback and external-link presentation for their respective content types.
- `tokens.css` defines semantic colors, spacing, shadows, type families, motion, and grid values.
- `global.css` defines shared reset, paper surface, focus, language visibility, reveal behavior, and reduced-motion behavior.
- Remove obsolete field-motion code and tests when the new motion model supersedes them; replace coverage with tests for the new visual foundation and fallbacks.

## 9. Accessibility and Failure Behavior

- Preserve semantic landmarks, one logical `h1`, sequential headings, skip link, keyboard access, and visible high-contrast focus styles.
- Maintain WCAG AA contrast for text and controls.
- Decorations are `aria-hidden` and never intercept pointer events.
- External links use safe target/rel behavior and remain understandable without icons.
- Remote images define intrinsic size, meaningful alt text, and a styled failure state. Important local assets remain the default where already available.
- With JavaScript unavailable, all content, language-default content, navigation links, email actions, downloads, and external links still work.
- Prevent horizontal overflow at all supported widths.

## 10. Verification and Release

Before release:

1. Run the full Vitest suite and Astro production build.
2. Inspect the production site at representative desktop, tablet, and mobile widths.
3. Verify every homepage chapter, `/prompts`, language switching, chapter navigation, external links, mail action, CV download, image rendering/fallback, and absence of horizontal overflow.
4. Verify keyboard navigation, visible focus, heading structure, reduced-motion behavior, and native mobile pointer behavior.
5. Check browser console output for errors and warnings.
6. Compare the rendered desktop homepage to the attached Stitch screenshot for palette, typography, hierarchy, card geometry, density, and controlled asymmetry.
7. Commit implementation on a feature branch, merge successfully into `main`, push `main` to `origin`, wait for production propagation, and verify the live site.

## 11. Non-Goals

- Do not add React, a Tailwind runtime/CDN, or a client-side application framework.
- Do not remove existing content or reduce the site to the subset visible in the Stitch screenshot.
- Do not introduce invented research claims, project claims, or metrics.
- Do not retain the custom pencil cursor or particle trail.
- Do not use fixed overlays that obscure page content.
