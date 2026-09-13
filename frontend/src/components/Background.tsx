import { useEffect, useRef } from 'react';

/**
 * The fixed backdrop every page sits on: a masked blueprint grid, two slowly
 * drifting ambient glows, and a two-tone cursor glow.
 *
 * The green layer tracks the pointer exactly; the cyan layer lags behind it on
 * a CSS transition, so the two read as a light source and its afterimage.
 */
export function Background() {
  const glow = useRef<HTMLDivElement>(null);
  const trail = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Touch devices have no cursor to follow, and reduced-motion users asked
    // for none of this.
    if (!window.matchMedia('(pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    let x = window.innerWidth / 2;
    let y = window.innerHeight * 0.3;

    const commit = () => {
      frame = 0;
      glow.current?.style.setProperty('--mx', `${x}px`);
      glow.current?.style.setProperty('--my', `${y}px`);
      trail.current?.style.setProperty('--tx', `${x}px`);
      trail.current?.style.setProperty('--ty', `${y}px`);
    };

    const onMove = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
      // pointermove can fire several times per frame; write at most once.
      if (!frame) frame = requestAnimationFrame(commit);
    };

    commit();
    window.addEventListener('pointermove', onMove, { passive: true });

    return () => {
      window.removeEventListener('pointermove', onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-void"
    >
      <div className="absolute inset-0 grid-mesh opacity-55 [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_5%,transparent_75%)]" />

      <div className="absolute -top-40 left-1/4 size-[42rem] animate-drift rounded-full bg-acid/[0.07] blur-[130px]" />
      <div className="absolute top-1/3 -right-32 size-[34rem] animate-drift rounded-full bg-cyan/[0.06] blur-[120px] [animation-delay:-7s]" />

      <div
        ref={glow}
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(520px circle at var(--mx, 50%) var(--my, 30%), rgba(43, 255, 136, 0.11), transparent 68%)',
        }}
      />

      <div
        ref={trail}
        className="absolute top-0 left-0 size-[36rem] rounded-full bg-cyan/[0.08] blur-[110px] transition-transform duration-[900ms] ease-out motion-reduce:transition-none"
        style={{
          transform:
            'translate3d(calc(var(--tx, 50vw) - 50%), calc(var(--ty, 30vh) - 50%), 0)',
        }}
      />

      <div className="absolute inset-0 scanlines opacity-60" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,var(--color-void)_100%)]" />
    </div>
  );
}
