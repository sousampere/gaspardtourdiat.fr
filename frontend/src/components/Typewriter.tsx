import { useEffect, useState } from 'react';
import { cx } from '../lib/cx';

interface TypewriterProps {
  text: string;
  className?: string;
  /** Milliseconds between characters, before jitter. */
  speed?: number;
  /** Pause before the first character, so the effect isn't missed on load. */
  startDelay?: number;
}

/**
 * Types `text` out one character at a time behind a blinking caret.
 *
 * The full string is always exposed to assistive tech via an `sr-only` copy —
 * screen readers announce the sentence, not the animation.
 */
export function Typewriter({ text, className, speed = 26, startDelay = 300 }: TypewriterProps) {
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setCount(0);
    setDone(false);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(text.length);
      setDone(true);
      return;
    }

    let index = 0;
    let timer = 0;

    const tick = () => {
      index += 1;
      setCount(index);
      if (index >= text.length) {
        setDone(true);
        return;
      }
      // A little jitter reads as typing rather than as a progress bar.
      timer = window.setTimeout(tick, speed + Math.random() * 50);
    };

    timer = window.setTimeout(tick, startDelay);
    return () => window.clearTimeout(timer);
  }, [text, speed, startDelay]);

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.slice(0, count)}
        <span className={cx('text-acid', done ? 'animate-caret' : 'opacity-100')}>▌</span>
      </span>
    </span>
  );
}
