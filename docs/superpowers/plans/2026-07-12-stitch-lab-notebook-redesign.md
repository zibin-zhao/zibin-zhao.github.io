# Stitch Lab-Notebook Portfolio Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the complete Astro portfolio in the attached Stitch neo-brutalist lab-notebook language while preserving every current route, content source, bilingual behavior, link, accessibility feature, and production workflow.

**Architecture:** Keep Astro content collections and data modules as the single source of truth, and replace only the presentation layer. Shared paper, typography, color, focus, and motion rules live in tokens/global CSS; focused Astro components own hero, chapter, card, and footer composition; one small script owns progressive reveal and navigation state.

**Tech Stack:** Astro 6, TypeScript 6, scoped Astro CSS, Fontsource packages, Vitest 4, browser-based responsive/accessibility verification.

## Global Constraints

- Use the Stitch export as a visual blueprint; do not embed its generated Tailwind CDN page.
- Use warm cream `#fffae0`, dark forest ink `#003322`, specimen green `#a2d39c`, and orange `#ffb95f` as the core palette.
- Use Anton for oversized Latin display type, Space Grotesk for body/card copy, and JetBrains Mono for technical labels.
- Load fonts locally; no Google Fonts runtime dependency.
- Keep all current About, Research, Projects, Vibe, CV, Contact, Prompts, bilingual, external-link, and CV-download behavior.
- Do not add React, Tailwind, or another client-side framework.
- Remove the custom pencil cursor and particle trail.
- All motion must have a `prefers-reduced-motion: reduce` fallback.
- Do not invent, remove, or duplicate content claims.
- Prevent horizontal overflow at desktop, tablet, and mobile widths.
- After a successful merge into `main`, push `main` to `origin` and verify the live site after deployment propagation.

---

## Planned File Structure

- `src/styles/tokens.css`: semantic Stitch palette, grid, typography, stroke, shadow, and motion tokens.
- `src/styles/global.css`: reset, graph-paper surface, local font imports, focus, bilingual visibility, reveal/fallback, and shared physical-control behavior.
- `src/layouts/Base.astro`: metadata, skip link, global decorative paper layer, and slot.
- `src/components/Nav.astro`: floating index label, language/contact actions, and accessible chapter menu.
- `src/components/Hero.astro`: one-viewport wordmark, collaboration sticker, intro specimen card, and scroll cue.
- `src/components/Section.astro`: numbered chapter-banner variants and bounded content wrapper.
- `src/components/About.astro`: researcher dossier.
- `src/components/PubList.astro`: featured evidence cards and compact archive cards.
- `src/components/Projects.astro`, `src/components/ProjectCard.astro`: experiment-board project collection.
- `src/components/Vibe.astro`, `src/components/VibeCard.astro`: staggered image-led Vibe collage and open slot.
- `src/components/CvTimeline.astro`: indexed résumé strip.
- `src/components/Contact.astro`: high-contrast closing poster and in-flow chapter/social index.
- `src/pages/prompts.astro`: calmer lab-archive version of the Prompts route.
- `src/scripts/hero.ts`: section reveal and compact-nav scroll state only.
- Delete `src/scripts/field-motion.ts` and `tests/field-motion.test.ts`.
- `tests/lab-notebook-foundation.test.ts`: static structural contract for palette, fonts, semantic sections, image fallbacks, no cursor particles, and Prompts visual adoption.
- Preserve `tests/pubs.test.ts` for publication ordering.

---

### Task 1: Establish the Local Typography and Paper Foundation

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/global.css`
- Modify: `src/layouts/Base.astro`
- Create: `tests/lab-notebook-foundation.test.ts`
- Delete: `tests/collage-foundation.test.ts`

**Interfaces:**
- Consumes: `Base.astro` wrapping every page and the existing `data-lang` attribute.
- Produces: CSS tokens `--paper`, `--paper-deep`, `--ink`, `--green`, `--orange`, `--grid-line`, `--stroke`, `--shadow-card`, `--font-display`, `--font-body`, and `--font-note` used by all later tasks.

- [ ] **Step 1: Replace the old visual-contract test with a failing lab-notebook foundation test**

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const root = new URL('..', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');

describe('Stitch lab-notebook foundation', () => {
  it('defines the approved palette and local type families', () => {
    const tokens = read('src/styles/tokens.css');
    const global = read('src/styles/global.css');
    expect(tokens).toContain('--paper: #fffae0');
    expect(tokens).toContain('--ink: #003322');
    expect(tokens).toContain('--green: #a2d39c');
    expect(tokens).toContain('--orange: #ffb95f');
    expect(tokens).toContain("--font-display: 'Anton'");
    expect(global).toContain("@import '@fontsource/anton/400.css'");
    expect(global).toContain("@import '@fontsource/jetbrains-mono/500.css'");
  });

  it('keeps the skip link and graph-paper surface', () => {
    const layout = read('src/layouts/Base.astro');
    const global = read('src/styles/global.css');
    expect(layout).toContain('class="skip-link" href="#main-content"');
    expect(layout).toContain('class="paper-atmosphere"');
    expect(global).toContain('background-size: var(--grid-size) var(--grid-size)');
  });
});
```

