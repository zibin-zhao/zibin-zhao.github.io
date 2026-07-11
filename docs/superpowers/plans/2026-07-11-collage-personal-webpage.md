# Collage Personal Webpage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform zibinzhao.com into an accessible community-print collage portfolio with a controlled messy hero, blank image holder, and desktop-only magic-pencil interactions.

**Architecture:** Preserve the Astro content collections and existing anchor-based information order. Move all motion ownership into one client module and keep components responsible only for semantic markup plus their local collage variant. Use CSS tokens for the palette, layout bounds, and motion timing so the visual system is consistent without adding React or a React Bits runtime.

**Tech Stack:** Astro 6, TypeScript, scoped Astro CSS, global CSS custom properties, vanilla browser APIs, Vitest, existing Astro build.

## Global Constraints

- Use warm cream `#FFF9E8` / `#FFF0C7`, green `#2F9264` / `#C7EF91`, blue `#8DD3F1`, orange `#F49753` / `#F5B181`, and ink `#123D34` as semantic tokens.
- Keep the DOM order hero, about, research, projects, vibe, CV, contact; preserve all existing bilingual content and external links.
- Keep the image area explicitly blank and label it as a future original image/experiment holder; do not create or add generated imagery.
- Do not add React, React Bits, a UI framework, or a new web-font dependency.
- Pointer effects run only when `pointer: fine` and reduced motion is not requested. They must not intercept pointer events, keyboard focus, or touch controls.
- All animation must use `transform` and `opacity`; active trail marks are bounded and cleaned up.
- Keyboard and no-JavaScript paths retain normal navigation and readable content.

---

### Task 1: Establish collage design tokens and global accessibility baseline

**Files:**
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/global.css`
- Modify: `src/layouts/Base.astro`

**Interfaces:**
- Produces CSS custom properties `--paper`, `--paper-warm`, `--ink`, `--green`, `--green-light`, `--blue`, `--orange`, `--orange-light`, `--grid-line`, `--shadow-sticker`, `--ease-spring`, and `--motion-fast` for all subsequent components.
- Produces a skip link targeting `#main-content`.

- [ ] **Step 1: Run the baseline production build**

Run: `npm run build`

Expected: PASS; this records the unchanged Astro baseline before visual changes.

- [ ] **Step 2: Replace the generic neutral token set with semantic collage tokens**

In `src/styles/tokens.css`, define the following complete token set:

```css
:root {
  --paper: #fffdf6;
  --paper-warm: #fff0c7;
  --ink: #123d34;
  --muted: #4e695f;
  --hair: rgba(18, 61, 52, 0.24);
  --green: #2f9264;
  --green-light: #c7ef91;
  --blue: #8dd3f1;
  --orange: #f49753;
  --orange-light: #f5b181;
  --grid-line: rgba(18, 61, 52, 0.14);
  --gap: clamp(12px, 1.5vw, 20px);
  --radius: 0px;
  --shadow-sticker: 5px 5px 0 var(--ink);
  --motion-fast: 180ms;
  --motion-slow: 800ms;
  --ease-spring: cubic-bezier(0.2, 1.35, 0.3, 1);
  --font-display: 'Space Grotesk', -apple-system, Arial, sans-serif;
  --font-body: 'Inter', -apple-system, Arial, sans-serif;
  --font-note: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
```

- [ ] **Step 3: Add the global paper texture, focus treatment, and skip-link styles**

Update `src/styles/global.css` so `body` uses `var(--paper)`, the content surface uses no rounded corporate sheet, and the following styles are present:

```css
body {
  min-width: 320px;
  font-family: var(--font-body);
  color: var(--ink);
  background-color: var(--paper-warm);
  background-image:
    linear-gradient(var(--grid-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
  background-size: 24px 24px;
}

.skip-link {
  position: fixed;
  z-index: 100;
  top: 12px;
  left: 12px;
  padding: 10px 14px;
  color: var(--ink);
  background: var(--green-light);
  border: 2px solid var(--ink);
  transform: translateY(-160%);
}

.skip-link:focus { transform: translateY(0); }

:focus-visible {
  outline: 3px solid var(--orange);
  outline-offset: 4px;
  border-radius: 0;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 1ms !important;
  }
}
```

- [ ] **Step 4: Add the landmark target to the base layout**

