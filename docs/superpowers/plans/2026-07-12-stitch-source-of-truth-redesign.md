# Stitch Source-of-Truth Portfolio Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current long-form homepage with a faithful Astro implementation of the downloaded Stitch canvas and complete motion system, while preserving all content and functionality through dedicated Index Sheet routes.

**Architecture:** Keep Astro collections and TypeScript data as the factual source of truth. Build a shared Stitch shell, three canonical homepage compositions, and supporting route-specific Index Sheets; validate the canonical 768px composition and every flow with retained lint, type, unit, build, and Playwright checks.

**Tech Stack:** Astro 6.4, TypeScript 6.0, scoped Astro CSS, local Fontsource packages, Vitest 4, ESLint 10 flat config, `astro check`, and Playwright Chromium.

## Global Constraints

- `screen.png` governs homepage composition, scale, spacing, overlap, card placement, and hierarchy.
- `code.html` governs animation names, timings, easing, interaction behavior, labels, and structural intent.
- `DESIGN.md` governs tokens, typography roles, component treatment, shape language, and responsive principles.
- Existing Astro data governs facts, bilingual text, URLs, complete collections, downloads, and behavior.
- The homepage contains only Header/Atmosphere, Hero, three Featured Research cards, Vibe Codings, and the fixed Footer Dock.
- About, complete Research, Projects, CV, Contact, and Prompts remain at `/about/`, `/research/`, `/projects/`, `/cv/`, `/contact/`, and `/prompts/`.
- Use local Anton, Space Grotesk, and JetBrains Mono. No React, Tailwind runtime/CDN, Google font/icon runtime, or Material Symbols runtime.
- Preserve every Stitch animation in normal mode and add no non-Stitch motion.
- `prefers-reduced-motion: reduce` renders the same composition statically.
- Preserve all claims, metadata, destinations, bilingual behavior, CV download, and Prompts behavior.
- Fixed controls must not obscure content; mobile must respect safe areas and have no page-level overflow.
- Implement on isolated branch `codex/stitch-source-of-truth`, review each task, merge into `main`, push, and verify production.

## File Structure

- `src/layouts/StitchShell.astro`: shared header, atmosphere, footer dock, bottom reserve, language script.
- `src/components/StitchHeader.astro`: source header.
- `src/components/StitchAtmosphere.astro`: guide lines, blobs, notes.
- `src/components/StitchFooterDock.astro`: socials, six labels, marquee, draw control.
- `src/components/IndexSheet.astro`: supporting-route surface.
- `src/components/StitchHero.astro`: canonical Hero.
- `src/components/FeaturedResearch.astro`: canonical three-paper stack.
- `src/components/StitchVibe.astro`: canonical five-card mosaic.
- `src/components/StitchVibeCard.astro`: one data-driven Vibe role card with image/fallback/link semantics.
- `src/data/home.ts`: stable homepage title selection.
- `src/styles/stitch-motion.css`: exact Stitch motion contract.
- `src/pages/{about,research,projects,cv,contact}.astro`: Index Sheet routes.
- `public/stitch/`: captured source assets and provenance.
- `eslint.config.js`, `playwright.config.ts`, unit contracts, and `tests/e2e/stitch.spec.ts`: retained gates.

---

### Task 1: Add Quality Gates and Capture Stitch Assets

**Files:**
- Modify: `package.json`, `package-lock.json`
- Create: `eslint.config.js`, `tests/tooling.test.ts`, `public/stitch/ASSETS.md`
- Download: `public/stitch/cart.png`; attempt `casmd.png` and `singularity.png`

**Interfaces:**
- Produces scripts `lint`, `check`, `test:browser`, `verify` and local Stitch asset paths.

- [ ] **Step 1: Write the failing tooling contract**

```ts
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
const root = new URL('..', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');

describe('production quality gates', () => {
  it('defines all verification scripts', () => {
    const pkg = JSON.parse(read('package.json'));
    expect(pkg.scripts.lint).toBe('eslint .');
    expect(pkg.scripts.check).toBe('astro check');
    expect(pkg.scripts['test:browser']).toBe('playwright test');
    expect(pkg.scripts.verify).toBe('npm run lint && npm run check && npm test && npm run build');
  });
  it('tracks Stitch asset provenance and the cart image', () => {
    expect(existsSync(new URL('public/stitch/cart.png', root))).toBe(true);
    expect(read('public/stitch/ASSETS.md')).toContain('Rollercoaster Cart Icon');
  });
});
```

- [ ] **Step 2: Confirm RED**

Run: `npm test -- tests/tooling.test.ts`

Expected: FAIL because scripts and assets are absent.

- [ ] **Step 3: Install verified tooling**

```bash
npm install --save-dev @astrojs/check eslint@^10 @eslint/js@^10 eslint-plugin-astro@^3 eslint-plugin-jsx-a11y@^6 typescript-eslint@^8 @playwright/test
npx playwright install chromium
```

