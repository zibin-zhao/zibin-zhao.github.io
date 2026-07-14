import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { cv } from '../src/data/cv';
import { promptPack } from '../src/data/prompts';

const root = new URL('..', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');

describe('preserved portfolio behavior', () => {
  it('keeps keyboard skip and two-color focus treatment', () => {
    const base = read('src/layouts/Base.astro');
    const global = read('src/styles/global.css');
    expect(base).toContain('class="skip-link" href="#main-content"');
    expect(base).toContain("document.documentElement.classList.add('js')");
    expect(global).toMatch(/\.skip-link\s*\{[^}]*position:\s*fixed;[^}]*transform:\s*translateY\(calc\(-100% - 24px\)\);/);
    expect(global).toMatch(/\.skip-link:focus-visible\s*\{[^}]*transform:\s*none;/);
    expect(global).toMatch(/:focus-visible\s*\{[^}]*outline:\s*3px solid var\(--ink\);[^}]*box-shadow:\s*0 0 0 5px var\(--paper\);/);
  });

  it('renders both languages and progressively enhances only the toggle', () => {
    const text = read('src/components/T.astro');
    const toggle = read('src/components/LangToggle.astro');
    const lang = read('src/scripts/lang.ts');
    expect(text).toContain('<span class="t-en">{en}</span><span class="t-zh">{zh}</span>');
    expect(toggle).toMatch(/\.langtoggle\s*\{[^}]*display:\s*none;/);
    expect(toggle).toMatch(/:global\(\.js\) \.langtoggle\s*\{[^}]*display:\s*inline-flex/);
    expect(lang).toContain("root.setAttribute('lang', lang)");
    expect(lang).toContain("localStorage.setItem('lang', lang)");
  });

  it('keeps responsive evidence layouts single-column at tablet width', () => {
    const contracts: Array<[string, RegExp]> = [
      ['src/components/PubList.astro', /@media \(max-width: 780px\)[\s\S]*?\.pubs\s*\{\s*display:\s*block;/],
      ['src/components/Projects.astro', /@media \(max-width: 780px\)[\s\S]*?\.project-board\s*\{\s*grid-template-columns:\s*minmax\(0, 1fr\);/],
      ['src/components/StitchVibe.astro', /@media \(max-width: 700px\)[\s\S]*?\.vibe-mosaic\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column;/],
      ['src/components/CvTimeline.astro', /@media \(max-width: 780px\)[\s\S]*?\.cv-layout\s*\{\s*grid-template-columns:\s*1fr;/],
    ];
    for (const [path, contract] of contracts) expect(read(path)).toMatch(contract);
  });

  it('keeps complete CV data and the real PDF behind the focused timeline', () => {
    const component = read('src/components/CvTimeline.astro');
    const expectedCount = cv.education.length + cv.experience.length + cv.leadership.length;
    expect(expectedCount).toBe(5);
    expect(component).toContain('const currentStudy = cv.education[0]');
    expect(component.match(/<li class="cv-entry"/g)).toHaveLength(1);
    expect(component).not.toMatch(/cv\.(experience|leadership)/);
    expect(component).toContain('href={cv.pdf} download');
    expect(cv.pdf).toBe('/cv.pdf');
    expect(existsSync(new URL('public/cv.pdf', root))).toBe(true);
  });

  it('keeps Prompts semantic stages and both clipboard paths', () => {
    const page = read('src/pages/prompts.astro');
    const block = read('src/components/PromptBlock.astro');
    expect(promptPack.stages).toHaveLength(8);
    expect(page).toContain('<IndexSheet number="//" title={P.title} titleZh={P.title}>');
    expect(page).toContain('<h2>{stage.title}</h2>');
    expect(page).toContain("['stage-card', 'stage']");
    expect(page).toContain("document.querySelectorAll('.copy')");
    expect(page).toContain('navigator.clipboard.writeText');
    expect(page).toContain("document.execCommand('copy')");
    expect(block).toContain('aria-label="Copy prompt to clipboard"');
  });

  it('keeps CasMD in research while removing it completely from Vibe sources', () => {
    const vibe = read('src/components/StitchVibe.astro');
    const projects = read('src/components/Projects.astro');
    const home = read('src/data/home.ts');
    const project = read('src/content/projects/hsingmd.md');
    const vibeSources = readdirSync(new URL('src/content/vibe/', root))
      .filter((name) => name.endsWith('.md'))
      .map((name) => read(`src/content/vibe/${name}`));
    for (const fact of [
      'title: "CasMD"',
      'blurb: "Protein–nucleic acid molecular dynamics, made simple. Interactive demo."',
      'href: "https://huggingface.co/spaces/zzhaobz/HsingMD"',
    ]) {
      expect(project).toContain(fact);
    }
    expect(existsSync(new URL('src/content/vibe/casmd.md', root))).toBe(false);
    expect(vibeSources.join('\n')).not.toMatch(/casmd/i);
    expect(vibe).toContain("getCollection('vibe')");
    expect(vibe).toContain('selectByTitles');
    expect(vibe).toContain('HOME_VIBE_TITLES');
    expect(vibe).not.toMatch(/casmd/i);
    expect(projects).toContain('getGithubProjects');
    expect(projects).not.toContain("getCollection('projects')");
    expect(home).toContain("'Singularity',\n  'Medit',\n  'Yaos',\n  'Zen',");
    expect(home.slice(home.indexOf('HOME_VIBE_TITLES'))).not.toContain("'CasMD'");
  });
});
