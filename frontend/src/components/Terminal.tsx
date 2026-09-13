import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { useSiteContent } from '../content/SiteContent';
import type { Project, Stats } from '../lib/api';
import { formatNumber } from '../lib/format';
import { cx } from '../lib/cx';

type LineKind = 'input' | 'output' | 'error' | 'success' | 'muted';

interface Line {
  id: number;
  kind: LineKind;
  text: string;
}

const PROMPT = 'visiteur@tourdiat:~$';

const BOOT: Array<{ kind: LineKind; text: string }> = [
  { kind: 'muted', text: 'gtd-shell 1.0.0 — tape « help » pour la liste des commandes.' },
];

const COMMANDS = [
  'help',
  'whoami',
  'ls',
  'cat',
  'projects',
  'stats',
  'goto',
  'social',
  'date',
  'echo',
  'neofetch',
  'clear',
  'sudo',
  'exit',
] as const;

const CAT_FILES = ['about.md', 'skills.txt', 'contact.txt'] as const;
const GOTO_PAGES = ['home', 'projects', 'about', 'contact'] as const;

const PAGES: Record<(typeof GOTO_PAGES)[number], string> = {
  home: '/',
  projects: '/projects',
  about: '/about',
  contact: '/contact',
};

const NEOFETCH_ART = [
  '   ▄▄▄▄▄▄▄▄▄▄▄▄   ',
  '  █  ▄▄▄▄▄▄  █   ',
  '  █  █ >_   █ █  ',
  '  █  █      █ █  ',
  '  █  ▀▀▀▀▀▀  █   ',
  '   ▀▀▀▀▀▀▀▀▀▀▀▀   ',
];

interface TerminalProps {
  projects: Project[] | null;
  stats: Stats | null;
}