In `src/layouts/Base.astro`, put this immediately inside `<body>`:

```astro
<a class="skip-link" href="#main-content">Skip to content</a>
```

The homepage `main` element will receive `id="main-content"` in Task 3.

- [ ] **Step 5: Build and inspect global constraints**

Run: `npm run build`

Expected: PASS with no CSS import or Astro template errors.

- [ ] **Step 6: Commit the baseline visual system**

```bash
git add src/styles/tokens.css src/styles/global.css src/layouts/Base.astro
git commit -m "feat: establish collage design tokens"
```

### Task 2: Add tested field-motion utilities and the desktop-only pointer layer

**Files:**
- Create: `src/scripts/field-motion.ts`
- Create: `tests/field-motion.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces `canUseFieldMotion(preferReducedMotion: boolean, finePointer: boolean): boolean`.
- Produces `takeNewest<T>(items: T[], limit: number): T[]`.
- Produces `mountFieldMotion(root: HTMLElement): () => void`, which is safe to call once on the hero field and returns a cleanup callback.
- Adds `test` script: `vitest run`.

- [ ] **Step 1: Write the failing unit tests**

Create `tests/field-motion.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { canUseFieldMotion, takeNewest } from '../src/scripts/field-motion';

describe('canUseFieldMotion', () => {
  it('enables motion only for fine pointers without reduced motion', () => {
    expect(canUseFieldMotion(false, true)).toBe(true);
    expect(canUseFieldMotion(true, true)).toBe(false);
    expect(canUseFieldMotion(false, false)).toBe(false);
  });
});

describe('takeNewest', () => {
  it('keeps only the newest bounded entries', () => {
    expect(takeNewest([1, 2, 3, 4], 2)).toEqual([3, 4]);
    expect(takeNewest([1, 2], 6)).toEqual([1, 2]);
  });
});
```

- [ ] **Step 2: Run the focused test to confirm it fails**

Run: `npx vitest run tests/field-motion.test.ts`

Expected: FAIL with module-not-found for `src/scripts/field-motion`.

- [ ] **Step 3: Write the utility exports and pointer implementation**

Create `src/scripts/field-motion.ts` with these public utilities and behavior:

```ts
export function canUseFieldMotion(preferReducedMotion: boolean, finePointer: boolean) {
  return !preferReducedMotion && finePointer;
}

export function takeNewest<T>(items: T[], limit: number) {
  return items.length <= limit ? items : items.slice(-limit);
}
```

Implement `mountFieldMotion(root)` to:

1. Read `matchMedia('(prefers-reduced-motion: reduce)')` and `matchMedia('(pointer: fine)')`; return a no-op cleanup function when `canUseFieldMotion` is false.
2. Create one `div.field-wand[aria-hidden="true"]` and append it to `root`.
3. On `pointermove`, place the 74px wand at the pointer location, with `transform: rotate(-45deg)`. Create a `.field-trail` only after pointer movement exceeds 24px; cycle `green`, `blue`, `orange`, and `star` classes; cap active trails to 34; remove each after 820ms.
4. On `pointerdown` with a non-touch pointer, create `.field-click` using the same color cycle; cap active clicks to 12; remove each after 1260ms.
5. Use event delegation to add `is-target` to the wand when the pointer enters an `a`, `button`, or `[data-field-target]` inside `root`.
6. Return a cleanup callback that removes listeners, all generated nodes, and the wand.

All generated elements must use `pointer-events: none`; no handler may call `preventDefault`.

- [ ] **Step 4: Add the test script and run the focused test**

Add this to `package.json` scripts:

```json
"test": "vitest run"
```

Run: `npm test -- tests/field-motion.test.ts`

Expected: PASS with 2 test groups and 2 passing tests.

- [ ] **Step 5: Add global motion classes**

In `src/styles/global.css`, add `.field-wand`, `.field-trail`, `.field-click`, `.field-wand.is-target`, and their keyframes. The wand must be `74px` long, have `transform-origin: 90% 50%`, point at `-45deg`, and use green body, orange ferrule, dark tip, and an orange `✦` pseudo-element. Trail and click keyframes must animate only `transform`, `opacity`, and `box-shadow`.

- [ ] **Step 6: Run complete automated checks**

Run: `npm test && npm run build`

Expected: both commands PASS.

- [ ] **Step 7: Commit the tested motion layer**

```bash
git add package.json src/scripts/field-motion.ts src/styles/global.css tests/field-motion.test.ts
git commit -m "feat: add magic pencil field motion"
```

### Task 3: Rebuild the semantic hero as the controlled collage poster

**Files:**
- Modify: `src/components/Hero.astro`
- Modify: `src/pages/index.astro`
- Modify: `src/scripts/hero.ts`
- Modify: `src/styles/global.css`

**Interfaces:**
- `Hero.astro` produces one `#field-hero[data-field-motion]` root and keeps all hero routes as normal anchors.
- `index.astro` provides `<main id="main-content" class="content">`.
- `hero.ts` imports `mountFieldMotion` and invokes it after DOM availability while preserving existing scroll/collapse and reveal behavior.

