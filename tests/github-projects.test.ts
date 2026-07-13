import { describe, expect, it, vi } from 'vitest';

import fallbackProjects from '../src/data/github-projects.fallback.json';
import { getGithubProjects } from '../src/data/github-projects';

interface RepositoryFixture {
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  topics: string[];
  updated_at: string;
  fork: boolean;
  archived: boolean;
  disabled: boolean;
}

const repository = (
  name: string,
  overrides: Partial<RepositoryFixture> = {},
): RepositoryFixture => ({
  name,
  description: `${name} remote description`,
  html_url: `https://github.com/zibin-zhao/${name}`,
  homepage: '',
  language: 'TypeScript',
  topics: [],
  updated_at: '2026-01-01T00:00:00Z',
  fork: false,
  archived: false,
  disabled: false,
  ...overrides,
});

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json' },
});

const requestUrl = (input: string | URL | Request) => (
  input instanceof Request ? input.url : input.toString()
);

const fetchStub = (
  repositories: RepositoryFixture[],
  languages: Record<string, Record<string, number> | number> = {},
) => vi.fn(async (input: string | URL | Request) => {
  const url = requestUrl(input);
  const languageMatch = url.match(/\/repos\/zibin-zhao\/([^/]+)\/languages$/);

  if (!languageMatch) return jsonResponse(repositories);

  const enrichment = languages[decodeURIComponent(languageMatch[1])];
  if (typeof enrichment === 'number') return jsonResponse({ message: 'failed' }, enrichment);
  return jsonResponse(enrichment ?? {});
}) as unknown as typeof globalThis.fetch;

describe('getGithubProjects', () => {
  it('filters excluded repositories, keeps future owned repositories, and sorts deterministically', async () => {
    const projects = await getGithubProjects({
      fetch: fetchStub([
        repository('forked', { fork: true }),
        repository('archived', { archived: true }),
        repository('disabled', { disabled: true }),
        repository('zibin-zhao.github.io'),
        repository('handle_mutation'),
        repository('TEMPO', { updated_at: '2026-06-01T00:00:00Z' }),
        repository('CasMD', { updated_at: '2025-01-01T00:00:00Z' }),
        repository('FutureLab', { updated_at: '2027-02-01T00:00:00Z' }),
        repository('Yaos', { updated_at: '2026-05-01T00:00:00Z' }),
        repository('DL-SELEX', { updated_at: '2024-01-01T00:00:00Z' }),
      ]),
    });

    expect(projects.map(({ name }) => name)).toEqual([
      'CasMD',
      'DL-SELEX',
      'Yaos',
      'FutureLab',
      'TEMPO',
    ]);
  });

  it('orders up to three languages by byte count, then appends non-duplicate topics', async () => {
    const projects = await getGithubProjects({
      fetch: fetchStub(
        [repository('FutureLab', {
          language: 'TypeScript',
          topics: ['TypeScript', 'bioinformatics', 'AI', 'ai'],
        })],
        {
          FutureLab: {
            CSS: 100,
            Python: 500,
            Shell: 10,
            TypeScript: 800,
          },
        },
      ),
    });

    expect(projects[0].stack).toEqual([
      'TypeScript',
      'Python',
      'CSS',
      'bioinformatics',
      'AI',
    ]);
  });

  it('uses primary languages and preserves remote repositories when enrichment fails', async () => {
    const projects = await getGithubProjects({
      fetch: fetchStub(
        [
          repository('FutureLab', {
            language: 'Ruby',
            topics: ['developer-tools'],
            updated_at: '2026-02-01T00:00:00Z',
          }),
          repository('AnotherLab', {
            language: 'Python',
            updated_at: '2026-01-01T00:00:00Z',
          }),
        ],
        { FutureLab: 503, AnotherLab: 403 },
      ),
    });

    expect(projects.map(({ name }) => name)).toEqual(['FutureLab', 'AnotherLab']);
    expect(projects[0].stack).toEqual(['Ruby', 'developer-tools']);
    expect(projects[1].stack).toEqual(['Python']);
  });

  it('returns the complete fallback snapshot when the repository list request fails', async () => {
    const failingFetch = vi.fn(async () => jsonResponse({ message: 'rate limited' }, 403)) as unknown as typeof globalThis.fetch;

    const projects = await getGithubProjects({ fetch: failingFetch });

    expect(projects).toEqual(fallbackProjects);
    expect(projects.map(({ name }) => name)).toEqual([
      'CasMD',
      'DL-SELEX',
      'Yaos',
      'TEMPO',
      'Cembra_AI',
      'DL-SELEX-web-explain',
      'ECG_analysing_app',
    ]);
  });

  it('fills missing descriptions and curated bilingual, demo, and featured metadata', async () => {
    const projects = await getGithubProjects({
      fetch: fetchStub([
        repository('CasMD', { description: null, homepage: null, language: 'Python' }),
        repository('Yaos', { description: null, homepage: null, language: 'JavaScript' }),
        repository('TEMPO', { description: null, homepage: null, language: 'JavaScript' }),
      ]),
    });

    const casmd = projects.find(({ name }) => name === 'CasMD');
    const yaos = projects.find(({ name }) => name === 'Yaos');
    const tempo = projects.find(({ name }) => name === 'TEMPO');

    expect(casmd).toMatchObject({
      description: 'Protein–nucleic acid molecular dynamics, made simple.',
      descriptionZh: '蛋白质–核酸分子动力学，化繁为简。',
      demoUrl: 'https://huggingface.co/spaces/zzhaobz/HsingMD',
      featured: true,
    });
    expect(yaos).toMatchObject({
      description: 'A time-aware Medicine Buddha wellness PWA.',
      descriptionZh: '自动识别时辰与节气的药师法门养生 PWA。',
      demoUrl: 'https://zibin-zhao.github.io/Yaos/',
      featured: true,
    });
    expect(tempo).toMatchObject({
      description: 'Supplementary toolkit for one-pot CRISPR molecular diagnostics.',
      descriptionZh: '一锅式 CRISPR 分子诊断的配套工具包。',
      featured: false,
    });
    expect(tempo).not.toHaveProperty('demoUrl');
  });
});
