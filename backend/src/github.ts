import { config } from './config.js';

const GRAPHQL_ENDPOINT = 'https://api.github.com/graphql';
const REST_ENDPOINT = 'https://api.github.com';
const REQUEST_TIMEOUT_MS = 20_000;

export interface GithubRepo {
  /** Numeric GitHub repository id, kept as a string because it is a BIGINT. */
  id: string;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  homepage: string | null;
  language: string | null;
  topics: string[];
  stars: number;
  forks: number;
  isFork: boolean;
  isArchived: boolean;
  createdAt: string | null;
  pushedAt: string | null;
  /** Whether the repository is pinned on the GitHub profile. */
  pinned: boolean;
}

export interface GithubProfile {
  login: string;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  location: string | null;
  followers: number;
}

export interface GithubSnapshot {
  profile: GithubProfile;
  repos: GithubRepo[];
  /** Total commits across every contribution year, `null` when unavailable. */
  commits: number | null;
  /** Oldest year with recorded contributions, `null` when unknown. */
  firstYear: number | null;
  source: 'graphql' | 'rest';
  fetchedAt: string;
}

function authHeaders(accept: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: accept,
    'User-Agent': 'gaspardtourdiat.fr',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (config.github.token) headers.Authorization = `Bearer ${config.github.token}`;
  return headers;
}

async function request(url: string, init: RequestInit): Promise<unknown> {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    const suffix = body ? ` — ${body.slice(0, 300)}` : '';
    throw new Error(`GitHub responded ${response.status} ${response.statusText} for ${url}${suffix}`);
  }
  return response.json();
}

function githubGraphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  return request(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: { ...authHeaders('application/json'), 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  }).then((payload) => {
    const body = payload as { data?: T; errors?: Array<{ message: string }> };
    if (body.errors?.length) {
      throw new Error(`GitHub GraphQL error: ${body.errors.map((e) => e.message).join('; ')}`);
    }
    if (!body.data) throw new Error('GitHub GraphQL returned no data');
    return body.data;
  });
}

/* -------------------------------------------------------------------------- */
/*  GraphQL (authenticated) path                                              */
/* -------------------------------------------------------------------------- */

interface RepoNode {
  databaseId: number | null;
  name: string;
  nameWithOwner: string;
  description: string | null;
  url: string;
  homepageUrl: string | null;
  stargazerCount: number;
  forkCount: number;
  isFork: boolean;
  isArchived: boolean;
  createdAt: string;
  pushedAt: string | null;
  primaryLanguage: { name: string } | null;
  repositoryTopics: { nodes: Array<{ topic: { name: string } }> } | null;
}

interface ReposQueryResult {
  user: {
    login: string;
    name: string | null;
    avatarUrl: string;
    bio: string | null;
    location: string | null;
    followers: { totalCount: number };
    repositories: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      nodes: RepoNode[];
    };
    pinnedItems: { nodes: Array<{ databaseId: number | null }> };
  } | null;
}

const REPOS_QUERY = `
  query Repositories($login: String!, $cursor: String) {
    user(login: $login) {
      login
      name
      avatarUrl
      bio
      location
      followers { totalCount }
      repositories(
        first: 100
        after: $cursor
        ownerAffiliations: OWNER
        privacy: PUBLIC
        orderBy: { field: PUSHED_AT, direction: DESC }
      ) {
        pageInfo { hasNextPage endCursor }
        nodes {
          databaseId
          name
          nameWithOwner
          description
          url
          homepageUrl
          stargazerCount
          forkCount
          isFork
          isArchived
          createdAt
          pushedAt
          primaryLanguage { name }
          repositoryTopics(first: 10) { nodes { topic { name } } }
        }
      }
      pinnedItems(first: 6, types: REPOSITORY) {
        nodes { ... on Repository { databaseId } }
      }
    }
  }
`;

async function fetchViaGraphql(): Promise<GithubSnapshot> {
  const login = config.github.username;
  let cursor: string | null = null;
  let profile: GithubProfile | null = null;
  const pinnedIds = new Set<string>();
  const repos: GithubRepo[] = [];

  // The profile holds few enough public repositories to fetch here, but page
  // through anyway so an unusually prolific account is not silently truncated.
  for (let page = 0; page < 5; page++) {
    const data: ReposQueryResult = await githubGraphql<ReposQueryResult>(REPOS_QUERY, { login, cursor });
    const user = data.user;
    if (!user) throw new Error(`GitHub user "${login}" was not found`);

    profile ??= {
      login: user.login,
      name: user.name,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      location: user.location,
      followers: user.followers.totalCount,
    };

    if (page === 0) {
      for (const node of user.pinnedItems.nodes) {
        if (node.databaseId !== null) pinnedIds.add(String(node.databaseId));
      }
    }

    for (const node of user.repositories.nodes) {
      if (node.databaseId === null) continue;
      repos.push({
        id: String(node.databaseId),
        name: node.name,
        fullName: node.nameWithOwner,
        description: node.description,
        url: node.url,
        homepage: node.homepageUrl,
        language: node.primaryLanguage?.name ?? null,
        topics: node.repositoryTopics?.nodes.map((n) => n.topic.name) ?? [],
        stars: node.stargazerCount,
        forks: node.forkCount,
        isFork: node.isFork,
        isArchived: node.isArchived,
        createdAt: node.createdAt,
        pushedAt: node.pushedAt,
        pinned: false,
      });
    }

    if (!user.repositories.pageInfo.hasNextPage) break;
    cursor = user.repositories.pageInfo.endCursor;
    if (!cursor) break;
  }

  for (const repo of repos) repo.pinned = pinnedIds.has(repo.id);

  const activity = await fetchActivity(login).catch((error: unknown) => {
    console.warn('[github] could not compute commit totals:', (error as Error).message);
    return { commits: null, firstYear: null } satisfies ActivitySummary;
  });

  return {
    profile: profile!,
    repos,
    commits: activity.commits,
    firstYear: activity.firstYear,
    source: 'graphql',
    fetchedAt: new Date().toISOString(),
  };
}

