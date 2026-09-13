import { useCountUp } from '../hooks/useCountUp';
import { useReveal } from '../hooks/useReveal';
import { formatNumber } from '../lib/format';

interface StatCounterProps {
  value: number | null;
  label: string;
  /** Small qualifier under the number, e.g. "via l'API GitHub". */
  hint?: string;
}

export function StatCounter({ value, label, hint }: StatCounterProps) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  const displayed = useCountUp(value ?? 0, visible && value !== null);

  return (
    <div ref={ref} className="group relative">
      <div className="font-mono text-2xl font-semibold text-acid tabular-nums sm:text-3xl">
        {value === null ? (
          <span className="text-faint" title="Indisponible sans jeton GitHub">
            ——
          </span>
        ) : (
          formatNumber(displayed)
        )}
      </div>
      <div className="mt-1 font-mono text-[11px] tracking-wide text-muted uppercase">{label}</div>
      {hint ? <div className="mt-0.5 text-[11px] text-faint">{hint}</div> : null}
    </div>
  );
}
