import { existsSync, readFileSync } from 'node:fs';
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

describe('reviewer fidelity and accessibility contracts', () => {
  it('uses the Stitch research banner palette with AA contrast', () => {
    const component = read('src/components/FeaturedResearch.astro');
    const tokens = read('src/styles/tokens.css');
    const headingRule = component.match(/\.research-heading h2\s*\{(?<body>[\s\S]*?)\n\s*\}/)?.groups?.body ?? '';
    const token = (name: string) => tokens.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'i'))?.[1] ?? '';

    expect(headingRule).toMatch(/background:\s*var\(--ink\);/);
    expect(headingRule).toMatch(/color:\s*var\(--surface\);/);
    expect(headingRule).toMatch(/box-shadow:\s*6px 6px 0 var\(--green-bright\);/);
    expect(contrast(token('surface'), token('ink'))).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the language control semantic while exposing the Stitch switch anatomy', () => {
    const toggle = read('src/components/LangToggle.astro');
    const lang = read('src/scripts/lang.ts');

    expect(toggle).toMatch(/<button\s+type="button"\s+class="langtoggle"/);
    expect(toggle).toContain('aria-pressed="false"');
    expect(toggle).toContain('class="toggle-track"');
    expect(toggle).toContain('class="toggle-knob"');
    expect(toggle).toContain('class="target target-zh"');
    expect(toggle).toContain('class="target target-en"');
    expect(toggle).toMatch(/\.toggle-track\s*\{[^}]*background:\s*var\(--ink\);/);
    expect(toggle).toMatch(/\.toggle-knob\s*\{[^}]*background:\s*var\(--surface\);/);
    expect(lang).toContain("button.setAttribute('aria-pressed', String(zhActive))");
    expect(lang).toContain("button.setAttribute('aria-label', labels[lang])");
    expect(lang).toContain('syncToggle(button, currentLang())');
  });

  it('does not ship the superseded pre-Stitch hero and Vibe implementation', () => {
    for (const path of [
      'src/components/Hero.astro',
      'src/components/Vibe.astro',
      'src/components/VibeCard.astro',
      'public/hero-portrait.jpg',
    ]) expect(existsSync(new URL(path, root)), path).toBe(false);
  });
});
