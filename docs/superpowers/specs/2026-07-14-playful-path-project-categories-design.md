# Playful Path and Project Categories Design

**Owner:** Zibin Zhao
**Date:** 2026-07-14
**Status:** Approved for implementation

## Objective

Make the portfolio warmer and more human without changing its strongest interaction or established Stitch visual language. Personal interests become collectible badges discovered along the page-wide coaster route. Work is separated into a clear research collection and a personal Vibe collection. Supporting copy, experience, and skills should sound like a curious builder rather than a formal dossier.

## Approved Direction

The existing roller coaster track, train, canvas layering, pointer behavior, responsive configuration, visibility lifecycle, and reduced-motion behavior remain intact. The cart gains a more physical speed rhythm, but no other interaction changes.

There is no standalone hobbies section. The seven existing hobby illustrations become small enamel-pin or puzzle-piece badges attached to the two dashed background guide lines that travel through the page. These guides remain visually separate from the roller coaster's solid rails. Research and Vibe become distinct collections rather than one mixed side-project shelf.

## Page-wide Hobby Badges

Remove the current `StickerConstellation` section, its captions, border, background treatment, and reserved vertical space. Reuse the seven existing transparent sticker assets:

1. DNA and AI
2. Musical instruments
3. Chinese calligraphy
4. Reading
5. Psychology
6. Meditation and Buddhism
7. Coding and experiments

Render these in a homepage-only fixed layer aligned to the two existing `.guide-left` and `.guide-right` dashed background lines. Each badge has an authored scroll region and viewport position, alternates between the left and right guide, and visually clips onto its guide with a small cream paper tab or puzzle notch. The badges should feel distributed through the homepage journey rather than clustered in one viewport or repeated on supporting routes.

Because the dashed guides are fixed to the viewport, badge visibility is driven by normalized homepage scroll progress. Each badge enters only near its assigned page region, settles beside one guide, and then leaves as the visitor continues. At most two badges should be visible at once on desktop and one on narrow mobile screens. The layer is pointer-free and does not cover readable content or actions.

No visible hobby names, captions, descriptions, headings, or section labels are rendered. The animated visual layer is `aria-hidden`, while one visually hidden homepage list names all seven interests for assistive technology. With reduced motion, the appropriate badge for the current page region is statically placed with no reveal, drift, or parallax.

## Coaster Motion

Keep the existing track geometry and train drawing. Replace linear time-to-progress mapping with a deterministic authored motion profile:

- slower through selected upper bends
- faster through selected long runs
- no stops, reversals, or discontinuities
- the same seamless 22-second total loop

The profile uses normalized progress zones rather than inferred slope because the current vertical S-curve has no true crests or drops. Its instantaneous speed stays approximately between 0.55× and 1.8× the average, is normalized to one complete circuit, and remains monotonic so train spacing, pause/resume behavior, and page lifecycle stay reliable. Reduced motion continues to park the train and starts no animation loop.

## Project Information Architecture

### Research Projects

The primary project collection contains research and engineering work, including:

- CASMD
- TEMPO
- DL-SELEX
- Cembra AI
- ECG Analysing App
- other future owned repositories classified as research through curated metadata

Research cards use the normalized GitHub data source, with curated metadata controlling category, feature order, bilingual summaries, and verified demo links. CASMD and TEMPO are featured first. The complete Projects route uses the same category metadata and does not duplicate a repository.

On the homepage, a separate `Research Projects / 研究项目` collection sits after the existing featured-publications section and before Vibe. It shows CASMD, TEMPO, and a compact selection of related research projects. It is not nested inside `#vibe`.

### Vibe

Vibe contains only the personal, playful, or experimental builds named by the owner:

- Zen, displayed as ZENS
- YAOS
- Medit
- Singularity

CASMD is removed from Vibe. The four Vibe cards retain their expressive authored layouts and direct live or repository actions when available. Singularity remains the visual anchor of this collection.

The existing GitHub shelf is removed from inside Vibe. On the homepage, Vibe contains only the four approved authored cards and its closing invitation.

### Additional GitHub Work

Qualifying repositories that are not classified as research or Vibe may appear in a quieter `More from GitHub` list on the Projects route. They do not enter either featured collection automatically. The Projects route explicitly renders three non-overlapping groups: Research Projects, Vibe, and More from GitHub. This keeps future repository fetching without weakening the category meaning.

