import { useEffect, useState } from 'react';

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Counts from 0 to `target` once `start` turns true. */
export function useCountUp(target: number, start: boolean, durationMs = 1500): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return;

    if (prefersReducedMotion() || durationMs <= 0) {
      setValue(target);
      return;
    }

    let frame = 0;
    const began = performance.now();

    const step = (now: number) => {
      const progress = Math.min(1, (now - began) / durationMs);
      // Ease-out cubic: fast at first, settles gently on the final number.
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, start, durationMs]);

  return value;
}