- [ ] **Step 4: Add scripts and ESLint flat config**

Add scripts exactly as asserted above. Create:

```js
import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

export default [
  { ignores: ['.astro/**', 'dist/**', 'public/medit/**', 'public/singularity/**', 'node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  { files: ['**/*.astro'], rules: { 'no-undef': 'off', '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }] } },
];
```

- [ ] **Step 5: Capture assets with retry and fallback**

```bash
mkdir -p public/stitch
curl --http1.1 -L --retry 4 --retry-all-errors -o public/stitch/cart.png 'https://lh3.googleusercontent.com/aida/AP1WRLvnukA4djZtHJYJuWsaZFrOqcFIe7eDBqp2l-uqnngfE35Yu431xhsySJ-xfgYyVQpaAMK1jT2Lkh-kvlBh_QPfNZLqVojrX1XVhONFJ3MOsOx3C9PFRlBaRaRNX0DN_STRU5g-EOqzWfCuhBic6SUNgFWepL1jIqgVZub30ZLjxvf58xtk6Jz7stroLGL-AGASWPw18JxYw-H1jSzVLIN_JIYN4LKF9IIe3ltrt9PjfLEKRKro_y7OEuk'
curl --http1.1 -L --retry 4 --retry-all-errors -o public/stitch/casmd.png 'https://lh3.googleusercontent.com/aida-public/AB6AXuADAS1hLtMNV3KPctLCuijwWbLl_fBo5JOpKHun3lRqI1ksYcZSbVuLXNXQKrgeD47XCqMJopo-ucFm6AHxh9gByOuT0SuHs07wtb-xseI7uclUqrzFKAn7roU5aCtnjkCFtt6xBvg9a_J-esLFr7jYbpbjzJcltOoNjE3c7ZFVCcDgf03wmZUi0YVAp7kbysLmJICAAy0vC28jgZ2rxUYQYJGJVx5EvvOqBX-9U72K-gopG5xd4CNiwA' || rm -f public/stitch/casmd.png
curl --http1.1 -L --retry 4 --retry-all-errors -o public/stitch/singularity.png 'https://lh3.googleusercontent.com/aida/AP1WRLuIuDlbAi1qUHUzUPq12hb61crXnPBnrK6HTLIQs_EIZvjE4TBGh298OQzIErcl_ODAPXJdp9gTRvFH4-1CATy3nt0gC8JOGln0sxJwSyAXb-YU3TGHtlAvY9ySUgyvTntH22zL5Cib_Jq4JJL6qPNR4X7ic7I4ohcapvTUof7X-R-R4_-jaUsjRFL8xW4T0CPlLzzGCrIG959wPtopy8v0qnpjggR12-D4EzW_Ujmnt5iiV_zxfWUSdi0x' || rm -f public/stitch/singularity.png
file public/stitch/*.png
```

Write `ASSETS.md` with this exact structure:

```md
# Stitch asset provenance

Captured from `/Users/zibinzhao/Downloads/stitch_zibinzhao.com/code.html` on 2026-07-12.

| Local file | Stitch label | Runtime fallback |
| --- | --- | --- |
| `/stitch/cart.png` | Rollercoaster Cart Icon | Styled 64×64 specimen box with `SPECIMEN` text |
| `/stitch/casmd.png` | CasMD | Original `aida-public` URL from `code.html`, then the experiment-preview fallback |
| `/stitch/singularity.png` | Singularity | `/vibe-singularity.jpg` |

The exact remote URLs remain recorded in this repository's approved design specification and implementation plan.
```

- [ ] **Step 6: Verify and commit**

Run: `npm run lint && npm run check && npm test -- tests/tooling.test.ts && npm run build`

```bash
git add package.json package-lock.json eslint.config.js tests/tooling.test.ts public/stitch
git commit -m "chore: add Stitch quality gates and assets"
```

---

### Task 2: Build the Shared Stitch Shell and Motion System

**Files:**
- Create: `src/layouts/StitchShell.astro`, `src/components/StitchHeader.astro`, `StitchAtmosphere.astro`, `StitchFooterDock.astro`, `IndexSheet.astro`, `src/styles/stitch-motion.css`, `tests/stitch-foundation.test.ts`
- Modify: `Base.astro`, `tokens.css`, `global.css`, `profile.ts`
- Delete after replacement: `Nav.astro`, `hero.ts`, `menu.ts`, `tests/menu.test.ts`, obsolete homepage contracts

**Interfaces:**
- Produces `<StitchShell title? description? active? home?>` and exact reusable Stitch animation classes.

