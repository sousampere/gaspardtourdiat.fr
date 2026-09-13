import mariadb from 'mariadb';
import type { Pool, PoolConnection } from 'mariadb';
import { config } from './config.js';

export const pool: Pool = mariadb.createPool({
  ...config.db,
  connectionLimit: 8,
  acquireTimeout: 15_000,
  // MariaDB returns BIGINT as a JS number by default, which is lossless for the
  // values we store (GitHub repo ids are well below 2^53) so no cast is needed.
  bigIntAsNumber: false,
  insertIdAsNumber: false,
  // Dates are stored and read as naive UTC strings. Formatting them ourselves
  // keeps the API output identical whatever the server's local timezone is.
  dateStrings: true,
});

/** Rows come back as a mix of result sets and OkPackets; this narrows to rows. */
export async function rows<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const result = await pool.query(sql, params);
  return (Array.isArray(result) ? result : []) as T[];
}

export async function exec(sql: string, params: unknown[] = []): Promise<void> {
  await pool.query(sql, params);
}

/** Runs `fn` inside a transaction, rolling back on any thrown error. */
export async function transaction<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

/**
 * Blocks until MariaDB accepts queries. Compose already gates the API behind the
 * database healthcheck, but a restart of the db container can still race us.
 */
export async function waitForDatabase(attempts = 30, delayMs = 2_000): Promise<void> {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const conn = await pool.getConnection();
      await conn.ping();
      conn.release();
      return;
    } catch (error) {
      if (attempt === attempts) throw error;
      console.log(`[db] not ready (attempt ${attempt}/${attempts}), retrying in ${delayMs}ms…`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

export async function ensureSchema(): Promise<void> {
  await exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id                 BIGINT UNSIGNED NOT NULL,
      name               VARCHAR(255)    NOT NULL,
      full_name          VARCHAR(255)    NOT NULL,
      description        TEXT            NULL,
      url                VARCHAR(512)    NOT NULL,
      homepage           VARCHAR(512)    NULL,
      language           VARCHAR(64)     NULL,
      topics             JSON            NULL,
      stars              INT UNSIGNED    NOT NULL DEFAULT 0,
      forks              INT UNSIGNED    NOT NULL DEFAULT 0,
      is_fork            TINYINT(1)      NOT NULL DEFAULT 0,
      is_archived        TINYINT(1)      NOT NULL DEFAULT 0,
      created_at         DATETIME        NULL,
      pushed_at          DATETIME        NULL,
      -- Below this line lives the administration panel's opinion; a GitHub
      -- re-sync must never overwrite it.
      pinned             TINYINT(1)      NOT NULL DEFAULT 0,
      hidden             TINYINT(1)      NOT NULL DEFAULT 0,
      sort_order         INT             NOT NULL DEFAULT 0,
      display_name       VARCHAR(255)    NULL,
      custom_description TEXT            NULL,
      synced_at          DATETIME        NOT NULL,
      PRIMARY KEY (id),
      KEY idx_listing (hidden, pinned, sort_order),
      KEY idx_full_name (full_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await exec(`
    CREATE TABLE IF NOT EXISTS settings (
      \`key\`      VARCHAR(64) NOT NULL,
      \`value\`    LONGTEXT    NOT NULL,
      updated_at DATETIME    NOT NULL,
      PRIMARY KEY (\`key\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function getSetting<T>(key: string): Promise<T | null> {
  const found = await rows<{ value: string }>('SELECT `value` FROM settings WHERE `key` = ?', [key]);
  if (found.length === 0) return null;
  try {
    return JSON.parse(found[0]!.value) as T;
  } catch {
    return null;
  }
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await exec(
    'INSERT INTO settings (`key`, `value`, updated_at) VALUES (?, ?, NOW()) ' +
      'ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), updated_at = NOW()',
    [key, JSON.stringify(value)],
  );
}

export async function closePool(): Promise<void> {
  await pool.end();
}
