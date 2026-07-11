import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const root = new URL('..', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');

describe('collage design foundation', () => {
  it('defines the approved palette tokens', () => {
    const tokens = read('src/styles/tokens.css');

    expect(tokens).toContain('--paper-warm: #fff0c7');
    expect(tokens).toContain('--green: #2f9264');
    expect(tokens).toContain('--blue: #8dd3f1');
    expect(tokens).toContain('--orange: #f49753');
    expect(tokens).toContain('--ink: #123d34');
  });

  it('provides a skip link to the homepage main landmark', () => {
    const layout = read('src/layouts/Base.astro');
    const homepage = read('src/pages/index.astro');

    expect(layout).toContain('class="skip-link" href="#main-content"');
    expect(homepage).toContain('<main id="main-content"');
  });

  it('defines the approved semantic collage hero and motion mount point', () => {
    const hero = read('src/components/Hero.astro');
    const heroScript = read('src/scripts/hero.ts');

    expect(hero).toContain('data-field-motion');
    expect(hero).toContain('id="hero-name"');
    expect(hero).toContain('class="experiment-holder"');
    expect(hero).toContain('class="field-routes"');
    expect(heroScript).toContain("import { mountFieldMotion } from './field-motion'");
  });
});