- [ ] **Step 2: Run the new test and confirm it fails on the old palette/type contract**

Run: `npm test -- tests/lab-notebook-foundation.test.ts`

Expected: FAIL because the new test file is not yet satisfied by the existing tokens and Base decoration.

- [ ] **Step 3: Install local Anton and JetBrains Mono packages**

Run: `npm install @fontsource/anton@^5.2.8 @fontsource/jetbrains-mono@^5.2.8`

Expected: `package.json` and `package-lock.json` include both packages with no audit failure that prevents installation.

- [ ] **Step 4: Replace tokens with the shared visual contract**

```css
:root {
  --paper: #fffae0;
  --paper-deep: #f3eed4;
  --paper-card: #f9f4d9;
  --ink: #003322;
  --muted: #414944;
  --green: #a2d39c;
  --green-bright: #bdf0b6;
  --orange: #ffb95f;
  --outline: #717973;
  --grid-line: rgba(0, 51, 34, .1);
  --grid-size: 20px;
  --stroke: 2px solid var(--ink);
  --shadow-card: 6px 6px 0 var(--ink);
  --shadow-control: 3px 3px 0 var(--ink);
  --page-pad: clamp(20px, 4vw, 40px);
  --content-max: 1120px;
  --font-display: 'Anton', 'Arial Narrow', sans-serif;
  --font-body: 'Space Grotesk', 'PingFang SC', sans-serif;
  --font-note: 'JetBrains Mono', ui-monospace, monospace;
  --motion-fast: 160ms;
  --motion-slow: 700ms;
  --ease-press: cubic-bezier(.2, .8, .2, 1);
}
```

- [ ] **Step 5: Implement global graph paper, typography, focus, reveal, and reduced-motion rules**

```css
@import '@fontsource/anton/400.css';
@import '@fontsource/jetbrains-mono/500.css';
@import '@fontsource/space-grotesk/500.css';
@import '@fontsource/space-grotesk/700.css';
@import './tokens.css';

* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  min-width: 320px;
  overflow-x: clip;
  color: var(--ink);
  background-color: var(--paper);
  background-image: linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
  background-size: var(--grid-size) var(--grid-size);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
}
a { color: inherit; text-decoration: none; }
button { color: inherit; font: inherit; }
:focus-visible { outline: 3px solid var(--orange); outline-offset: 4px; }
.reveal { opacity: 0; transform: translateY(24px); transition: opacity var(--motion-slow), transform var(--motion-slow); }
.reveal.in { opacity: 1; transform: none; }
[data-lang='en'] .t-zh, [data-lang='zh'] .t-en { display: none; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 1ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; transition-duration: 1ms !important; }
  .reveal { opacity: 1; transform: none; }
}
```

- [ ] **Step 6: Add a decorative, non-interactive paper atmosphere to Base**

```astro
<body>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <div class="paper-atmosphere" aria-hidden="true"><i></i><i></i><i></i></div>
  <slot />
</body>
```

- [ ] **Step 7: Run the foundation test and full suite**

Run: `npm test -- tests/lab-notebook-foundation.test.ts && npm test`

Expected: foundation contract PASS; any remaining failures must be limited to tests intentionally replaced in later tasks.

- [ ] **Step 8: Commit the visual foundation**

```bash
git add package.json package-lock.json src/styles/tokens.css src/styles/global.css src/layouts/Base.astro tests/lab-notebook-foundation.test.ts tests/collage-foundation.test.ts
git commit -m "feat: establish Stitch lab notebook foundation"
```

---

### Task 2: Rebuild Navigation and Hero; Remove Pencil Motion

