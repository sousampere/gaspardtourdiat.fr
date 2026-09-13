/**
 * Editable site content.
 *
 * The TypeScript files under `frontend/src/content/` hold the defaults. This
 * table holds *only the fields the admin has changed*, addressed by dotted path
 * (`profile.tagline`, `aboutIntro.city`, …). A key that is absent here falls
 * back to the value compiled into the frontend, so wiping this table restores
 * the original site exactly.
 */

import { exec, rows, setSetting } from './db.js';

/** A dotted path: `profile.status`, `notCoding.alternatives`, … */
const KEY_PATTERN = /^[a-z][a-zA-Z0-9]*(?:\.[a-zA-Z0-9]+)*$/;
const MAX_KEY_LENGTH = 64;

/**
 * Segments that would let a crafted key reach `Object.prototype` when the
 * frontend applies the override onto the defaults. Rejected here as well as
 * there — the write path is admin-only, but there is no reason to store them.
 */
const FORBIDDEN_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype']);

export type ContentSettings = Record<string, unknown>;

/** Throws a message safe to return to the admin panel when a key is unusable. */
export function assertValidKey(key: string): void {
  if (key.length === 0 || key.length > MAX_KEY_LENGTH) {
    throw new BadSetting(`Clé invalide (1 à ${MAX_KEY_LENGTH} caractères) : ${key}`);
  }
  if (!KEY_PATTERN.test(key)) {
    throw new BadSetting(`Clé invalide : ${key}`);
  }
  for (const segment of key.split('.')) {
    if (FORBIDDEN_SEGMENTS.has(segment)) {
      throw new BadSetting(`Clé interdite : ${key}`);
    }
  }
}

export class BadSetting extends Error {}

function assertValidValue(key: string, value: unknown): void {
  if (value === undefined) {
    throw new BadSetting(`Valeur manquante pour ${key}`);
  }
  let encoded: string;
  try {
    encoded = JSON.stringify(value);
  } catch {
    throw new BadSetting(`Valeur non sérialisable pour ${key}`);
  }
  if (encoded === undefined) {
    throw new BadSetting(`Valeur non sérialisable pour ${key}`);
  }
  if (encoded.length > 32_000) {
    throw new BadSetting(`Valeur trop longue pour ${key} (max 32 000 caractères)`);
  }
}

const KEY_PREFIX = 'content.';

/** Every override currently stored, as a flat `{ path: value }` map. */
export async function listContentSettings(): Promise<ContentSettings> {
  const found = await rows<{ key: string; value: string }>(
    'SELECT `key`, `value` FROM settings WHERE `key` LIKE ?',
    [`${KEY_PREFIX}%`],
  );

  const settings: ContentSettings = {};
  for (const row of found) {
    try {
      settings[row.key.slice(KEY_PREFIX.length)] = JSON.parse(row.value);
    } catch {
      // A value we cannot parse is a value we cannot use; skip it rather than
      // failing the whole page for one corrupt row.
      console.warn(`[settings] valeur illisible pour ${row.key}, ignorée`);
    }
  }
  return settings;
}

/**
 * Upserts the given paths. `null` clears the override, so the field falls back
 * to its compiled default. Returns the resulting full map.
 */
export async function saveContentSettings(patch: ContentSettings): Promise<ContentSettings> {
  const keys = Object.keys(patch);
  if (keys.length === 0) throw new BadSetting('Aucun réglage fourni');

  for (const key of keys) {
    assertValidKey(key);
    assertValidValue(key, patch[key]);
  }

  for (const key of keys) {
    const value = patch[key];
    if (value === null) {
      await deleteContentSetting(key);
      continue;
    }
    await setSetting(`content.${key}`, value);
  }

  return listContentSettings();
}

export async function deleteContentSetting(key: string): Promise<void> {
  assertValidKey(key);
  await exec('DELETE FROM settings WHERE `key` = ?', [`content.${key}`]);
}
