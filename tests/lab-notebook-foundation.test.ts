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
  });
});