**Files:**
- Modify: `src/components/Nav.astro`
- Modify: `src/components/Hero.astro`
- Modify: `src/scripts/hero.ts`
- Delete: `src/scripts/field-motion.ts`
- Delete: `tests/field-motion.test.ts`
- Modify: `tests/lab-notebook-foundation.test.ts`

**Interfaces:**
- Consumes: `profile`, `T.astro`, `LangToggle.astro`, shared CSS tokens, and the `#main-content` landmark.
- Produces: `#topnav`, `#menubtn`, `#navlinks`, `#hero-name`, `.hero-specimen`, and `.scroll-cue`; `hero.ts` only toggles `.scrolled`, `.open`, and `.in` states.

- [ ] **Step 1: Add failing structural assertions for the approved hero**

```ts
it('uses the Stitch index navigation and physical hero card', () => {
  const nav = read('src/components/Nav.astro');
  const hero = read('src/components/Hero.astro');
  const script = read('src/scripts/hero.ts');
  expect(nav).toContain('UNFINISHED INDEX');
  expect(nav).toContain('id="navlinks"');
  expect(hero).toContain('id="hero-name"');
  expect(hero).toContain('class="hero-specimen"');
  expect(hero).toContain('class="scroll-cue"');
  expect(hero).not.toContain('experiment-holder');
  expect(script).not.toContain('field-motion');
});
```

- [ ] **Step 2: Run the test to verify the hero contract fails**

Run: `npm test -- tests/lab-notebook-foundation.test.ts`

Expected: FAIL on `.hero-specimen`, `.scroll-cue`, and the obsolete field-motion import.

- [ ] **Step 3: Implement the two-label navigation structure**

```astro
<header class="topnav" id="topnav">
  <a class="index-label" href="#top">ZIBINZHAO.COM · <span class="t-en">UNFINISHED INDEX</span><span class="t-zh">未完成索引</span></a>
  <div class="nav-actions">
    <button class="menubtn" id="menubtn" type="button" aria-expanded="false" aria-controls="navlinks"><T en="Index" zh="索引" /></button>
    <nav id="navlinks" aria-label="Site chapters">
      {profile.navLinks.map((link) => <a href={link.href}><T en={link.en} zh={link.zh} /></a>)}
    </nav>
    <LangToggle />
    <a class="talk" href={`mailto:${profile.email}`}><T en="Let's talk ↗" zh="联系我 ↗" /></a>
  </div>
</header>
```

- [ ] **Step 4: Implement the natural-flow hero structure**

```astro
<section class="hero" id="top" aria-labelledby="hero-name">
  <span class="collab"><T en={profile.status.en} zh={profile.status.zh} /></span>
  <h1 class="hero-name" id="hero-name"><span>{profile.firstName}</span><span>{profile.lastName}</span></h1>
  <aside class="formula" aria-hidden="true">f(x) = ∫(CRISPR + AI)dx</aside>
  <article class="hero-specimen">
    <h2><T en={profile.role.en} zh={profile.role.zh} /></h2>
    <p class="hero-thesis"><T en="AIing, caring, learning, and everyday wellbeing." zh="人工智能、关怀、学习与日常健康。" /></p>
    <p><T en={profile.tagline.en} zh={profile.tagline.zh} /></p>
    <div class="specimen-meta"><img src="https://lh3.googleusercontent.com/aida/AP1WRLvnukA4djZtHJYJuWsaZFrOqcFIe7eDBqp2l-uqnngfE35Yu431xhsySJ-xfgYyVQpaAMK1jT2Lkh-kvlBh_QPfNZLqVojrX1XVhONFJ3MOsOx3C9PFRlBaRaRNX0DN_STRU5g-EOqzWfCuhBic6SUNgFWepL1jIqgVZub30ZLjxvf58xtk6Jz7stroLGL-AGASWPw18JxYw-H1jSzVLIN_JIYN4LKF9IIe3ltrt9PjfLEKRKro_y7OEuk" alt="Small illustrated specimen cart" width="64" height="64" fetchpriority="high" /><span>v1.0.4 // Active</span></div>
  </article>
  <a class="scroll-cue" href="#about"><T en="Scroll for updates ↓" zh="向下查看更新 ↓" /></a>
</section>
```

- [ ] **Step 5: Replace hero script with reveal and compact-nav state only**