- [ ] **Step 1: Write the failing shell/motion contract**

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
const root = new URL('..', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');

describe('Stitch shell', () => {
  it('defines exact motion timings', () => {
    const css = read('src/styles/stitch-motion.css');
    expect(css).toContain('parallax-slow 20s linear infinite alternate');
    expect(css).toContain('parallax-fast 15s linear infinite alternate');
    expect(css).toContain('float 6s ease-in-out infinite');
    expect(css).toContain('morph 8s ease-in-out infinite both alternate');
    expect(css).toContain('marquee 20s linear infinite');
    expect(css).toContain('glitch-skew .3s cubic-bezier(.25, .46, .45, .94) both infinite');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
  });
  it('renders the authored shell destinations', () => {
    const header = read('src/components/StitchHeader.astro');
    const footer = read('src/components/StitchFooterDock.astro');
    expect(header).toContain('UNFINISHED INDEX');
    expect(header).not.toContain('menubtn');
    for (const href of ['/about/', '/research/', '/projects/', '/#vibe', '/cv/', '/contact/', '/prompts/']) expect(footer).toContain(href);
  });
});
```

- [ ] **Step 2: Confirm RED**

Run: `npm test -- tests/stitch-foundation.test.ts`

- [ ] **Step 3: Define shared tokens**

```css
:root {
  --surface:#fffae0; --surface-low:#f9f4d9; --surface-container:#f3eed4; --surface-high:#eee9ce;
  --ink:#003322; --on-surface:#1d1c0c; --muted:#414944; --outline:#717973; --outline-variant:#c0c8c2;
  --green:#a2d39c; --green-bright:#bdf0b6; --orange:#ffb95f; --blue:#87ceeb;
  --grid-size:20px; --page-pad:clamp(20px,5.2vw,40px); --canvas-max:1024px;
  --stroke:2px solid var(--ink); --shadow-2:2px 2px 0 var(--ink); --shadow-4:4px 4px 0 var(--ink);
  --shadow-6:6px 6px 0 var(--ink); --shadow-8:8px 8px 0 var(--ink); --footer-reserve:150px;
  --font-display:'Anton','Arial Narrow',sans-serif; --font-body:'Space Grotesk','PingFang SC',sans-serif;
  --font-note:'JetBrains Mono',ui-monospace,monospace;
}
```

- [ ] **Step 4: Implement exact Stitch motion CSS**

```css
@keyframes parallax-slow{from{transform:translateY(0) rotate(1deg)}to{transform:translateY(-50px) rotate(1deg)}}
@keyframes parallax-fast{from{transform:translateY(0) rotate(-2deg)}to{transform:translateY(-80px) rotate(-2deg)}}
@keyframes float{0%,100%{transform:translateY(0) rotate(3deg)}50%{transform:translateY(-15px) rotate(1deg)}}
@keyframes morph{from{border-radius:40% 60% 70% 30%/40% 50% 60% 50%}to{border-radius:60% 40% 30% 70%/60% 30% 70% 40%}}
@keyframes fade-up{from{opacity:0;transform:translateY(20px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}
@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-100%)}}
@keyframes glitch-skew{0%,100%{transform:skew(0)}20%{transform:skew(-5deg)}40%{transform:skew(5deg)}60%{transform:skew(-2deg)}80%{transform:skew(2deg)}}
.animate-parallax-slow{animation:parallax-slow 20s linear infinite alternate}.animate-parallax-fast{animation:parallax-fast 15s linear infinite alternate}
.animate-float{animation:float 6s ease-in-out infinite}.blob{animation:morph 8s ease-in-out infinite both alternate}
.animate-fade-up-1{animation:fade-up .6s ease-out .1s both}.animate-fade-up-2{animation:fade-up .6s ease-out .2s both}
.animate-fade-up-3{animation:fade-up .6s ease-out .3s both}.animate-fade-up-4{animation:fade-up .6s ease-out .4s both}
.marquee span{animation:marquee 20s linear infinite}.glitch-hover:hover{animation:glitch-skew .3s cubic-bezier(.25,.46,.45,.94) both infinite}
.btn-primary{transition:box-shadow .15s ease,transform .15s ease}.btn-primary:active{box-shadow:none;transform:translate(4px,4px)}
.pub-card{transition:box-shadow .3s cubic-bezier(.25,.8,.25,1),transform .3s cubic-bezier(.25,.8,.25,1)}
.pub-card:hover{box-shadow:8px 8px 0 var(--ink);transform:translate(-4px,-4px) rotate(1deg)}
.pub-card:hover .magnify-icon{color:var(--green);transform:scale(1.2)}
.draw-control{transition:transform .15s ease}.draw-control:hover{transform:rotate(12deg)}
```

Add reduced-motion rules that disable animations, expose fade-up content, and keep marquee text readable. Apply fade-up classes to outer wrappers and card rotation to inner physical cards so the animation transform never erases the canonical resting rotation.

- [ ] **Step 5: Implement shell components**

```astro
<header class="stitch-header">
  <a class="site-stamp" href="/">ZIBINZHAO.COM · <T en="UNFINISHED INDEX" zh="未完成索引" /></a>
  <div class="header-actions"><LangToggle /><a class="talk btn-primary" href={`mailto:${profile.email}`}><T en="LET'S TALK ↗" zh="联系我 ↗" /></a></div>