- [ ] **Step 1: Add the hero field root and blank holder markup**

Replace the framed hero-card hierarchy with a semantic `section` rooted at:

```astro
<section class="field-hero" id="top" data-field-motion aria-labelledby="hero-name">
  <div class="field-orb field-orb-blue" aria-hidden="true"></div>
  <div class="field-orb field-orb-green" aria-hidden="true"></div>
  <div class="field-orb field-orb-orange" aria-hidden="true"></div>
  <div class="field-grid" aria-hidden="true"></div>
  <div class="field-meta">Zibin Zhao.com · unfinished index</div>
  <span class="field-sticker">Open to collaboration</span>
  <h1 id="hero-name" class="field-name"><span>Zibin</span><span>Zhao</span></h1>
  <div class="field-orbit" aria-hidden="true"></div>
  <div class="experiment-holder" data-field-target>
    <span class="t-en">Image / experiment holder — waiting for an original visual</span>
    <span class="t-zh">图像 / 实验占位区 —— 等待原创视觉素材</span>
  </div>
  <p class="field-statement">
    <span class="t-en">Bioengineering × AI — tools for care, learning, and everyday wellbeing.</span>
    <span class="t-zh">生物工程 × 人工智能 —— 为关怀、学习与日常健康打造工具。</span>
  </p>
  <nav class="field-routes" aria-label="Primary">
    <!-- map existing profile.navLinks, preserving href and T -->
  </nav>
</section>
```

Keep email, language toggle, and social links as actual accessible controls; use `T` for all new English/Chinese visible copy.

- [ ] **Step 2: Add the bounded desktop and stacked mobile hero CSS**

Scope hero styles in `Hero.astro` so desktop positions use percentages/clamps, not fixed viewport coordinates. Add a `@media (max-width: 760px)` rule that changes `.field-hero` to a single-column flow, makes route stickers wrap, removes absolute positioning from text content, and keeps the blank holder in normal flow. Add `@media (prefers-reduced-motion: reduce)` rules that stop orb/orbit animations.

- [ ] **Step 3: Connect the motion module without changing content behavior**

At the bottom of `src/scripts/hero.ts`, add:

```ts
import { mountFieldMotion } from './field-motion';

const fieldRoot = document.querySelector<HTMLElement>('[data-field-motion]');
if (fieldRoot) mountFieldMotion(fieldRoot);
```

Keep the IntersectionObserver reveal behavior and update only selectors invalidated by the new hero markup.

- [ ] **Step 4: Add the main landmark target**

In `src/pages/index.astro`, change:

```astro
<main class="content">
```

to:

```astro
<main id="main-content" class="content" tabindex="-1">
```

- [ ] **Step 5: Build and inspect hero markup**

Run: `npm run build`

Expected: PASS; generated HTML has one `h1`, one `main#main-content`, a blank holder string, and all existing hero links.

- [ ] **Step 6: Commit the collage hero**

```bash
git add src/components/Hero.astro src/pages/index.astro src/scripts/hero.ts src/styles/global.css
git commit -m "feat: rebuild hero as research collage"
```

### Task 4: Convert supporting sections into readable scrapbook chapters

**Files:**
- Modify: `src/components/Section.astro`
- Modify: `src/components/About.astro`
- Modify: `src/components/PubList.astro`
- Modify: `src/components/Projects.astro`
- Modify: `src/components/ProjectCard.astro`
- Modify: `src/components/Vibe.astro`
- Modify: `src/components/VibeCard.astro`
- Modify: `src/components/CvTimeline.astro`
- Modify: `src/components/Contact.astro`

