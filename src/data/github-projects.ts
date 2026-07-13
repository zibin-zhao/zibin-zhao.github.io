import fallbackSnapshot from './github-projects.fallback.json';

export interface GithubProject {
  name: string;
  description: string;
  descriptionZh: string;
  githubUrl: string;
  demoUrl?: string;
  stack: string[];
  updatedAt: string;
  featured: boolean;
}

interface GithubRepository {
  name: string;
  description?: string;
  githubUrl: string;
  demoUrl?: string;
  primaryLanguage?: string;
  topics: string[];
  updatedAt: string;
  fork: boolean;
  archived: boolean;
  disabled: boolean;
}

const GITHUB_OWNER = 'zibin-zhao';
const GITHUB_API = 'https://api.github.com';
const REQUEST_TIMEOUT_MS = 8_000;
const EXCLUDED_REPOSITORIES = new Set(['zibin-zhao.github.io', 'handle_mutation']);
const FEATURED_ORDER = ['CasMD', 'DL-SELEX', 'Yaos'] as const;
const fallbackProjects: GithubProject[] = fallbackSnapshot;
const curatedProjects = new Map(fallbackProjects.map((project) => [project.name, project]));

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const nonEmptyString = (value: unknown): string | undefined => (
  typeof value === 'string' && value.trim() ? value.trim() : undefined
);

const validWebUrl = (value: unknown): string | undefined => {
  const url = nonEmptyString(value);
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : undefined;
  } catch {
    return undefined;
  }
};

const validGithubUrl = (value: unknown): string | undefined => {
  const url = validWebUrl(value);
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname === 'github.com' ? url : undefined;
  } catch {
    return undefined;
  }
};

const validDate = (value: unknown): string | undefined => {
  const date = nonEmptyString(value);
  return date && !Number.isNaN(Date.parse(date)) ? date : undefined;
};

const parseRepository = (value: unknown): GithubRepository | undefined => {
  if (!isRecord(value)) return undefined;

  const name = nonEmptyString(value.name);
  const githubUrl = validGithubUrl(value.html_url);
  const updatedAt = validDate(value.updated_at);
  if (
    !name
    || !githubUrl
    || !updatedAt
    || typeof value.fork !== 'boolean'
    || typeof value.archived !== 'boolean'
    || typeof value.disabled !== 'boolean'
  ) return undefined;

  return {
    name,
    description: nonEmptyString(value.description),
    githubUrl,
    demoUrl: validWebUrl(value.homepage),
    primaryLanguage: nonEmptyString(value.language),
    topics: Array.isArray(value.topics)
      ? value.topics.flatMap((topic) => nonEmptyString(topic) ?? [])
      : [],
    updatedAt,
    fork: value.fork,
    archived: value.archived,
    disabled: value.disabled,
  };
};

const cloneFallback = (): GithubProject[] => fallbackProjects.map((project) => ({
  ...project,
  stack: [...project.stack],
}));

const requestHeaders = (token?: string): HeadersInit => {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'zibin-zhao-portfolio-build',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  const bearerToken = token?.trim();
  if (bearerToken) headers.Authorization = `Bearer ${bearerToken}`;
  return headers;
};

const fetchJson = async (
  fetcher: typeof globalThis.fetch,
  url: string,
  headers: HeadersInit,
): Promise<unknown> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetcher(url, { headers, signal: controller.signal });
    if (!response.ok) throw new Error(`GitHub request failed with status ${response.status}`);
    return await response.json() as unknown;
  } finally {
    clearTimeout(timeout);
  }
};

const parseLanguages = (value: unknown): Array<[string, number]> | undefined => {
  if (!isRecord(value)) return undefined;

  const languages: Array<[string, number]> = [];
  for (const [language, bytes] of Object.entries(value)) {
    if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes < 0) return undefined;
    if (bytes > 0) languages.push([language, bytes]);
  }
  return languages.sort(([leftName, leftBytes], [rightName, rightBytes]) => (
    rightBytes - leftBytes || leftName.localeCompare(rightName)
  ));
};

const normalizedStack = (
  repository: GithubRepository,
  languages?: Array<[string, number]>,
): string[] => {
  const stack = languages?.slice(0, 3).map(([language]) => language) ?? [];
  if (stack.length === 0 && repository.primaryLanguage) stack.push(repository.primaryLanguage);

  const seen = new Set(stack.map((label) => label.toLocaleLowerCase()));
  for (const topic of repository.topics) {
    const key = topic.toLocaleLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      stack.push(topic);
    }
  }
  return stack;
};

const normalizeRepository = (
  repository: GithubRepository,
  languages?: Array<[string, number]>,
): GithubProject => {
  const curated = curatedProjects.get(repository.name);
  const project: GithubProject = {
    name: repository.name,
    description: repository.description
      ?? curated?.description
      ?? `Explore ${repository.name} on GitHub.`,
    descriptionZh: curated?.descriptionZh ?? `在 GitHub 上了解 ${repository.name}。`,
    githubUrl: repository.githubUrl,
    stack: normalizedStack(repository, languages),
    updatedAt: repository.updatedAt,
    featured: curated?.featured ?? false,
  };
  const demoUrl = repository.demoUrl ?? curated?.demoUrl;
  if (demoUrl) project.demoUrl = demoUrl;
  return project;
};

const sortProjects = (projects: GithubProject[]): GithubProject[] => {
  const featuredRank: ReadonlyMap<string, number> = new Map(
    FEATURED_ORDER.map((name, index) => [name, index]),
  );
  return projects.sort((left, right) => {
    if (left.featured !== right.featured) return left.featured ? -1 : 1;
    if (left.featured && right.featured) {
      const order = (featuredRank.get(left.name) ?? Number.MAX_SAFE_INTEGER)
        - (featuredRank.get(right.name) ?? Number.MAX_SAFE_INTEGER);
      if (order !== 0) return order;
    }
    return Date.parse(right.updatedAt) - Date.parse(left.updatedAt)
      || left.name.localeCompare(right.name);
  });
};

export async function getGithubProjects(options: {
  fetch?: typeof globalThis.fetch;
  token?: string;
} = {}): Promise<GithubProject[]> {
  const fetcher = options.fetch ?? globalThis.fetch;
  const headers = requestHeaders(options.token);
  let repositories: GithubRepository[];

  try {
    const response = await fetchJson(
      fetcher,
      `${GITHUB_API}/users/${GITHUB_OWNER}/repos?type=owner&sort=updated&per_page=100`,
      headers,
    );
    if (!Array.isArray(response)) return cloneFallback();
    repositories = response
      .map(parseRepository)
      .filter((repository): repository is GithubRepository => repository !== undefined)
      .filter((repository) => (
        !repository.fork
        && !repository.archived
        && !repository.disabled
        && !EXCLUDED_REPOSITORIES.has(repository.name)
      ));
  } catch {
    return cloneFallback();
  }

  const projects = await Promise.all(repositories.map(async (repository) => {
    let languages: Array<[string, number]> | undefined;
    try {
      const response = await fetchJson(
        fetcher,
        `${GITHUB_API}/repos/${GITHUB_OWNER}/${encodeURIComponent(repository.name)}/languages`,
        headers,
      );
      languages = parseLanguages(response);
    } catch {
      // A language request must not discard a successfully fetched repository.
    }
    return normalizeRepository(repository, languages);
  }));

  return sortProjects(projects);
}