</header>
```

Atmosphere has exactly two guide lines at `left:15%` and `right:24%`, two blobs, and three notes. Footer has real route/social anchors, `/prompts/` draw control, duplicated marquee text, pointer-active controls, and pointer-inert decoration. Shell wraps Base and exposes `main#main-content`.

Keep Base's early `.js` class. Hide the language button when JavaScript is unavailable so no dead control remains; ordinary route, mail, social, download, and footer anchors stay visible and usable with default English content.

- [ ] **Step 6: Remove replaced menu/reveal files, verify, and commit**

Run: `npm test -- tests/stitch-foundation.test.ts && npm run lint && npm run check && npm test && npm run build`

```bash
git add src tests
git commit -m "feat: build the Stitch shell and motion system"
```

---

### Task 3: Reproduce the Canonical Stitch Hero

**Files:**
- Create: `src/components/StitchHero.astro`
- Modify: `src/pages/index.astro`, `tests/stitch-foundation.test.ts`

**Interfaces:**
- Consumes profile identity/status/role/tagline and `/stitch/cart.png`.
- Produces `#top`, `#hero-name`, `.hero-wordmark`, `.hero-card`, `.collaboration-sticker`, `.hero-formula`, `.scroll-sticker`.

- [ ] **Step 1: Add failing hero assertions**

```ts
it('uses the source-faithful hero and cart asset',()=>{
  const hero=read('src/components/StitchHero.astro'); const page=read('src/pages/index.astro');
  for(const marker of ['hero-wordmark','collaboration-sticker','hero-card','scroll-sticker']) expect(hero).toContain(marker);
  expect(hero).toContain('src="/stitch/cart.png"'); expect(page).toContain('<StitchHero />');
  for(const legacy of ['<About />','<Projects />','<CvTimeline />','<Contact />']) expect(page).not.toContain(legacy);
});
```

- [ ] **Step 2: Confirm RED**

Run: `npm test -- tests/stitch-foundation.test.ts`

- [ ] **Step 3: Implement semantic hero markup**

```astro
<section class="stitch-hero" id="top" aria-labelledby="hero-name">
  <span class="collaboration-sticker"><T en={profile.status.en} zh={profile.status.zh} /></span>
  <h1 class="hero-wordmark" id="hero-name"><span>{profile.firstName}</span><span>{profile.lastName}</span></h1>
  <span class="hero-formula" aria-hidden="true">f(x) = ∫(CRISPR + AI)dx</span>
  <article class="hero-card"><h2><T en={profile.role.en} zh={profile.role.zh} /></h2><p class="hero-thesis"><T en="AIing, caring, learning, and everyday wellbeing." zh="人工智能、关怀、学习与日常健康。" /></p><p><T en={profile.tagline.en} zh={profile.tagline.zh} /></p><div class="hero-card-meta"><img src="/stitch/cart.png" alt="Illustrated rollercoaster specimen cart" width="64" height="64" /><span>v1.0.4 // Active</span></div></article>
  <a class="scroll-sticker" href="#research"><T en="Scroll for updates ↓" zh="向下查看更新 ↓" /></a>
</section>
```

- [ ] **Step 4: Implement geometry and homepage shell**

At 768px, wordmark occupies the left quarter near 23% hero height; sticker sits near one-third width; 450px card is centered lower; formula sits above/right; scroll sticker sits near 30% from left. Use bounded absolute/percentage placement on desktop and source-order single column below 640px.

Start from this concrete geometry and refine only during Task 8 visual comparison:

```css
.stitch-hero{position:relative;min-height:819px;margin-top:40px}.hero-wordmark{position:absolute;top:170px;left:0;font:400 clamp(76px,15.6vw,120px)/.8 var(--font-display)}
.collaboration-sticker{position:absolute;top:40px;left:33%;transform:rotate(-6deg)}
.hero-card{position:absolute;top:360px;left:50%;width:min(450px,60vw);transform:translateX(-50%) rotate(-2deg)}
.hero-formula{position:absolute;top:330px;left:60%;transform:rotate(12deg)}
.scroll-sticker{position:absolute;top:680px;left:30%;transform:rotate(-3deg)}
@media(max-width:640px){.stitch-hero{display:flex;min-height:auto;flex-direction:column;gap:32px;padding:120px 20px 90px}.hero-wordmark,.collaboration-sticker,.hero-card,.hero-formula,.scroll-sticker{position:relative;inset:auto;align-self:flex-start}.hero-card{width:100%;transform:rotate(-2deg)}}
```

```astro
<StitchShell home><StitchHero /></StitchShell>
```

- [ ] **Step 5: Verify and commit**

Run: `npm test -- tests/stitch-foundation.test.ts && npm run check && npm run build`

```bash
git add src/components/StitchHero.astro src/pages/index.astro tests/stitch-foundation.test.ts
git commit -m "feat: reproduce the canonical Stitch hero"
```

---

