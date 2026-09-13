import { config } from './config.js';
import { exec, getSetting, rows, setSetting, transaction } from './db.js';
import { fetchSnapshot, fromMysqlDate, toMysqlDate, type GithubSnapshot } from './github.js';

export interface ProjectDto {
  id: string;
  name: string;
  fullName: string;
  displayName: string;
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
  pinned: boolean;
  hidden: boolean;
  sortOrder: number;
}

export interface ProjectStats {
  projects: number;
  commits: number | null;
  stars: number;
  followers: number;
  yearsOfCode: number | null;
  languages: Array<{ name: string; count: number }>;
  lastSync: string | null;
  source: 'graphql' | 'rest' | null;
}

export interface SyncResult {
  repos: number;
  source: 'graphql' | 'rest';
  durationMs: number;
  syncedAt: string;
}

interface ProjectRow {
  id: string | number;
  name: string;
  full_name: string;
  description: string | null;
  url: string;
  homepage: string | null;
  language: string | null;
  topics: string | null;
  stars: number;
  forks: number;
  is_fork: number;
  is_archived: number;
  created_at: string | null;
  pushed_at: string | null;
  pinned: number;
  hidden: number;
  sort_order: number;
  display_name: string | null;
  custom_description: string | null;
}

interface StoredStats {
  commits: number | null;
  followers: number;
  stars: number;
  projects: number;
  firstYear: number | null;
  languages: Array<{ name: string; count: number }>;
  source: 'graphql' | 'rest';
  lastSync: string;
}

const STATS_KEY = 'github_stats';

function parseTopics(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === 'string') : [];
  } catch {
    return [];
  }
}

function toDto(row: ProjectRow): ProjectDto {
  return {
    id: String(row.id),
    name: row.name,
    fullName: row.full_name,
    displayName: row.display_name ?? row.name,
    description: row.custom_description ?? row.description,
    url: row.url,
    homepage: row.homepage,
    language: row.language,
    topics: parseTopics(row.topics),
    stars: Number(row.stars),
    forks: Number(row.forks),
    isFork: Boolean(row.is_fork),
    isArchived: Boolean(row.is_archived),
    createdAt: fromMysqlDate(row.created_at),
    pushedAt: fromMysqlDate(row.pushed_at),
    pinned: Boolean(row.pinned),
    hidden: Boolean(row.hidden),
    sortOrder: Number(row.sort_order),
  };
}

const UPSERT_SQL = `
  INSERT INTO projects (
    id, name, full_name, description, url, homepage, language, topics,
    stars, forks, is_fork, is_archived, created_at, pushed_at,
    pinned, hidden, sort_order, synced_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)
  ON DUPLICATE KEY UPDATE
    name        = VALUES(name),
    full_name   = VALUES(full_name),
    description = VALUES(description),
    url         = VALUES(url),
    homepage    = VALUES(homepage),
    language    = VALUES(language),
    topics      = VALUES(topics),
    stars       = VALUES(stars),
    forks       = VALUES(forks),
    is_fork     = VALUES(is_fork),
    is_archived = VALUES(is_archived),
    created_at  = VALUES(created_at),
    pushed_at   = VALUES(pushed_at),
    synced_at   = VALUES(synced_at)
    -- pinned / hidden / sort_order / display_name / custom_description are
    -- deliberately absent: they belong to the admin panel, not to GitHub.
`;

/* -------------------------------------------------------------------------- */
/*  Sync                                                                      */
/* -------------------------------------------------------------------------- */

let inFlight: Promise<SyncResult> | null = null;

