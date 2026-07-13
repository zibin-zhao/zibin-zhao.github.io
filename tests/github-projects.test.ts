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
  it('memoizes one promise and one GitHub transaction for default build-time calls', async () => {
    const requests: string[] = [];
    const defaultFetch = vi.fn(async (input: string | URL | Request) => {
      const url = requestUrl(input);
      requests.push(url);
      return jsonResponse(url.endsWith('/languages')
        ? { TypeScript: 100 }
        : [repository('FutureLab')]);
    }) as unknown as typeof globalThis.fetch;
    vi.resetModules();
    vi.stubGlobal('fetch', defaultFetch);

    try {
      const { getGithubProjects: getDefaultProjects } = await import('../src/data/github-projects');
      const first = getDefaultProjects();
      const second = getDefaultProjects();

      expect(first).toBe(second);
      const [firstProjects, secondProjects] = await Promise.all([first, second]);
      expect(firstProjects).toBe(secondProjects);
      expect(firstProjects.map(({ name }) => name)).toEqual(['FutureLab']);
      expect(requests).toHaveLength(2);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('does not cache explicitly injected fetch or token calls', async () => {
    const injectedFetch = fetchStub([repository('FutureLab')]);

    const first = getGithubProjects({ fetch: injectedFetch, token: 'test-token' });
    const second = getGithubProjects({ fetch: injectedFetch, token: 'test-token' });
    await Promise.all([first, second]);

    expect(injectedFetch).toHaveBeenCalledTimes(4);
  });

  it('returns a cloned fallback without fetching in private offline build mode', async () => {
    const offlineFetch = vi.fn(async () => jsonResponse([])) as unknown as typeof globalThis.fetch;
    vi.resetModules();
    vi.stubGlobal('fetch', offlineFetch);
    vi.stubEnv('GITHUB_PROJECTS_OFFLINE', '1');

    try {
      const { getGithubProjects: getOfflineProjects } = await import('../src/data/github-projects');
      const projects = await getOfflineProjects();

      expect(projects).toEqual(fallbackProjects);
      expect(projects).not.toBe(fallbackProjects);
      expect(projects[0].stack).not.toBe(fallbackProjects[0].stack);
      expect(offlineFetch).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
      vi.unstubAllEnvs();
    }
  });

  it('keeps explicit injected behavior active when offline build mode is set', async () => {
    const injectedFetch = fetchStub([repository('FutureLab')]);
    vi.stubEnv('GITHUB_PROJECTS_OFFLINE', '1');

    try {
      const projects = await getGithubProjects({ fetch: injectedFetch });
      expect(projects.map(({ name }) => name)).toEqual(['FutureLab']);
      expect(injectedFetch).toHaveBeenCalledTimes(2);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('uses the private build environment token when no explicit token is supplied', async () => {
    const token = 'environment-build-token';
    const requests: Array<{ authorization: string | null; url: string }> = [];
    const authenticatedFetch = vi.fn(async (
      input: string | URL | Request,
      init?: RequestInit,
    ) => {
      const url = requestUrl(input);
      requests.push({
        authorization: new Headers(init?.headers).get('Authorization'),
        url,
      });
      return jsonResponse(url.endsWith('/languages') ? {} : [repository('FutureLab')]);
    }) as unknown as typeof globalThis.fetch;
    vi.stubEnv('GITHUB_TOKEN', token);

    try {
      await getGithubProjects({ fetch: authenticatedFetch });
    } finally {
      vi.unstubAllEnvs();
    }

    expect(requests).toHaveLength(2);
    expect(requests.map(({ authorization }) => authorization)).toEqual([
      `Bearer ${token}`,
      `Bearer ${token}`,
    ]);
    expect(requests.every(({ url }) => !url.includes(token))).toBe(true);
  });

  it('keeps explicit authentication injectable ahead of the build environment', async () => {
    const authorizations: Array<string | null> = [];
    const authenticatedFetch = vi.fn(async (
      input: string | URL | Request,
      init?: RequestInit,
    ) => {
      const url = requestUrl(input);
      authorizations.push(new Headers(init?.headers).get('Authorization'));
      return jsonResponse(url.endsWith('/languages') ? {} : [repository('FutureLab')]);
    }) as unknown as typeof globalThis.fetch;
    vi.stubEnv('GITHUB_TOKEN', 'environment-build-token');

    try {
      await getGithubProjects({ fetch: authenticatedFetch, token: 'explicit-test-token' });
    } finally {
      vi.unstubAllEnvs();
    }

    expect(authorizations).toEqual([
      'Bearer explicit-test-token',
      'Bearer explicit-test-token',
    ]);
  });

  it('allows an explicit empty token for tokenless local requests', async () => {
    const authorizations: Array<string | null> = [];
    const tokenlessFetch = vi.fn(async (
      input: string | URL | Request,
      init?: RequestInit,
    ) => {
      const url = requestUrl(input);
      authorizations.push(new Headers(init?.headers).get('Authorization'));
      return jsonResponse(url.endsWith('/languages') ? {} : [repository('FutureLab')]);
    }) as unknown as typeof globalThis.fetch;
    vi.stubEnv('GITHUB_TOKEN', 'environment-build-token');

    try {
      await getGithubProjects({ fetch: tokenlessFetch, token: '' });
    } finally {
      vi.unstubAllEnvs();
    }

    expect(authorizations).toEqual([null, null]);
  });

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

  it.each([
    ['first entry', [null, repository('FutureLab')]],
    ['mixed entry', [repository('FutureLab'), { name: 'BrokenLab' }]],
  ])('returns the complete fallback when a list page has a malformed %s', async (_label, body) => {
    const malformedFetch = vi.fn(async () => jsonResponse(body)) as unknown as typeof globalThis.fetch;

    const projects = await getGithubProjects({ fetch: malformedFetch });

    expect(projects).toEqual(fallbackProjects);
    expect(malformedFetch).toHaveBeenCalledTimes(1);
  });

  it('returns the complete fallback when a later list page contains a malformed record', async () => {
    const fullPage = Array.from({ length: 100 }, (_, index) => repository(`PageOne-${index}`));
    const laterMalformedFetch = vi.fn(async (input: string | URL | Request) => {
      const page = new URL(requestUrl(input)).searchParams.get('page');
      return jsonResponse(page === '1' ? fullPage : [repository('FutureLab'), null]);
    }) as unknown as typeof globalThis.fetch;

    const projects = await getGithubProjects({ fetch: laterMalformedFetch });

    expect(projects).toEqual(fallbackProjects);
    expect(laterMalformedFetch).toHaveBeenCalledTimes(2);
  });

  it('aggregates repository pages before filtering, sorting, and enrichment', async () => {
    const pageOne = Array.from({ length: 100 }, (_, index) => repository(`Archive-${index}`, {
      updated_at: `2025-01-${String(index % 28 + 1).padStart(2, '0')}T00:00:00Z`,
    }));
    const future = repository('FuturePageProject', { updated_at: '2027-01-01T00:00:00Z' });
    const requests: string[] = [];
    const paginatedFetch = vi.fn(async (input: string | URL | Request) => {
      const url = requestUrl(input);
      requests.push(url);
      if (url.includes('/languages')) return jsonResponse({ TypeScript: 100 });
      const page = new URL(url).searchParams.get('page');
      if (page === '1') return jsonResponse(pageOne);
      if (page === '2') return jsonResponse([future]);
      return jsonResponse([]);
    }) as unknown as typeof globalThis.fetch;

    const projects = await getGithubProjects({ fetch: paginatedFetch });

    expect(projects).toHaveLength(101);
    expect(projects[0].name).toBe('FuturePageProject');
    expect(requests.filter((url) => url.includes('/users/'))).toEqual([
      'https://api.github.com/users/zibin-zhao/repos?type=owner&sort=updated&per_page=100&page=1',
      'https://api.github.com/users/zibin-zhao/repos?type=owner&sort=updated&per_page=100&page=2',
    ]);
    expect(requests).toHaveLength(103);
  });

  it('bounds pagination and falls back if GitHub never returns a final short page', async () => {
    const fullPage = Array.from({ length: 100 }, (_, index) => repository(`Loop-${index}`));
    const loopingFetch = vi.fn(async () => jsonResponse(fullPage)) as unknown as typeof globalThis.fetch;

    const projects = await getGithubProjects({ fetch: loopingFetch });

    expect(projects).toEqual(fallbackProjects);
    expect(loopingFetch).toHaveBeenCalledTimes(100);
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
