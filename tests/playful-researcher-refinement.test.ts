import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const root = new URL('..', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');

const hexToRgb = (hex: string) => {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const luminance = (hex: string) => {
  const channels = hexToRgb(hex).map((channel) => {
    const normalized = channel / 255;
    return normalized <= .04045 ? normalized / 12.92 : ((normalized + .055) / 1.055) ** 2.4;
  });
  return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
};

const contrast = (foreground: string, background: string) => {
  const light = Math.max(luminance(foreground), luminance(background));
  const dark = Math.min(luminance(foreground), luminance(background));
  return (light + .05) / (dark + .05);
};

describe('playful researcher refinement', () => {
  it('uses the approved curious-builder story without candidate language', () => {
    const about = read('src/components/About.astro');
    const profile = read('src/data/profile.ts');
    const base = read('src/layouts/Base.astro');
    const approvedEnglishStory = 'I keep making things because apparently leaving an idea alone is not one of my skills. Some are useful, some are gloriously unnecessary, and most begin with “what if?” I like trains, games, design, AI, biology, and the strange places where they crash into each other. Somewhere along the way, curiosity accidentally turned into doing a PhD at HKUST. I still learn the same way: build it, break it, make notes, try again.';

    expect(about).toContain('CURIOSITY FILE / ACTIVE');
    expect(about).toContain(approvedEnglishStory);
    for (const marker of ['火车', '游戏', '设计', 'AI', '生物', '香港科技大学读博']) {
      expect(about).toContain(marker);
    }

    expect(profile).toContain('doing a PhD at HKUST');
    expect(profile).toMatch(/curious|curiosity/i);
    expect(profile).toMatch(/AI[\s\S]*biology|biology[\s\S]*AI/i);
    expect(profile).toMatch(/molecular diagnostics/i);
    expect(base).toContain("jobTitle: 'PhD Researcher in Bioengineering'");
    expect(base).toMatch(/AI[\s\S]*biology|biology[\s\S]*AI/i);
    expect(base).toMatch(/molecular diagnostics/i);

    for (const source of [about, profile, base]) {
      expect(source).not.toMatch(/PhD candidate/i);
    }
  });

  it('adds the bilingual personal close without unexplained homepage numbering', () => {
    const research = read('src/components/FeaturedResearch.astro');
    const vibe = read('src/components/StitchVibe.astro');
    const pathBadges = read('src/components/PathBadges.astro');

    expect(research).not.toContain('02 —');
    expect(vibe).not.toContain('04 —');
    expect(vibe).not.toContain('<strong>LOL</strong>');
    expect(vibe).toContain('<T en="Vibe" zh="随性实验" />');

    for (const marker of ['DNA and AI', 'Music', 'Chinese calligraphy', 'Reading', 'Psychology', 'Meditation and Buddhism', 'Coding experiments']) {
      expect(pathBadges).toContain(marker);
    }
    expect(vibe).toContain('Start a conversation');
  });

  it('uses semantic primary card links and a flow footer at mobile widths', () => {
    const research = read('src/components/FeaturedResearch.astro');
    const vibeCard = read('src/components/StitchVibeCard.astro');
    const footer = read('src/components/StitchFooterDock.astro');

    expect(research).toContain('paper-primary-link');
    expect(vibeCard).toContain('vibe-primary-link');
    expect(vibeCard).toContain('vibe-secondary-actions');
    expect(research).toMatch(/\.paper-primary-link::after\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0;/);
    expect(vibeCard).toMatch(/\.vibe-primary-link::after\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0;/);
    expect(vibeCard).toMatch(/\.vibe-secondary-actions\s*\{[^}]*position:\s*relative;[^}]*z-index:\s*2;/);
    expect(vibeCard).toMatch(/\.vibe-action\s*\{[^}]*min-width:\s*44px;[^}]*min-height:\s*44px;/);
    expect(footer).toContain('draw-label');
    expect(footer).toMatch(/@media \(max-width: 700px\)[\s\S]*?\.stitch-footer\s*\{[^}]*position:\s*relative;/);
  });

  it('defines readable type roles and an AA outline ramp', () => {
    const tokens = read('src/styles/tokens.css');
    const token = (name: string) => tokens.match(new RegExp('--' + name + ':\\s*(#[0-9a-f]{6})', 'i'))?.[1] ?? '';

    expect(tokens).toContain('--text-body: 1rem;');
    expect(tokens).toContain('--text-supporting: .875rem;');
    expect(tokens).toContain('--text-meta: .75rem;');
    expect(tokens).toContain('--text-action: .75rem;');

    for (const surface of ['surface', 'surface-low', 'surface-container']) {
      expect(contrast(token('outline'), token(surface)), surface).toBeGreaterThanOrEqual(4.5);
    }
  });
});