### Task 4: Add Featured Research and Full Research Route

**Files:**
- Create: `src/data/home.ts`, `src/components/FeaturedResearch.astro`, `src/pages/research.astro`, `tests/home-selection.test.ts`
- Modify: `src/pages/index.astro`, `tests/stitch-foundation.test.ts`

**Interfaces:**
- Produces `selectByTitles<T extends {title:string}>`, `HOME_RESEARCH_TITLES`, and later `HOME_VIBE_TITLES`.

- [ ] **Step 1: Write failing deterministic-selection tests**

```ts
import { describe,expect,it } from 'vitest';
import { HOME_RESEARCH_TITLES,selectByTitles } from '../src/data/home';
it('selects named records in authored order',()=>expect(selectByTitles([{title:'B'},{title:'A'},{title:'C'}],['A','C']).map(x=>x.title)).toEqual(['A','C']));
it('fails when canonical data is missing',()=>expect(()=>selectByTitles([{title:'A'}],['A','B'])).toThrow('Missing canonical Stitch item: B'));
it('names the three papers',()=>expect(HOME_RESEARCH_TITLES).toEqual([
  'DNA-guided CRISPR–Cas12a effectors for programmable RNA recognition and cleavage',
  'Structure-enhanced deep learning accelerates aptamer selection for small molecule families like steroids',
  'Transforming ECG diagnosis: an in-depth review of transformer-based deep-learning models in cardiovascular disease detection',
]));
```

- [ ] **Step 2: Confirm RED and implement selection**

Run: `npm test -- tests/home-selection.test.ts`

```ts
export function selectByTitles<T extends {title:string}>(items:T[],titles:readonly string[]):T[]{
  const byTitle=new Map(items.map(item=>[item.title,item]));
  return titles.map(title=>{const item=byTitle.get(title);if(!item)throw new Error(`Missing canonical Stitch item: ${title}`);return item;});
}
```

- [ ] **Step 3: Build exact three-card research composition**

Render title, year/venue strip, authors, star, and every link. Use explicit role classes with 85%/70%/60% widths, right/left/center offsets, second-card negative overlap, solid/solid/dashed strokes, source rotations, large green Anton banner, and separate selected-work annotation.

Use an outer fade wrapper and inner physical card:

```astro
<section class="featured-research" id="research" aria-labelledby="research-title">
  <header class="research-heading"><h2 id="research-title">02 — <T en="Research & Publications" zh="研究与论文" /></h2><span><T en="Selected work" zh="代表性成果" /></span></header>
  <div class="research-stack">
    {featured.map((paper,index)=><div class:list={['fade-slot',`animate-fade-up-${index+1}`]}><article class:list={['pub-card',`pub-card--${index+1}`]}>{index===0&&<span class="paper-index">1</span>}<div class="paper-meta"><span>{paper.year} / {paper.venue}</span><span class="magnify-icon" aria-hidden="true">⌕</span></div><h3>{paper.title}{paper.featured&&<span aria-label="Featured">★</span>}</h3>{paper.authors&&<p>{paper.authors}</p>}{paper.links&&<div class="paper-links">{Object.entries(paper.links).filter(([,href])=>href).map(([label,href])=><a href={href} target="_blank" rel="noopener">{label.toUpperCase()} →</a>)}</div>}</article></div>)}
  </div>
</section>
```

- [ ] **Step 4: Add complete `/research/` Index Sheet**

```astro
<StitchShell title="Research — Zibin Zhao" active="research"><IndexSheet number="02" title="Research & Publications" titleZh="研究与论文"><PubList /></IndexSheet></StitchShell>
```

- [ ] **Step 5: Verify and commit**

Run: `npm test -- tests/home-selection.test.ts tests/pubs.test.ts tests/stitch-foundation.test.ts && npm run check && npm run build`

```bash
git add src/data/home.ts src/components/FeaturedResearch.astro src/pages/index.astro src/pages/research.astro tests
git commit -m "feat: add Stitch research composition and archive"
```

---

### Task 5: Reproduce the Five-Card Stitch Vibe Mosaic

**Files:**
- Modify: `src/data/home.ts`, `src/pages/index.astro`, `src/content/vibe/casmd.md`, `tests/home-selection.test.ts`, `tests/stitch-foundation.test.ts`
- Create: `src/components/StitchVibe.astro`, `src/components/StitchVibeCard.astro`

**Interfaces:**
- Adds `HOME_VIBE_TITLES = ['CasMD','Singularity','Medit','Yaos','Zen'] as const`.
- Produces `#vibe` and fixed role classes `vibe-card--casmd|singularity|medit|yaos|zen`.

- [ ] **Step 1: Add failing order/structure tests**

```ts
it('fixes canonical Vibe order',()=>expect(HOME_VIBE_TITLES).toEqual(['CasMD','Singularity','Medit','Yaos','Zen']));
it('renders all authored Vibe roles',()=>{
  const vibe=read('src/components/StitchVibe.astro');
  for(const role of ['casmd','singularity','medit','yaos','zen'])expect(vibe).toContain(`vibe-card--${role}`);
  expect(vibe).toContain('04 —'); expect(vibe).toContain('LOL');
});
```

