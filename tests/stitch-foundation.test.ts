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
    for (const href of ['/about/', '/research/', '/projects/', '/#vibe', '/cv/', '/contact/', '/prompts/']) {
      expect(footer).toContain(href);
    }
  });
});