/** Concurrent callers share one request instead of stampeding the GitHub API. */
export function syncProjects(): Promise<SyncResult> {
  if (inFlight) return inFlight;
  inFlight = performSync().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function performSync(): Promise<SyncResult> {
  const startedAt = Date.now();
  const marker = toMysqlDate(new Date().toISOString())!;
  const snapshot: GithubSnapshot = await fetchSnapshot();

  await transaction(async (conn) => {
    if (snapshot.repos.length > 0) {
      const values = snapshot.repos.map((repo) => [
        repo.id,
        repo.name,
        repo.fullName,
        repo.description,
        repo.url,
        repo.homepage,
        repo.language,
        JSON.stringify(repo.topics),
        repo.stars,
        repo.forks,
        repo.isFork ? 1 : 0,
        repo.isArchived ? 1 : 0,
        toMysqlDate(repo.createdAt),
        toMysqlDate(repo.pushedAt),
        repo.pinned ? 1 : 0,
        marker,
      ]);
      await conn.batch(UPSERT_SQL, values);
    }

    // Anything GitHub no longer returns has been deleted, renamed away or made
    // private — drop the stale row rather than advertise a dead link.
    await conn.query('DELETE FROM projects WHERE synced_at < ?', [marker]);
  });

  await setSetting(STATS_KEY, buildStats(snapshot));

  const result: SyncResult = {
    repos: snapshot.repos.length,
    source: snapshot.source,
    durationMs: Date.now() - startedAt,
    syncedAt: snapshot.fetchedAt,
  };
  console.log(
    `[sync] ${result.repos} repositories via ${result.source} in ${result.durationMs}ms`,
  );
  return result;
}

function buildStats(snapshot: GithubSnapshot): StoredStats {
  const counts = new Map<string, number>();
  for (const repo of snapshot.repos) {
    if (repo.isFork || !repo.language) continue;
    counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
  }

  return {
    commits: snapshot.commits,
    followers: snapshot.profile.followers,
    stars: snapshot.repos.reduce((sum, repo) => sum + repo.stars, 0),
    projects: snapshot.repos.filter((repo) => !repo.isFork).length,
    firstYear: snapshot.firstYear,
    languages: [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    source: snapshot.source,
    lastSync: snapshot.fetchedAt,
  };
}

/** Re-syncs in the background when the cache has gone stale. */
export async function refreshIfStale(): Promise<void> {
  const stored = await getSetting<StoredStats>(STATS_KEY);
  const age = stored ? Date.now() - new Date(stored.lastSync).getTime() : Number.POSITIVE_INFINITY;

  if (age < config.github.syncIntervalMs) return;

  console.log('[sync] cache is stale, refreshing from GitHub…');
  await syncProjects().catch((error: unknown) => {
    console.error('[sync] failed:', (error as Error).message);
  });
}

/* -------------------------------------------------------------------------- */
/*  Reads                                                                     */
/* -------------------------------------------------------------------------- */

export async function listProjects(options: { includeHidden?: boolean; includeForks?: boolean } = {}): Promise<ProjectDto[]> {
  const includeHidden = options.includeHidden ? 1 : 0;
  const includeForks = options.includeForks === false ? 0 : 1;

  const result = await rows<ProjectRow>(
    `SELECT * FROM projects
      WHERE (? = 1 OR hidden = 0)
        AND (? = 1 OR is_fork = 0)
      ORDER BY pinned DESC, sort_order ASC, pushed_at DESC, name ASC`,
    [includeHidden, includeForks],
  );
  return result.map(toDto);
}

export async function getProject(id: string): Promise<ProjectDto | null> {
  const found = await rows<ProjectRow>('SELECT * FROM projects WHERE id = ?', [id]);
  const row = found[0];
  return row ? toDto(row) : null;
}

export async function getStats(): Promise<ProjectStats> {
  const stored = await getSetting<StoredStats>(STATS_KEY);
  const currentYear = new Date().getUTCFullYear();

  return {
    projects: stored?.projects ?? 0,
    commits: stored?.commits ?? null,
    stars: stored?.stars ?? 0,
    followers: stored?.followers ?? 0,
    yearsOfCode: stored?.firstYear ? Math.max(1, currentYear - stored.firstYear + 1) : null,
    languages: stored?.languages ?? [],
    lastSync: stored?.lastSync ?? null,
    source: stored?.source ?? null,
  };
}

export async function countProjects(): Promise<number> {
  const found = await rows<{ total: number }>('SELECT COUNT(*) AS total FROM projects');
  return Number(found[0]?.total ?? 0);
}

/* -------------------------------------------------------------------------- */
/*  Writes (admin)                                                            */
/* -------------------------------------------------------------------------- */

export interface ProjectPatch {
  pinned?: boolean;
  hidden?: boolean;
  sortOrder?: number;
  displayName?: string | null;
  customDescription?: string | null;
}

const PATCHABLE = {
  pinned: 'pinned',
  hidden: 'hidden',
  sortOrder: 'sort_order',
  displayName: 'display_name',
  customDescription: 'custom_description',
} as const;

export async function updateProject(id: string, patch: ProjectPatch): Promise<ProjectDto | null> {
  const assignments: string[] = [];
  const values: unknown[] = [];

  for (const [key, column] of Object.entries(PATCHABLE) as Array<[keyof ProjectPatch, string]>) {
    const value = patch[key];
    if (value === undefined) continue;
    assignments.push(`${column} = ?`);
    values.push(typeof value === 'boolean' ? Number(value) : value);
  }

  if (assignments.length > 0) {
    values.push(id);
    await exec(`UPDATE projects SET ${assignments.join(', ')} WHERE id = ?`, values);
  }

  return getProject(id);
}

/** Applies an explicit ordering; ids absent from the list keep their position. */
export async function reorderProjects(orderedIds: string[]): Promise<void> {
  if (orderedIds.length === 0) return;

  await transaction(async (conn) => {
    const values = orderedIds.map((id, index) => [index, id]);
    await conn.batch('UPDATE projects SET sort_order = ? WHERE id = ?', values);
  });
}
