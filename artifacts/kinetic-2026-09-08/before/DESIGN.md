# An open collection

Canonical art direction for the September 7, 2026 local redesign. The spatial field supersedes the nocturnal desk, illustrated portfolio, three-room hero, and vertical collection designs.

## Composition

One scattered field holds research, software, music, a miniature train, papers, and personal cues together. Objects differ in scale, material, orientation, and character. The composition should feel collected by a person, with enough space to recognize individual objects and choose where to go next.

The homepage has no hero followed by content sections, themed rooms, or required tour order. The name sits inside the field. Eight HTML artifact links connect the objects to Research, Projects, Singularity, Medit, About, Prompts, CV, and Contact. Their desktop positions derive from the scene camera so labels accompany the objects when the field turns.

Interior routes use a floating reading sheet over the fixed spatial background. The sheet holds the full content and scrolls as a normal document. Its return link leads back to the field. The Index is a native disclosure at all sizes and contains the seven portfolio destinations.

## Materials and type

- Chalk background `#e8e9e3`, graphite text `#232622`, muted text `#60635b`, and quiet rules `#c8cbc1`.
- Orange objects `#e57540`, silver metal, dark record surfaces, pale paper, and muted green details. Small text accents use darker orange `#b73c19`.
- Self-hosted Manrope, system monospace for compact artifact notes and controls, and system Chinese font fallbacks.
- Uneven object placement and restrained labels create hierarchy. Avoid generic card grids on the homepage, decorative metric blocks, repeated slogans, and invented interfaces.
- Medit and Singularity previews use actual application screenshots. Original parametric sculptures provide the other spatial imagery and do not claim structural or scientific accuracy.

## Interaction and motion

- Three.js renders local geometry, materials, lights, environment lighting, and generated contact shadows. The scene does not require remote model or texture downloads.
- Pointer dragging turns the whole field. Another-angle changes the view, reset restores its starting orientation, and pause/resume controls continuous motion. Artifact hover and focus may respond through their associated objects.
- Real HTML links carry navigation. The decorative canvas is hidden from assistive technology; discovering an object must not be required to reach a route.
- Native navigation and document scrolling remain available. No loading gate, pointer lock, forced audio, or scroll-driven section sequence is part of the experience.
- Reduced motion starts paused and removes animated route transitions. Continuous rendering suspends when the scene is offscreen or the page is hidden. Pixel ratio is capped to control rendering cost.
- WebGL creation failure or context loss must leave the HTML field, Index, and reading content usable, with the fallback artwork in place.

## Responsive reading

The mobile field uses its own object placement and a taller surface. Labels, controls, and touch navigation must remain readable without depending on desktop projection. At narrow widths or enlarged text, readability and access take priority over fixed spatial placement.

Reading sheets collapse to a single content column as needed. Long titles, email addresses, and prompt bodies wrap within the available width. Keyboard focus stays visible, clipboard failures explain manual recovery, and native prompt disclosures work without JavaScript.

Print removes the scene, motion controls, and navigation; reading sheets become plain white pages with dark text. The CV export uses the same factual content as the online CV. Sharing imagery should depict the current field rather than reconstruct a superseded homepage.

## Review limits

Rendering depends on browser, GPU, viewport, and motion preferences. Visual inspection must include desktop and mobile states, interior reading sheets, expanded prompts, and fallback behavior. Automated accessibility checks do not certify conformance, and a local performance measurement does not establish production or device-wide performance. Record exact checks and remaining limitations with the delivery.
