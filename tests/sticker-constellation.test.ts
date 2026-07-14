import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const root = new URL('..', import.meta.url);
const read = (path: string) => {
  const url = new URL(path, root);
  return existsSync(url) ? readFileSync(url, 'utf8') : '';
};

describe('homepage path badges', () => {
  it('replaces the standalone constellation with seven decorative guide badges', () => {
    const componentPath = 'src/components/PathBadges.astro';
    const component = read(componentPath);

    expect(existsSync(new URL(componentPath, root))).toBe(true);
    expect(existsSync(new URL('src/components/StickerConstellation.astro', root))).toBe(false);
    expect(existsSync(new URL('src/scripts/sticker-motion.ts', root))).toBe(false);

    const expectedFiles = [
      'dna-ai',
      'instruments',
      'calligraphy',
      'reading',
      'psychology',
      'meditation',
      'coding-lab',
    ];
    const sources = [...component.matchAll(/src:\s*'((?:\/stickers\/)[^']+\.png)'/g)]
      .map((match) => match[1]);

    expect(sources).toEqual(expectedFiles.map((name) => `/stickers/${name}.png`));
    for (const source of sources) expect(existsSync(new URL(`public${source}`, root))).toBe(true);

    const visualLayer = component.match(/<div\b[^>]*data-path-badges[^>]*>[\s\S]*?<\/div>/)?.[0] ?? '';
    expect(visualLayer).toContain('aria-hidden="true"');
    expect(visualLayer).toMatch(/<img\b[^>]*data-path-badge/);
    expect(visualLayer).toContain('alt=""');
    expect(visualLayer).toContain('width="768"');
    expect(visualLayer).toContain('height="768"');
    expect(component).not.toMatch(/<figcaption\b|<section\b|<h[1-6]\b/);
  });

  it('authors scroll centers and alternates the badges between the two dashed guides', () => {
    const component = read('src/components/PathBadges.astro');
    const centers = [...component.matchAll(/center:\s*(0?\.\d+)/g)]
      .map((match) => Number(match[1]));
    const guides = [...component.matchAll(/guide:\s*'(left|right)'/g)]
      .map((match) => match[1]);

    expect(centers).toEqual([0.06, 0.20, 0.35, 0.50, 0.65, 0.80, 0.94]);
    expect(guides).toEqual(['left', 'right', 'left', 'right', 'left', 'right', 'left']);
    expect(component).toContain('data-center={badge.center}');
    expect(component).toContain('data-guide={badge.guide}');
    for (const property of ['size', 'top', 'tilt']) {
      expect(component).toContain(`--badge-${property}`);
    }
    expect(component).toMatch(/\[data-guide='left'\]\s*\{[^}]*left:\s*15%;/);
    expect(component).toMatch(/\[data-guide='right'\]\s*\{[^}]*right:\s*24%;/);
    expect(component).toMatch(/\.path-badges\s*\{[^}]*position:\s*fixed;[^}]*z-index:\s*[1-9];[^}]*pointer-events:\s*none;/);
    const responsiveRules = component.slice(component.indexOf('@media (max-width: 700px)'));
    expect(responsiveRules).not.toMatch(/\[data-guide='(?:left|right)'\]/);
  });

  it('keeps one bilingual interest list available without visible badge copy', () => {
    const component = read('src/components/PathBadges.astro');
    const hiddenLists = component.match(/<ul\b[^>]*class="sr-only"[^>]*>[\s\S]*?<\/ul>/g) ?? [];

    expect(hiddenLists).toHaveLength(1);
    for (const interest of [
      'DNA and AI / DNA 与 AI',
      'Music / 音乐',
      'Chinese calligraphy / 中国书法',
      'Reading / 阅读',
      'Psychology / 心理学',
      'Meditation and Buddhism / 冥想与佛学',
      'Coding experiments / 编程实验',
    ]) {
      expect(hiddenLists[0]).toContain(`<li>${interest}</li>`);
    }
    expect(component).not.toMatch(/<figcaption\b|class="[^"\n]*(?:caption|label)[^"\n]*"/);
  });

  it('uses one scheduled frame to select at most two desktop or one mobile badge', () => {
    const scriptPath = 'src/scripts/path-badges.ts';
    const script = read(scriptPath);
    const component = read('src/components/PathBadges.astro');

    expect(existsSync(new URL(scriptPath, root))).toBe(true);
    expect(script.match(/requestAnimationFrame/g) ?? []).toHaveLength(1);
    expect(script.match(/addEventListener\(['"]scroll['"]/g) ?? []).toHaveLength(1);
    expect(script).toMatch(/addEventListener\(['"]scroll['"],\s*\w+,\s*\{\s*passive:\s*true\s*\}/);
    expect(script.match(/addEventListener\(['"]resize['"]/g) ?? []).toHaveLength(1);
    expect(script).toContain("addEventListener('astro:before-swap'");
    expect(script).toContain("addEventListener('astro:page-load'");
    expect(script).toContain("addEventListener('pagehide'");
    expect(script).toContain("matchMedia('(prefers-reduced-motion: reduce)')");
    expect(script).toContain("layer.dataset.motionState = reducedMotion.matches ? 'reduced' : 'running'");
    expect(script).toContain("removeEventListener('change'");
    expect(script).toContain('cancelAnimationFrame');

    expect(script).toMatch(/document\.documentElement\.scrollHeight\s*-\s*window\.innerHeight/);
    expect(script).toMatch(/window\.innerWidth\s*<=\s*700\s*\?\s*1\s*:\s*2/);
    expect(script).toContain("badge.dataset.visible = visible.has(badge) ? 'true' : 'false'");
    expect(script).toMatch(/Math\.abs\(\w+\.center\s*-\s*progress\)/);

    const reducedRules = component.slice(component.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(reducedRules).toMatch(/\.path-badge\s*\{[^}]*transition:\s*none\s*!important;/);
  });

  it('removes every dead legacy constellation motion selector', () => {
    const motionCss = read('src/styles/stitch-motion.css');

    for (const selector of [
      'sticker-idle-drift',
      'sticker-reveal',
      'sticker-constellation',
      'sticker-parallax',
      'sticker-drift',
      'sticker-figure',
      'sticker-image',
    ]) {
      expect(motionCss).not.toContain(selector);
    }
  });
});