```ts
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const topnav = document.getElementById('topnav');
const menu = document.getElementById('menubtn');
const links = document.getElementById('navlinks');

const updateNav = () => topnav?.classList.toggle('scrolled', window.scrollY > 24);
window.addEventListener('scroll', updateNav, { passive: true });
updateNav();

menu?.addEventListener('click', () => {
  const open = links?.classList.toggle('open') ?? false;
  menu.setAttribute('aria-expanded', String(open));
});

if (!reduce && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('in')), { threshold: .12 });
  document.querySelectorAll('.reveal').forEach((node) => observer.observe(node));
} else {
  document.querySelectorAll('.reveal').forEach((node) => node.classList.add('in'));
}
```

- [ ] **Step 6: Delete pencil code and its unit test**

Delete `src/scripts/field-motion.ts` and `tests/field-motion.test.ts`; remove all `.field-wand`, `.field-trail`, and `.field-click` rules from global CSS.

- [ ] **Step 7: Run the hero contract and build**

Run: `npm test -- tests/lab-notebook-foundation.test.ts && npm run build`

Expected: PASS; build produces `/`, `/prompts/`, `/medit/`, and `/singularity/` without an unresolved field-motion import.

- [ ] **Step 8: Commit navigation and hero**

```bash
git add src/components/Nav.astro src/components/Hero.astro src/scripts/hero.ts src/scripts/field-motion.ts tests/field-motion.test.ts tests/lab-notebook-foundation.test.ts src/styles/global.css
git commit -m "feat: rebuild index navigation and hero"
```

---

### Task 3: Build About and Publication Evidence Chapters

**Files:**
- Modify: `src/components/Section.astro`
- Modify: `src/components/About.astro`
- Modify: `src/components/PubList.astro`
- Modify: `tests/lab-notebook-foundation.test.ts`

**Interfaces:**
- Consumes: `Section` props `{ id, num, label, labelZh, variant }`, `profile.focus`, and publication collection data sorted by `sortPubs`.
- Produces: `.chapter-banner`, `.dossier`, `.pub--featured`, `.pub--archive`, and unchanged publication links.

- [ ] **Step 1: Add failing chapter assertions**

```ts
it('renders dossier and evidence-card chapter variants', () => {
  const section = read('src/components/Section.astro');
  const about = read('src/components/About.astro');
  const pubs = read('src/components/PubList.astro');
  expect(section).toContain('chapter-banner');
  expect(about).toContain('class="dossier"');
  expect(pubs).toContain("p.featured ? 'pub--featured' : 'pub--archive'");
  expect(pubs).toContain('Object.entries(p.links)');
});
```

- [ ] **Step 2: Verify the chapter test fails**

Run: `npm test -- tests/lab-notebook-foundation.test.ts`

Expected: FAIL because the dossier and evidence-card classes do not exist.

- [ ] **Step 3: Implement the shared chapter banner**

```astro
<section id={id} class:list={['reveal', 'chapter', `chapter--${variant}`]}>
  <header class="chapter-heading">
    <h2 class="chapter-banner"><span>{num}</span> — <T en={label} zh={labelZh ?? label} /></h2>
  </header>
  <div class="chapter-content"><slot /></div>
</section>
```

- [ ] **Step 4: Wrap About content in a dossier without changing copy**

```astro
<Section id="about" num="01" label="About" labelZh="关于" variant="dossier">
  <article class="dossier">
    <p class="dossier-code">RESEARCHER FILE / ACTIVE</p>
    <h3><T en="A short story" zh="我的故事" /></h3>
    <p class="t-en">PhD candidate in Bioengineering at the Hong Kong University of Science and Technology (Hsing Lab), HKPFS + Redbird awardee. BSc Biomedical Engineering, University of Melbourne (First Class Honours). I build deep-learning methods at the interface of molecular biology and AI — one-pot CRISPR diagnostics, structure-aware aptamer selection, and molecular-dynamics tooling.</p>
    <p class="t-zh">香港科技大学生物工程博士候选人（Hsing 实验室），香港博士研究生奖学金（HKPFS）+ Redbird 奖得主；本科毕业于墨尔本大学生物医学工程（一等荣誉）。我在分子生物学与人工智能的交叉处构建深度学习方法 —— 一锅式 CRISPR 诊断、结构感知的适体筛选，以及分子动力学工具。</p>
    <div class="chips">{profile.focus.map((focus) => <span class="chip"><T en={focus.en} zh={focus.zh} /></span>)}</div>
  </article>
</Section>
```

- [ ] **Step 5: Render featured and archive publication cards from the same collection**