interface ActivitySummary {
  commits: number | null;
  /** Oldest year with recorded contributions — used for "years of code". */
  firstYear: number | null;
}

/**
 * `contributionsCollection` only ever describes a 12 month window, so the total
 * is obtained by asking for one aliased window per contribution year.
 */
async function fetchActivity(login: string): Promise<ActivitySummary> {
  const yearsData = await githubGraphql<{ user: { contributionsCollection: { contributionYears: number[] } } | null }>(
    `query ContributionYears($login: String!) {
       user(login: $login) { contributionsCollection { contributionYears } }
     }`,
    { login },
  );

  const years = (yearsData.user?.contributionsCollection.contributionYears ?? [])
    .slice()
    .sort((a, b) => a - b);
  if (years.length === 0) return { commits: 0, firstYear: null };

  const firstYear = years[0] ?? null;

  const fields = years
    .map(
      (year) =>
        `y${year}: contributionsCollection(from: "${year}-01-01T00:00:00Z", to: "${year}-12-31T23:59:59Z") ` +
        `{ totalCommitContributions restrictedContributionsCount }`,
    )
    .join('\n');

  const data = await githubGraphql<{
    user: Record<string, { totalCommitContributions: number; restrictedContributionsCount: number }> | null;
  }>(`query CommitTotals($login: String!) { user(login: $login) { ${fields} } }`, { login });

  if (!data.user) return { commits: null, firstYear };

  let total = 0;
  for (const key of Object.keys(data.user)) {
    const window = data.user[key];
    if (!window) continue;
    total += window.totalCommitContributions + window.restrictedContributionsCount;
  }
  return { commits: total, firstYear };
}

/* -------------------------------------------------------------------------- */
/*  REST fallback (no token)                                                  */
/* -------------------------------------------------------------------------- */

interface RestRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  topics?: string[];
  stargazers_count: number;
  forks_count: number;
  fork: boolean;
  archived: boolean;
  created_at: string | null;
  pushed_at: string | null;
}

interface RestUser {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  location: string | null;
  followers: number;
}

async function fetchViaRest(): Promise<GithubSnapshot> {
  const login = config.github.username;
  const headers = authHeaders('application/vnd.github+json');

  const user = (await request(`${REST_ENDPOINT}/users/${login}`, { headers })) as RestUser;

  const repos: GithubRepo[] = [];
  for (let page = 1; page <= 5; page++) {
    const batch = (await request(
      `${REST_ENDPOINT}/users/${login}/repos?per_page=100&page=${page}&sort=pushed&type=owner`,
      { headers },
    )) as RestRepo[];

    for (const repo of batch) {
      repos.push({
        id: String(repo.id),
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        homepage: repo.homepage,
        language: repo.language,
        topics: repo.topics ?? [],
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        isFork: repo.fork,
        isArchived: repo.archived,
        createdAt: repo.created_at,
        pushedAt: repo.pushed_at,
        pinned: false,
      });
    }

    if (batch.length < 100) break;
  }

  return {
    profile: {
      login: user.login,
      name: user.name,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      location: user.location,
      followers: user.followers,
    },
    repos,
    commits: null,
    // Without a token there is no contribution calendar, so fall back to the
    // oldest repository creation date as a proxy for "coding since".
    firstYear: repos.reduce<number | null>((oldest, repo) => {
      const year = repo.createdAt ? new Date(repo.createdAt).getUTCFullYear() : null;
      if (year === null) return oldest;
      return oldest === null ? year : Math.min(oldest, year);
    }, null),
    source: 'rest',
    fetchedAt: new Date().toISOString(),
  };
}

export function fetchSnapshot(): Promise<GithubSnapshot> {
  return config.github.token ? fetchViaGraphql() : fetchViaRest();
}

/* -------------------------------------------------------------------------- */
/*  Persistence                                                               */
/* -------------------------------------------------------------------------- */

export function toMysqlDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  // Store naive UTC so the value means the same thing in every timezone.
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

export function fromMysqlDate(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0) return null;
  const normalised = value.includes('T') ? value : value.replace(' ', 'T');
  const date = new Date(`${normalised}Z`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
