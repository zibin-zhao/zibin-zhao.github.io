import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const root = new URL('..', import.meta.url);
const read = (path: string) => {
  const url = new URL(path, root);
  return existsSync(url) ? readFileSync(url, 'utf8') : '';
};

describe('sticker constellation', () => {
  it('replaces the old Beyond panel after the GitHub project shelf', () => {
    const vibe = read('src/components/StitchVibe.astro');

    expect(vibe).not.toContain('beyond-lab');
    expect(vibe).not.toContain('Beyond the lab');
    expect(vibe).not.toContain('interest-groups');
    expect(vibe).toContain("import StickerConstellation from './StickerConstellation.astro'");
    expect(vibe).toContain('<StickerConstellation />');
    expect(vibe.indexOf('<StickerConstellation />'))
      .toBeGreaterThan(vibe.indexOf('<GithubProjectShelf projects={githubProjects} />'));
  });

  it('renders exactly seven useful, local sticker figures with bilingual physical captions', () => {
    const componentPath = 'src/components/StickerConstellation.astro';
    const component = read(componentPath);
    expect(existsSync(new URL(componentPath, root))).toBe(true);

    const figures = component.match(/<figure\b[\s\S]*?<\/figure>/g) ?? [];
    expect(figures).toHaveLength(7);

    const expectedFiles = [
      'dna-ai',
      'instruments',
      'calligraphy',
      'reading',
      'psychology',
      'meditation',
      'coding-lab',
    ];
    const sources = figures.flatMap((figure) => [...figure.matchAll(/src="(\/stickers\/[^"]+\.png)"/g)]
      .map((match) => match[1]));

    expect(sources).toEqual(expectedFiles.map((name) => `/stickers/${name}.png`));
    expect(figures[1]).toContain('alt="Violin, piano keys, guitar, and drums arranged as musical instruments"');
    expect(figures[1]).toContain('<T en="Violin · piano · guitar · drums" zh="小提琴 · 钢琴 · 吉他 · 架子鼓" />');
    for (const [index, figure] of figures.entries()) {
      expect(existsSync(new URL(`public${sources[index]}`, root))).toBe(true);
      expect(figure).toMatch(/<img\b[^>]*width="1254"[^>]*height="1254"/);
      expect(figure).toContain('loading="lazy"');
      expect(figure).toContain('decoding="async"');
      const alt = figure.match(/alt="([^"]+)"/)?.[1] ?? '';
      expect(alt.length).toBeGreaterThan(12);
      expect(alt).toMatch(/[A-Za-z]{4}/);
      expect(figure).toMatch(/<figcaption>[\s\S]*<T en="[^"]+" zh="[^"]+" \/>[\s\S]*<\/figcaption>/);
      for (const property of ['depth', 'angle', 'duration', 'delay']) {
        expect(figure).toContain(`--sticker-${property}:`);
      }
    }
  });

  it('isolates reveal, parallax, and idle drift in nested transform wrappers', () => {
    const component = read('src/components/StickerConstellation.astro');
    const figures = component.match(/<figure\b[\s\S]*?<\/figure>/g) ?? [];

    expect(component).toContain('data-sticker-constellation');
    expect(component).toMatch(/<section\b[^>]*aria-label="[^"]+"/);
    expect(component).not.toMatch(/<h[1-6]\b/);
    for (const figure of figures) {
      expect(figure).toMatch(/class="sticker-reveal"[\s\S]*class="sticker-parallax"[\s\S]*class="sticker-drift"/);
    }
  });

  it('keeps each semantic figcaption as the direct final child of its figure', () => {
    const component = read('src/components/StickerConstellation.astro');
    const figures = component.match(/<figure\b[\s\S]*?<\/figure>/g) ?? [];

    expect(figures).toHaveLength(7);
    for (const figure of figures) {
      const captionStart = figure.indexOf('<figcaption>');
      expect(captionStart).toBeGreaterThan(0);
      expect(figure.lastIndexOf('</div>')).toBeLessThan(captionStart);
      expect(figure).toMatch(/<figcaption>[\s\S]*<\/figcaption>\s*<\/figure>$/);
    }
  });

  it('queues a single transform-led parallax update and a one-time reveal', () => {
    const motion = read('src/scripts/sticker-motion.ts');
    expect(existsSync(new URL('src/scripts/sticker-motion.ts', root))).toBe(true);

    expect(motion.match(/requestAnimationFrame/g) ?? []).toHaveLength(1);
    expect(motion.match(/addEventListener\(['"]scroll['"]/g) ?? []).toHaveLength(1);
    expect(motion).toMatch(/addEventListener\(['"]scroll['"],\s*\w+,\s*\{\s*passive:\s*true\s*\}/);
    expect(motion.match(/new IntersectionObserver/g) ?? []).toHaveLength(1);
    expect(motion).toContain('.unobserve(');
    expect(motion).toMatch(/Math\.max\(-12,\s*Math\.min\(12,/);
    expect(motion).toContain("style.setProperty('--sticker-scroll'");
    expect(motion).not.toMatch(/style\.(?:top|right|bottom|left|width|height|margin|padding)/);
  });

  it('makes the constellation fully static when reduced motion is requested', () => {
    const css = read('src/styles/stitch-motion.css');
    const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));

    expect(reduced).toContain('.sticker-reveal');
    expect(reduced).toContain('.sticker-parallax');
    expect(reduced).toContain('.sticker-drift');
    expect(reduced).toContain('.sticker-figure:hover');
    expect(reduced).toContain('animation: none !important');
    expect(reduced).toContain('transition: none !important');
    expect(reduced).toContain('transform: none !important');
    expect(reduced).toContain('opacity: 1 !important');
  });
});