- [ ] **Step 2: Confirm RED**

Run: `npm test -- tests/home-selection.test.ts tests/stitch-foundation.test.ts`

- [ ] **Step 3: Implement stable role mapping and asset fallbacks**

Select the five records by title; render each role explicitly rather than relying on collection indices. Asset order:

```ts
const casmdImage = '/stitch/casmd.png'; // if captured, otherwise exact source URL with fallback surface
const singularityImage = '/stitch/singularity.png'; // if captured, otherwise '/vibe-singularity.jpg'
```

CasMD/Singularity are image-led, Medit is text-only, Yaos is compact, and Zen is dashed/coming-soon. All links and bilingual copy come from collection data.

`StitchVibeCard` accepts `{ item, role, image?, dark? }`, renders the record's title, bilingual description, tags, safe link/coming-soon action, and an image or designed fallback. Use explicit named records and wrappers:

```astro
<section class="stitch-vibe" id="vibe" aria-labelledby="vibe-title">
  <h2 id="vibe-title">04 — Vibe Codings</h2>
  <aside class="lol-note"><strong>LOL</strong><T en="Things I've vibe-coded." zh="我随性编写的小项目。" /></aside>
  <div class="vibe-mosaic">
    <div class="fade-slot animate-fade-up-1"><StitchVibeCard item={casmd} role="casmd" image={casmdImage} /></div>
    <div class="fade-slot animate-fade-up-2"><StitchVibeCard item={singularity} role="singularity" image={singularityImage} dark /></div>
    <div class="fade-slot animate-fade-up-3"><StitchVibeCard item={medit} role="medit" /></div>
    <div class="vibe-lower animate-fade-up-4"><StitchVibeCard item={yaos} role="yaos" /><StitchVibeCard item={zen} role="zen" /></div>
  </div>
</section>
```

- [ ] **Step 4: Implement exact desktop mosaic and mobile order**

- CasMD: 8/12 columns, large image, solid cream body, `rotate(1deg)`.
- Singularity: 6/12 columns, negative top offset, 20% left offset, dark body, `rotate(-2deg)`.
- Medit: 5/12 columns, right aligned, stronger negative top offset, text-only, `rotate(3deg)`.
- Yaos/Zen: shared full row with bounded compact cards, `rotate(-1deg)` / `rotate(2deg)`.
- Below 700px: single column with bounded overlap and no page overflow.

- [ ] **Step 5: Verify and commit**

Run: `npm test -- tests/home-selection.test.ts tests/stitch-foundation.test.ts && npm run lint && npm run check && npm run build`

```bash
git add src/data/home.ts src/components/StitchVibe.astro src/components/StitchVibeCard.astro src/pages/index.astro src/content/vibe tests
git commit -m "feat: reproduce the Stitch Vibe mosaic"
```

---

### Task 6: Move Existing Content into Index Sheet Routes

**Files:**
- Create: `src/pages/about.astro`, `projects.astro`, `cv.astro`, `contact.astro`, `tests/routes.test.ts`
- Modify: `Section.astro`, `About.astro`, `PubList.astro`, `Projects.astro`, `ProjectCard.astro`, `CvTimeline.astro`, `Contact.astro`

**Interfaces:**
- Consumes IndexSheet, collections, profile, and cv; produces complete supporting routes.

- [ ] **Step 1: Write failing route/content contracts**

```ts
import { readFileSync } from 'node:fs';
import { describe,expect,it } from 'vitest';
const root=new URL('..',import.meta.url);const read=(path:string)=>readFileSync(new URL(path,root),'utf8');
describe('Index Sheet routes',()=>{
  for(const route of ['about','research','projects','cv','contact'])it(`provides /${route}/`,()=>expect(read(`src/pages/${route}.astro`)).toContain('<StitchShell'));
  it('preserves complete sources',()=>{
    expect(read('src/pages/about.astro')).toContain('<About />');
    expect(read('src/pages/research.astro')).toContain('<PubList />');
    expect(read('src/pages/projects.astro')).toContain('<Projects />');
    expect(read('src/pages/cv.astro')).toContain('<CvTimeline />');
    expect(read('src/pages/contact.astro')).toContain('<Contact />');
  });
});
```

- [ ] **Step 2: Confirm RED**

Run: `npm test -- tests/routes.test.ts`

- [ ] **Step 3: Create supporting pages with exact metadata**

Use this pattern with corresponding number/title/active/component:

```astro
<StitchShell title="About — Zibin Zhao" active="about"><IndexSheet number="01" title="About" titleZh="关于"><About /></IndexSheet></StitchShell>
```

Use `03/Projects`, `05/CV`, and `06/Contact`. Research already uses `02`.

Exact mapping:

| Route | number | title / titleZh | active | component |
| --- | --- | --- | --- | --- |
| `/about/` | `01` | `About / 关于` | `about` | `<About />` |
| `/research/` | `02` | `Research & Publications / 研究与论文` | `research` | `<PubList />` |
| `/projects/` | `03` | `Projects / 项目` | `projects` | `<Projects />` |
| `/cv/` | `05` | `CV / 简历` | `cv` | `<CvTimeline />` |
| `/contact/` | `06` | `Contact / 联系` | `contact` | `<Contact />` |

- [ ] **Step 4: Restyle renderers as physical archive content**

Remove homepage-scale spacing/repeated generic banners. Keep semantic headings and data mapping. Use cream sheets, 2px strokes, 4px/6px block shadows, dashed metadata rules, Anton major titles, Space Grotesk body, mono labels, ±2deg maximum rotation, and single-column fallback below 700px. Do not remove any record, entry, note, skill, email, social, or download.

- [ ] **Step 5: Verify and commit**

Run: `npm test -- tests/routes.test.ts tests/pubs.test.ts && npm run lint && npm run check && npm run build`

```bash
git add src/pages src/components/Section.astro src/components/About.astro src/components/PubList.astro src/components/Projects.astro src/components/ProjectCard.astro src/components/CvTimeline.astro src/components/Contact.astro tests/routes.test.ts
git commit -m "feat: move portfolio content into Index Sheets"
```

---

### Task 7: Integrate Prompts with the Stitch Shell

**Files:**
- Modify: `src/pages/prompts.astro`, `src/components/PromptBlock.astro`, `tests/routes.test.ts`, `tests/stitch-foundation.test.ts`

**Interfaces:**
- Preserves promptPack, `.copy`, `.ptext`, `.stagenav`, `.stage`, primary/fallback copy, and scroll-spy.

- [ ] **Step 1: Add failing behavior-hook assertions**

```ts
it('preserves Prompts hooks inside StitchShell',()=>{
  const page=read('src/pages/prompts.astro');
  for(const marker of ['<StitchShell',"document.querySelectorAll('.copy')","document.querySelectorAll('.stage')",'navigator.clipboard.writeText',"document.execCommand('copy')",'new IntersectionObserver'])expect(page).toContain(marker);
});
```

- [ ] **Step 2: Confirm RED**

Run: `npm test -- tests/routes.test.ts tests/stitch-foundation.test.ts`

- [ ] **Step 3: Replace page-specific shell without changing behavior**

Use StitchShell, one page h1, `main#main-content`, eight stage h2s, discipline heading, and shell/footer home return. Keep copy paths. Guard missing IntersectionObserver so stages remain usable; avoid scroll-spy fighting user stage navigation.

```astro
<StitchShell title="Prompt Pack — Zibin Zhao" active="prompts">
  <IndexSheet number="//" title={P.title} titleZh={P.title}>
    <section class="prompt-hero"><p class="kicker">{P.kicker}</p><p class="intro">{P.intro}</p><div class="meta"><p><strong>Running example</strong>{P.runningExample}</p><p><strong>How to use</strong>{P.howToUse}</p></div></section>
    <nav class="stagenav" aria-label="Pipeline stages">{P.stages.map((stage)=><a href={`#stage-${stage.num}`} data-stage={stage.num}><b>{stage.num}</b><span>{stage.title}</span></a>)}</nav>
    <div class="stages">{P.stages.map((stage)=><section class="stage" id={`stage-${stage.num}`}><header><span>{stage.num}</span><div><h2>{stage.title}</h2><span>{stage.tool}</span></div></header>{stage.note&&<p class="note">{stage.note}</p>}{stage.blocks.map((block)=><PromptBlock label={block.label} text={block.text} />)}{stage.afterNote&&<p class="after">↳ {stage.afterNote}</p>}</section>)}</div>
    <section class="discipline"><h2>{P.disciplineTitle}</h2><ul>{P.discipline.map((item)=><li>{item}</li>)}</ul></section>
  </IndexSheet>
</StitchShell>
```

- [ ] **Step 4: Verify and commit**

Run: `npm test -- tests/routes.test.ts tests/stitch-foundation.test.ts && npm run lint && npm run check && npm test && npm run build`

```bash
git add src/pages/prompts.astro src/components/PromptBlock.astro tests
git commit -m "feat: integrate Prompts with the Stitch shell"
```

---

### Task 8: Add Retained Browser Verification and Refine against `screen.png`

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/stitch.spec.ts`
- Modify after observed failures: relevant Task 2–7 component/style files
- Generate: `artifacts/stitch/home-768-full.png` and responsive screenshots

**Interfaces:**
- Consumes production build and all seven routes; produces reproducible browser checks and canonical screenshot.

- [ ] **Step 1: Configure production-preview Playwright**