```astro
<ol class="pubs">
  {pubs.map((p, index) => (
    <li class:list={['pub', p.featured ? 'pub--featured' : 'pub--archive']}>
      {p.featured && <span class="pub-index" aria-hidden="true">{index + 1}</span>}
      <div class="pub-meta"><span>{p.year}</span>{p.venue && <span>{p.venue}</span>}</div>
      <h3>{p.title}{p.featured && <span class="star" aria-label="Featured">★</span>}</h3>
      {p.authors && <p class="pub-authors">{p.authors}</p>}
      {p.links && <div class="pub-links">{Object.entries(p.links).filter(([, value]) => value).map(([key, value]) => <a href={value} target="_blank" rel="noopener">{key.toUpperCase()} ↗</a>)}</div>}
    </li>
  ))}
</ol>
```

- [ ] **Step 6: Run publication tests and production build**

Run: `npm test -- tests/lab-notebook-foundation.test.ts tests/pubs.test.ts && npm run build`

Expected: all selected tests PASS; collection rendering builds with no missing frontmatter property errors.

- [ ] **Step 7: Commit About and Research chapters**

```bash
git add src/components/Section.astro src/components/About.astro src/components/PubList.astro tests/lab-notebook-foundation.test.ts
git commit -m "feat: add dossier and publication evidence chapters"
```

---

### Task 4: Recompose Projects and Vibe as Experiment Boards

**Files:**
- Modify: `src/components/Projects.astro`
- Modify: `src/components/ProjectCard.astro`
- Modify: `src/components/Vibe.astro`
- Modify: `src/components/VibeCard.astro`
- Modify: `tests/lab-notebook-foundation.test.ts`

**Interfaces:**
- Consumes: existing project/vibe collection frontmatter, including `href`, `screenshot`, `preview`, `comingSoon`, and `tags`.
- Produces: `.project-board`, `.project-schematic`, `.vibe-board`, `.shot-fallback`, and safe outbound anchors.

- [ ] **Step 1: Add failing experiment-board assertions**

```ts
it('uses explicit project and Vibe image fallbacks', () => {
  const projects = read('src/components/Projects.astro');
  const projectCard = read('src/components/ProjectCard.astro');
  const vibe = read('src/components/Vibe.astro');
  const vibeCard = read('src/components/VibeCard.astro');
  expect(projects).toContain('class="project-board"');
  expect(projectCard).toContain('class="project-schematic"');
  expect(vibe).toContain('class="vibe-board"');
  expect(vibeCard).toContain('class="shot-fallback"');
  expect(vibeCard).toContain('width="800" height="600"');
});
```

- [ ] **Step 2: Verify the experiment-board test fails**

Run: `npm test -- tests/lab-notebook-foundation.test.ts`

Expected: FAIL on the new board/fallback class assertions.

- [ ] **Step 3: Implement the project experiment card structure**

```astro
<Tag class="project-card" href={href} target={href ? '_blank' : undefined} rel={href ? 'noopener' : undefined}>
  <div class="project-schematic" aria-hidden="true"><span></span><span></span><span></span><i></i></div>
  <div class="project-copy">
    <span class="project-type">{type}</span>
    <h3>{title}</h3>
    <p><T en={blurb} zh={blurbZh ?? blurb} /></p>
    {href && <span class="project-action"><T en="Open experiment ↗" zh="打开实验 ↗" /></span>}
  </div>
</Tag>
```

- [ ] **Step 4: Use semantic board wrappers for both collections**

```astro
<div class="project-board">{items.map((project) => <ProjectCard {...project.data} />)}</div>
```

```astro
<div class="vibe-board">
  {items.map((item) => <VibeCard {...item.data} />)}
  <div class="open-slot"><span>+</span><T en="Open slot — more projects to come" zh="虚位以待，更多项目即将到来" /></div>
</div>
```

- [ ] **Step 5: Replace generic Vibe placeholder text with a visual fallback**

```astro
<div class:list={['shot', preview && `shot--${preview}`]}>
  {screenshot
    ? <img src={screenshot} alt={`${title} screenshot`} width="800" height="600" loading="lazy" />
    : preview === 'medit'
      ? <span class="medit-preview" aria-label="Medit: a quiet place for journaling and gentle daily rituals">☾ leaf / quiet place ☾</span>
      : <span class="shot-fallback" aria-hidden="true"><i></i><i></i><i></i><b>EXPERIMENT PREVIEW</b></span>}
</div>
```

- [ ] **Step 6: Run structural tests and build**

Run: `npm test -- tests/lab-notebook-foundation.test.ts && npm run build`

Expected: PASS; no content collection item loses its title, description, tags, or link.

