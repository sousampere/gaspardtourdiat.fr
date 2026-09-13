import { useMemo, useState } from 'react';

import { AlertIcon, RefreshIcon, SearchIcon } from '../components/Icons';
import { ProjectCard } from '../components/ProjectCard';
import { Reveal } from '../components/Reveal';
import { SectionHeading } from '../components/SectionHeading';
import { Window } from '../components/Window';
import { useProjects } from '../hooks/useApi';
import { cx } from '../lib/cx';
import { formatRelative, languageColor } from '../lib/format';

type SortKey = 'default' | 'stars' | 'recent' | 'name';

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: 'default', label: 'par défaut' },
  { key: 'stars', label: 'étoiles' },
  { key: 'recent', label: 'récents' },
  { key: 'name', label: 'a → z' },
];

function SkeletonCard() {
  return (
    <div className="window-chrome flex h-full flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b border-line bg-raised/50 px-3.5 py-2.5">
        <span className="h-3 w-28 animate-pulse rounded bg-line" />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <span className="h-4 w-40 animate-pulse rounded bg-line" />
        <span className="h-3 w-full animate-pulse rounded bg-line/70" />
        <span className="h-3 w-3/4 animate-pulse rounded bg-line/70" />
        <span className="mt-auto h-3 w-32 animate-pulse rounded bg-line/70" />
      </div>
    </div>
  );
}

export function Projects() {
  const [search, setSearch] = useState('');
  const [language, setLanguage] = useState<string | null>(null);
  const [showForks, setShowForks] = useState(false);
  const [sort, setSort] = useState<SortKey>('default');

  const { data, loading, error, reload } = useProjects({ forks: showForks });

  const projects = useMemo(() => data ?? [], [data]);

  const languages = useMemo(() => {
    const counts = new Map<string, number>();
    for (const project of projects) {
      if (!project.language) continue;
      counts.set(project.language, (counts.get(project.language) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, [projects]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();

    const filtered = projects.filter((project) => {
      if (language && project.language !== language) return false;
      if (!needle) return true;
      return [project.displayName, project.name, project.description ?? '', ...project.topics]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });

    if (sort === 'default') return filtered;

    // Pinned repositories keep the top spot whatever the sort.
    return [...filtered].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (sort === 'stars') return b.stars - a.stars;
      if (sort === 'name') return a.displayName.localeCompare(b.displayName, 'fr');
      return (b.pushedAt ?? '').localeCompare(a.pushedAt ?? '');
    });
  }, [projects, search, language, sort]);

  const filtersActive = search.trim().length > 0 || language !== null || showForks;

  return (
    <div className="flex flex-col gap-8">
      <SectionHeading index={0} title="Projets" />

      {/* ---- Controls ---------------------------------------------------- */}
      <Reveal>
        <Window title="~/projets — filtres" flush>
          <div className="flex flex-col gap-4 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="relative flex flex-1 items-center">
                <SearchIcon className="absolute left-3 size-4 text-faint" />
                <span className="sr-only">Rechercher un projet</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechercher un projet, un topic…"
                  className="w-full rounded-lg border border-line bg-void/60 py-2 pr-3 pl-9 font-mono text-sm text-ink placeholder:text-faint focus:border-acid/40 focus:outline-none"
                />
              </label>

              <div className="flex items-center gap-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-void/60 px-3 py-2 font-mono text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={showForks}
                    onChange={(event) => setShowForks(event.target.checked)}
                    className="size-3.5 accent-[var(--color-acid)]"
                  />
                  inclure les forks
                </label>

                <button
                  type="button"
                  onClick={reload}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg border border-line bg-void/60 px-3 py-2 font-mono text-xs text-muted transition-colors hover:text-ink disabled:opacity-50"
                >
                  <RefreshIcon className={cx('size-3.5', loading && 'animate-spin')} />
                  rafraîchir
                </button>
              </div>
            </div>

            {languages.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setLanguage(null)}
                  className={cx(
                    'rounded-md border px-2 py-1 font-mono text-[11px] transition-colors',
                    language === null
                      ? 'border-acid/40 bg-acid/10 text-acid'
                      : 'border-line text-muted hover:text-ink',
                  )}
                >
                  tous
                </button>

                {languages.map((entry) => (
                  <button
                    key={entry.name}
                    type="button"
                    onClick={() => setLanguage(language === entry.name ? null : entry.name)}
                    className={cx(
                      'flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[11px] transition-colors',
                      language === entry.name
                        ? 'border-acid/40 bg-acid/10 text-acid'
                        : 'border-line text-muted hover:text-ink',
                    )}
                  >
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: languageColor(entry.name) }}
                      aria-hidden="true"
                    />
                    {entry.name}
                    <span className="text-faint">{entry.count}</span>
                  </button>
                ))}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[11px] text-faint">tri :</span>
                {SORTS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSort(option.key)}
                    className={cx(
                      'rounded-md px-2 py-1 font-mono text-[11px] transition-colors',
                      sort === option.key
                        ? 'bg-raised text-ink'
                        : 'text-muted hover:text-ink',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <p className="font-mono text-[11px] text-faint" aria-live="polite">
                {loading ? 'chargement…' : `${visible.length} projet(s) affiché(s)`}
                {filtersActive && !loading ? ` sur ${projects.length}` : ''}
              </p>
            </div>
          </div>
        </Window>
      </Reveal>

      {/* ---- Results ----------------------------------------------------- */}
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((key) => (
            <SkeletonCard key={key} />
          ))}
        </div>
      ) : error ? (
        <Reveal>
          <Window title="~/projets — erreur">
            <div className="flex flex-col items-start gap-3">
              <p className="flex items-center gap-2 font-mono text-sm text-rose">
                <AlertIcon className="size-4" />
                {error}
              </p>
              <p className="text-sm text-muted">
                L'API ne répond pas. La liste complète reste consultable sur{' '}
                <a
                  href="https://github.com/sousampere"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-acid underline decoration-acid/40 underline-offset-2"
                >
                  GitHub
                </a>
                .
              </p>
              <button
                type="button"
                onClick={reload}
                className="rounded-lg border border-line bg-panel/60 px-3 py-2 font-mono text-xs text-muted transition-colors hover:text-ink"
              >
                réessayer
              </button>
            </div>
          </Window>
        </Reveal>
      ) : visible.length === 0 ? (
        <Reveal>
          <Window title="~/projets — vide">
            <p className="font-mono text-sm text-muted">
              Aucun projet ne correspond à ces filtres.
            </p>
            {filtersActive ? (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setLanguage(null);
                  setShowForks(false);
                }}
                className="mt-3 rounded-lg border border-line bg-panel/60 px-3 py-2 font-mono text-xs text-muted transition-colors hover:text-ink"
              >
                réinitialiser les filtres
              </button>
            ) : null}
          </Window>
        </Reveal>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((project, index) => (
            <Reveal key={project.id} delay={Math.min(index, 8) * 45} className="h-full">
              <ProjectCard project={project} />
            </Reveal>
          ))}
        </div>
      )}

      {!loading && !error && projects.length > 0 ? (
        <p className="text-center font-mono text-[11px] text-faint">
          Dernier push sur GitHub{' '}
          {formatRelative(
            projects.reduce<string | null>(
              (newest, project) =>
                project.pushedAt && (!newest || project.pushedAt > newest) ? project.pushedAt : newest,
              null,
            ),
          ) ?? 'récemment'}
          .
        </p>
      ) : null}
    </div>
  );
}
