const BASE = import.meta.env.VITE_API_BASE ?? '/api';

export interface Project {
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

export interface Stats {
  projects: number;
  commits: number | null;
  stars: number;
  followers: number;
  yearsOfCode: number | null;
  languages: Array<{ name: string; count: number }>;
  lastSync: string | null;
  source: 'graphql' | 'rest' | null;
  cachedProjects?: number;
}

export interface ProjectPatch {
  pinned?: boolean;
  hidden?: boolean;
  sortOrder?: number;
  displayName?: string | null;
  customDescription?: string | null;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      credentials: 'include',
      ...init,
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    });
  } catch {
    // fetch only rejects on network-level failures, which here means the API
    // container is unreachable rather than the request being refused.
    throw new ApiError('API injoignable', 0);
  }

  if (response.status === 204) return undefined as T;

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
        ? payload.error
        : `Erreur ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return payload as T;
}

/* --- public ---------------------------------------------------------------- */

export async function fetchProjects(options: { forks?: boolean } = {}): Promise<Project[]> {
  const query = options.forks ? '?forks=true' : '';
  const data = await request<{ projects: Project[] }>(`/projects${query}`);
  return data.projects;
}

export function fetchStats(): Promise<Stats> {
  return request<Stats>('/stats');
}

/**
 * Admin overrides for the site's text content, keyed by dotted path. Only the
 * fields that were changed appear; the rest fall back to the compiled defaults.
 */
export async function fetchSettings(): Promise<Record<string, unknown>> {
  const data = await request<{ settings: Record<string, unknown> }>('/settings');
  return data.settings;
}

/* --- auth ------------------------------------------------------------------ */

export async function login(username: string, password: string): Promise<void> {
  await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function logout(): Promise<void> {
  await request('/auth/logout', { method: 'POST' });
}

export async function checkSession(): Promise<boolean> {
  const data = await request<{ authenticated: boolean }>('/auth/me');
  return data.authenticated;
}

/* --- admin ----------------------------------------------------------------- */

export async function adminFetchProjects(): Promise<Project[]> {
  const data = await request<{ projects: Project[] }>('/admin/projects');
  return data.projects;
}

export async function adminUpdateProject(id: string, patch: ProjectPatch): Promise<Project> {
  const data = await request<{ project: Project }>(`/admin/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  return data.project;
}

export async function adminReorderProjects(ids: string[]): Promise<Project[]> {
  const data = await request<{ projects: Project[] }>('/admin/projects/reorder', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
  return data.projects;
}

export async function adminSync(): Promise<{ repos: number; source: string; durationMs: number }> {
  const data = await request<{
    result: { repos: number; source: string; durationMs: number };
    projects: Project[];
  }>('/admin/sync', { method: 'POST' });
  return data.result;
}

export async function adminFetchSettings(): Promise<Record<string, unknown>> {
  const data = await request<{ settings: Record<string, unknown> }>('/admin/settings');
  return data.settings;
}

/** Partial update; a `null` value clears the override and restores the default. */
export async function adminSaveSettings(
  patch: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const data = await request<{ settings: Record<string, unknown> }>('/admin/settings', {
    method: 'PUT',
    body: JSON.stringify({ settings: patch }),
  });
  return data.settings;
}

export async function adminResetSetting(key: string): Promise<Record<string, unknown>> {
  const data = await request<{ settings: Record<string, unknown> }>(
    `/admin/settings/${encodeURIComponent(key)}`,
    { method: 'DELETE' },
  );
  return data.settings;
}