- [ ] **Step 7: Commit experiment-board chapters**

```bash
git add src/components/Projects.astro src/components/ProjectCard.astro src/components/Vibe.astro src/components/VibeCard.astro tests/lab-notebook-foundation.test.ts
git commit -m "feat: compose project experiment boards"
```

---

### Task 5: Finish CV and Contact as Indexed Closing Matter

**Files:**
- Modify: `src/components/CvTimeline.astro`
- Modify: `src/components/Contact.astro`
- Modify: `tests/lab-notebook-foundation.test.ts`

**Interfaces:**
- Consumes: `cv` entries/skills/PDF path and `profile.email`, `profile.socials`, `profile.navLinks`.
- Produces: `.cv-index`, `.cv-entry`, `.closing-poster`, and `.footer-index` in normal document flow.

- [ ] **Step 1: Add failing closing-matter assertions**

```ts
it('keeps CV download and in-flow closing index', () => {
  const cv = read('src/components/CvTimeline.astro');
  const contact = read('src/components/Contact.astro');
  expect(cv).toContain('class="cv-index"');
  expect(cv).toContain('href={cv.pdf} download');
  expect(contact).toContain('class="closing-poster"');
  expect(contact).toContain('class="footer-index"');
  expect(contact).toContain('profile.navLinks');
  expect(contact).not.toContain('position:fixed');
});
```

- [ ] **Step 2: Verify closing-matter test fails**

Run: `npm test -- tests/lab-notebook-foundation.test.ts`

Expected: FAIL because the index and closing-poster classes are absent.

- [ ] **Step 3: Render the CV as an ordered index**

```astro
<div class="cv-layout">
  <ol class="cv-index">
    {items.map((item, index) => (
      <li class="cv-entry">
        <span class="cv-num">{String(index + 1).padStart(2, '0')}</span>
        <div><h3><T en={`${item.title.en} — ${item.org.en}`} zh={`${item.title.zh} — ${item.org.zh}`} /></h3><p class="t-en">{[item.period.en, ...item.notes.en].filter(Boolean).join(' · ')}</p><p class="t-zh">{[item.period.zh, ...item.notes.zh].filter(Boolean).join(' · ')}</p></div>
      </li>
    ))}
  </ol>
  <aside class="cv-tools"><div class="chips">{cv.skills.map((skill) => <span class="chip">{skill}</span>)}</div><a class="download" href={cv.pdf} download><T en={cv.download.en} zh={cv.download.zh} /></a></aside>
</div>
```

- [ ] **Step 4: Implement closing poster and in-flow index**

```astro
<section id="contact" class="reveal closing-poster">
  <p class="closing-label">06 — <T en="Contact" zh="联系" /></p>
  <h2><T en="Let's make something useful." zh="一起做些真正有用的东西。" /></h2>
  <p><T en="Open to collaboration, research chats & opportunities." zh="欢迎合作、学术交流与各类机会。" /></p>
  <a class="email" href={`mailto:${profile.email}`}>{profile.email} ↗</a>
  <nav class="footer-index" aria-label="Footer chapters">{profile.navLinks.map((link) => <a href={link.href}><T en={link.en} zh={link.zh} /></a>)}</nav>
  <div class="social-index">{profile.socials.map((social) => <a href={social.href} target="_blank" rel="noopener">{social.label} ↗</a>)}</div>
  <footer>© {year} Zibin Zhao</footer>
</section>
```

- [ ] **Step 5: Run structural tests and build**

Run: `npm test -- tests/lab-notebook-foundation.test.ts && npm run build`

Expected: PASS; CV PDF remains copied to `dist/cv.pdf` and footer links build without invalid anchors.

- [ ] **Step 6: Commit indexed closing matter**

```bash
git add src/components/CvTimeline.astro src/components/Contact.astro tests/lab-notebook-foundation.test.ts
git commit -m "feat: add indexed CV and closing poster"
```

---

### Task 6: Restyle the Prompts Route as a Lab Archive

**Files:**
- Modify: `src/pages/prompts.astro`
- Modify: `src/components/PromptBlock.astro`
- Modify: `tests/lab-notebook-foundation.test.ts`

**Interfaces:**
- Consumes: unchanged `promptPack`, `PromptBlock` copy-button hooks `.copy` and `.ptext`, and global tokens.
- Produces: `.prompt-index-label`, `.prompt-hero`, `.stage-card`, physical stage navigation, and unchanged copy/scroll-spy behavior.