```ts
import { defineConfig,devices } from '@playwright/test';
export default defineConfig({
  testDir:'./tests/e2e', timeout:30_000,
  use:{baseURL:'http://127.0.0.1:4321',trace:'retain-on-failure'},
  webServer:{command:'npm run build && npm run preview -- --host 127.0.0.1',port:4321,reuseExistingServer:false,timeout:120_000},
  projects:[
    {name:'canonical-768',use:{viewport:{width:768,height:1024}}},
    {name:'desktop',use:{viewport:{width:1440,height:1000}}},
    {name:'mobile',use:{...devices['iPhone 13']}},
  ],
});
```

- [ ] **Step 2: Write browser contracts**

```ts
import { expect,test } from '@playwright/test';
const routes=['/','/about/','/research/','/projects/','/cv/','/contact/','/prompts/'];
for(const route of routes)test(`${route} loads cleanly`,async({page})=>{
  const errors:string[]=[];page.on('console',m=>m.type()==='error'&&errors.push(m.text()));page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(route,{waitUntil:'networkidle'});await expect(page.locator('h1')).toHaveCount(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBe(0);expect(errors).toEqual([]);
});
test('homepage keeps canonical roles',async({page})=>{
  await page.goto('/',{waitUntil:'networkidle'});await expect(page.locator('.pub-card')).toHaveCount(3);await expect(page.locator('#vibe article')).toHaveCount(5);
  await expect(page.locator('.stitch-footer-dock a[href="/about/"]')).toBeVisible();await expect(page.locator('.draw-control')).toHaveAttribute('href','/prompts/');
});
```

Add checks for bilingual persistence, Prompts copy/stage links, reduced motion (`animationName === 'none'`), image natural widths, keyboard focus, footer reserve, CV download, mail/social URLs, and fixed-control visibility. Add a JavaScript-disabled mobile context that proves default English content and all ordinary route/footer anchors remain visible and usable while the language button is hidden.

- [ ] **Step 3: Run browser suite and fix only observed defects**

Run: `npm run test:browser`

Expected: failures retain traces; correct each verified geometry, flow, accessibility, or responsive defect before continuing.

- [ ] **Step 4: Capture and inspect screenshots**

```ts
await page.setViewportSize({width:768,height:1024});
await page.goto('/',{waitUntil:'networkidle'});
await page.screenshot({path:'artifacts/stitch/home-768-full.png',fullPage:true});
```

Capture 1440 desktop, 768 Research/Vibe crops, and 390 mobile homepage/Index Sheet/Prompts. Compare `screen.png` and the canonical screenshot side by side for header, 15%/76% guide lines, hero empty-space ratio, wordmark/card/formula/scroll geometry, research banner/overlap, Vibe mosaic, and footer dock. Correct CSS only for observed mismatches.

- [ ] **Step 5: Run full gate and commit**

Run: `npm run verify && npm run test:browser && git diff --check`

```bash
git add playwright.config.ts tests/e2e src artifacts/stitch
git commit -m "fix: refine Stitch geometry and responsive behavior"
```

---

### Task 9: Whole-Branch Review, Merge, Push, and Production Verification

**Files:**
- Inspect: approved specification, complete branch diff, screenshots, build output
- Change source only when the audit proves an unmet requirement

**Interfaces:**
- Produces clean synchronized main and verified live routes.

- [ ] **Step 1: Audit every specification section**

Create an evidence table covering authority order, homepage, all routes, header, atmosphere, Hero, Research, Vibe, footer, every animation, reduced motion, responsive behavior, data, failure behavior, accessibility, performance, tooling, and release. Each item requires source, automated result, and browser evidence.

- [ ] **Step 2: Run final feature-branch gates**

```bash
npm run verify
npm run test:browser
git diff --check
git status --short --branch
```

Expected: all pass; branch clean.

- [ ] **Step 3: Request whole-branch code/design review**

Review merge-base-to-HEAD against the spec and `screen.png`. Fix all Critical/Important issues in one consolidated pass and re-review until explicitly ready.

- [ ] **Step 4: Merge and retest main**

```bash
MAIN_ROOT=/Users/zibinzhao/Desktop/Projects/personal_webpage
git -C "$MAIN_ROOT" pull --ff-only origin main
git -C "$MAIN_ROOT" merge --no-ff codex/stitch-source-of-truth -m "feat: adopt Stitch source-of-truth portfolio"
cd "$MAIN_ROOT"
npm run verify
npm run test:browser
```

- [ ] **Step 5: Push main and verify deployment**

Run: `git push origin main`

Poll GitHub Pages below 60-second intervals. Verify HTTP 200, expected markers, clean browser state, no overflow, language/footer/Prompts/CV/contact flows, normal motion, and reduced-motion fallback at all seven live routes.

- [ ] **Step 6: Confirm synchronization and report**

Run: `git status --short --branch && git rev-parse HEAD && git rev-parse origin/main`

Expected: clean `main...origin/main` and identical hashes. Report merge hash, deployment run, tests/lint/check/build/browser results, live verification, and non-blocking audit findings.
