# Personal Webpage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy Zibin Zhao's personal webpage — a framed, bold-editorial single page with a collapsing hero, 7 content sections, served from Astro to GitHub Pages at `zibinzhao.com`.

**Architecture:** Astro static site. Content (publications, projects, vibe-coding, profile, CV) lives in typed content collections / data modules so layout and data stay separate. One `index.astro` composes focused components. A tiny inline script drives the hero scroll-collapse + reveal-on-scroll, guarded by `prefers-reduced-motion`. CI builds on push and deploys to Pages.

**Tech Stack:** Astro 4, TypeScript, Vitest (data-helper tests), `@fontsource` (Space Grotesk + Inter), `rembg` (portrait cutout), Playwright (CV → PDF), GitHub Actions + Pages.

**Design source of truth:** `docs/superpowers/specs/2026-06-02-personal-webpage-design.md` and the approved prototypes in `.superpowers/brainstorm/*/content/` (`hero-framed-v2.html`, `full-layout.html`, `vibe-coding.html`). Port their CSS/JS verbatim where referenced.

---

## File Structure

```
astro.config.mjs            # site=https://zibinzhao.com, integrations
package.json                # scripts, deps
tsconfig.json
vitest.config.ts
src/
  content/
    config.ts               # collection schemas (publications, projects, vibe)
    publications/*.md        # 9 papers (seed from spec §5.2)
    projects/*.md            # HsingMD, DL-SELEX, TEMPO, ECG/CasMD
    vibe/*.md                # Yaos, Zen (coming-soon)
  data/
    profile.ts              # name, tagline, role, socials, email, status
    cv.ts                   # timeline, skills, languages, pdf path
    pubs.ts                 # helper: load+sort publications  (UNIT TESTED)
  layouts/
    Base.astro              # <html>, head, fonts, frame background
  components/
    Nav.astro               # floating rounded nav (collapsed hero)
    Hero.astro              # framed hero composition
    Section.astro           # reusable section wrapper w/ reveal
    About.astro
    PubList.astro
    ProjectCard.astro  Projects.astro
    VibeCard.astro     Vibe.astro
    CvTimeline.astro
    Contact.astro
  scripts/
    hero.ts                 # scroll-collapse + IntersectionObserver reveals
  styles/
    tokens.css  global.css
  pages/
    index.astro             # composes everything
public/
  CNAME                     # zibinzhao.com
  portrait.png              # cutout (or poster fallback)
  poster.png                # artistic graduation poster
  cv.pdf                    # generated
  favicon.svg  og.png
tools/
  make-cv.mjs               # Playwright HTML->PDF generator
  cv-template.html          # styled CV source
tests/
  pubs.test.ts
.github/workflows/deploy.yml
```

**Tests for a static visual site:** unit-test the only real logic (publication loading/sorting) with Vitest; verify everything else with `astro build` success, a link/asset check, and visual checks in the running preview (the brainstorm companion server or `astro preview`).

---

## Task 1: Scaffold Astro project

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/pages/index.astro`, `src/layouts/Base.astro`, `src/styles/tokens.css`, `src/styles/global.css`

- [ ] **Step 1: Create the Astro project in-place**

Run (in repo root, which already has `.git`):
```bash
npm create astro@latest -- --template minimal --no-install --no-git --typescript strict --yes .
npm install
npm install @fontsource/space-grotesk @fontsource/inter
```
Expected: `package.json`, `astro.config.mjs`, `src/pages/index.astro` created; deps installed.

- [ ] **Step 2: Configure the site URL**

Replace `astro.config.mjs` with:
```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://zibinzhao.com',
  build: { format: 'directory' },
});
```

- [ ] **Step 3: Create design tokens** — `src/styles/tokens.css`:
```css
:root{
  --ink:#18181b; --paper:#ffffff; --bg:#e7e7e8; --muted:#52525b;
  --hair:#e4e4e7; --accent:#22c55e;
  --gap:18px; --radius:30px;
  --font-display:'Space Grotesk',-apple-system,Arial,sans-serif;
  --font-body:'Inter',-apple-system,Arial,sans-serif;
}
```

- [ ] **Step 4: Create global CSS** — `src/styles/global.css`:
```css
@import '@fontsource/space-grotesk/700.css';
@import '@fontsource/space-grotesk/800.css';
@import '@fontsource/inter/400.css';
@import '@fontsource/inter/500.css';
@import '@fontsource/inter/600.css';
@import './tokens.css';
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:var(--font-body);color:var(--ink);background:var(--bg);-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
@media (prefers-reduced-motion: reduce){*{animation:none!important;transition:none!important}}
```

- [ ] **Step 5: Create Base layout** — `src/layouts/Base.astro`:
```astro
---
import '../styles/global.css';
const { title = 'Zibin Zhao', description = 'PhD candidate in Bioengineering at HKUST — deep learning for molecular diagnostics, CRISPR & aptamer design.' } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content="/og.png" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  </head>
  <body><slot /></body>