- [ ] **Step 1: Add failing Prompts adoption assertions**

```ts
it('adopts the lab archive language on the Prompts route', () => {
  const prompts = read('src/pages/prompts.astro');
  expect(prompts).toContain('class="prompt-index-label"');
  expect(prompts).toContain('class="prompt-hero"');
  expect(prompts).toContain("['stage-card', 'stage']");
  expect(prompts).not.toContain('border-radius:22px');
  expect(prompts).not.toContain('backdrop-filter:blur');
});
```

- [ ] **Step 2: Verify Prompts test fails**

Run: `npm test -- tests/lab-notebook-foundation.test.ts`

Expected: FAIL on new lab-archive classes and old rounded/glass rules.

- [ ] **Step 3: Rename structural hooks without changing behavior hooks**

```astro
<header class="prompt-bar">
  <a class="prompt-index-label" href="/">ZIBINZHAO.COM · PROMPT ARCHIVE</a>
  <a class="back" href="/">← Back to site</a>
</header>
<section class="prompt-hero">
  <p class="kicker">{P.kicker}</p>
  <h1>{P.title}</h1>
  <p class="intro">{P.intro}</p>
</section>
```

```astro
<section class:list={['stage-card', 'stage']} id={`stage-${s.num}`}>
  <header class="stage-heading"><span class="stage-number">{s.num}</span><div><h2>{s.title}</h2><span class:list={['tool', s.frontier && 'frontier']}>{s.tool}</span></div></header>
  {s.note && <p class="note">{s.note}</p>}
  {s.blocks.map((block) => <PromptBlock label={block.label} text={block.text} />)}
  {s.afterNote && <p class="after">↳ {s.afterNote}</p>}
</section>
```

- [ ] **Step 4: Replace glass/rounded CSS with square physical archive styling**

```css
.prompt-bar,.prompt-index-label,.back,.stagenav,.stage-card,.meta,.discipline{border:var(--stroke);background:var(--paper-card);box-shadow:var(--shadow-control)}
.prompt-bar{display:flex;justify-content:space-between;align-items:center;max-width:var(--content-max);margin:0 auto;padding:10px 12px;transform:rotate(-.35deg)}
.prompt-index-label,.back{padding:7px 9px;font:500 11px/1 var(--font-note);text-transform:uppercase}
.prompt-hero{max-width:880px;margin:0 auto;padding:90px 20px 24px;text-align:left}
.stage-card{max-width:980px;margin:28px auto 0;padding:clamp(22px,4vw,38px);scroll-margin-top:110px}
.stage-card:nth-child(even){transform:translateX(clamp(0px,2vw,24px)) rotate(.25deg)}
```

- [ ] **Step 5: Run full tests and build**

Run: `npm test && npm run build`

Expected: all tests PASS and both homepage and Prompts route build successfully.

- [ ] **Step 6: Commit Prompts restyle**

```bash
git add src/pages/prompts.astro src/components/PromptBlock.astro tests/lab-notebook-foundation.test.ts
git commit -m "feat: restyle prompts as lab archive"
```

---

### Task 7: Browser Verification, Visual Polish, and Accessibility Corrections

**Files:**
- Modify after a failed verification check: `src/styles/global.css`
- Modify after a failed verification check: `src/styles/tokens.css`
- Modify after a failed verification check: `src/components/Nav.astro`
- Modify after a failed verification check: `src/components/Hero.astro`
- Modify after a failed verification check: `src/components/Section.astro`
- Modify after a failed verification check: `src/components/About.astro`
- Modify after a failed verification check: `src/components/PubList.astro`
- Modify after a failed verification check: `src/components/Projects.astro`
- Modify after a failed verification check: `src/components/ProjectCard.astro`
- Modify after a failed verification check: `src/components/Vibe.astro`
- Modify after a failed verification check: `src/components/VibeCard.astro`
- Modify after a failed verification check: `src/components/CvTimeline.astro`
- Modify after a failed verification check: `src/components/Contact.astro`
- Modify after a failed verification check: `src/pages/prompts.astro`
- Modify after a failed verification check: `src/scripts/hero.ts`
- Test: `tests/lab-notebook-foundation.test.ts`

**Interfaces:**
- Consumes: completed build and all page routes.
- Produces: verified desktop/mobile/reduced-motion presentation with no horizontal overflow, blocked controls, console errors, or broken content paths.

- [ ] **Step 1: Start a production-like preview**

Run: `npm run build && npm run preview -- --host 127.0.0.1`

