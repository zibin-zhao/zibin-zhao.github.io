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
  it('adds the bilingual personal close without unexplained homepage numbering', () => {
    const research = read('src/components/FeaturedResearch.astro');
    const vibe = read('src/components/StitchVibe.astro');

    expect(research).not.toContain('02 —');
    expect(vibe).not.toContain('04 —');
    expect(vibe).not.toContain('<strong>LOL</strong>');
    expect(vibe).toContain('Side Quests');

    for (const marker of [
      'Beyond the lab',
      '实验室之外',
      'Violin',
      '小提琴',
      'Chinese calligraphy',
      '书法',
      'Psychology',
      '心理学',
      'Buddhism',
      '佛学',
      'Start a conversation',
    ]) expect(vibe).toContain(marker);
  });

  it('uses semantic primary card links and a flow footer at mobile widths', () => {
    const research = read('src/components/FeaturedResearch.astro');
    const vibeCard = read('src/components/StitchVibeCard.astro');
    const footer = read('src/components/StitchFooterDock.astro');

    expect(research).toContain('paper-primary-link');
    expect(vibeCard).toContain('vibe-primary-link');
    expect(research).toMatch(/\.paper-primary-link::after\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0;/);
    expect(vibeCard).toMatch(/\.vibe-primary-link::after\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0;/);
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