</html>
```

- [ ] **Step 6: Minimal index** — replace `src/pages/index.astro`:
```astro
---
import Base from '../layouts/Base.astro';
---
<Base><main style="padding:40px">Scaffold OK</main></Base>
```

- [ ] **Step 7: Verify dev server builds**

Run: `npm run build`
Expected: build completes, `dist/index.html` exists with "Scaffold OK".

- [ ] **Step 8: Commit**
```bash
git add -A && git commit -m "chore: scaffold Astro project with fonts and tokens"
```

---

## Task 2: Profile & CV data modules

**Files:**
- Create: `src/data/profile.ts`, `src/data/cv.ts`

- [ ] **Step 1: Profile data** — `src/data/profile.ts`:
```ts
export const profile = {
  name: 'ZIBIN ZHAO',
  firstName: 'ZIBIN',
  lastName: 'ZHAO',
  role: 'Bioengineering × AI',
  tagline: 'PhD candidate at HKUST — deep learning for molecular diagnostics, CRISPR & aptamer design.',
  status: 'Open to Collaboration',
  affiliation: 'HKUST · Hsing Lab',
  email: 'zibin.zhao@connect.ust.hk',
  scholar: { citations: 100, hIndex: 4, i10: 3, asOf: '2026-06' },
  socials: [
    { label: 'GitHub', href: 'https://github.com/zibin-zhao', icon: 'github' },
    { label: 'Hugging Face', href: 'https://huggingface.co/zzhaobz', icon: 'hf' },
    { label: 'Scholar', href: 'https://scholar.google.com/citations?user=EQ6DTNkAAAAJ', icon: 'scholar' },
    { label: 'LinkedIn', href: 'https://hk.linkedin.com/in/zibinzhao', icon: 'linkedin' },
    { label: 'ORCID', href: 'https://orcid.org/0000-0002-3121-9131', icon: 'orcid' },
  ],
  focus: ['Computational biology', 'Deep learning', 'Molecular dynamics', 'Diagnostics'],
};
```

- [ ] **Step 2: CV data (single source for timeline + PDF)** — `src/data/cv.ts`:
```ts
export const cv = {
  pdf: '/cv.pdf',
  education: [
    { title: 'Ph.D., Bioengineering', org: 'HKUST', loc: 'Hong Kong', period: '2022–present', notes: ['HKPFS + Redbird Award (2022)', 'Hsing Lab'] },
    { title: 'B.S., Biomedical Engineering', org: 'University of Melbourne', loc: 'Australia', period: '2018–2020', notes: ['WAM 84.6 — First Class Honours', 'Top-5 exam score, Engineering Mechanics'] },
  ],
  experience: [
    { title: 'Research Assistant', org: 'HKUST', period: '2021–2022', notes: ['Wearable wireless real-time 12-lead ECG monitoring', 'Filter bank + deep learning for heart-disease classification'] },
    { title: 'Industry / Applied', org: 'PealthMed Ltd', period: '—', notes: [] },
    { title: 'Team Leader', org: 'University of Melbourne', period: '2020', notes: ['COVID-19 patient-care medical device prototype (LabVIEW, myRIO)'] },
  ],
  skills: ['Python', 'C', 'MATLAB', 'LabVIEW', 'SolidWorks'],
  languages: ['Mandarin (native)', 'Cantonese (native)', 'English (professional)'],
  leadership: ['President — Chinese Music Group, Victoria (5,000+ members)'],
};
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**
```bash
git add -A && git commit -m "feat: add profile and CV data modules"
```

---

## Task 3: Content collections + publication helper (TDD)

**Files:**
- Create: `src/content/config.ts`, `src/data/pubs.ts`, `tests/pubs.test.ts`, `vitest.config.ts`
- Create seed markdown under `src/content/publications/`, `projects/`, `vibe/`

- [ ] **Step 1: Install Vitest**
```bash
npm install -D vitest
```

- [ ] **Step 2: Vitest config** — `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node' } });
```

- [ ] **Step 3: Write the failing test** — `tests/pubs.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { sortPubs } from '../src/data/pubs';

const sample = [
  { year: 2023, title: 'B', featured: false },
  { year: 2026, title: 'A', featured: true },
  { year: 2025, title: 'C', featured: false },
];

describe('sortPubs', () => {
  it('orders by year descending', () => {
    const out = sortPubs(sample);
    expect(out.map(p => p.year)).toEqual([2026, 2025, 2023]);
  });
  it('keeps featured flag intact', () => {
    expect(sortPubs(sample)[0].featured).toBe(true);
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run tests/pubs.test.ts`
Expected: FAIL — cannot find module `../src/data/pubs`.

- [ ] **Step 5: Implement the helper** — `src/data/pubs.ts`:
```ts
export type Pub = { year: number; title: string; venue?: string; authors?: string;
  links?: { pdf?: string; doi?: string; code?: string; scholar?: string }; featured?: boolean; firstAuthor?: boolean };

export function sortPubs<T extends { year: number }>(pubs: T[]): T[] {
  return [...pubs].sort((a, b) => b.year - a.year);
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run tests/pubs.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 7: Define collection schemas** — `src/content/config.ts`:
```ts
import { defineCollection, z } from 'astro:content';

const publications = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(), authors: z.string().optional(), venue: z.string().optional(),
    year: z.number(),
    links: z.object({ pdf: z.string().optional(), doi: z.string().optional(), code: z.string().optional(), scholar: z.string().optional() }).optional(),
    featured: z.boolean().default(false), firstAuthor: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  type: 'content',
  schema: z.object({ title: z.string(), blurb: z.string(), type: z.string(), tags: z.array(z.string()).default([]), href: z.string().optional(), order: z.number().default(0) }),
});

const vibe = defineCollection({
  type: 'content',
  schema: z.object({ title: z.string(), titleZh: z.string().optional(), blurb: z.string(), tags: z.array(z.string()).default([]), href: z.string().optional(), screenshot: z.string().optional(), comingSoon: z.boolean().default(false), order: z.number().default(0) }),
});

export const collections = { publications, projects, vibe };
```

- [ ] **Step 8: Seed all 9 publications** — create one file per paper in `src/content/publications/`. Example `nature-biotech-cas12a.md`:
```md
---
title: "DNA-guided CRISPR–Cas12a effectors for programmable RNA recognition and cleavage"
authors: "X Wu, WH Lam, Z Zhao, Y Cao, H Lin, X Feng, Y Zhai, IM Hsing"
venue: "Nature Biotechnology"
year: 2026
featured: true
links: { scholar: "https://scholar.google.com/citations?user=EQ6DTNkAAAAJ" }
---
```
Create the remaining 8 with the same frontmatter shape using titles/venues/years/authors from spec §5.2 (files: `onepot-snp-genotyping.md` 2026; `crispr-lamp-viral-load.md` 2025 *Biosensors and Bioelectronics*; `dl-selex.md` 2025 *Briefings in Bioinformatics*, `featured: true`, `links.code: https://github.com/zibin-zhao/DL-SELEX`; `dna-guided-cas-effector.md` 2025; `dna-hydrogel-oect.md` 2025 *ACS AMI*; `ecg-patch-12lead.md` 2023 *Advanced Materials Technologies*; `pooled-rtqpcr-barcoding.md` 2023 *Analytical Chemistry*; `ecg-transformer-review.md` 2023 *arXiv:2306.01249*, `featured: true`). Set `firstAuthor: true` on dl-selex, ecg-transformer-review, and any where Z Zhao is first.

