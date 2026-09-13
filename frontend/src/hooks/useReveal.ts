import { useEffect, useRef, useState } from 'react';

/**
 * Reveals an element the first time it scrolls into view, then stops observing.
 * Sections that are already on screen at mount flip immediately.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Browsers without IntersectionObserver (and jsdom) just show everything.
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
            return;
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -48px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}
