# Playful Motion and GitHub Projects Design

**Owner:** Zibin Zhao
**Date:** 2026-07-13
**Status:** Approved for implementation

## Objective

Make the portfolio more playful, memorable, and interactive without weakening its research-first hierarchy. Replace the current Beyond the Lab panel with original cartoon stickers, add a subtle continuously moving roller coaster behind the page, and expand Side Quests plus the Projects route from current GitHub data.

## Chosen Direction

The selected direction is a curated constellation. Existing expressive Side Quest cards remain the foreground. GitHub repositories join them through a compact field-notes shelf and a complete Projects index. Stickers occupy the former Beyond the Lab position. The coaster is one restrained ambient system behind the page rather than another foreground interaction.

## Information Architecture

The homepage order is:

1. Hero
2. Featured research
3. Featured Side Quests mosaic
4. GitHub field-notes shelf
5. Sticker constellation
6. Conversation invitation
7. Footer

The Projects route becomes the complete repository index. It shows every included GitHub repository once and no longer depends solely on the four manually maintained project markdown entries.

## Sticker Constellation

Remove the current `.beyond-lab` panel, heading, interest groups, and related styles. Replace it with seven original raster stickers:

1. DNA helix, molecular model, and AI chip
2. Violin, piano keys, guitar, and drums
3. Chinese calligraphy brush, ink stone, and paper
4. Open books and a reading lamp
5. Brain and heart connected by an orbit
6. Lotus, meditation cushion, and prayer beads
7. Playful coding terminal and experimental tool cart

The stickers use the portfolio palette: cream, ink green, mint, orange, and pale blue. They have thick ink outlines, tactile paper-cut edges, light printed texture, no embedded words, no logos, and no watermark. They are generated individually on a flat chroma-key background, converted to transparent PNG, inspected, and copied into `public/stickers/`.

The constellation is a normal-flow region in the former Beyond the Lab location. Each figure has an accessible English alt description and a bilingual physical caption. The visible heading “Beyond the Lab” is not retained.

### Sticker Motion

Each sticker has two nested layers:

- An outer layer performs one reveal-settle transition when the constellation enters the viewport.
- An inner layer performs a slow idle drift using only `transform`.

The seven stickers use different durations and delays but move no more than 8px while idle. A single requestAnimationFrame scroll listener writes one shared CSS custom property, and per-sticker depth values convert it to no more than 12px of parallax. No layout property is animated. Hover-capable pointers receive a small static tilt/scale response.

With `prefers-reduced-motion: reduce`, reveal, parallax, hover transforms, and idle drift are disabled. Stickers render immediately in their authored resting positions.

## Roller Coaster Atmosphere

Add a fixed, pointer-free, `aria-hidden` canvas behind all content and above the graph-paper background. It fills the viewport and redraws on resize, not on scroll. The track runs from above the viewport to below it in an asymmetric vertical S-curve, so it appears to span the whole page at every scroll position.

The track is pre-rendered to an offscreen canvas. The visible animation copies the static track, then draws a small train at a sampled point along the curve. Path samples and tangent angles are precomputed on resize. The train loops every 22 seconds and uses requestAnimationFrame only while the document is visible.

The canvas device-pixel ratio is capped at 1.5. Desktop uses a two-car train and approximately 12% track opacity. Mobile uses one car, fewer sleepers, and approximately 7% opacity. Cards and text retain opaque surfaces. The canvas never receives pointer events.

With reduced motion, the train is parked at a quiet point on the track and no animation frame loop starts. If canvas is unavailable, the existing graph-paper atmosphere remains complete and usable.

## GitHub Repository Data

Repository data is fetched during the Astro static build, never in the visitor’s browser. The loader exposes an injectable fetch interface for deterministic tests and returns a normalized `GithubProject[]`.

```ts
interface GithubProject {
  name: string;
  description: string;
  descriptionZh: string;
  githubUrl: string;
  demoUrl?: string;
  stack: string[];
  updatedAt: string;
  featured: boolean;
}
```

The loader requests owned repositories sorted by update date and, when available, each repository’s language breakdown. It excludes:

- forks
- archived or disabled repositories
- `zibin-zhao.github.io`
- `handle_mutation`

