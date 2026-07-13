import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import fallbackProjects from '../src/data/github-projects.fallback.json';

const root = new URL('..', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');

describe('GitHub project surfaces', () => {
  it('loads both project surfaces through the shared normalized loader', () => {
    const vibe = read('src/components/StitchVibe.astro');
    const projects = read('src/components/Projects.astro');

    for (const surface of [vibe, projects]) {
      expect(surface).toContain("import { getGithubProjects } from '../data/github-projects'");
      expect(surface).toContain('await getGithubProjects()');
    }
    expect(vibe).toContain('<GithubProjectShelf projects={githubProjects} />');
    expect(projects).toContain('githubProjects.map((project)');
  });

  it('deduplicates the homepage shelf from the authored CasMD and Yaos cards', () => {
    expect(existsSync(new URL('src/components/GithubProjectShelf.astro', root))).toBe(true);
    if (!existsSync(new URL('src/components/GithubProjectShelf.astro', root))) return;

    const shelf = read('src/components/GithubProjectShelf.astro');
    expect(fallbackProjects.map(({ name }) => name)).toEqual([
      'CasMD',
      'DL-SELEX',
      'Yaos',
      'TEMPO',
      'Cembra_AI',
      'DL-SELEX-web-explain',
      'ECG_analysing_app',
    ]);
    expect(fallbackProjects.filter(({ name }) => !['CasMD', 'Yaos'].includes(name)).map(({ name }) => name)).toEqual([
      'DL-SELEX',
      'TEMPO',
      'Cembra_AI',
      'DL-SELEX-web-explain',
      'ECG_analysing_app',
    ]);
    expect(shelf).toContain("const AUTHORED_PROJECTS = new Set(['CasMD', 'Yaos'])");
    expect(shelf).toContain('!AUTHORED_PROJECTS.has(project.name)');
    expect(shelf).toContain('shelfProjects.map((project)');
    expect(shelf).toContain('<GithubProjectCard project={project} />');
    expect(shelf).toMatch(/\.github-project-shelf-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);/);
    expect(shelf).toMatch(/@media \(max-width: 700px\)[\s\S]*?\.github-project-shelf-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\);/);
  });

  it('renders every normalized project on the Projects route without the manual collection', () => {
    const projects = read('src/components/Projects.astro');

    expect(fallbackProjects).toHaveLength(7);
    expect(projects).toContain('<GithubProjectCard project={project} />');
    expect(projects).not.toMatch(/getCollection\(['"]projects['"]\)/);
    expect(projects).not.toContain("from './ProjectCard.astro'");
    expect(projects).not.toMatch(/githubProjects\.(?:filter|slice)\(/);
  });

  it('uses semantic bilingual GitHub cards with safe, touch-sized actions', () => {
    expect(existsSync(new URL('src/components/GithubProjectCard.astro', root))).toBe(true);
    if (!existsSync(new URL('src/components/GithubProjectCard.astro', root))) return;

    const card = read('src/components/GithubProjectCard.astro');
    expect(card).toContain('<article');
    expect(card).toContain('data-github-project={project.name}');
    expect(card).toContain("data-featured={project.featured ? 'true' : undefined}");
    expect(card).toContain('<T en={project.description} zh={project.descriptionZh} />');
    expect(card).toContain('project.stack.map((technology)');
    expect(card).toContain('<li>{technology}</li>');
    expect(card).toContain('href={project.githubUrl}');
    expect(card).toContain('project.demoUrl &&');
    expect(card).toContain('href={project.demoUrl}');
    expect(card).toContain('target="_blank"');
    expect(card).toContain('rel="noopener noreferrer"');
    expect(card).toContain('★');
    expect(card).toMatch(/\.github-project-action\s*\{[^}]*min-width:\s*44px;[^}]*min-height:\s*44px;/);
    expect(card).toMatch(/\.github-project-action:focus-visible\s*\{[^}]*outline:/);
  });

  it('gives the authored CasMD and Yaos cards separate GitHub and live-demo actions', () => {
    const card = read('src/components/StitchVibeCard.astro');
    const config = read('src/content.config.ts');
    const casmd = read('src/content/vibe/casmd.md');
    const yaos = read('src/content/vibe/yaos.md');

    expect(config).toContain('githubUrl: z.string().optional()');
    expect(card).toContain('item.githubUrl');
    expect(card).toContain('<T en="GitHub ↗" zh="GitHub ↗" />');
    expect(card).toContain('<T en="Live demo ↗" zh="在线演示 ↗" />');
    expect(card).toMatch(/\.vibe-secondary-actions\s*\{[^}]*position:\s*relative;[^}]*z-index:\s*2;/);
    expect(card).toMatch(/\.vibe-action\s*\{[^}]*min-width:\s*44px;[^}]*min-height:\s*44px;/);

    expect(casmd).toContain('githubUrl: "https://github.com/zibin-zhao/CasMD"');
    expect(casmd).toContain('href: "https://huggingface.co/spaces/zzhaobz/HsingMD"');
    expect(yaos).toContain('githubUrl: "https://github.com/zibin-zhao/Yaos"');
    expect(yaos).toContain('href: "https://zibin-zhao.github.io/Yaos/"');
  });
});
