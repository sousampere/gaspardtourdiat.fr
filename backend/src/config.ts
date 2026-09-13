/**
 * Centralised, validated environment configuration.
 * Every other module reads its settings from here so that a missing variable
 * fails loudly at boot instead of silently at request time.
 */

function str(name: string, fallback?: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) throw new Error(`Environment variable ${name} must be a number, got "${raw}"`);
  return parsed;
}

const isProduction = (process.env.NODE_ENV ?? 'development') === 'production';

/** Secrets that are convenient in development but dangerous in production. */
function secret(name: string, devFallback: string): string {
  const value = process.env[name];
  if (value && value.length > 0) return value;
  if (isProduction) {
    throw new Error(
      `${name} must be set in production. Generate one with: openssl rand -hex 32`,
    );
  }
  console.warn(`[config] ${name} is not set — falling back to an insecure development value.`);
  return devFallback;
}

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction,
  port: num('PORT', 3000),

  /** Value used to sign admin session cookies. */
  jwtSecret: secret('JWT_SECRET', 'dev-only-insecure-jwt-secret'),
  adminUser: process.env.ADMIN_USER ?? 'admin',
  adminPassword: secret('ADMIN_PASSWORD', 'admin'),

  github: {
    username: process.env.GITHUB_USERNAME ?? 'sousampere',
    token: process.env.GITHUB_TOKEN ?? '',
    syncIntervalMs: num('SYNC_INTERVAL_HOURS', 6) * 60 * 60 * 1000,
  },

  db: {
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: num('DB_PORT', 3306),
    user: process.env.DB_USER ?? 'gtd',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'gaspardtourdiat',
  },

  sessionTtlSeconds: 12 * 60 * 60,
} as const;

if (!config.github.token) {
  console.warn(
    '[config] GITHUB_TOKEN is empty — falling back to the unauthenticated GitHub API ' +
      '(60 requests/hour) and commit statistics will be unavailable.',
  );
}
