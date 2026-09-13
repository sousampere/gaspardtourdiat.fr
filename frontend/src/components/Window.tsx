import type { ReactNode } from 'react';
import { cx } from '../lib/cx';

/** The three macOS buttons. Purely decorative — hence `aria-hidden`. */
export function TrafficLights({ className }: { className?: string }) {
  return (
    <div className={cx('flex shrink-0 items-center gap-[7px]', className)} aria-hidden="true">
      <span className="size-[11px] rounded-full bg-[#ff5f57] ring-1 ring-black/25 ring-inset" />
      <span className="size-[11px] rounded-full bg-[#febc2e] ring-1 ring-black/25 ring-inset" />
      <span className="size-[11px] rounded-full bg-[#28c840] ring-1 ring-black/25 ring-inset" />
    </div>
  );
}

interface WindowProps {
  /** Shown in the title bar. */
  title?: ReactNode;
  /** Right-aligned slot in the title bar (badges, buttons…). */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Removes the body padding — for windows whose content fills the frame. */
  flush?: boolean;
  /** Draws the three decorative macOS buttons. Reserved for the hero windows. */
  lights?: boolean;
}

/**
 * A macOS-style floating window. Every boxed piece of the site is one of these,
 * which is what gives the pages their consistent "terminal desktop" look.
 */
export function Window({
  title,
  actions,
  children,
  className,
  bodyClassName,
  flush,
  lights = false,
}: WindowProps) {
  return (
    <div className={cx('window-chrome overflow-hidden', className)}>
      <div className="flex items-center gap-3 border-b border-line bg-raised/50 px-3.5 py-2.5">
        {lights ? <TrafficLights /> : null}
        {title ? (
          <span className="truncate font-mono text-xs text-muted">{title}</span>
        ) : null}
        {actions ? <div className="ml-auto flex items-center gap-2">{actions}</div> : null}
      </div>
      <div className={cx(!flush && 'p-5 sm:p-6', bodyClassName)}>{children}</div>
    </div>
  );
}