export function Terminal({ projects, stats }: TerminalProps) {
  const navigate = useNavigate();
  const { profile, skillGroups, socials, aboutIntro } = useSiteContent();
  const [lines, setLines] = useState<Line[]>(() =>
    BOOT.map((line, index) => ({ id: index, kind: line.kind, text: line.text })),
  );
  const [value, setValue] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [focused, setFocused] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(BOOT.length);

  const push = useCallback((entries: Array<{ kind: LineKind; text: string }>) => {
    setLines((previous) => {
      const appended = entries.map((entry) => ({ ...entry, id: nextId.current++ }));
      const combined = [...previous, ...appended];
      // A long session shouldn't grow the DOM without bound.
      return combined.length > 250 ? combined.slice(combined.length - 250) : combined;
    });
  }, []);

  // Pin the view to the newest line whenever output is appended.
  useEffect(() => {
    const node = scrollerRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [lines]);

  const skillsLine = useMemo(
    () => skillGroups.map((group) => `${group.label}: ${group.items.map((s) => s.name).join(', ')}`).join('\n'),
    [skillGroups],
  );

  const run = useCallback(
    (raw: string) => {
      const input = raw.trim();
      if (!input) return;

      push([{ kind: 'input', text: `${PROMPT} ${input}` }]);
      setHistory((previous) => [...previous, input]);
      setHistoryIndex(-1);

      const [command = '', ...args] = input.split(/\s+/);
      const argument = args.join(' ');
      const out: Array<{ kind: LineKind; text: string }> = [];

      switch (command.toLowerCase()) {
        case 'help':
          out.push(
            { kind: 'output', text: 'Commandes disponibles :' },
            { kind: 'muted', text: '  whoami              qui suis-je' },
            { kind: 'muted', text: '  ls                  fichiers du dossier courant' },
            { kind: 'muted', text: '  cat <fichier>       about.md · skills.txt · contact.txt' },
            { kind: 'muted', text: '  projects            quelques projets récents' },
            { kind: 'muted', text: '  stats               chiffres en direct depuis GitHub' },
            { kind: 'muted', text: '  goto <page>         home · projects · about · contact' },
            { kind: 'muted', text: '  social              ouvrir mon GitHub' },
            { kind: 'muted', text: '  neofetch            fiche système' },
            { kind: 'muted', text: '  echo <texte>        répète le texte' },
            { kind: 'muted', text: '  date                date du jour' },
            { kind: 'muted', text: '  clear               vider l’écran' },
            { kind: 'muted', text: '  sudo                ne tente pas' },
          );
          break;

        case 'whoami':
          out.push(
            { kind: 'success', text: `${profile.fullName} — ${profile.role}` },
            { kind: 'output', text: profile.tagline },
            { kind: 'muted', text: `Basé à ${profile.location}.` },
          );
          break;

        case 'ls':
          out.push({ kind: 'output', text: 'about.md   skills.txt   contact.txt   projects/' });
          break;

        case 'cat': {
          if (!argument) {
            out.push({ kind: 'error', text: 'cat : précise un fichier. Essaie « ls ».' });
            break;
          }
          switch (argument) {
            case 'about.md':
              out.push({ kind: 'muted', text: `# ${aboutIntro.city}` });
              for (const paragraph of aboutIntro.paragraphs) {
                out.push({ kind: 'output', text: paragraph });
              }
              break;
            case 'skills.txt':
              out.push({ kind: 'output', text: skillsLine });
              break;
            case 'contact.txt':
              for (const social of socials) {
                out.push({ kind: 'output', text: `${social.label.padEnd(10)} ${social.href}` });
              }
              break;
            default:
              out.push({ kind: 'error', text: `cat : ${argument} : aucun fichier de ce nom.` });
          }
          break;
        }

        case 'projects': {
          if (!projects || projects.length === 0) {
            out.push({ kind: 'muted', text: 'Chargement des projets… réessaie dans une seconde.' });
            break;
          }
          const showcase = projects.slice(0, 5);
          for (const project of showcase) {
            const pin = project.pinned ? '★ ' : '  ';
            out.push({
              kind: 'output',
              text: `${pin}${project.displayName.padEnd(26)} ${
                project.language ?? '—'
              }  · ${formatNumber(project.stars)}★`,
            });
          }
          out.push({
            kind: 'muted',
            text: `${projects.length} projets au total — « goto projects » pour tout voir.`,
          });
          break;
        }

        case 'stats': {
          if (!stats) {
            out.push({ kind: 'muted', text: 'Statistiques indisponibles pour le moment.' });
            break;
          }
          out.push(
            { kind: 'output', text: `projets      ${formatNumber(stats.projects)}` },
            {
              kind: 'output',
              text: `commits      ${stats.commits === null ? 'indisponible (jeton GitHub absent)' : formatNumber(stats.commits)}`,
            },
            { kind: 'output', text: `étoiles      ${formatNumber(stats.stars)}` },
            {
              kind: 'output',
              text: `années       ${stats.yearsOfCode === null ? '—' : String(stats.yearsOfCode)}`,
            },
          );
          break;
        }

        case 'goto':
        case 'open':
        case 'cd': {
          const target = argument.toLowerCase() as (typeof GOTO_PAGES)[number];
          if (!argument) {
            out.push({ kind: 'error', text: `${command} : précise une page — ${GOTO_PAGES.join(' · ')}` });
            break;
          }
          if (target in PAGES) {
            out.push({ kind: 'success', text: `→ ${PAGES[target]}` });
            setTimeout(() => navigate(PAGES[target]), 220);
          } else {
            out.push({ kind: 'error', text: `${command} : ${argument} : page inconnue.` });
          }
          break;
        }

        case 'social': {
          const github = socials.find((social) => social.id === 'github');
          if (github) {
            out.push({ kind: 'success', text: `Ouverture de ${github.href}…` });
            window.open(github.href, '_blank', 'noopener,noreferrer');
          }
          break;
        }

        case 'neofetch': {
          const info = [
            `${profile.handle}@tourdiat`,
            '─────────────────',
            `OS        école 42`,
            `Shell     gtd-shell 1.0.0`,
            `Rôle      ${profile.role}`,
            `Ville     ${profile.location}`,
            `Projets   ${stats ? formatNumber(stats.projects) : '—'}`,
          ];
          const rows = Math.max(NEOFETCH_ART.length, info.length);
          for (let index = 0; index < rows; index++) {
            out.push({
              kind: index === 0 ? 'success' : 'output',
              text: `${(NEOFETCH_ART[index] ?? '                   ').padEnd(20)}${info[index] ?? ''}`,
            });
          }
          break;
        }

        case 'echo':
          out.push({ kind: argument ? 'output' : 'muted', text: argument || '' });
          break;

        case 'date':
          out.push({ kind: 'output', text: new Date().toLocaleString('fr-FR') });
          break;

        case 'clear':
          setLines([]);
          return;

        case 'sudo':
          out.push(
            { kind: 'error', text: 'visiteur n’est pas dans le fichier sudoers. Cet incident sera signalé.' },
            { kind: 'muted', text: '…' },
            { kind: 'success', text: 'Blague. Mais essaie donc « goto contact ».' },
          );
          break;

        case 'exit':
        case 'logout':
          out.push({ kind: 'muted', text: 'Impossible de quitter : tu viens à peine d’arriver.' });
          break;

        default:
          out.push(
            { kind: 'error', text: `${command} : commande introuvable.` },
            { kind: 'muted', text: 'Tape « help » pour voir ce que je sais faire.' },
          );
      }

      if (out.length > 0) push(out);
    },
    [navigate, projects, push, skillsLine, stats, profile, socials, aboutIntro],
  );

  const onKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      run(value);
      setValue('');
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (history.length === 0) return;
      const next = historyIndex < 0 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(next);
      setValue(history[next] ?? '');
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (historyIndex < 0) return;
      const next = historyIndex + 1;
      if (next >= history.length) {
        setHistoryIndex(-1);
        setValue('');
      } else {
        setHistoryIndex(next);
        setValue(history[next] ?? '');
      }
      return;
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      const text = value;
      const parts = text.split(/\s+/);
      const last = parts[parts.length - 1] ?? '';

      const pool = parts.length > 1
        ? parts[0] === 'goto' || parts[0] === 'open' || parts[0] === 'cd'
          ? [...GOTO_PAGES]
          : parts[0] === 'cat'
            ? [...CAT_FILES]
            : []
        : [...COMMANDS];

      const matches = pool.filter((candidate) => candidate.startsWith(last));
      if (matches.length === 1 && matches[0]) {
        parts[parts.length - 1] = matches[0];
        setValue(`${parts.join(' ')}${parts.length === 1 ? ' ' : ''}`);
      } else if (matches.length > 1) {
        push([{ kind: 'muted', text: matches.join('   ') }]);
      }
      return;
    }

    if (event.key === 'l' && event.ctrlKey) {
      event.preventDefault();
      setLines([]);
    }
  };

  const colorFor: Record<LineKind, string> = {
    input: 'text-ink',
    output: 'text-muted',
    error: 'text-rose',
    success: 'text-acid',
    muted: 'text-faint',
  };

  return (
    <div
      className="window-chrome flex h-[24rem] flex-col overflow-hidden sm:h-[26rem]"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex items-center gap-3 border-b border-line bg-raised/50 px-3.5 py-2.5">
        <span className="font-mono text-xs text-muted">
          {profile.handle}@tourdiat: ~ — shell
        </span>
        <span
          className={cx(
            'ml-auto font-mono text-[10px]',
            focused ? 'text-acid' : 'text-faint',
          )}
        >
          {focused ? '● actif' : '○ inactif'}
        </span>
      </div>

      <div
        ref={scrollerRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-[12.5px] leading-relaxed sm:text-[13px]"
      >
        {lines.map((line) => (
          <div
            key={line.id}
            className={cx('break-words whitespace-pre-wrap', colorFor[line.kind])}
          >
            {line.text}
          </div>
        ))}

        <div className="mt-1 flex items-center gap-2">
          <span className="shrink-0 text-acid">{PROMPT}</span>
          <span className="relative min-w-0 flex-1">
            <input
              ref={inputRef}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={onKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              aria-label="Terminal interactif — tape help"
              className="w-full bg-transparent text-ink caret-transparent focus:outline-none"
            />
            {/*
              The caret is drawn here rather than by the browser so it can blink
              in the site's own colour, and so it sits exactly after the text.
            */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-0 left-0 text-ink"
            >
              <span className="invisible">{value}</span>
              <span className="animate-caret text-acid">▌</span>
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
