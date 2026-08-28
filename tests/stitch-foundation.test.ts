import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const root = new URL('..', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');
const compact = (value: string) => value.replace(/\s+/g, '');

describe('Stitch shell', () => {
  it('forwards the home route flag so only the homepage mounts path badges', () => {
    const shell = read('src/layouts/StitchShell.astro');
    const atmosphere = read('src/components/StitchAtmosphere.astro');

    expect(shell).toContain('<StitchAtmosphere home={home} />');
    expect(atmosphere).toContain("import PathBadges from './PathBadges.astro'");
    expect(atmosphere).toContain('home?: boolean');
    expect(atmosphere).toContain('const { home = false } = Astro.props');
    expect(atmosphere).toContain('{home && <PathBadges />}');
  });

  it('opens the homepage with the nacre gate as the authored hero', () => {
    expect(existsSync(new URL('src/components/StitchNacreGate.astro', root))).toBe(true);
    const gate = read('src/components/StitchNacreGate.astro');
    const page = read('src/pages/index.astro');

    for (const marker of ['id="night-gate"', 'gate-lamp', '螺钿夜航', '/night/']) {
      expect(gate).toContain(marker);
    }
    const deck = read('src/components/StitchNightDeck.astro');
    for (const marker of ['id="night-deck"', 'data-frame="4"', '螺钿夜航', 'deck-noscript']) {
      expect(deck).toContain(marker);
    }
    expect(page).toContain('<StitchNightDeck />');
    for (const legacy of ['<StitchNacreGate />', '<NightJourney />']) {
      expect(page).not.toContain(legacy);
    }
    for (const legacy of ['<About />', '<Projects />', '<CvTimeline />', '<Contact />', '<StitchHero />']) {
      expect(page).not.toContain(legacy);
    }
  });

  it('uses canonical records for the authored featured-research composition', () => {
    expect(existsSync(new URL('src/components/FeaturedResearch.astro', root))).toBe(true);
    expect(existsSync(new URL('src/pages/research.astro', root))).toBe(true);
    const deck = read('src/components/StitchNightDeck.astro');
    const home = read('src/pages/index.astro');
    const archive = read('src/pages/research.astro');

    expect(deck).toContain("getCollection('publications')");
    expect(deck).toContain('selectByTitles');
    expect(deck).toContain('HOME_RESEARCH_TITLES');
    expect(deck).toContain('data-frame="1"');
    expect(deck).toContain('pub-row');
    expect(home).toContain('<StitchNightDeck />');
    expect(archive).toContain('<StitchShell title="Research — Zibin Zhao" active="research">');
    expect(archive).toContain('<IndexSheet number="02" title="Research & Publications" titleZh="研究与论文">');
    expect(archive).toContain('<PubList />');
  });

  it('separates homepage research projects from exactly four authored Vibe roles', () => {
    expect(existsSync(new URL('src/components/StitchResearchProjects.astro', root))).toBe(true);
    expect(existsSync(new URL('src/components/StitchVibe.astro', root))).toBe(true);
    expect(existsSync(new URL('src/components/StitchVibeCard.astro', root))).toBe(true);
    const researchProjects = read('src/components/StitchResearchProjects.astro');
    const deck = read('src/components/StitchNightDeck.astro');
    const home = read('src/pages/index.astro');

    expect(researchProjects).toContain('id="research-projects"');
    expect(deck).toContain("getCollection('vibe')");
    expect(deck).toContain('selectByTitles');
    expect(deck).toContain('HOME_VIBE_TITLES');
    expect(deck).toContain("getGithubProjects");
    expect(deck).toContain('partitionGithubProjects');
    const researchFrame = deck.indexOf('data-frame="1"');
    const projectsFrame = deck.indexOf('data-frame="2"');
    const vibeFrame = deck.indexOf('data-frame="3"');
    expect(researchFrame).toBeGreaterThanOrEqual(0);
    expect(researchFrame).toBeLessThan(projectsFrame);
    expect(projectsFrame).toBeLessThan(vibeFrame);
    for (const title of ['Singularity', 'Medit', 'Yaos', 'Zen']) {
      expect(deck).not.toContain(`'${title}'`);
    }
    expect(home).toContain('<StitchNightDeck />');
  });

  it('owns rotation inside fade wrappers and preserves canonical Vibe geometry', () => {
    const vibe = read('src/components/StitchVibe.astro');
    const card = read('src/components/StitchVibeCard.astro');

    expect(vibe).toContain('class="fade-slot animate-fade-up-1"');
    expect(vibe).toContain('class="fade-slot animate-fade-up-2"');
    expect(vibe).toContain('class="vibe-lower animate-fade-up-3"');
    expect(vibe).toMatch(/\.vibe-card--singularity\s*\{[^}]*--resting-transform:\s*rotate\(-2deg\);/);
    expect(vibe).toMatch(/\.vibe-card--medit\s*\{[^}]*--resting-transform:\s*rotate\(3deg\);/);
    expect(vibe).toMatch(/\.vibe-card--yaos\s*\{[^}]*--resting-transform:\s*rotate\(-1deg\);/);
    expect(vibe).toMatch(/\.vibe-card--zen\s*\{[^}]*--resting-transform:\s*rotate\(2deg\);/);
    expect(vibe).toMatch(/\[data-vibe-slot='singularity'\]\s*\{[^}]*grid-column:\s*span 7;/);
    expect(vibe).toMatch(/\[data-vibe-slot='medit'\]\s*\{[^}]*grid-column:\s*span 5;[^}]*margin-top:\s*72px;[^}]*margin-left:\s*auto;/);
    expect(card).toContain("class:list={['vibe-card'");
  });

  it('uses local image-led Vibe assets with explicit intrinsic dimensions and fallbacks', () => {
    const vibe = read('src/components/StitchVibe.astro');
    const card = read('src/components/StitchVibeCard.astro');
    expect(existsSync(new URL('public/stitch/singularity-cartoon.png', root))).toBe(true);
    expect(vibe).toContain("const singularityImage = '/stitch/singularity-cartoon.png'");
    expect(card).toContain('width="512"');
    expect(card).toContain('height="384"');
    expect(card).toContain('onerror=');
    expect(card).toContain('vibe-image-fallback');
  });

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
    expect(footer).toContain("aria-current={active === 'prompts' ? 'page' : undefined}");
  });

  it('preserves Prompts hooks inside StitchShell', () => {
    const page = read('src/pages/prompts.astro');
    const block = read('src/components/PromptBlock.astro');

    for (const marker of [
      '<StitchShell',
      "document.querySelectorAll('.copy')",
      "document.querySelectorAll('.stage')",
      'navigator.clipboard.writeText',
      "document.execCommand('copy')",
      'new IntersectionObserver',
    ]) expect(page).toContain(marker);
    for (const hook of ['class="copy"', 'class="ptext"']) expect(block).toContain(hook);
    expect(page).toContain('typeof IntersectionObserver');
    expect(page).toContain("document.querySelectorAll('.stagenav a')");
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
