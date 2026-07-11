# Collage Personal Webpage — Design Specification

**Owner:** Zibin Zhao
**Date:** 2026-07-11
**Status:** Approved for planning

## 1. Intent

Redesign `zibinzhao.com` as an artistic, fresh, deliberately non-elite personal website. It must feel like an open research field: lively, public-minded, curious, and a little unfinished rather than a polished corporate portfolio. The site still needs to make Zibin's research, projects, CV, and contact paths easy to find.

The design draws from the narrative motion of Yuki Asakura, the intimate details of Jackie Hu, the playful project browsing of Cathy Dolle, and the person-first stance of Olha Uzhykova. It must not reproduce any reference site's visual system.

## 2. Chosen Visual Direction

### Controlled community-print collage

The homepage uses a **controlled mess**: pieces look taped, found, orbiting, or slightly off-grid, while content retains a predictable semantic order. This is not random positioning or a visual obstacle course.

- **Ground:** warm cream `#FFF9E8` / `#FFF0C7`.
- **Identity:** leafy green `#2F9264` and light green `#C7EF91`.
- **Technical note:** sky blue `#8DD3F1`.
- **Energy / clicks:** orange `#F49753` / `#F5B181`.
- **Ink:** deep green-black `#123D34`.
- **Type:** Space Grotesk 700, horizontally compressed only for the display wordmark and short declarations; Georgia for editorial headings; system mono for labels, routes, and annotations. No new web-font dependency is required.
- **Texture:** low-opacity construction grid and small paper-like borders/shadows. Texture must remain decorative and never reduce contrast.

### Hero: Poster Path

The first viewport is a loose collage instead of a framed corporate card:

- Large split wordmark: `ZIBIN` / `ZHAO`, with a slight intentional tilt and green emphasis.
- A clear identity declaration: Bioengineering × AI, tools that people can use, molecular care and everyday wellbeing.
- Bright floating circles and a slow orbit line that connects molecular research with human-scale care.
- Scattered visible route stickers for Research, Projects, Vibe, and CV. The same destinations remain in a semantic nav/menu.
- An explicit blank **“image / experiment holder”**. It explains that a future original portrait, drawing, or generated image belongs there; it must not use generated imagery now.
- An `Open to Collaboration` sticker and working mail/social routes.

The homepage scrolls from this poster into content chapters. The visual composition may be asymmetric, but the DOM and keyboard order is: hero, about, research, projects, vibe, CV, contact.

## 3. Content Chapters

Existing Astro collections and bilingual text remain the single source of truth. No content is invented or removed.

Each chapter keeps its current anchor, data source, and link behavior, but receives a different collage treatment instead of a repeated generic card pattern:

1. **About — field note.** Short bio and research focus rendered as a tipped note plus colored labels.
2. **Research — evidence folder.** Publications stay readable in chronological list form; featured papers receive loose colored tabs, not decorative motion that obscures text.
3. **Projects — experiment scraps.** Project cards vary modestly in orientation and color accent, with reliable visible titles, descriptions, and external-link affordances.
4. **Vibe — open notebook.** Existing screenshot placeholders become honest experiment slots; the add-card remains an intentional open space rather than a dead tile.
5. **CV — timeline strip.** The current information remains scannable and download actions remain conventional.
6. **Contact — closing poster.** A high-contrast closing panel gives email and social routes a simple finish.

On small screens, content returns to a single, comfortable reading column. Decorative collage offsets are bounded and repositioned; no content overlaps or becomes unreachable.

## 4. Motion and Pointer Interaction

Motion is part of the identity, but all movement has a named purpose and a non-moving fallback.

### Passive movement

- Green, blue, and orange circles float with very low amplitude.
- A thin orbit line rotates slowly in the hero.
- The field-note ribbon moves gently on desktop and becomes static on touch and reduced-motion contexts.
- Stickers use short spring-like hover and press movement. Link targets must continue to have standard focus outlines.

### Magic pencil + field markers

For fine-pointer desktop devices only:

- Replace the hero cursor with a **74px magic pencil**, angled 45° upward toward its glowing tip.
- Pointer movement leaves a low-density, short-lived trail of small green, blue, orange, and star marks. Mark creation is distance-throttled; marks fade in about 0.8 seconds and are capped to avoid DOM growth.
- Pointer clicks continue to create a larger temporary specimen tick/ripple (about 1.25 seconds), with a bounded count of active marks.
- On interactive targets, the pencil gains a subtle glow/target state without changing the target's normal semantics.

The pencil, trail, click markers, custom cursor, and passive movement are disabled under `prefers-reduced-motion: reduce`, on touch/coarse-pointer devices, and whenever scripting is unavailable. Native cursor/tap behavior remains available in those cases.

This borrows the useful interaction ideas of React Bits' cursor, click-spark, magnet, orbit, and sticker patterns, but is implemented as small Astro-native CSS/TypeScript behavior. Do not add React just for these effects.

## 5. Component and Data Boundaries

The implementation keeps data separate from visual behavior.

- `Hero.astro`: composition and accessible hero links; renders semantic route controls and the blank holder.
- New focused motion module `src/scripts/field-motion.ts`: owns desktop pointer detection, cursor, trail, click markers, cleanup, and reduced-motion checks. It does not own content or navigation.
- `hero.ts`: owns scroll/collapse and section reveal only; either stays focused or delegates pointer behavior to the dedicated module.
- `Section.astro`, `ProjectCard.astro`, `VibeCard.astro`, and supporting components: expose contextual collage classes/variants without duplicating content data.
- `tokens.css` and `global.css`: own semantic color, motion, shadow, and spacing tokens. Raw palette values must not spread through unrelated components.
- Existing `profile`, content collections, publication data, project data, and vibe data remain unchanged except where a visual label needs an explicit class or accessible text.

## 6. Accessibility, Performance, and Failure Behavior

- Preserve one logical `h1`, sequential headings, landmarks, visible focus, descriptive image alt text, and normal keyboard activation of links/buttons.
- Text/background combinations meet WCAG AA contrast; decorative color is never the only carrier of meaning.
- Every animated decoration is `aria-hidden`; pointer effects use `pointer-events: none` and cannot intercept links or scrolling.
- The site must be fully usable with JavaScript disabled: no required navigation, content, or link exists only through animation.
- Use `transform` and `opacity` for animation. Motion loops use small counts and are capped; no unbounded marker nodes, scroll listeners, or layout-thrashing loops.
- Disable heavy cursor/pointer effects on `(pointer: coarse)` and low-motion preferences. Mobile uses an intentional stacked composition rather than a scaled desktop collage.

## 7. Verification Plan

Before handoff:

1. Run the Astro production build and the existing Vitest suite.
2. Verify the redesigned site at desktop and mobile widths in a browser: loading, no horizontal overflow, navigation anchors, mail/social/external links, language switching, hero scroll, and blank holder.
3. Verify fine-pointer motion: 45° pencil, trail cleanup/cap, click tick cleanup/cap, target behavior, no blocked controls.
4. Verify `prefers-reduced-motion` and mobile/coarse-pointer fallbacks: no custom cursor/trails, readable static hero, keyboard navigation intact.
5. Inspect browser console for errors and confirm images reserve layout space.

## 8. Explicit Non-Goals

- No generated portrait or background asset in this iteration.
- No React runtime or React Bits dependency.
- No fake research claims, invented metrics, or prestige-oriented visual language.
- No cursor effect outside the intended desktop/fine-pointer experience.
