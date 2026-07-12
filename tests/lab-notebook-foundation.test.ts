import { existsSync, readFileSync } from 'node:fs';
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
    expect(global).toMatch(/\.skip-link\s*\{[^}]*position:\s*fixed;[^}]*transform:\s*translateY\(calc\(-100% - 24px\)\);/);
    expect(global).toMatch(/\.skip-link:focus-visible\s*\{[^}]*transform:\s*none;/);
  });

  it('uses a two-color focus indicator and high-contrast Prompts stage numbers', () => {
    const global = read('src/styles/global.css');
    const prompts = read('src/pages/prompts.astro');
    expect(global).toMatch(/:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--ink\);[^}]*outline-offset:\s*2px;[^}]*box-shadow:\s*0 0 0 5px var\(--paper\);/);
    expect(prompts).toMatch(/\.stage-number\s*\{[^}]*color:\s*var\(--ink\);[^}]*background:\s*var\(--orange\);/);
  });

  it('enhances visible-by-default chapters only after motion setup succeeds', () => {
    const global = read('src/styles/global.css');
    const script = read('src/scripts/hero.ts');
    expect(global).toMatch(/\.reveal\s*\{[^}]*opacity:\s*1;[^}]*transform:\s*none;/);
    expect(global).not.toMatch(/\.reveal\s*\{[^}]*opacity:\s*0;/);
    expect(global).toMatch(/\.motion-ready \.reveal\s*\{[^}]*opacity:\s*\.01;[^}]*transform:\s*translateY\(18px\);/);
    expect(global).toMatch(/\.motion-ready \.reveal\.in\s*\{[^}]*opacity:\s*1;[^}]*transform:\s*none;/);
    expect(global).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.motion-ready \.reveal\s*\{[^}]*opacity:\s*1;[^}]*transform:\s*none;/);
    expect(script).toContain("document.documentElement.classList.add('motion-ready')");
    expect(script).toContain("if (!reduce && 'IntersectionObserver' in window)");
    expect(script).toContain('try {');
    expect(script).toContain('catch');
  });

  it('styles exactly three restrained atmospheric decorations with reduced-motion fallbacks', () => {
    const layout = read('src/layouts/Base.astro');
    const global = read('src/styles/global.css');
    expect(layout).toContain('<div class="paper-atmosphere" aria-hidden="true"><i></i><i></i><i></i></div>');
    expect(global).toMatch(/\.paper-atmosphere\s*\{[^}]*position:\s*fixed;[^}]*pointer-events:\s*none;/);
    expect(global).toContain('.paper-atmosphere i:nth-child(1)');
    expect(global).toContain('.paper-atmosphere i:nth-child(2)');
    expect(global).toContain('.paper-atmosphere i:nth-child(3)');
    expect(global).toContain('@keyframes atmosphere-guide');
    expect(global).toContain('@keyframes atmosphere-blob');
    expect(global).toContain('@keyframes atmosphere-note');
    expect(global).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.paper-atmosphere i\s*\{[^}]*animation:\s*none !important;/);
  });

  it('uses the Stitch index navigation and physical hero card', () => {
    const nav = read('src/components/Nav.astro');
    const layout = read('src/layouts/Base.astro');
    const hero = read('src/components/Hero.astro');
    const script = read('src/scripts/hero.ts');
    expect(nav).toContain('UNFINISHED INDEX');
    expect(nav).toContain('id="navlinks"');
    expect(hero).toContain('id="hero-name"');
    expect(hero).toContain('class="hero-specimen"');
    expect(hero).toContain('class="scroll-cue"');
    expect(hero).toContain('src="/hero-portrait.jpg"');
    expect(hero).not.toContain('lh3.googleusercontent.com');
    expect(hero).not.toContain('experiment-holder');
    expect(script).not.toContain('field-motion');
    expect(layout).toContain("document.documentElement.classList.add('js')");
    expect(nav).not.toContain('.nav-actions:focus-within #navlinks');
    expect(nav).toMatch(/\.topnav\s*\{[^}]*position:\s*static;[^}]*flex-wrap:\s*wrap;/);
    expect(nav).toMatch(/:global\(\.js\) \.topnav\s*\{[^}]*position:\s*fixed;/);
    expect(nav).toMatch(/\.menubtn\s*\{[^}]*display:\s*none;/);
    expect(nav).toMatch(/:global\(\.js\) \.menubtn\s*\{[^}]*display:\s*block;/);
    expect(nav).toMatch(/#navlinks\s*\{[^}]*position:\s*static;[^}]*display:\s*flex;[^}]*flex-wrap:\s*wrap;[^}]*visibility:\s*visible;[^}]*pointer-events:\s*auto;/);
    expect(nav).toMatch(/:global\(\.js\) #navlinks\s*\{[^}]*position:\s*absolute;[^}]*display:\s*grid;[^}]*visibility:\s*hidden;[^}]*pointer-events:\s*none;/);
    expect(nav).toMatch(/:global\(\.js\) #navlinks\.open\s*\{[\s\S]*?visibility:\s*visible;/);
    expect(script).toContain("import { isMenuOpen, setMenuOpen, shouldDismissMenu } from './menu';");
    expect(script).toContain("links?.querySelectorAll('a').forEach");
    expect(script).toContain("document.addEventListener('click'");
    expect(script).toContain("document.addEventListener('keydown'");
    expect(script).toContain("event.key === 'Escape'");
    expect(script).toContain('returnFocus: true');
  });

  it('renders dossier and evidence-card chapter variants', () => {
    const section = read('src/components/Section.astro');
    const about = read('src/components/About.astro');
    const pubs = read('src/components/PubList.astro');
    expect(section).toContain('chapter-banner');
    expect(about).toContain('class="dossier"');
    expect(pubs).toContain("p.featured ? 'pub--featured' : 'pub--archive'");
    expect(pubs).toContain('Object.entries(p.links)');
  });

  it('styles featured publication indices as clear bordered circles', () => {
    const pubs = read('src/components/PubList.astro');
    expect(pubs).toMatch(/\.pub-index\s*\{[^}]*width:\s*46px;[^}]*height:\s*46px;[^}]*border:\s*2px solid var\(--ink\);[^}]*border-radius:\s*50%;/);
    expect(pubs).toMatch(/\.pub-index\s*\{[^}]*opacity:\s*1;/);
  });

  it('presents publication years and venues as a shared metadata strip', () => {
    const pubs = read('src/components/PubList.astro');
    expect(pubs).toContain('<div class="pub-meta"><span>{p.year}</span>{p.venue && <span>{p.venue}</span>}</div>');
    expect(pubs).toMatch(/\.pub-meta\s*\{[^}]*border:\s*1px solid var\(--ink\);[^}]*background:\s*var\(--paper\);/);
    expect(pubs).toMatch(/\.pub-meta span \+ span\s*\{[^}]*border-left:\s*1px solid var\(--ink\);/);
  });

  it('uses a restrained dossier rotation that is neutralized on narrow screens', () => {
    const about = read('src/components/About.astro');
    expect(about).toMatch(/\.dossier\s*\{[^}]*transform:\s*rotate\(-\.35deg\);/);
    expect(about).toMatch(/@media \(max-width: 640px\)[\s\S]*?\.dossier\s*\{[\s\S]*?transform:\s*none;/);
  });

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

  it('cross-lists authoritative CasMD data in deterministic Vibe order', () => {
    const casmdPath = new URL('src/content/vibe/casmd.md', root);
    const casmdExists = existsSync(casmdPath);
    const casmd = casmdExists ? readFileSync(casmdPath, 'utf8') : '';
    const project = read('src/content/projects/hsingmd.md');
    const vibe = read('src/components/Vibe.astro');
    expect(casmdExists).toBe(true);
    for (const fact of [
      'title: "CasMD"',
      'blurb: "Protein–nucleic acid molecular dynamics, made simple. Interactive demo."',
      'blurbZh: "蛋白质–核酸分子动力学，化繁为简。交互式演示。"',
      'tags: ["Spaces", "MD"]',
      'href: "https://huggingface.co/spaces/zzhaobz/HsingMD"',
    ]) {
      expect(project).toContain(fact);
      expect(casmd).toContain(fact);
    }
    expect(casmd).not.toContain('screenshot:');
    expect(vibe).toContain("a.data.order-b.data.order || a.id.localeCompare(b.id)");
  });

  it('keeps chapter headings semantic and subordinate content at h3', () => {
    const section = read('src/components/Section.astro');
    const projects = read('src/components/Projects.astro');
    const vibe = read('src/components/Vibe.astro');
    const vibeCard = read('src/components/VibeCard.astro');
    const prompts = read('src/pages/prompts.astro');
    expect(section).toContain('<h2 class="chapter-banner">');
    expect(projects).toContain('<h3 class="big">');
    expect(projects).not.toContain('<h2 class="big">');
    expect(vibe).toContain('<h3 class="big">');
    expect(vibeCard).toContain('<h3 class="ttl">');
    expect(prompts).toContain('<h2 class="dlabel">{P.disciplineTitle}</h2>');
  });

  it('collapses every chapter evidence layout to one column at the 768px tablet width', () => {
    const pubs = read('src/components/PubList.astro');
    const projects = read('src/components/Projects.astro');
    const vibe = read('src/components/Vibe.astro');
    const cv = read('src/components/CvTimeline.astro');
    expect(pubs).toMatch(/@media \(max-width: 780px\)[\s\S]*?\.pubs\s*\{\s*display:\s*block;/);
    expect(projects).toMatch(/@media \(max-width: 780px\)[\s\S]*?\.project-board\s*\{\s*grid-template-columns:\s*minmax\(0, 1fr\);/);
    expect(vibe).toMatch(/@media \(max-width: 780px\)[\s\S]*?\.vibe-board\s*\{\s*grid-template-columns:\s*minmax\(0, 1fr\);/);
    expect(cv).toMatch(/@media \(max-width: 780px\)[\s\S]*?\.cv-layout\s*\{\s*grid-template-columns:\s*1fr;/);
  });

  it('keeps clustered navigation and copy controls at least 40px tall', () => {
    const nav = read('src/components/Nav.astro');
    const prompts = read('src/pages/prompts.astro');
    const promptBlock = read('src/components/PromptBlock.astro');
    expect(nav).toMatch(/\.index-label\s*\{[^}]*min-height:\s*40px;/);
    expect(nav).toMatch(/\.menubtn,\s*\.talk\s*\{[^}]*min-height:\s*40px;/);
    expect(nav).toMatch(/\.nav-actions :global\(\.langtoggle\)\s*\{[^}]*min-height:\s*40px;/);
    expect(nav).not.toContain('min-height: 34px');
    expect(nav).not.toContain('min-height: 30px');
    expect(prompts).toMatch(/\.prompt-index-label,\s*\.back\s*\{[^}]*min-height:\s*40px;/);
    expect(prompts).toMatch(/\.stagenav a\s*\{[^}]*min-height:\s*40px;/);
    expect(promptBlock).toMatch(/\.copy\s*\{[^}]*min-height:\s*40px;/);
  });

  it('keeps the condensed hero display spacing within the legibility floor', () => {
    const hero = read('src/components/Hero.astro');
    expect(hero).toMatch(/\.hero-name\s*\{[^}]*letter-spacing:\s*-.04em;/);
    expect(hero).not.toContain('letter-spacing: -.055em');
  });

  it('keeps CV download and in-flow closing index', () => {
    const cv = read('src/components/CvTimeline.astro');
    const contact = read('src/components/Contact.astro');
    expect(cv).toContain('class="cv-index"');
    expect(cv).toContain('const items = [...cv.education, ...cv.experience, ...cv.leadership]');
    expect(cv).toContain('items.map((item, index)');
    expect(cv).toContain('href={cv.pdf} download');
    expect(cv).not.toContain('Working tools');
    expect(cv).not.toContain('常用工具');
    expect(contact).toContain('class="reveal closing-poster"');
    expect(contact).toContain('class="footer-index"');
    expect(contact).toContain('profile.email');
    expect(contact).toContain('profile.socials');
    expect(contact).toContain('profile.navLinks');
    expect(contact).toContain('target="_blank" rel="noopener"');
    expect(contact).not.toContain('position:fixed');
  });

  it('adopts the lab archive language on the Prompts route', () => {
    const prompts = read('src/pages/prompts.astro');
    expect(prompts).toContain('class="prompt-index-label"');
    expect(prompts).toContain('class="prompt-hero"');
    expect(prompts).toContain("['stage-card', 'stage']");
    expect(prompts).not.toContain('border-radius:22px');
    expect(prompts).not.toContain('backdrop-filter:blur');
  });

  it('keeps the Prompts skip link off-canvas until keyboard focus', () => {
    const prompts = read('src/pages/prompts.astro');
    expect(prompts).toContain(':global(.skip-link)');
    expect(prompts).toContain(':global(.skip-link:focus-visible)');
  });
});
