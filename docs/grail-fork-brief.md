# Grail Reference Fork

## Request and scope

On 2026-09-09 the user requested a new fork to recreate the visual and motion direction of https://grail-app.com/ for zibinzhao.com. This independent worktree preserves the existing orange mechanical archive trial. Treat Grail as the new visual reference, not the current archive styling.

Build a working personal site with the user's real bilingual research, projects, writing, CV, and contact content. Closely study the reference's composition, typography, materials, layered depth, scrolling, hover, and transitions before implementing. Do not reduce the reference to a color palette, empty 3D decoration, or generic card sections. Preserve factual content and working routes while adapting the reference to the user's identity.

## Initial reference observation

The public homepage loaded successfully in the Codex in-app browser on 2026-09-09. The initial view uses a black background, oversized white serif display type, a pale lilac accent, and floating double-sided cards with readable fronts and graphic backs. Scrolling transitions to large editorial typography. The initial hero screenshot is retained at `artifacts/grail-reference-2026-09-09/hero.jpg`. The new task should inspect the complete desktop and mobile experience and its interactions itself.

## Inputs and boundaries

- Source checkout: `/Users/zibinzhao/Desktop/Projects/personal_webpage` on `codex/3d-build`, with extensive uncommitted work. Do not write to the source checkout.
- Fork worktree: `/Users/zibinzhao/.codex/worktrees/027f/personal_webpage`. The fork has carried over the uncommitted tracked and untracked files. Verify canonical inputs before editing.
- Canonical factual content: `src/data/`, `src/content/publications/`, `public/cv.pdf`, and existing route definitions. Preserve the embedded Medit and Singularity applications.
- Existing archive documentation describes the previous trial and does not constrain the new visual direction. Keep applicable content and accessibility contracts.
- All project links and visible interactive controls must work. Provide real content, mobile behavior, keyboard access, and reduced-motion support.
- Use a separate local preview port so the existing preview at port 43220 remains available for comparison.
- Implement and run relevant project checks and actual browser verification. Record which surfaces were tested.
- No production deployment, merge, or push is authorized by this request.

## Delivery

Deliver the functioning Grail-inspired alternative and its local preview in this fork. Communicate in Simplified Chinese and use English in code and documentation. Keep the configured model and reasoning settings.