Expected: preview server reports a local URL and serves the built site.

- [ ] **Step 2: Verify desktop homepage at 1440 × 1000**

Check `/` for: two-label navigation, complete one-viewport hero, ZIBIN/ZHAO hierarchy, collaboration sticker, physical intro card, chapters 01–06 in semantic order, all publication/project/Vibe/CV/contact content, working language toggle, working links, no horizontal scrollbar, and no console errors.

- [ ] **Step 3: Compare desktop composition against the attachment**

Confirm the rendered page matches the reference in these explicit dimensions: warm 20px grid, condensed display hierarchy, forest-green 2px strokes, square cream cards, hard offset shadows, green/orange labels, controlled card offsets, restrained drifting annotations, and readable negative space. Correct CSS if any dimension is materially absent.

- [ ] **Step 4: Verify mobile homepage at 390 × 844 and tablet at 768 × 1024**

Check that every chapter becomes a readable single column; navigation opens, closes, and exposes all links; touch targets are at least 40px high where clustered; rotations do not clip text; images keep aspect ratio; contact/footer links do not overflow; no horizontal scrollbar appears.

- [ ] **Step 5: Verify Prompts route at desktop and mobile widths**

Check `/prompts/` for every stage, sticky horizontally scrollable stage navigation, active-stage state, copy buttons, fallback clipboard behavior, discipline panel, return links, readable code wrapping, and no fixed overlay over content.

- [ ] **Step 6: Verify accessibility and failure modes**

Using keyboard only, traverse skip link, nav, language switch, chapter links, publication/project/Vibe links, CV download, and social links. Emulate `prefers-reduced-motion: reduce` and confirm all content is immediately visible with no drift/reveal movement. Disable JavaScript and confirm default English content, anchors, email, downloads, and external links work. Inspect heading order and image alt text.

- [ ] **Step 7: Re-run final automated checks after corrections**

Run: `npm test && npm run build && git diff --check`

Expected: all Vitest tests PASS, Astro build exits 0, and `git diff --check` emits no whitespace errors.

- [ ] **Step 8: Commit verified polish**

```bash
git add src tests package.json package-lock.json
git commit -m "fix: polish responsive lab notebook experience"
```

---

### Task 8: Completion Audit, Merge, Push, and Production Verification

**Files:**
- Inspect: `docs/superpowers/specs/2026-07-12-stitch-lab-notebook-redesign.md`
- Inspect: all changed files and generated `dist/`
- No source changes unless the completion audit finds a contradiction.

**Interfaces:**
- Consumes: verified feature branch and production hosting connected to `origin/main`.
- Produces: merged/pushed `main` and verified live `https://zibinzhao.com`.

- [ ] **Step 1: Audit every design-spec section against authoritative evidence**

Create a checklist covering visual system; navigation/hero; chapters 01–06; Prompts; motion; component boundaries; accessibility/failures; tests/build. For each item, cite a source file plus browser/runtime evidence. Treat missing evidence as incomplete and correct it before proceeding.

- [ ] **Step 2: Inspect final branch state and history**

Run: `git status --short --branch && git log --oneline --decorate -10 && git diff main...HEAD --stat`

Expected: clean feature branch with only intentional redesign commits.

- [ ] **Step 3: Run release checks one final time**

Run: `npm test && npm run build`

Expected: all tests PASS and Astro production build exits 0 immediately before integration.

- [ ] **Step 4: Merge the feature branch into main**

```bash
git switch main
git merge --no-ff codex/stitch-lab-notebook -m "feat: redesign portfolio as lab notebook"
```

Expected: merge completes without conflicts and `main` contains the full redesign history.

- [ ] **Step 5: Push main to origin**

Run: `git push origin main`

Expected: remote reports `main` updated successfully.

- [ ] **Step 6: Wait for deployment propagation without blocking communication**

Poll the live site at reasonable intervals for the new hero markers and deployment response; do not use a single sleep longer than 60 seconds.

- [ ] **Step 7: Verify production**

Check `https://zibinzhao.com/` and `https://zibinzhao.com/prompts/` for HTTP success, the new `UNFINISHED INDEX`, the new chapter/hero classes in rendered output, core navigation, and visible responsive layout. Inspect the production browser console for errors.

- [ ] **Step 8: Confirm clean synchronized repository**

Run: `git status --short --branch && git rev-parse HEAD && git rev-parse origin/main`

Expected: `main...origin/main` with no ahead/behind count, clean status, and identical commit hashes.
