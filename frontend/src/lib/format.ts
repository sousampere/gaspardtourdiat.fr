const numberFormatter = new Intl.NumberFormat('fr-FR');
const compactFormatter = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 });

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/** 1240 → « 1,2 k ». Used where space is tight. */
export function formatCompact(value: number): string {
  return value < 1000 ? numberFormatter.format(value) : compactFormatter.format(value);
}

const relativeFormatter = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' });

const UNITS: Array<{ limit: number; unit: Intl.RelativeTimeFormatUnit; ms: number }> = [
  { limit: 60_000, unit: 'second', ms: 1000 },
  { limit: 3_600_000, unit: 'minute', ms: 60_000 },
  { limit: 86_400_000, unit: 'hour', ms: 3_600_000 },
  { limit: 2_592_000_000, unit: 'day', ms: 86_400_000 },
  { limit: 31_536_000_000, unit: 'month', ms: 2_592_000_000 },
  { limit: Number.POSITIVE_INFINITY, unit: 'year', ms: 31_536_000_000 },
];

/** « il y a 3 jours », « hier »… Renvoie `null` si la date est absente/invalide. */
export function formatRelative(iso: string | null): string | null {
  if (!iso) return null;
  const timestamp = new Date(iso).getTime();
  if (Number.isNaN(timestamp)) return null;

  const elapsed = timestamp - Date.now();
  const magnitude = Math.abs(elapsed);

  for (const entry of UNITS) {
    if (magnitude < entry.limit) {
      return relativeFormatter.format(Math.round(elapsed / entry.ms), entry.unit);
    }
  }
  return null;
}

export function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(date);
}

/**
 * Roughly GitHub's own language colours, so a dot reads as the right colour to
 * anyone used to the GitHub UI.
 */
const LANGUAGE_COLORS: Record<string, string> = {
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  Go: '#00ADD8',
  Haskell: '#5e5086',
  Java: '#b07219',
  JavaScript: '#f1e05a',
  Kotlin: '#A97BFF',
  Lua: '#000080',
  Makefile: '#427819',
  PHP: '#4F5D95',
  Python: '#3572A5',
  Ruby: '#701516',
  Rust: '#dea584',
  Shell: '#89e051',
  Swift: '#F05138',
  TypeScript: '#3178c6',
  Vue: '#41b883',
  Zig: '#ec915c',
};

export function languageColor(language: string | null): string {
  if (!language) return '#4a5e6b';
  return LANGUAGE_COLORS[language] ?? '#7d93a1';
}

/** Turns `my_cool-project` into `my cool project` for display fallbacks. */
export function humaniseName(name: string): string {
  return name.replace(/[-_]+/g, ' ').trim();
}
