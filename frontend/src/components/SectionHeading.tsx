import type { ReactNode } from 'react';
import { cx } from '../lib/cx';

interface SectionHeadingProps {
  /** Two-digit index shown as `01`, `02`… */
  index?: number;
  title: string;
  subtitle?: ReactNode;
  className?: string;
}

export function SectionHeading({ index, title, subtitle, className }: SectionHeadingProps) {
  return (
    <div className={cx('mb-6', className)}>
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-xs text-acid/70 select-none">#</span>
        {index !== undefined ? (
          <span className="font-mono text-xs text-faint tabular-nums">
            {String(index).padStart(2, '0')}
          </span>
        ) : null}
        <h2 className="font-mono text-lg font-semibold tracking-tight text-ink sm:text-xl">{title}</h2>
        <span className="h-px flex-1 bg-gradient-to-r from-line to-transparent" />
      </div>
      {subtitle ? <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">{subtitle}</p> : null}
    </div>
  );
}
