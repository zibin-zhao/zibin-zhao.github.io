import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { cv } from '../src/data/cv';
import { profile } from '../src/data/profile';
import { promptPack } from '../src/data/prompts';
import fallbackProjects from '../src/data/github-projects.fallback.json';

const root = new URL('..', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');
const files = (path: string) => readdirSync(new URL(path, root)).filter((name) => name.endsWith('.md')).sort();
const frontmatterValue = (source: string, key: string) => source.match(new RegExp(`^${key}: "([^"]*)"`, 'm'))?.[1];

const routes = [
  { route: 'about', number: '01', title: 'About', titleZh: '关于', component: 'About', shellTitle: 'About' },
  { route: 'research', number: '02', title: 'Research & Publications', titleZh: '研究与论文', component: 'PubList', shellTitle: 'Research' },
  { route: 'projects', number: '03', title: 'Projects', titleZh: '项目', component: 'Projects', shellTitle: 'Projects' },
  { route: 'cv', number: '05', title: 'CV', titleZh: '简历', component: 'CvTimeline', shellTitle: 'CV' },
  { route: 'contact', number: '06', title: 'Contact', titleZh: '联系', component: 'Contact', shellTitle: 'Contact' },
] as const;

describe('Index Sheet route contracts', () => {
  for (const { route, number, title, titleZh, component, shellTitle } of routes) {
    it(`provides /${route}/ with exact archive metadata`, () => {
      const path = `src/pages/${route}.astro`;
      expect(existsSync(new URL(path, root))).toBe(true);
      if (!existsSync(new URL(path, root))) return;

      const page = read(path);
      expect(page).toContain(`<StitchShell title="${shellTitle} — Zibin Zhao" active="${route}">`);
      expect(page).toContain(`<IndexSheet number="${number}" title="${title}" titleZh="${titleZh}">`);
      expect(page).toContain(`<${component} />`);
      expect(page).not.toMatch(/getCollection|\.map\(|profile\.|cv\./);
    });
  }

  it('renders the complete Prompt Pack inside the Prompts Index Sheet', () => {
    const page = read('src/pages/prompts.astro');
    const blockCount = promptPack.stages.reduce((total, stage) => total + stage.blocks.length, 0);

    expect(promptPack.stages).toHaveLength(8);
    expect(blockCount).toBe(11);
    expect(page).toContain('<StitchShell title="Prompt Pack — Zibin Zhao"');
    expect(page).toContain('active="prompts"');
    expect(page).toContain('<IndexSheet number="//" title={P.title} titleZh={P.title}>');
    expect(page).toContain('P.stages.map((stage)');
    expect(page).toContain('stage.blocks.map((block)');
    expect(page).toContain('<h2>{stage.title}</h2>');
    expect(page).toContain('<h2 class="dlabel">{P.disciplineTitle}</h2>');
    expect(page).not.toContain('<Base');
    expect(page).not.toMatch(/<main\b/);
  });
});

describe('complete archive source contracts', () => {
  it('renders every About focus identity from profile data', () => {
    expect(profile.focus.map((item) => item.en)).toEqual([
      'Computational biology',
      'Deep learning',
      'Molecular dynamics',
      'Diagnostics',
    ]);
    const about = read('src/components/About.astro');
    expect(about).toContain('profile.focus.map((focus)');
    expect(about).toContain('data-focus');
  });

  it('renders every publication identity from the canonical collection', () => {
    const publicationFiles = files('src/content/publications/');
    const titles = publicationFiles.map((name) => frontmatterValue(read(`src/content/publications/${name}`), 'title'));
    expect(publicationFiles).toHaveLength(9);
    expect(new Set(titles).size).toBe(9);
    expect(titles).not.toContain(undefined);
    const publications = read('src/components/PubList.astro');
    expect(publications).toContain('pubs.map((p, index)');
    expect(publications).not.toMatch(/\.slice\(|filter\([^)]*featured/);
  });

  it('retains legacy project records while rendering every normalized GitHub project', () => {
    const projectFiles = files('src/content/projects/');
    const records = projectFiles.map((name) => {
      const source = read(`src/content/projects/${name}`);
      return { title: frontmatterValue(source, 'title'), href: frontmatterValue(source, 'href') };
    });
    expect(records).toEqual([
      { title: 'DL-SELEX', href: 'https://github.com/zibin-zhao/DL-SELEX' },
      { title: 'ECG App', href: 'https://github.com/zibin-zhao/ECG_analysing_app' },
      { title: 'CasMD', href: 'https://huggingface.co/spaces/zzhaobz/HsingMD' },
      { title: 'TEMPO', href: 'https://github.com/zibin-zhao/TEMPO' },
    ]);
    const projects = read('src/components/Projects.astro');
    expect(fallbackProjects.map(({ name }) => name)).toEqual([
      'CasMD',
      'TEMPO',
      'DL-SELEX',
      'Yaos',
      'Cembra_AI',
      'DL-SELEX-web-explain',
      'ECG_analysing_app',
    ]);
    expect(projects).toContain('partitionGithubProjects(githubProjects)');
    expect(projects).toContain('research.map((project)');
    expect(projects).toContain('more.map((project)');
    expect(projects).toContain('getGithubProjects');
    expect(projects).not.toContain("getCollection('projects')");
    expect(projects).not.toContain('.slice(');
  });

  it('retains the complete CV data while showing only the active PhD study and core skills', () => {
    const entries = [...cv.education, ...cv.experience, ...cv.leadership];
    expect(entries.map((entry) => entry.title.en)).toEqual([
      'Ph.D., Bioengineering',
      'B.S., Biomedical Engineering',
      'Co-founder & CEO',
      'Research Assistant',
      'President & Event Director',
    ]);
    expect(entries.flatMap((entry) => entry.notes.en)).toHaveLength(6);
    expect(cv.skills).toEqual(['AI', 'Python', 'C', 'MATLAB', 'LabVIEW', 'SolidWorks']);
    expect(cv.pdf).toBe('/cv.pdf');
    expect(existsSync(new URL('public/cv.pdf', root))).toBe(true);
    const timeline = read('src/components/CvTimeline.astro');
    expect(timeline).toContain('const currentStudy = cv.education[0]');
    expect(timeline).toContain('en="PhD @ HKUST"');
    expect(timeline).toContain('zh="博士研究 @ 香港科技大学"');
    expect(timeline).toContain('currentStudy.notes.en');
    expect(timeline).toContain('cv.skills.map((skill)');
    expect(timeline).toContain('href={cv.pdf} download');
    expect(timeline).not.toMatch(/cv\.(experience|leadership)/);
    expect(timeline).not.toMatch(/candidate|co-founder|leadership/i);
  });

  it('renders the canonical email, every social and every contact index link', () => {
    expect(profile.email).toBe('zibin.zhao@connect.ust.hk');
    expect(profile.socials.map((social) => social.label)).toEqual([
      'GitHub',
      'Hugging Face',
      'Scholar',
      'LinkedIn',
      'ORCID',
    ]);
    expect(profile.navLinks.map((link) => link.href)).toEqual([
      '/about/', '/research/', '/projects/', '/#vibe', '/cv/', '/contact/', '/prompts/',
    ]);
    const contact = read('src/components/Contact.astro');
    expect(contact).toContain('mailto:${profile.email}');
    expect(contact).toContain('profile.socials.map((social)');
    expect(contact).toContain('profile.navLinks.map((link)');
    expect(contact).not.toContain('.slice(');
  });
});