- [ ] **Step 9: Seed projects** — `src/content/projects/`: `hsingmd.md` (type "Hugging Face Space · live", href `https://huggingface.co/spaces/CasMD/HsingMD`, tags [Spaces, MD], order 1), `dl-selex.md` (type "GitHub · Python", href `https://github.com/zibin-zhao/DL-SELEX`, order 2), `tempo.md` (type "GitHub · JS", href `https://github.com/zibin-zhao/TEMPO`, order 3), `ecg-casmd.md` (type "GitHub", href `https://github.com/zibin-zhao`, order 4). Each with a one-line `blurb` from spec §5.3.

- [ ] **Step 10: Seed vibe** — `src/content/vibe/`: `yaos.md` (titleZh "药师法门 · 养生", tags [PWA, "HTML/JS", Wellness, "Claude Code"], `comingSoon: true`, order 1) and `zen.md` (titleZh "禅德 · Zende", tags ["uni-app/Vue", WeChat, "Cloud DB", "Claude Code"], `comingSoon: true`, order 2). Blurbs from spec §5.4. No `href` (not public).

- [ ] **Step 11: Verify build picks up collections**

Run: `npm run build`
Expected: build succeeds, no schema errors.

- [ ] **Step 12: Commit**
```bash
git add -A && git commit -m "feat: content collections, pubs helper (tested), seed all content"
```

---

## Task 4: Frame background + Nav component

**Files:**
- Create: `src/components/Nav.astro`
- Modify: `src/layouts/Base.astro` (add frame background class)

- [ ] **Step 1: Nav component** — `src/components/Nav.astro` (port from `hero-framed-v2.html` `.topnav`):
```astro
---
import { profile } from '../data/profile';
---
<header class="topnav" id="topnav">
  <a class="logo" href="#top">{profile.name}</a>
  <nav><a href="#about">About</a><a href="#research">Research</a><a href="#projects">Projects</a><a href="#cv">CV</a><a href="#contact">Contact</a></nav>
  <a class="cta" href={`mailto:${profile.email}`}>Let's Talk ↗</a>
</header>
<style>
  .topnav{position:fixed;top:var(--gap);left:var(--gap);right:var(--gap);z-index:50;display:flex;justify-content:space-between;align-items:center;
    padding:13px 24px;background:rgba(255,255,255,.78);backdrop-filter:blur(12px);border-radius:22px;box-shadow:0 8px 26px rgba(0,0,0,.10);
    opacity:0;transform:translateY(-14px);transition:opacity .45s,transform .45s;pointer-events:none}
  .topnav.show{opacity:1;transform:none;pointer-events:auto}
  .topnav .logo{font-family:var(--font-display);font-weight:800;letter-spacing:-1px;font-size:17px}
  .topnav nav{display:flex;gap:22px;font-size:14px;color:var(--muted)}
  .topnav .cta{background:var(--ink);color:#fff;border-radius:18px;padding:8px 15px;font-size:13px;font-weight:600}
  @media (max-width:640px){.topnav nav{display:none}}
</style>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: success.

- [ ] **Step 3: Commit**
```bash
git add -A && git commit -m "feat: floating Nav component"
```

---

## Task 5: Hero component

**Files:**
- Create: `src/components/Hero.astro`

- [ ] **Step 1: Hero** — port the composition from `hero-framed-v2.html` (the approved sketch: lifted wordmark, large centered portrait, role bottom-left, socials bottom-right) — `src/components/Hero.astro`:
```astro
---
import { profile } from '../data/profile';
---
<div class="heroPin" id="top">
  <div class="hero">
    <div class="heroCard">
      <div class="hbar">
        <span class="pill"><span class="dot"></span> {profile.status}</span>
        <nav><a href="#about">About</a><a href="#research">Research</a><a href="#projects">Projects</a><a href="#cv">CV</a></nav>
        <a class="ctaTop" href={`mailto:${profile.email}`}>Let's Talk ↗</a>
      </div>
      <div class="heroCore" id="heroCore">
        <div class="bigName"><span class="o">{profile.firstName}</span> {profile.lastName}</div>
        <img class="portrait" src="/portrait.png" alt="Portrait of Zibin Zhao" />
        <div class="role">
          <h1>{profile.role}</h1>
          <p>{profile.tagline}</p>
          <a class="collab" href="#research">View research ↗</a>
        </div>
        <div class="socials">
          {profile.socials.slice(0,4).map(s => <a class="sbtn" href={s.href} target="_blank" rel="noopener">{s.label}</a>)}
        </div>
      </div>
      <div class="scrollHint" id="hint">scroll ↓</div>
    </div>
  </div>