Future owned repositories that pass those rules are included automatically. Current approved repositories are CasMD, TEMPO, Yaos, Cembra_AI, DL-SELEX-web-explain, DL-SELEX, and ECG_analysing_app.

Stack labels use up to three languages ordered by byte count, followed by useful repository topics without duplication. If language detail fails, the repository’s primary language is used.

A committed fallback snapshot guarantees stable offline and rate-limited builds. Curated overrides supply missing English descriptions, all Chinese descriptions, known demo URLs, and featured state. Remote names, GitHub URLs, update dates, languages, topics, descriptions, and homepages win when valid; curated values fill gaps and provide editorial control.

CasMD, DL-SELEX, and Yaos are featured. Featured repositories sort first in that order. Remaining repositories sort by `updatedAt` descending.

GitHub Actions passes its repository token to the Astro build. If the list request fails, the complete fallback snapshot is returned. If only enrichment requests fail, the successfully fetched list still renders with primary-language metadata.

## Project Presentation

### Homepage

Keep the five existing Side Quest cards. CasMD and Yaos gain separate GitHub and live-demo actions. Their GitHub entries are not duplicated in the shelf.

The GitHub field-notes shelf displays the other five approved repositories as compact tactile index cards. Each card includes name, bilingual description, stack chips, GitHub action, and a demo action only when verified. The shelf uses a two-column desktop grid and one-column mobile flow. It avoids card overlap so seven-repository growth remains scannable.

### Projects Route

The Projects route displays all seven included repositories. Featured entries receive a visible star label and slightly larger card treatment. Remaining entries use the compact project-card treatment. The route uses the same normalized data as the homepage, so sorting, links, and fallbacks cannot drift.

## Accessibility and Performance

- All repository actions are ordinary anchors and remain usable without JavaScript.
- Every action has a minimum 44 by 44px target.
- External links use `target="_blank"` with `rel="noopener noreferrer"`.
- Sticker meaning is available through alt text and bilingual captions; motion is never the only carrier of meaning.
- Coaster and decorative sticker motion are excluded from the accessibility tree.
- Reduced motion produces a fully static composition with clear hover and focus paint feedback.
- Keyboard focus remains visible and is never hidden behind stretched-link overlays.
- No horizontal overflow is permitted at 1440, 768, 390, or 320 CSS pixels.
- Canvas work pauses when the page is hidden and is capped to one animation loop.
- Sticker images use explicit dimensions, lazy loading, async decoding, and project-local files.

## Testing Strategy

### Source and unit tests

- Repository filtering excludes the two approved names, forks, archived, and disabled entries.
- Future qualifying repositories are included.
- Featured-first and recency sorting is deterministic.
- Language byte counts become ordered, deduplicated stack labels.
- List failure returns the fallback snapshot.
- Partial enrichment failure preserves remote repositories.
- Curated descriptions and demo URLs fill missing metadata.
- The Beyond the Lab markup is removed and seven sticker figures are present.
- The coaster canvas and reduced-motion contract are present.

### Browser tests

- Homepage Side Quests contain five authored cards plus five non-duplicated GitHub shelf cards.
- Projects route contains all seven repository cards with correct GitHub/demo links.
- 1440, 768, 390, and 320px viewports have no overflow or footer collision.
- Sticker captions switch languages and images have useful alt text.
- Reduced motion keeps sticker and train geometry static.
- Normal motion starts one coaster loop, pauses when hidden, and does not block pointer interaction.
- No-JavaScript navigation preserves project and footer destinations.
- Updated full-page visual artifacts are inspected for hierarchy, contrast, clipping, and excessive motion density.

## Non-goals

- No client-side GitHub fetch or visitor-facing loading state
- No rigid-body sticker physics or collision simulation
- No audio, autoplay controls, WebGL, or animation library dependency
- No generated SVG illustration
- No redesign of the hero, research cards, header, or footer language

## Acceptance Criteria

- Beyond the Lab is replaced by seven AI-generated cartoon stickers.
- The sticker constellation is playful but remains readable and static under reduced motion.
- A subtle coaster track spans the viewport and a train loops continuously in normal motion.
- All seven approved repositories render from one normalized data source.
- Future qualifying repositories are included automatically at build time.
- Builds remain successful when GitHub is unavailable.
- Homepage and Projects route remain bilingual, keyboard accessible, responsive, and visually consistent with the Stitch design language.
