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
    expect(nav).not.toContain('.nav-actions:focus-within #navlinks');
    expect(nav).toMatch(/#navlinks\s*\{[\s\S]*?visibility: hidden;/);
    expect(nav).toMatch(/#navlinks\.open\s*\{[\s\S]*?visibility: visible;/);
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
});