</div>
<style>
  .heroPin{height:200vh;position:relative}
  .hero{position:sticky;top:0;height:100vh;padding:var(--gap);display:flex}
  .heroCard{position:relative;flex:1;background:var(--paper);border-radius:var(--radius);box-shadow:0 18px 50px rgba(0,0,0,.13);display:flex;flex-direction:column;overflow:hidden}
  .hbar{position:relative;z-index:6;display:flex;justify-content:space-between;align-items:center;padding:24px 32px;font-size:13px}
  .pill{border:1px solid var(--hair);border-radius:24px;padding:9px 15px;display:inline-flex;gap:8px;align-items:center;box-shadow:0 4px 14px rgba(0,0,0,.05);background:#fff}
  .dot{width:8px;height:8px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 3px rgba(34,197,94,.18)}
  .hbar nav{display:flex;gap:24px;color:#3f3f46}
  .ctaTop{background:var(--ink);color:#fff;border-radius:24px;padding:10px 17px;font-weight:600}
  .heroCore{flex:1;position:relative;will-change:transform,opacity}
  .bigName{position:absolute;top:8%;left:0;right:0;text-align:center;z-index:2;font-family:var(--font-display);font-weight:800;letter-spacing:-5px;line-height:.9;font-size:clamp(56px,14.5vw,200px)}
  .bigName .o{color:transparent;-webkit-text-stroke:2.5px var(--ink)}
  .portrait{position:absolute;left:50%;bottom:6%;transform:translateX(-50%);z-index:3;width:clamp(260px,30vw,400px);height:clamp(360px,52vh,560px);object-fit:contain;object-position:bottom}
  .role{position:absolute;left:36px;bottom:48px;z-index:5;max-width:320px}
  .role h1{font-family:var(--font-display);font-size:28px;font-weight:700;letter-spacing:-1px}
  .role p{font-size:14px;color:var(--muted);margin-top:9px}
  .collab{display:inline-block;margin-top:14px;background:var(--ink);color:#fff;border-radius:24px;padding:12px 22px;font-size:14px;font-weight:600}
  .socials{position:absolute;right:36px;bottom:48px;z-index:5;display:flex;flex-direction:column;gap:8px}
  .sbtn{border:1px solid var(--hair);border-radius:24px;padding:8px 15px;font-size:13px;min-width:138px;box-shadow:0 4px 12px rgba(0,0,0,.04);background:#fff}
  .scrollHint{position:absolute;bottom:20px;left:50%;transform:translateX(-50%);z-index:6;font-size:12px;color:#a1a1aa;letter-spacing:1px;animation:bob 1.6s ease-in-out infinite}
  @keyframes bob{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(7px)}}
  .bigName,.portrait,.role,.socials{animation:rise .9s cubic-bezier(.2,.7,.2,1) both}
  .portrait{animation-name:riseP}.role{animation-delay:.22s}.socials{animation-delay:.3s}
  @keyframes rise{from{opacity:0;transform:translateY(26px)}to{opacity:1}}
  @keyframes riseP{from{opacity:0;transform:translateX(-50%) translateY(30px)}to{opacity:1;transform:translateX(-50%)}}
  @media (max-width:760px){
    .hbar nav{display:none}
    .role,.socials{position:static;margin:0 auto;text-align:center}
    .heroCore{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px}
    .bigName{position:static}.portrait{position:static;transform:none}
    .socials{flex-direction:row;flex-wrap:wrap;justify-content:center}
  }
</style>
```

- [ ] **Step 2: Add a temporary placeholder portrait** so the build doesn't 404 before Task 11:
```bash
printf '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="560"><rect width="100%%" height="100%%" rx="180" fill="#cfcfd4"/></svg>' > public/portrait.png
```
(Real cutout replaces this in Task 11; SVG-in-png is fine as a temporary stand-in for layout.)

- [ ] **Step 3: Wire Hero into index** — `src/pages/index.astro`:
```astro
---
import Base from '../layouts/Base.astro';
import Nav from '../components/Nav.astro';
import Hero from '../components/Hero.astro';
---
<Base>
  <Nav />
  <Hero />
</Base>
```

- [ ] **Step 4: Verify build + visual check**

Run: `npm run build && npm run preview`
Open the preview URL. Expected: framed hero fills the screen; name lifted; portrait centered between words; role bottom-left; socials bottom-right.

- [ ] **Step 5: Commit**
```bash
git add -A && git commit -m "feat: framed Hero component + placeholder portrait"
```

---

## Task 6: Hero scroll-collapse + reveal script

**Files:**
- Create: `src/scripts/hero.ts`
- Modify: `src/pages/index.astro` (import script)

- [ ] **Step 1: Script** — port the scroll math from `hero-framed-v2.html`, add reduced-motion guard — `src/scripts/hero.ts`:
```ts
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const heroCore = document.getElementById('heroCore');
const topnav = document.getElementById('topnav');
const hint = document.getElementById('hint');

function onScroll() {
  if (!heroCore || !topnav) return;
  const vh = window.innerHeight;
  const p = Math.min(Math.max(window.scrollY / vh, 0), 1);
  if (!reduce) {
    heroCore.style.transform = `translateY(${-80 * p}px) scale(${1 - 0.6 * p})`;
    heroCore.style.opacity = String(Math.max(1 - 1.25 * p, 0));
    if (hint) hint.style.opacity = String(1 - 2 * p);
  }
  topnav.classList.toggle('show', p > 0.55);
}
window.addEventListener('scroll', () => requestAnimationFrame(onScroll), { passive: true });
onScroll();

const io = new IntersectionObserver(
  (es) => es.forEach((e) => e.isIntersecting && e.target.classList.add('in')),
  { threshold: 0.18 }
);
document.querySelectorAll('.reveal').forEach((s) => io.observe(s));
```

- [ ] **Step 2: Load the script** — add to `src/pages/index.astro` after the components:
```astro
<script>
  import '../scripts/hero.ts';
</script>
```

- [ ] **Step 3: Verify behavior**

Run: `npm run build && npm run preview`
Scroll the page. Expected: hero scales down + fades; floating nav appears past ~55%; no errors in console. Toggle OS "reduce motion" → hero stays static, nav still appears.

- [ ] **Step 4: Commit**
```bash
git add -A && git commit -m "feat: hero scroll-collapse + reveal-on-scroll (reduced-motion safe)"
```

---

## Task 7: Section wrapper + About

**Files:**
- Create: `src/components/Section.astro`, `src/components/About.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Content sheet + Section wrapper** — `src/components/Section.astro`:
```astro
---
const { id, num, label } = Astro.props;
---
<section id={id} class="reveal sec">
  <div class="label">{num} — {label}</div>
  <slot />
</section>
<style>
  .sec{padding:72px 50px;max-width:1040px;margin:0 auto}
  .sec + :global(.sec){border-top:1px solid #f0f0f0}
  .label{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#a1a1aa;font-weight:700}
  .reveal{opacity:0;transform:translateY(32px);transition:opacity .7s,transform .7s}
  .reveal.in{opacity:1;transform:none}
</style>
```

- [ ] **Step 2: Content sheet container** — add to `src/styles/global.css`:
```css
.content{position:relative;z-index:10;background:var(--paper);border-radius:var(--radius) var(--radius) 0 0;margin:0 var(--gap);box-shadow:0 -10px 40px rgba(0,0,0,.06)}
h2.big{font-family:var(--font-display);font-weight:800;letter-spacing:-1px;font-size:29px;margin:14px 0}
.muted{color:var(--muted);font-size:15px;line-height:1.65;max-width:640px}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
.chip{font-size:12px;border:1px solid var(--hair);border-radius:14px;padding:5px 12px;color:var(--muted)}
```

- [ ] **Step 3: About** — `src/components/About.astro`:
```astro
---
import Section from './Section.astro';
import { profile } from '../data/profile';
---
<Section id="about" num="01" label="About">
  <h2 class="big">A short story</h2>
  <div class="grid">
    <div>
      <p class="muted">PhD candidate in Bioengineering at HKUST (Hsing Lab), HKPFS + Redbird awardee. BSc Biomedical Engineering, University of Melbourne (First Class Honours). I build deep-learning methods at the interface of molecular biology and AI — one-pot CRISPR diagnostics, structure-aware aptamer selection, and molecular-dynamics tooling.</p>
      <div class="chips">{profile.focus.map(f => <span class="chip">{f}</span>)}</div>
    </div>
    <img class="poster" src="/poster.png" alt="Graduation poster — University of Melbourne" />
  </div>
</Section>
<style>
  .grid{display:grid;grid-template-columns:1.6fr 1fr;gap:30px;align-items:center;margin-top:8px}
  .poster{width:100%;border-radius:12px}
  @media (max-width:760px){.grid{grid-template-columns:1fr}}
</style>
```

- [ ] **Step 4: Add poster asset**
```bash
cp /Users/zibinzhao/Desktop/headshot.png public/poster.png
```

- [ ] **Step 5: Wrap content in the sheet** — update `src/pages/index.astro`:
```astro
---
import Base from '../layouts/Base.astro';
import Nav from '../components/Nav.astro';
import Hero from '../components/Hero.astro';
import About from '../components/About.astro';
---
<Base>
  <Nav />
  <Hero />
  <main class="content">
    <About />
  </main>
  <script>import '../scripts/hero.ts';</script>
</Base>
```

- [ ] **Step 6: Verify**

Run: `npm run build && npm run preview`
Expected: About section reveals on scroll beneath the hero; poster shows.

- [ ] **Step 7: Commit**
```bash
git add -A && git commit -m "feat: Section wrapper, content sheet, About section"
```

---

## Task 8: Research & Publications

**Files:**
- Create: `src/components/PubList.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: PubList** — `src/components/PubList.astro`:
```astro
---
import Section from './Section.astro';
import { getCollection } from 'astro:content';
import { sortPubs } from '../data/pubs';
import { profile } from '../data/profile';
const entries = await getCollection('publications');
const pubs = sortPubs(entries.map(e => ({ ...e.data })));
const s = profile.scholar;
---
<Section id="research" num="02" label="Research & Publications">
  <h2 class="big">Selected work</h2>
  <p class="muted">{s.citations} citations · h-index {s.hIndex} · i10 {s.i10} <span style="color:#a1a1aa">(Google Scholar, {s.asOf})</span></p>
  <ul class="pubs">
    {pubs.map(p => (
      <li class="pub">
        <span class="yr">{p.year}</span>
        <div>
          <h4>{p.title}{p.featured && <span class="star">★</span>}</h4>
          {p.venue && <div class="venue">{p.venue}</div>}
          {p.authors && <div class="auth">{p.authors}</div>}
          {p.links && <div class="links">{Object.entries(p.links).map(([k,v]) => <a href={v} target="_blank" rel="noopener">{k.toUpperCase()}</a>)}</div>}
        </div>
      </li>
    ))}
  </ul>
</Section>
<style>
  .pubs{list-style:none;margin-top:18px}
  .pub{display:flex;gap:16px;padding:16px 0;border-top:1px solid #f0f0f0}
  .yr{font-size:12px;color:#a1a1aa;min-width:46px;font-weight:700}
  .pub h4{font-size:15px;font-weight:600;line-height:1.4}
  .star{color:#18181b;margin-left:6px}
  .venue{font-size:12px;color:var(--muted);margin-top:3px}
  .auth{font-size:11px;color:#a1a1aa;margin-top:3px}
  .links{display:flex;gap:12px;font-size:11px;margin-top:6px}
  .links a{font-weight:700}
</style>
```

- [ ] **Step 2: Add `<PubList />`** to `src/pages/index.astro` after `<About />`.

- [ ] **Step 3: Verify**

Run: `npm run build && npm run preview`
Expected: 9 papers, year-descending, Nature Biotech 2026 first, metrics line shows 100 / 4 / 3.

- [ ] **Step 4: Commit**
```bash
git add -A && git commit -m "feat: Research & Publications from content collection"
```

---

## Task 9: Projects & Demos

**Files:**
- Create: `src/components/ProjectCard.astro`, `src/components/Projects.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: ProjectCard** — `src/components/ProjectCard.astro`:
```astro
---
const { title, blurb, type, href } = Astro.props;
const Tag = href ? 'a' : 'div';
---
<Tag class="pcard" href={href} target={href ? '_blank' : undefined} rel="noopener">
  <span class="tag">{type}</span>
  <h4>{title}</h4>
  <p>{blurb}</p>
  {href && <span class="go">View →</span>}
</Tag>
<style>
  .pcard{display:block;border:1px solid var(--hair);border-radius:14px;padding:20px;transition:transform .25s,box-shadow .25s}
  a.pcard:hover{transform:translateY(-4px);box-shadow:0 14px 30px rgba(0,0,0,.08)}
  .tag{font-size:10px;border:1px solid var(--hair);border-radius:12px;padding:2px 8px;color:var(--muted)}
  .pcard h4{font-family:var(--font-display);font-size:17px;margin:9px 0 5px}
  .pcard p{font-size:13px;color:var(--muted);line-height:1.5}
  .go{font-size:11px;font-weight:700;margin-top:10px;display:inline-block}
</style>
```

- [ ] **Step 2: Projects** — `src/components/Projects.astro`:
```astro
---
import Section from './Section.astro';
import ProjectCard from './ProjectCard.astro';
import { getCollection } from 'astro:content';
const items = (await getCollection('projects')).sort((a,b)=>a.data.order-b.data.order);
---
<Section id="projects" num="03" label="Projects & Demos">
  <h2 class="big">Things I've built</h2>
  <div class="cards">{items.map(p => <ProjectCard {...p.data} />)}</div>
</Section>
<style>
  .cards{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:22px}
  @media (max-width:760px){.cards{grid-template-columns:1fr}}
</style>
```

- [ ] **Step 3: Add `<Projects />`** to `index.astro` after `<PubList />`.

- [ ] **Step 4: Verify**

Run: `npm run build && npm run preview`
Expected: 4 project cards; HsingMD/DL-SELEX/TEMPO link out; hover lift works.

- [ ] **Step 5: Commit**
```bash
git add -A && git commit -m "feat: Projects & Demos section"
```

---

## Task 10: Vibe Coding

**Files:**
- Create: `src/components/VibeCard.astro`, `src/components/Vibe.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: VibeCard** — port from `vibe-coding.html`, handle coming-soon (no href) + blank screenshot — `src/components/VibeCard.astro`:
```astro
---
const { title, titleZh, blurb, tags = [], href, screenshot, comingSoon } = Astro.props;
const Tag = href ? 'a' : 'div';
---
<Tag class="card" href={href} target={href ? '_blank' : undefined} rel="noopener">
  <div class="shot">{screenshot ? <img src={screenshot} alt={`${title} screenshot`} /> : 'screenshot — coming soon'}</div>
  <div class="body">
    <div class="ttl">{title} {titleZh && <span class="zh">{titleZh}</span>}</div>
    <p class="desc">{blurb}</p>
    <div class="tags">{tags.map(t => <span class="t">{t}</span>)}</div>
    <span class="go">{comingSoon ? 'Coming soon' : 'View →'}</span>
  </div>
</Tag>
<style>
  .card{display:flex;flex-direction:column;border:1px solid #e7e7e9;border-radius:18px;overflow:hidden;background:#fff;transition:transform .25s,box-shadow .25s}
  a.card:hover{transform:translateY(-5px);box-shadow:0 16px 34px rgba(0,0,0,.10)}
  .shot{aspect-ratio:4/3;display:flex;align-items:center;justify-content:center;color:#b4b4ba;font-size:12px;border-bottom:1px solid #eee;background:repeating-linear-gradient(45deg,#f4f4f5,#f4f4f5 12px,#efeff1 12px,#efeff1 24px)}
  .shot img{width:100%;height:100%;object-fit:cover}
  .body{padding:18px}
  .ttl{font-family:var(--font-display);display:flex;align-items:center;gap:8px;font-size:18px;font-weight:700}
  .zh{font-size:12px;color:#a1a1aa;font-weight:500}
  .desc{font-size:13px;color:var(--muted);line-height:1.55;margin:8px 0 12px}
  .tags{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}
  .t{font-size:10px;border:1px solid var(--hair);border-radius:12px;padding:3px 9px;color:var(--muted)}
  .go{font-size:12px;font-weight:700}
</style>
```

- [ ] **Step 2: Vibe** — `src/components/Vibe.astro` (with extensible grid + open-slot card):
```astro
---
import Section from './Section.astro';
import VibeCard from './VibeCard.astro';
import { getCollection } from 'astro:content';
const items = (await getCollection('vibe')).sort((a,b)=>a.data.order-b.data.order);
---
<Section id="vibe" num="04" label="Vibe Coding">
  <h2 class="big">Built for the joy of it 🛠️</h2>
  <p class="muted">Things I've vibe-coded — shipped fast with AI pair-programming. Side projects where curiosity leads and the build follows.</p>
  <div class="grid">
    {items.map(v => <VibeCard {...v.data} />)}
    <div class="addcard"><div class="plus">+</div><div>Open slot —<br>more projects to come</div></div>
  </div>
</Section>
<style>
  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:30px}
  .addcard{border:2px dashed #d7d7db;border-radius:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:#a1a1aa;min-height:240px;text-align:center}
  .plus{font-size:34px;font-weight:300;line-height:1}
  @media (max-width:760px){.grid{grid-template-columns:1fr}}
</style>
```

- [ ] **Step 3: Add `<Vibe />`** to `index.astro` after `<Projects />`.

- [ ] **Step 4: Verify**

Run: `npm run build && npm run preview`
Expected: Yaos + Zen cards with hatched "coming soon" screenshot slots, no broken links, open-slot card present.

- [ ] **Step 5: Commit**
```bash
git add -A && git commit -m "feat: Vibe Coding section (Yaos, Zen, coming-soon)"
```

---

## Task 11: CV timeline + Contact

**Files:**
- Create: `src/components/CvTimeline.astro`, `src/components/Contact.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: CvTimeline** — `src/components/CvTimeline.astro`:
```astro
---
import Section from './Section.astro';
import { cv } from '../data/cv';
const items = [...cv.education, ...cv.experience];
---
<Section id="cv" num="05" label="CV / Resume">
  <div class="cvgrid">
    <div class="tl">
      {items.map(i => (
        <div class="item"><h4>{i.title} — {i.org}</h4><div class="meta">{i.period}{i.notes?.length ? ' · ' + i.notes.join(' · ') : ''}</div></div>
      ))}
    </div>
    <div>
      <p class="muted">Full CV as a one-click PDF, plus an at-a-glance timeline of education, experience &amp; awards.</p>
      <div class="chips">{cv.skills.map(s => <span class="chip">{s}</span>)}</div>
      <a class="download" href={cv.pdf} download>⬇ Download CV (PDF)</a>
    </div>
  </div>
</Section>
<style>
  .cvgrid{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:18px}
  .tl{border-left:2px solid var(--ink);margin-left:6px;padding-left:20px}
  .item{margin-bottom:16px;position:relative}
  .item::before{content:"";position:absolute;left:-26px;top:5px;width:9px;height:9px;border-radius:50%;background:var(--ink)}
  .item h4{font-size:14px}.meta{font-size:12px;color:var(--muted)}
  .download{background:var(--ink);color:#fff;border-radius:22px;padding:11px 20px;font-size:13px;font-weight:600;display:inline-block;margin-top:16px}
  @media (max-width:760px){.cvgrid{grid-template-columns:1fr}}
</style>
```

- [ ] **Step 2: Contact** — `src/components/Contact.astro`:
```astro
---
import { profile } from '../data/profile';
---
<section id="contact" class="reveal contact">
  <div class="label">06 — Contact</div>
  <h2 class="big">Let's talk.</h2>
  <p>Open to collaboration, research chats &amp; opportunities.</p>
  <div class="row">
    <a href={`mailto:${profile.email}`}>✉ Email</a>
    {profile.socials.map(s => <a href={s.href} target="_blank" rel="noopener">{s.label}</a>)}
  </div>
  <footer>© {new Date().getFullYear()} Zibin Zhao</footer>
</section>
<style>
  .contact{text-align:center;background:var(--ink);color:#fff;padding:90px 50px 50px;border-radius:var(--radius) var(--radius) 0 0;margin:0 var(--gap)}
  .contact .label{color:#71717a}
  .contact h2{font-family:var(--font-display);font-size:34px;margin:10px 0}
  .contact p{color:#a1a1aa;font-size:14px}
  .row{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:20px}
  .row a{border:1px solid #3f3f46;border-radius:20px;padding:8px 16px;font-size:13px}
  footer{margin-top:34px;color:#52525b;font-size:12px}
</style>
```

- [ ] **Step 3: Add both** to `index.astro` (`<CvTimeline />` inside `.content` after `<Vibe />`; `<Contact />` after the closing `</main>`).

- [ ] **Step 4: Verify**

Run: `npm run build && npm run preview`
Expected: CV timeline + skills chips + download button; dark contact section closes the page with all links.

- [ ] **Step 5: Commit**
```bash
git add -A && git commit -m "feat: CV timeline and Contact sections"
```

---

## Task 12: Portrait cutout

**Files:**
- Replace: `public/portrait.png`

- [ ] **Step 1: Attempt background removal** on the poster:
```bash
cd /Users/zibinzhao/Desktop/Projects/personal_webpage
uvx --from rembg 'rembg[cli]' i /Users/zibinzhao/Desktop/headshot.png public/portrait.png || \
  pipx run rembg i /Users/zibinzhao/Desktop/headshot.png public/portrait.png
```
(Confirm the install method first per repo conventions; either `uvx` or `pipx` is fine.)

- [ ] **Step 2: Inspect the result**

Open `public/portrait.png`. Judge: is the subject cleanly isolated with transparent background, or does the baked-in "GRADUATE" text / campus imagery remain?

- [ ] **Step 3: Decide**
  - **If clean:** keep it; the hero portrait now sits transparent over the wordmark. Done.
  - **If not crisp (expected risk):** fall back — remove the `<img class="portrait">` from `Hero.astro` and instead reduce hero to typography-only OR place the framed `poster.png` as the centered hero image (object-fit:cover, rounded). Update `Hero.astro` accordingly and note the change in the commit. The site still ships.

- [ ] **Step 4: Verify**

Run: `npm run build && npm run preview`
Expected: hero portrait renders correctly per the chosen path.

- [ ] **Step 5: Commit**
```bash
git add -A && git commit -m "feat: portrait cutout (or framed-poster fallback)"
```

---

## Task 13: Generate updated CV PDF

**Files:**
- Create: `tools/cv-template.html`, `tools/make-cv.mjs`
- Output: `public/cv.pdf`

- [ ] **Step 1: Install Playwright (Chromium only)**
```bash
npm install -D playwright && npx playwright install chromium
```

- [ ] **Step 2: CV HTML template** — `tools/cv-template.html`: a single-page A4 CV styled with the site's typography (Space Grotesk headings, Inter body, monochrome). Populate sections from `src/data/cv.ts` + the publication list (spec §5.2): **Header** (name, email `zibin.zhao@connect.ust.hk`, +852 6210 0581, HKUST); **Education**; **Selected Publications** (the 9 papers, year-desc, Nature Biotech first); **Research & Work Experience**; **Skills**; **Languages**; **Leadership**. Use print CSS `@page { size: A4; margin: 16mm }`.

- [ ] **Step 3: Generator** — `tools/make-cv.mjs`:
```js
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const dir = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('file://' + path.join(dir, 'cv-template.html'));
await page.pdf({ path: path.join(dir, '../public/cv.pdf'), format: 'A4', printBackground: true });
await browser.close();
console.log('Wrote public/cv.pdf');
```

- [ ] **Step 4: Add npm script** to `package.json`: `"cv": "node tools/make-cv.mjs"`. Run:
```bash
npm run cv
```
Expected: `public/cv.pdf` created.

- [ ] **Step 5: USER REVIEW GATE** — open `public/cv.pdf`, confirm content/accuracy with Zibin before publishing. Fix `cv-template.html` and re-run if needed.

- [ ] **Step 6: Verify download link**

Run: `npm run build && npm run preview` → click "Download CV (PDF)". Expected: the generated PDF opens.

- [ ] **Step 7: Commit**
```bash
git add -A && git commit -m "feat: generate updated CV PDF from current data + publications"
```

---

## Task 14: Favicon, OG image, accessibility & responsive pass

**Files:**
- Create: `public/favicon.svg`, `public/og.png`
- Modify: components as needed

- [ ] **Step 1: Favicon** — `public/favicon.svg` (monogram "ZZ"):
```bash
printf '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#18181b"/><text x="50" y="68" font-family="Arial" font-weight="800" font-size="52" fill="#fff" text-anchor="middle">ZZ</text></svg>' > public/favicon.svg
```

- [ ] **Step 2: OG image** — create a 1200×630 `public/og.png` (name + role on the frame background; can be a screenshot of the hero or a simple generated banner).

- [ ] **Step 3: Accessibility checks** — confirm: exactly one `<h1>` (the wordmark in Hero — verify `.bigName` wraps an `<h1>`; if it is a `<div>`, change to `<h1>` and keep `.role h1` as `<h2>`/`<p>`), all `<img>` have alt text, nav links have discernible text, focus-visible outlines present (add to global.css):
```css
:focus-visible{outline:2px solid var(--ink);outline-offset:3px;border-radius:6px}
```

- [ ] **Step 4: Responsive check**

Run: `npm run preview`, resize to 375px and 768px. Expected: hero recomposes (name/portrait/role/socials stack, centered), sections single-column, nav menu hidden on mobile.

- [ ] **Step 5: Build + a11y sanity**

Run: `npm run build`
Optionally: `npx @lhci/cli autorun --collect.staticDistDir=dist` or run Lighthouse in the browser. Target ≥95 performance/SEO/best-practices, ≥90 a11y. Fix contrast/alt issues found.

- [ ] **Step 6: Commit**
```bash
git add -A && git commit -m "feat: favicon, OG image, a11y + responsive polish"
```

---

## Task 15: GitHub Pages deploy + custom domain

**Files:**
- Create: `.github/workflows/deploy.yml`, `public/CNAME`

- [ ] **Step 1: CNAME** — `public/CNAME`:
```
zibinzhao.com
```

- [ ] **Step 2: Workflow** — `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages
on:
  push: { branches: [main] }
  workflow_dispatch:
permissions: { contents: read, pages: write, id-token: write }
concurrency: { group: pages, cancel-in-progress: true }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: withastro/action@v3
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages, url: "${{ steps.deployment.outputs.page_url }}" }
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```
> Note: do NOT commit `public/cv.pdf` generation into CI — the PDF is built locally (Task 13) and committed as a static asset. `withastro/action` runs `npm ci && astro build`; ensure `package-lock.json` is committed.

- [ ] **Step 3: Create the GitHub repo and push**
```bash
gh repo create zibin-zhao/personal-webpage --public --source=. --remote=origin --push
```

- [ ] **Step 4: Enable Pages** — in repo Settings → Pages, set Source = "GitHub Actions". Confirm the workflow run succeeds (`gh run watch`).

- [ ] **Step 5: DNS (user action)** — point `zibinzhao.com` at GitHub Pages: apex `A` records to `185.199.108–111.153`, `www` CNAME → `zibin-zhao.github.io`. Enable "Enforce HTTPS" once DNS resolves. Until then the site is live at the `*.github.io` URL.

- [ ] **Step 6: Verify deployment**

Run: `gh run list --limit 1` → success; visit the Pages URL. Expected: full site loads, hero collapses, all links work.

- [ ] **Step 7: Commit any fixes**
```bash
git add -A && git commit -m "ci: GitHub Pages deploy + custom domain CNAME" && git push
```

---

## Self-Review

**Spec coverage** (spec §→task):
- §2 Design language → Tasks 1,4,5 (tokens, fonts, frame). ✅
- §3 IA / section order → index composition Tasks 5–11. ✅
- §4 Hero + collapse interaction → Tasks 5,6. ✅
- §5.1 About → Task 7. §5.2 Publications (full list + metrics) → Tasks 3,8. §5.3 Projects → Task 9. §5.4 Vibe Coding (coming-soon) → Task 10. §5.5 CV (timeline + generated PDF) → Tasks 11,13. §5.6 Contact → Task 11. ✅
- §6 Content model → Tasks 2,3. ✅
- §7 Stack/structure → Task 1 + per-component tasks. ✅
- §8 Portrait/assets → Tasks 5,7,12,14. ✅
- §9 a11y/perf/responsive → Task 14. ✅
- §10 Deploy + custom domain → Task 15. ✅
- §11 decisions (full list, no vibe links, new CV, domain, tagline) → reflected in Tasks 3,10,13,15,2. ✅

**Placeholder scan:** No "TBD/handle edge cases" left as work items. Task 13 Step 2 and Task 14 Step 2 describe asset content rather than full literal code (HTML CV template, OG image) — these are content-authoring steps with explicit required contents, acceptable. ✅

**Type consistency:** `sortPubs` signature matches usage in PubList; `Pub` fields (year/title/venue/authors/links/featured) match the collection schema and the markdown frontmatter; `profile.scholar.{citations,hIndex,i10,asOf}` matches PubList usage; `cv.{education,experience,skills,pdf}` matches CvTimeline. IDs (`#about #research #projects #vibe #cv #contact`) match Nav links. ✅

**Note:** Section numbering labels — Hero is unNumbered; About=01, Research=02, Projects=03, Vibe=04, CV=05, Contact=06 (consistent across components). ✅