## Project Cover Illustrations

Replace the current photorealistic CASMD cover with a hand-drawn molecular playground: a simplified protein, nucleic-acid strand, and small simulation controls arranged like a friendly lab sketch.

Replace the dark rendered Singularity cover with a hand-drawn particle universe: a playful black-hole ring, orbiting particle dots, and a small DNA or typed-symbol motif that communicates its morphing WebGL experience.

Both covers use the existing cream, ink green, mint, orange, and pale-blue palette, thick dark-green outlines, paper-print texture, flat color, and slightly imperfect shapes. They contain no embedded text, logos, realistic rendering, polished gradients, or photographic lighting.

The new featured research-card treatment renders the CASMD cover on both the homepage and Projects route at a stable 16:9 aspect ratio with useful alt text and a dimensionally stable fallback. The Singularity cover remains inside its authored Vibe card at its existing aspect ratio.

## Experience, Skills, and Voice

The visible experience timeline contains one concise item: `PhD @ HKUST`. Other historical data may remain in the underlying CV data and downloadable CV, but the homepage presentation is intentionally simple. Replace experience-facing `candidate` language with `PhD @ HKUST` or `PhD researcher @ HKUST` without implying that the degree is completed.

Add `AI` to the main technical skill list alongside Python, SolidWorks, MATLAB, and the existing engineering tools. It is not presented as a separate specialty.

Use this English story as the voice reference:

> I keep making things because apparently leaving an idea alone is not one of my skills. Some are useful, some are gloriously unnecessary, and most begin with “what if?” I like trains, games, design, AI, biology, and the strange places where they crash into each other. Somewhere along the way, curiosity accidentally turned into doing a PhD at HKUST. I still learn the same way: build it, break it, make notes, try again.

The Chinese version should preserve the warmth and subtle humor rather than translate the sentence structure literally. Hero metadata and page descriptions should use the same curious-builder tone while retaining accurate research keywords.

## Responsive and Accessibility Rules

- Hobby badges never create horizontal overflow at 320, 390, 768, or 1440 CSS pixels.
- Badges remain smaller than nearby cards and never reduce text contrast.
- The badge layer and coaster canvas remain pointer-free.
- Visible project actions retain 44 by 44px targets and clear keyboard focus.
- Research and Vibe headings remain bilingual and understandable without animation.
- Project covers use useful alt text and dimensionally stable fallbacks.
- DOM badge motion uses transforms and opacity only, pauses when hidden, and honors reduced motion. The existing canvas coaster continues to redraw normally.
- Badge state is updated by the existing shared page-scroll orchestration rather than adding a competing animation-frame loop.

## Verification

Source and unit tests will cover category classification, featured ordering, Vibe membership, timeline simplification, the AI skill, removal of visible hobby text, badge-path configuration, and monotonic coaster speed mapping.

Browser verification will cover:

- research and Vibe cards appear in the intended collections with no duplicates
- hobby badges appear beside both dashed guides across multiple homepage scroll regions without a standalone section
- at most two badges are visible on desktop and one on mobile
- the train accelerates and decelerates while looping seamlessly
- reduced motion parks the train and removes badge motion
- no horizontal overflow, blocked links, or content collisions at desktop, tablet, and mobile widths
- English and Chinese copy remain complete and readable

Final verification runs lint, Astro check, unit tests, production build, browser tests, and `git diff --check`, followed by visual inspection of full-page screenshots.

## Non-goals

- No new hobbies section or visible hobby labels
- No rigid-body sticker physics
- No change to the roller coaster path, cart illustration, canvas layer, or interaction model
- No client-side GitHub fetch
- No automatic promotion of every repository into Research or Vibe
- No redesign of the header, footer, or core paper-cut design system

## Acceptance Criteria

- Seven hobby badges are discovered along the two page-wide dashed guides with no dedicated hobby section.
- The coaster keeps its existing interaction and gains a noticeable but tasteful physical speed rhythm.
- Research Projects clearly contains CASMD, TEMPO, and related research work.
- Vibe contains ZENS, YAOS, Medit, and Singularity, and does not contain CASMD.
- CASMD and Singularity have cohesive hand-drawn covers.
- The visible timeline shows only `PhD @ HKUST`, and `AI` appears in the core skills.
- Personal copy feels playful, curious, humble, and builder-led.
- The site remains bilingual, accessible, responsive, performant, and visually consistent.
