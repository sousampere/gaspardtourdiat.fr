import { cx } from '../lib/cx';

interface MarqueeProps {
  items: readonly string[];
  /** Seconds for one full pass. Slower reads better for long sentences. */
  duration?: number;
  className?: string;
}

/**
 * Infinite right-to-left ticker.
 *
 * The track holds exactly two copies of the row and slides by -50%, so the
 * moment the first copy leaves the viewport the second is pixel-identical to
 * where it started — the loop has no visible seam.
 */
export function Marquee({ items, duration = 46, className }: MarqueeProps) {
  const row = (key: string, hidden: boolean) => (
    <div key={key} className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((item) => (
        <span key={item} className="flex items-center gap-3 px-5 whitespace-nowrap">
          <span className="text-acid">▸</span>
          <span className="font-mono text-xs tracking-wide text-muted sm:text-[13px]">{item}</span>
        </span>
      ))}
    </div>
  );

  return (
    <div className={cx('relative flex overflow-hidden', className)}>
      <div className="flex w-max animate-marquee" style={{ animationDuration: `${duration}s` }}>
        {row('primary', false)}
        {row('duplicate', true)}
      </div>

      {/* Soften both ends so the text fades rather than being clipped. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-void to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-void to-transparent" />
    </div>
  );
}
