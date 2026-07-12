import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const root = new URL('..', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');
const compact = (value: string) => value.replace(/\s+/g, '');

describe('Stitch shell', () => {
  it('defines exact motion timings', () => {
    const css = read('src/styles/stitch-motion.css');
    expect(css).toContain('parallax-slow 20s linear infinite alternate');
    expect(css).toContain('parallax-fast 15s linear infinite alternate');
    expect(css).toContain('float 6s ease-in-out infinite');
    expect(css).toContain('morph 8s ease-in-out infinite both alternate');
    expect(css).toContain('marquee 20s linear infinite');
    expect(css).toContain('glitch-skew .3s cubic-bezier(.25, .46, .45, .94) both infinite');
    for (const delay of ['.1s', '.2s', '.3s', '.4s', '.5s']) {
      expect(css).toContain(`fade-up .6s ease-out ${delay} both`);
    }
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
  });

  it('preserves the exact authored keyframe bodies', () => {
    const css = compact(read('src/styles/stitch-motion.css'));
    for (const keyframes of [
      '@keyframesparallax-slow{from{transform:translateY(0)rotate(1deg);}to{transform:translateY(-50px)rotate(1deg);}}',
      '@keyframesparallax-fast{from{transform:translateY(0)rotate(-2deg);}to{transform:translateY(-80px)rotate(-2deg);}}',
      '@keyframesfloat{0%,100%{transform:translateY(0)rotate(3deg);}50%{transform:translateY(-15px)rotate(1deg);}}',
      '@keyframesmorph{from{border-radius:40%60%70%30%/40%50%60%50%;}to{border-radius:60%40%30%70%/60%30%70%40%;}}',
      '@keyframesfade-up{from{opacity:0;transform:translateY(20px)scale(.95);}to{opacity:1;transform:translateY(0)scale(1);}}',
      '@keyframesmarquee{from{transform:translateX(0);}to{transform:translateX(-100%);}}',
      '@keyframesglitch-skew{0%,100%{transform:skew(0);}20%{transform:skew(-5deg);}40%{transform:skew(5deg);}60%{transform:skew(-2deg);}80%{transform:skew(2deg);}}',
    ]) {
      expect(css).toContain(keyframes);
    }
  });

  it('neutralizes every Stitch interaction state under reduced motion', () => {
    const css = read('src/styles/stitch-motion.css');
    const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(reduced).toContain('.glitch-hover:hover');
    expect(reduced).toContain('background-color: var(--resting-background, inherit)');
    expect(reduced).toContain('.btn-primary:active');
    expect(reduced).toContain('box-shadow: var(--resting-shadow, none)');
    expect(reduced).toContain('transform: var(--resting-transform, none)');
    expect(reduced).toContain('.pub-card:hover');
    expect(reduced).toContain('.pub-card:hover .magnify-icon');
    expect(reduced).toContain('color: inherit');
    expect(reduced).toContain('transform: none');
    expect(reduced).toContain('.draw-control:hover');
    expect(reduced).toContain('.footer-pill:hover');
  });

  it('retains the authored atmosphere geometry when animation is disabled', () => {
    const css = read('src/styles/stitch-motion.css');
    const atmosphere = read('src/components/StitchAtmosphere.astro');
    expect(css).toMatch(/\.blob\s*\{[^}]*border-radius:\s*40% 60% 70% 30% \/ 40% 50% 60% 50%;[^}]*animation:\s*morph 8s ease-in-out infinite both alternate;/);
    expect(atmosphere).toMatch(/\.guide-left\s*\{[^}]*left:\s*15%;[^}]*transform:\s*rotate\(1deg\);/);
    expect(atmosphere).toMatch(/\.guide-right\s*\{[^}]*right:\s*24%;[^}]*transform:\s*rotate\(-2deg\);/);
    expect(atmosphere).toMatch(/\.note-formula\s*\{[^}]*transform:\s*rotate\(12deg\);/);
    expect(atmosphere).toMatch(/\.note-pathway\s*\{[^}]*transform:\s*rotate\(-6deg\);/);
    expect(atmosphere).toMatch(/\.note-question\s*\{[^}]*transform:\s*rotate\(3deg\);/);
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

  it('keeps required anchors visible and above pointer-inert decoration at every width', () => {
    const header = read('src/components/StitchHeader.astro');
    const footer = read('src/components/StitchFooterDock.astro');
    expect(header.slice(header.indexOf('@media'))).not.toMatch(/\.talk\s*\{[^}]*display:\s*none/);
    expect(footer.slice(footer.indexOf('@media'))).not.toMatch(/\.footer-socials\s*\{[^}]*display:\s*none/);
    expect(header).toMatch(/\.stitch-header\s*\{[^}]*z-index:\s*50;[^}]*pointer-events:\s*none;/);
    expect(header).toMatch(/\.site-stamp,\s*\.header-actions\s*\{[^}]*pointer-events:\s*auto;/);
    expect(footer).toMatch(/\.stitch-footer\s*\{[^}]*position:\s*fixed;[^}]*z-index:\s*40;[^}]*pointer-events:\s*none;/);
    expect(footer).toMatch(/\.footer-socials,\s*\.footer-routes,\s*\.draw-control\s*\{[^}]*pointer-events:\s*auto;/);
    expect(footer).toMatch(/\.footer-decoration\s*\{[^}]*pointer-events:\s*none;/);
  });
});
