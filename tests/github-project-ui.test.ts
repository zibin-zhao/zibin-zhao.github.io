import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import fallbackProjects from '../src/data/github-projects.fallback.json';

const root = new URL('..', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');

describe('GitHub project surfaces', () => {
  it('loads the homepage research collection and complete Projects route once per surface', () => {
    expect(existsSync(new URL('src/components/StitchResearchProjects.astro', root))).toBe(true);
    const research = read('src/components/StitchResearchProjects.astro');
    const vibe = read('src/components/StitchVibe.astro');
    const projects = read('src/components/Projects.astro');

    for (const surface of [research, projects]) {
      expect(surface).toContain('getGithubProjects');
      expect(surface).toContain('partitionGithubProjects');
      expect(surface).toContain('await getGithubProjects()');
      expect(surface.match(/await getGithubProjects\(\)/g)).toHaveLength(1);
    }
    expect(vibe).not.toContain('getGithubProjects');
    expect(vibe).not.toContain('GithubProjectShelf');
  });

  it('renders CasMD first, then TEMPO, then the remaining homepage research projects', () => {
    if (!existsSync(new URL('src/components/StitchResearchProjects.astro', root))) {
      expect(existsSync(new URL('src/components/StitchResearchProjects.astro', root))).toBe(true);
      return;
    }
    const research = read('src/components/StitchResearchProjects.astro');
    const vibe = read('src/components/StitchVibe.astro');
    expect(fallbackProjects.map(({ name }) => name)).toEqual([
      'CasMD',
      'TEMPO',
      'DL-SELEX',
      'Yaos',
      'Cembra_AI',
      'DL-SELEX-web-explain',
      'ECG_analysing_app',
    ]);
    expect(research).toContain("const casmd = research.find(({ name }) => name === 'CasMD')");
    expect(research).toContain("const tempo = research.find(({ name }) => name === 'TEMPO')");
    expect(research).toContain("!['CasMD', 'TEMPO'].includes(project.name)");
    expect(research.indexOf('project={casmd}')).toBeLessThan(research.indexOf('project={tempo}'));
    expect(research.indexOf('project={tempo}')).toBeLessThan(research.indexOf('remaining.map((project)'));
    expect(research).toContain("src: '/stitch/casmd-cartoon.png'");
    expect(research).not.toContain("src: '/stitch/casmd.png'");
    expect(vibe).toContain("const singularityImage = '/stitch/singularity-cartoon.png'");
    expect(vibe).not.toContain("const singularityImage = '/stitch/singularity.png'");
  });

  it('renders non-overlapping Research, Vibe, and More groups on the Projects route', () => {
    const projects = read('src/components/Projects.astro');

    expect(fallbackProjects).toHaveLength(7);
    expect(projects).toContain('const { research, more } = partitionGithubProjects(githubProjects)');
    expect(projects).toContain('HOME_VIBE_TITLES');
    expect(projects).toContain("getCollection('vibe')");
    expect(projects).toContain('research.map((project) => <ResearchProjectCard project={project} />)');
    expect(projects).toContain('vibeProjects.map((item, index) =>');
    expect(projects).toContain('more.map((project) => <GithubProjectCard project={project} />)');
    expect(projects).not.toContain('githubProjects.map(');
    expect(projects).not.toMatch(/getCollection\(['"]projects['"]\)/);
    expect(projects).not.toContain("from './ProjectCard.astro'");
    for (const heading of [
      '<T en="Research" zh="研究项目" />',
      '<T en="Vibe" zh="随性实验" />',
      '<T en="More" zh="更多项目" />',
    ]) expect(projects).toContain(heading);
  });

  it('uses semantic bilingual research cards with bounded stacks and optional art', () => {
    expect(existsSync(new URL('src/components/ResearchProjectCard.astro', root))).toBe(true);
    const card = read('src/components/ResearchProjectCard.astro');

    expect(card).toContain('<article');
    expect(card).toContain('data-research-project={project.name}');
    expect(card).toContain('data-featured={project.featured}');
    expect(card).toContain('image &&');
    expect(card).toContain('src={image.src}');
    expect(card).toContain('alt={image.alt}');
    expect(card).toContain('width="1024"');
    expect(card).toContain('height="576"');
    expect(card).toContain('<p class="t-en">{project.description}</p>');
    expect(card).toContain('<p class="t-zh">{project.descriptionZh}</p>');
    expect(card).toContain('project.stack.slice(0, 3).map((technology)');
    expect(card).toContain('<li>{technology}</li>');
    expect(card).toContain('href={project.githubUrl}');
    expect(card).toContain('project.demoUrl &&');
    expect(card).toContain('href={project.demoUrl}');
    expect(card).toContain('target="_blank"');
    expect(card).toContain('rel="noopener noreferrer"');
    expect(card).toMatch(/\.research-project-action\s*\{[^}]*min-width:\s*44px;[^}]*min-height:\s*44px;/);
  });

  it('keeps separate GitHub and live-demo actions for authored Vibe projects', () => {
    const card = read('src/components/StitchVibeCard.astro');
    const config = read('src/content.config.ts');
    const yaos = read('src/content/vibe/yaos.md');

    expect(config).toContain('githubUrl: z.string().optional()');
    expect(card).toContain('item.githubUrl');
    expect(card).toContain('<T en="GitHub ↗" zh="GitHub ↗" />');
    expect(card).toContain('<T en="Live demo ↗" zh="在线演示 ↗" />');
    expect(card).toMatch(/\.vibe-secondary-actions\s*\{[^}]*position:\s*relative;[^}]*z-index:\s*2;/);
    expect(card).toMatch(/\.vibe-action\s*\{[^}]*min-width:\s*44px;[^}]*min-height:\s*44px;/);

    expect(yaos).toContain('githubUrl: "https://github.com/zibin-zhao/Yaos"');
    expect(yaos).toContain('href: "https://zibin-zhao.github.io/Yaos/"');
  });
});