**Interfaces:**
- `Section.astro` accepts optional `variant?: 'note' | 'folder' | 'scrap' | 'strip'` and exposes `section--${variant}`.
- Cards preserve their current props and anchors; variants only change class names and visual framing.

- [ ] **Step 1: Add the section variant interface**

In `Section.astro`, set:

```astro
const { id, num, label, labelZh, variant = 'note' } = Astro.props;
```

and render `class:list={['reveal', 'sec', `section--${variant}`]}`. Do not alter slot order or anchor IDs.

- [ ] **Step 2: Assign a distinct variant to each chapter**

Pass `variant="note"` to About, `variant="folder"` to Publications, `variant="scrap"` to Projects and Vibe, and `variant="strip"` to CV. Keep the Contact section as its own closing poster component.

- [ ] **Step 3: Replace identical card surfaces with bounded scrapbook styles**

Use component-scoped CSS to apply:

- a small rotate/translate variation using `:nth-child()` only on desktop;
- colored paper backgrounds from the semantic tokens;
- `var(--shadow-sticker)` on interactive project and vibe cards;
- `transform` hover and `:focus-visible` states;
- zero rotation and one-column layout below 760px.

Publication rows must remain a linear list with visible years, titles, venue, authors, and links. CV must remain a linear timeline and retain the PDF download anchor.

- [ ] **Step 4: Make screenshot absence an explicit experiment state**

In `VibeCard.astro`, replace the generic striped placeholder copy with bilingual text that says it is an experiment/image holder awaiting a future original screenshot. Keep the existing `<img>` behavior unchanged when `screenshot` is supplied.

- [ ] **Step 5: Build and run tests**

Run: `npm test && npm run build`

Expected: PASS. Existing publication sorting tests remain green, and Astro renders every collection component.

- [ ] **Step 6: Commit the content chapter redesign**

```bash
git add src/components/Section.astro src/components/About.astro src/components/PubList.astro src/components/Projects.astro src/components/ProjectCard.astro src/components/Vibe.astro src/components/VibeCard.astro src/components/CvTimeline.astro src/components/Contact.astro
git commit -m "feat: style portfolio sections as scrapbook chapters"
```

### Task 5: Verify interaction fallbacks and the complete rendered experience

**Files:**
- Modify only if verification identifies a concrete defect in a file changed by Tasks 1–4.
- Test: `tests/field-motion.test.ts`

**Interfaces:**
- Verifies the public site behavior defined in the approved design specification; introduces no new visual scope.

- [ ] **Step 1: Run automated verification**

Run: `npm test && npm run build`

Expected: PASS.

- [ ] **Step 2: Start the local site for browser verification**

Run: `npm run dev -- --host 127.0.0.1`

Expected: Astro reports a localhost URL and serves the home page.

- [ ] **Step 3: Verify desktop fine-pointer behavior in a browser**

At a desktop viewport, confirm:

- the hero has the 45° 74px wand;
- trail marks fade and do not accumulate beyond the cap;
- clicks emit larger temporary ticks;
- hovering real links/stickers changes wand state but links remain clickable;
- nav anchors, language toggle, email, social links, CV download, and external links work;
- no console errors occur.

- [ ] **Step 4: Verify mobile and reduced-motion fallbacks**

At a mobile viewport, confirm no horizontal overflow, normal native cursor/tap behavior, stacked hero content, and reachable route stickers. Emulate `prefers-reduced-motion: reduce` and confirm no floating orbit, custom wand, trail, or click marks appear while all content remains visible and keyboard focus is clear.

- [ ] **Step 5: Commit any verification-only fixes**

If and only if a concrete issue was fixed during this task:

```bash
git add src/components/Hero.astro src/pages/index.astro src/scripts/hero.ts src/scripts/field-motion.ts src/styles/global.css src/styles/tokens.css src/components/Section.astro src/components/About.astro src/components/PubList.astro src/components/Projects.astro src/components/ProjectCard.astro src/components/Vibe.astro src/components/VibeCard.astro src/components/CvTimeline.astro src/components/Contact.astro tests/field-motion.test.ts package.json
git commit -m "fix: harden collage interaction fallbacks"
```

If no file changed, do not create an empty commit.
