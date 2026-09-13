import type { ReactNode } from 'react';
import { useReveal } from '../hooks/useReveal';
import { cx } from '../lib/cx';

interface RevealProps {
  children: ReactNode;
  /** Stagger in milliseconds, for revealing a list item by item. */
  delay?: number;
  className?: string;
}

/** Fades and lifts its children into place the first time they are scrolled to. */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={cx(
        'transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0',
        className,
      )}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
