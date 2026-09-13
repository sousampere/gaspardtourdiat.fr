import type { ReactNode } from 'react';

import { ExternalIcon, ForkIcon, GithubIcon, PinIcon, StarIcon } from './Icons';
import type { Project } from '../lib/api';
import { cx } from '../lib/cx';
import { formatNumber, formatRelative, languageColor } from '../lib/format';

function Badge({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'acid' | 'amber' }) {
  const tones = {
    muted: 'border-line text-faint',
    acid: 'border-acid/35 text-acid',
    amber: 'border-amber/35 text-amber',
  } as const;

  return (
    <span
      className={cx(
        'rounded border px-1.5 py-0.5 font-mono text-[10px] tracking-wide uppercase',
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function ProjectCard({ project }: { project: Project }) {
  const pushed = formatRelative(project.pushedAt);
  const demo = project.homepage?.trim();

  return (
    <article
      className={cx(
        'window-chrome group flex h-full flex-col overflow-hidden transition-[transform,border-color] duration-200',
        'hover:-translate-y-1 hover:border-line-hi',
        project.pinned && 'border-acid/25',
      )}
    >
      <div className="flex items-center gap-3 border-b border-line bg-raised/50 px-3.5 py-2.5">
        <span className="truncate font-mono text-xs text-muted">{project.fullName}</span>
        {project.pinned ? (
          <PinIcon className="ml-auto size-3.5 shrink-0 text-acid" />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-mono text-base font-semibold text-ink">{project.displayName}</h3>
          {project.isArchived ? <Badge tone="amber">archivé</Badge> : null}
          {project.isFork ? <Badge>fork</Badge> : null}
        </div>

        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
          {project.description ?? (
            <span className="text-faint italic">Pas encore de description.</span>
          )}
        </p>

        {project.topics.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {project.topics.slice(0, 5).map((topic) => (
              <li
                key={topic}
                className="rounded border border-line bg-void/50 px-1.5 py-0.5 font-mono text-[10px] text-faint"
              >
                #{topic}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3 font-mono text-[11px] text-faint">
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

          <span className="flex items-center gap-1.5">
            <StarIcon className="size-3.5" />
            {formatNumber(project.stars)}
          </span>

          <span className="flex items-center gap-1.5">
            <ForkIcon className="size-3.5" />
            {formatNumber(project.forks)}
          </span>

          {pushed ? <span className="ml-auto">{pushed}</span> : null}
        </div>
      </div>

      <div className="flex border-t border-line">
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-2 px-4 py-2.5 font-mono text-xs text-muted transition-colors hover:bg-raised hover:text-acid"
        >
          <GithubIcon className="size-4" />
          code
        </a>

        {demo ? (
          <>
            <span className="w-px bg-line" aria-hidden="true" />
            <a
              href={demo.startsWith('http') ? demo : `https://${demo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 px-4 py-2.5 font-mono text-xs text-muted transition-colors hover:bg-raised hover:text-cyan"
            >
              <ExternalIcon className="size-4" />
              démo
            </a>
          </>
        ) : null}
      </div>
    </article>
  );
}
