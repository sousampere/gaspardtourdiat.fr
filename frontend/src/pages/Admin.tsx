import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';

import {
  AlertIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  PinIcon,
  RefreshIcon,
} from '../components/Icons';
import {
  ApiError,
  adminFetchProjects,
  adminReorderProjects,
  adminSync,
  adminUpdateProject,
  checkSession,
  login,
  logout,
  type Project,
  type ProjectPatch,
} from '../lib/api';
import { cx } from '../lib/cx';
import { formatNumber, formatRelative, languageColor } from '../lib/format';
import { AdminContent } from './AdminContent';

type Notice = { tone: 'ok' | 'error'; text: string } | null;

const TABS = [
  { id: 'projects', label: 'Projets' },
  { id: 'content', label: 'Contenu' },
] as const;

/* -------------------------------------------------------------------------- */
/*  Login                                                                     */
/* -------------------------------------------------------------------------- */

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      await login(username, password);
      onSuccess();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Connexion impossible');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="window-chrome overflow-hidden">
        <div className="flex items-center gap-3 border-b border-line bg-raised/50 px-3.5 py-2.5">
          <span className="font-mono text-xs text-muted">~/admin — authentification</span>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4 p-6">
          <div className="flex items-center gap-2 font-mono text-xs text-faint">
            <LockIcon className="size-3.5" />
            accès réservé
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] tracking-wide text-muted uppercase">
              utilisateur
            </span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
              className="rounded-lg border border-line bg-void/60 px-3 py-2 font-mono text-sm text-ink focus:border-acid/40 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] tracking-wide text-muted uppercase">
              mot de passe
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              className="rounded-lg border border-line bg-void/60 px-3 py-2 font-mono text-sm text-ink focus:border-acid/40 focus:outline-none"
            />
          </label>

          {error ? (
            <p className="flex items-center gap-2 rounded-lg border border-rose/30 bg-rose/5 px-3 py-2 font-mono text-xs text-rose">
              <AlertIcon className="size-4 shrink-0" />
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="rounded-lg border border-acid/35 bg-acid/10 px-4 py-2.5 font-mono text-sm text-acid transition-colors hover:bg-acid/20 disabled:opacity-50"
          >
            {busy ? 'connexion…' : 'se connecter'}
          </button>

          <p className="font-mono text-[11px] leading-relaxed text-faint">
            Identifiants définis par <span className="text-muted">ADMIN_USER</span> et{' '}
            <span className="text-muted">ADMIN_PASSWORD</span> dans le fichier{' '}
            <span className="text-muted">.env</span> à la racine du projet.
          </p>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Row                                                                       */
/* -------------------------------------------------------------------------- */

interface RowProps {
  project: Project;
  index: number;
  total: number;
  onPatch: (id: string, changes: ProjectPatch) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  busy: boolean;
}

function ProjectRow({ project, index, total, onPatch, onMove, busy }: RowProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project.displayName);
  const [description, setDescription] = useState(project.description ?? '');

  const reset = () => {
    setName(project.displayName);
    setDescription(project.description ?? '');
  };

  return (
    <li className={cx('border-b border-line last:border-b-0', project.hidden && 'opacity-55')}>
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <span className="w-8 shrink-0 font-mono text-[11px] text-faint tabular-nums">
          {String(index + 1).padStart(2, '0')}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {project.pinned ? <PinIcon className="size-3.5 shrink-0 text-acid" /> : null}
            <span className="truncate font-mono text-sm text-ink">{project.displayName}</span>
            {project.hidden ? (
              <span className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-faint uppercase">
                masqué
              </span>
            ) : null}
            {project.isFork ? (
              <span className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-faint uppercase">
                fork
              </span>
            ) : null}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-faint">
            {project.language ? (
              <span className="flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: languageColor(project.language) }}
                  aria-hidden="true"
                />
                {project.language}
              </span>
            ) : null}
            <span>{formatNumber(project.stars)}★</span>
            {formatRelative(project.pushedAt) ? (
              <span>{formatRelative(project.pushedAt)}</span>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            disabled={busy || index === 0}
            onClick={() => onMove(index, -1)}
            aria-label="Monter"
            className="rounded-md border border-line p-1.5 text-muted transition-colors hover:text-ink disabled:opacity-30"
          >
            <ChevronUpIcon className="size-3.5" />
          </button>
          <button
            type="button"
            disabled={busy || index === total - 1}
            onClick={() => onMove(index, 1)}
            aria-label="Descendre"
            className="rounded-md border border-line p-1.5 text-muted transition-colors hover:text-ink disabled:opacity-30"
          >
            <ChevronDownIcon className="size-3.5" />
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => onPatch(project.id, { pinned: !project.pinned })}
            aria-pressed={project.pinned}
            title={project.pinned ? 'Ne plus épingler' : 'Épingler'}
            className={cx(
              'rounded-md border p-1.5 transition-colors disabled:opacity-50',
              project.pinned
                ? 'border-acid/40 bg-acid/10 text-acid'
                : 'border-line text-muted hover:text-ink',
            )}
          >
            <PinIcon className="size-3.5" />
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => onPatch(project.id, { hidden: !project.hidden })}
            aria-pressed={project.hidden}
            title={project.hidden ? 'Afficher sur le site' : 'Masquer du site'}
            className={cx(
              'rounded-md border p-1.5 transition-colors disabled:opacity-50',
              project.hidden
                ? 'border-amber/40 bg-amber/10 text-amber'
                : 'border-line text-muted hover:text-ink',
            )}
          >
            {project.hidden ? <EyeOffIcon className="size-3.5" /> : <EyeIcon className="size-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => {
              if (editing) reset();
              setEditing((value) => !value);
            }}
            className={cx(
              'rounded-md border px-2.5 py-1.5 font-mono text-[11px] transition-colors',
              editing ? 'border-acid/40 text-acid' : 'border-line text-muted hover:text-ink',
            )}
          >
            {editing ? 'annuler' : 'éditer'}
          </button>
        </div>
      </div>

      {editing ? (
        <div className="flex flex-col gap-3 border-t border-line bg-void/40 px-4 py-4">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] tracking-wide text-muted uppercase">
              nom affiché
            </span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={project.name}
              className="rounded-lg border border-line bg-void/60 px-3 py-2 font-mono text-sm text-ink focus:border-acid/40 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] tracking-wide text-muted uppercase">
              description personnalisée
            </span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="Laisser vide pour utiliser la description GitHub."
              className="resize-y rounded-lg border border-line bg-void/60 px-3 py-2 text-sm text-ink focus:border-acid/40 focus:outline-none"
            />
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                onPatch(project.id, {
                  displayName: name.trim() || null,
                  customDescription: description.trim() || null,
                });
                setEditing(false);
              }}
              className="rounded-lg border border-acid/35 bg-acid/10 px-3 py-2 font-mono text-xs text-acid transition-colors hover:bg-acid/20 disabled:opacity-50"
            >
              enregistrer
            </button>
            <button
              type="button"
              onClick={() => {
                reset();
                setEditing(false);
              }}
              className="rounded-lg border border-line px-3 py-2 font-mono text-xs text-muted transition-colors hover:text-ink"
            >
              fermer
            </button>
            <span className="ml-auto font-mono text-[11px] text-faint">{project.fullName}</span>
          </div>
        </div>
      ) : null}
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/*  Dashboard                                                                 */
/* -------------------------------------------------------------------------- */

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [filter, setFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProjects(await adminFetchProjects());
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        onLogout();
        return;
      }
      setNotice({ tone: 'error', text: caught instanceof Error ? caught.message : 'Erreur' });
    } finally {
      setLoading(false);
    }
  }, [onLogout]);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = async (id: string, changes: ProjectPatch) => {
    setBusy(true);
    setNotice(null);
    try {
      const updated = await adminUpdateProject(id, changes);
      setProjects((previous) => previous.map((p) => (p.id === id ? updated : p)));
      setNotice({ tone: 'ok', text: `${updated.displayName} mis à jour.` });
    } catch (caught) {
      setNotice({
        tone: 'error',
        text: caught instanceof Error ? caught.message : 'Mise à jour impossible',
      });
    } finally {
      setBusy(false);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= projects.length) return;

    const reordered = [...projects];
    const moved = reordered[index];
    const swapped = reordered[target];
    if (!moved || !swapped) return;
    reordered[index] = swapped;
    reordered[target] = moved;

    // Optimistic: the list is the whole point of the interaction.
    setProjects(reordered);
    setBusy(true);

    try {
      setProjects(await adminReorderProjects(reordered.map((project) => project.id)));
    } catch (caught) {
      setNotice({
        tone: 'error',
        text: caught instanceof Error ? caught.message : 'Réordonnancement impossible',
      });
      void load();
    } finally {
      setBusy(false);
    }
  };

  const sync = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const result = await adminSync();
      setProjects(await adminFetchProjects());
      setNotice({
        tone: 'ok',
        text: `${result.repos} dépôts synchronisés en ${result.durationMs} ms (${result.source}).`,
      });
    } catch (caught) {
      setNotice({ tone: 'error', text: caught instanceof Error ? caught.message : 'Sync impossible' });
    } finally {
      setBusy(false);
    }
  };

  const hidden = projects.filter((project) => project.hidden).length;
  const pinned = projects.filter((project) => project.pinned).length;

  const needle = filter.trim().toLowerCase();
  const visible = needle
    ? projects.filter((project) =>
        `${project.displayName} ${project.fullName} ${project.language ?? ''}`
          .toLowerCase()
          .includes(needle),
      )
    : projects;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-mono text-xl font-semibold text-ink">Administration</h1>
          <p className="mt-1 font-mono text-[11px] text-faint">
            {projects.length} dépôts · {pinned} épinglé(s) · {hidden} masqué(s)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={sync}
            disabled={busy || loading}
            className="flex items-center gap-2 rounded-lg border border-acid/35 bg-acid/10 px-3 py-2 font-mono text-xs text-acid transition-colors hover:bg-acid/20 disabled:opacity-50"
          >
            <RefreshIcon className={cx('size-3.5', busy && 'animate-spin')} />
            synchroniser GitHub
          </button>
        </div>
      </div>

      {notice ? (
        <p
          role="status"
          className={cx(
            'rounded-lg border px-3 py-2 font-mono text-xs',
            notice.tone === 'ok'
              ? 'border-acid/30 bg-acid/5 text-acid'
              : 'border-rose/30 bg-rose/5 text-rose',
          )}
        >
          {notice.text}
        </p>
      ) : null}

      <div className="window-chrome overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-line bg-raised/50 px-4 py-2.5">
          <span className="font-mono text-xs text-muted">~/admin/projets</span>

          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="filtrer…"
            className="ml-auto w-40 rounded-md border border-line bg-void/60 px-2.5 py-1 font-mono text-[11px] text-ink placeholder:text-faint focus:border-acid/40 focus:outline-none"
          />
        </div>

        {loading ? (
          <p className="px-4 py-10 text-center font-mono text-xs text-faint">chargement…</p>
        ) : visible.length === 0 ? (
          <p className="px-4 py-10 text-center font-mono text-xs text-faint">
            {projects.length === 0
              ? "Aucun projet en cache. Lance une synchronisation GitHub."
              : 'Aucun résultat.'}
          </p>
        ) : (
          <ul>
            {visible.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                index={projects.indexOf(project)}
                total={projects.length}
                onPatch={patch}
                onMove={move}
                busy={busy}
              />
            ))}
          </ul>
        )}
      </div>

      <p className="font-mono text-[11px] leading-relaxed text-faint">
        Les projets épinglés remontent toujours en haut de la liste publique, quel que soit l'ordre.
        Masquer un projet le retire immédiatement du site sans le supprimer du cache. Une
        synchronisation GitHub n'écrase jamais ces réglages.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export function Admin() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<'projects' | 'content'>('projects');

  useEffect(() => {
    let cancelled = false;
    checkSession()
      .then((value) => {
        if (!cancelled) setAuthed(value);
      })
      .catch(() => {
        if (!cancelled) setAuthed(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Stable identity: `Dashboard` uses this inside a `useCallback` that drives
  // its data-loading effect, so a new function each render would loop forever.
  const signOut = useCallback(() => {
    void logout().finally(() => setAuthed(false));
  }, []);

  if (authed === null) {
    return (
      <p className="py-20 text-center font-mono text-xs text-faint">vérification de la session…</p>
    );
  }

  if (!authed) {
    return (
      <div className="py-6">
        <LoginForm onSuccess={() => setAuthed(true)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div
        role="tablist"
        aria-label="Sections de l'administration"
        className="flex flex-wrap items-center gap-1.5 rounded-xl border border-line bg-raised/40 p-1.5"
      >
        {TABS.map((entry) => (
          <button
            key={entry.id}
            role="tab"
            type="button"
            aria-selected={tab === entry.id}
            onClick={() => setTab(entry.id)}
            className={cx(
              'rounded-lg px-3 py-1.5 font-mono text-xs transition-colors',
              tab === entry.id
                ? 'bg-acid/10 text-acid'
                : 'text-muted hover:bg-void/40 hover:text-ink',
            )}
          >
            {entry.label}
          </button>
        ))}

        <button
          type="button"
          onClick={signOut}
          className="ml-auto rounded-lg border border-line px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:text-ink"
        >
          déconnexion
        </button>
      </div>

      {tab === 'projects' ? <Dashboard onLogout={signOut} /> : <AdminContent />}
    </div>
  );
}
