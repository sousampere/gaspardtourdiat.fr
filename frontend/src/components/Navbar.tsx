import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

import { CommandIcon, CloseIcon, MenuIcon } from './Icons';
import { useSiteContent } from '../content/SiteContent';
import { cx } from '../lib/cx';

const NAV_LINKS = [
  { to: '/', label: 'accueil' },
  { to: '/projects', label: 'projets' },
  { to: '/about', label: 'à propos' },
  { to: '/contact', label: 'contact' },
] as const;

interface NavbarProps {
  onOpenPalette: () => void;
}

export function Navbar({ onOpenPalette }: NavbarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { profile } = useSiteContent();

  // Any navigation closes the drawer, including a browser back button.
  useEffect(() => setDrawerOpen(false), [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [drawerOpen]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
        <nav
          aria-label="Navigation principale"
          className={cx(
            'window-chrome mx-auto flex max-w-5xl items-center gap-3 rounded-2xl px-3 py-2 transition-shadow duration-300',
            scrolled && 'shadow-[0_18px_50px_-24px_rgba(0,0,0,0.95)]',
          )}
        >
          <Link
            to="/"
            className="group flex items-center gap-2 font-mono text-[13px] text-ink transition-colors hover:text-acid"
          >
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-pulse-dot rounded-full bg-acid" />
            </span>
            <span className="truncate">
              <span className="text-muted">gaspard@tourdiat</span>
              <span className="text-faint">:~$</span>
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-1">
            <ul className="hidden items-center gap-0.5 md:flex">
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.to === '/'}
                    className={({ isActive }) =>
                      cx(
                        'rounded-lg px-3 py-1.5 font-mono text-[13px] transition-colors',
                        isActive
                          ? 'bg-acid/10 text-acid'
                          : 'text-muted hover:bg-raised hover:text-ink',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className={cx('mr-1', isActive ? 'text-acid' : 'text-faint')}>
                          {isActive ? '▸' : '·'}
                        </span>
                        {link.label}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={onOpenPalette}
              className="hidden items-center gap-2 rounded-lg border border-line bg-panel/60 px-2.5 py-1.5 font-mono text-[11px] text-muted transition-colors hover:border-line-hi hover:text-ink md:flex"
              aria-label="Ouvrir la palette de commandes"
            >
              <CommandIcon className="size-3.5" />
              <span>K</span>
            </button>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="rounded-lg border border-line bg-panel/60 p-2 text-muted transition-colors hover:text-ink md:hidden"
              aria-label="Ouvrir le menu"
              aria-expanded={drawerOpen}
              aria-controls="mobile-drawer"
            >
              <MenuIcon className="size-4" />
            </button>
          </div>
        </nav>
      </header>

      {/* ---- Mobile drawer ------------------------------------------------ */}
      <div
        className={cx(
          'fixed inset-0 z-[60] md:hidden',
          drawerOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
      >
        <button
          type="button"
          tabIndex={drawerOpen ? 0 : -1}
          aria-label="Fermer le menu"
          onClick={() => setDrawerOpen(false)}
          className={cx(
            'absolute inset-0 bg-void/80 backdrop-blur-sm transition-opacity duration-300',
            drawerOpen ? 'opacity-100' : 'opacity-0',
          )}
        />

        <div
          id="mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className={cx(
            'window-chrome absolute inset-y-3 right-3 flex w-[min(20rem,calc(100vw-1.5rem))] flex-col overflow-hidden transition-transform duration-300 ease-out',
            drawerOpen ? 'translate-x-0' : 'translate-x-[calc(100%+1.5rem)]',
          )}
        >
          <div className="flex items-center gap-3 border-b border-line bg-raised/50 px-3.5 py-3">
            <span className="font-mono text-xs text-muted">~/menu</span>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="ml-auto rounded-md p-1 text-muted transition-colors hover:text-ink"
              aria-label="Fermer"
            >
              <CloseIcon className="size-4" />
            </button>
          </div>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
            {NAV_LINKS.map((link, index) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  cx(
                    'flex items-center gap-3 rounded-xl border px-3 py-3 font-mono text-sm transition-colors',
                    isActive
                      ? 'border-acid/30 bg-acid/10 text-acid'
                      : 'border-transparent text-muted hover:bg-raised hover:text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={cx('text-xs', isActive ? 'text-acid' : 'text-faint')}>
                      {String(index).padStart(2, '0')}
                    </span>
                    {link.label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="hairline-top p-4">
            <p className="font-mono text-[11px] text-faint">{profile.email}</p>
            <p className="mt-1 font-mono text-[11px] text-faint">{profile.location}</p>
          </div>
        </div>
      </div>
    </>
  );
}
