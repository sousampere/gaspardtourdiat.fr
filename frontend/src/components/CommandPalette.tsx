import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { ArrowRightIcon, ExternalIcon, SearchIcon } from './Icons';
import { useSiteContent } from '../content/SiteContent';
import { cx } from '../lib/cx';

interface Action {
  id: string;
  label: string;
  hint: string;
  group: 'Pages' | 'Liens';
  external: boolean;
  run: () => void;
}

/** Case- and accent-insensitive so "a propos" matches "à propos". */
function normalise(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { socials } = useSiteContent();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const actions = useMemo<Action[]>(() => {
    const pages: Action[] = [
      { id: 'home', path: '/', label: 'Accueil', hint: 'Présentation, compétences, terminal' },
      { id: 'projects', path: '/projects', label: 'Projets', hint: 'Tout ce qui vient de GitHub' },
      { id: 'about', path: '/about', label: 'À propos', hint: 'Parcours, 42, passions, langues' },
      { id: 'contact', path: '/contact', label: 'Contact', hint: 'LinkedIn, GitHub, e-mail' },
    ].map(
      (page): Action => ({
        id: page.id,
        label: page.label,
        hint: page.hint,
        group: 'Pages',
        external: false,
        run: () => navigate(page.path),
      }),
    );

    const links: Action[] = socials.map(
      (social): Action => ({
        id: social.id,
        label: social.label,
        hint: social.description,
        group: 'Liens',
        external: social.external,
        run: () => {
          if (social.external) window.open(social.href, '_blank', 'noopener,noreferrer');
          else if (social.href.startsWith('mailto:')) window.location.href = social.href;
          else navigate(social.href);
        },
      }),
    );

    return [...pages, ...links];
  }, [navigate, socials]);

  const results = useMemo(() => {
    const needle = normalise(query.trim());
    if (!needle) return actions;
    return actions.filter(
      (action) =>
        normalise(action.label).includes(needle) || normalise(action.hint).includes(needle),
    );
  }, [actions, query]);

  // Reset the query and refocus each time the palette opens.
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  // Keep the highlighted row in view when arrowing past the visible window.
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  const runAt = (index: number) => {
    const action = results[index];
    if (!action) return;
    onClose();
    action.run();
  };

  const onKeyDown = (event: ReactKeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((value) => (results.length === 0 ? 0 : (value + 1) % results.length));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((value) => (results.length === 0 ? 0 : (value - 1 + results.length) % results.length));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      runAt(active);
    }
  };

  let lastGroup: Action['group'] | null = null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh]"
      onKeyDown={onKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Palette de commandes"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-void/80 backdrop-blur-md"
      />

      <div className="window-chrome relative w-full max-w-xl overflow-hidden">
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <SearchIcon className="size-4 shrink-0 text-faint" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            placeholder="Où veux-tu aller ?"
            aria-label="Rechercher"
            className="w-full bg-transparent font-mono text-sm text-ink placeholder:text-faint focus:outline-none"
          />
          <kbd className="hidden shrink-0 rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-faint sm:block">
            esc
          </kbd>
        </div>

        <ul ref={listRef} className="max-h-[52vh] overflow-y-auto p-2" role="listbox">
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center font-mono text-xs text-faint">
              Aucun résultat pour « {query} »
            </li>
          ) : (
            results.map((action, index) => {
              const header = action.group !== lastGroup ? action.group : null;
              lastGroup = action.group;

              return (
                <li key={action.id}>
                  {header ? (
                    <div className="px-3 pt-3 pb-1.5 font-mono text-[10px] tracking-widest text-faint uppercase">
                      {header}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    role="option"
                    aria-selected={index === active}
                    data-active={index === active}
                    onMouseMove={() => setActive(index)}
                    onClick={() => runAt(index)}
                    className={cx(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                      index === active ? 'bg-acid/10 text-ink' : 'text-muted hover:bg-raised',
                    )}
                  >
                    <span
                      className={cx(
                        'font-mono text-xs',
                        index === active ? 'text-acid' : 'text-faint',
                      )}
                    >
                      {index === active ? '▸' : '·'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-mono text-sm">{action.label}</span>
                      <span className="block truncate text-xs text-faint">{action.hint}</span>
                    </span>
                    {action.external ? (
                      <ExternalIcon className="size-3.5 shrink-0 text-faint" />
                    ) : (
                      <ArrowRightIcon className="size-3.5 shrink-0 text-faint" />
                    )}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
