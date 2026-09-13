import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { aboutIntro, education, languages, notCoding, passions, school42 } from './about';
import type { AboutIntro, LanguageLevel, NotCoding, Passion, School42, TimelineEntry } from './about';
import { fallbackStats, profile, skillGroups, socials } from './profile';
import type { FallbackStats, Profile, SkillGroup, SocialLink } from './profile';
import { fetchSettings } from '../lib/api';

export interface SiteContent {
  profile: Profile;
  socials: SocialLink[];
  skillGroups: SkillGroup[];
  fallbackStats: FallbackStats;
  aboutIntro: AboutIntro;
  education: TimelineEntry[];
  school42: School42;
  passions: Passion[];
  languages: LanguageLevel[];
  notCoding: NotCoding;
}

/** The values compiled into the bundle, used whenever no override exists. */
export const defaultContent: SiteContent = {
  profile,
  socials,
  skillGroups,
  fallbackStats,
  aboutIntro,
  education,
  school42,
  passions,
  languages,
  notCoding,
};

/**
 * Segments that would reach `Object.prototype` when walked as a path. The API
 * rejects these too; this is the second half of the same guard.
 */
const FORBIDDEN_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Copies `base` and writes each override in place.
 *
 * A path is only applied if its parent exists and the leaf is a property the
 * defaults already define — so the shape of the content is fixed at build time
 * and a stored key can never introduce a new field or a prototype key.
 */
export function applyOverrides(
  base: SiteContent,
  overrides: Record<string, unknown>,
): SiteContent {
  const next = structuredClone(base) as unknown as Record<string, unknown>;
  const root = next as Record<string, unknown>;

  for (const [path, value] of Object.entries(overrides)) {
    const segments = path.split('.');
    if (segments.some((segment) => FORBIDDEN_SEGMENTS.has(segment))) continue;

    let cursor: Record<string, unknown> = root;
    let reachable = true;

    for (let index = 0; index < segments.length - 1; index++) {
      const child = cursor[segments[index]!];
      if (typeof child !== 'object' || child === null || Array.isArray(child)) {
        reachable = false;
        break;
      }
      cursor = child as Record<string, unknown>;
    }
    if (!reachable) continue;

    const leaf = segments[segments.length - 1]!;
    if (!Object.prototype.hasOwnProperty.call(cursor, leaf)) continue;

    cursor[leaf] = value;
  }

  return next as unknown as SiteContent;
}

/**
 * Defaults are the initial value, so the first paint never waits on the
 * network and a failed request simply leaves the shipped content on screen.
 */
const SiteContentContext = createContext<SiteContent>(defaultContent);

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Record<string, unknown>>({});

  useEffect(() => {
    let cancelled = false;

    fetchSettings()
      .then((settings) => {
        if (!cancelled) setOverrides(settings);
      })
      .catch(() => {
        // The defaults are already rendered; nothing to recover from.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => applyOverrides(defaultContent, overrides), [overrides]);

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

/** The site's text content, with any admin overrides already applied. */
export function useSiteContent(): SiteContent {
  return useContext(SiteContentContext);
}
