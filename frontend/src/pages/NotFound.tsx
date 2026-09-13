import { Link } from 'react-router-dom';

import { ArrowRightIcon } from '../components/Icons';
import { Window } from '../components/Window';

export function NotFound() {
  return (
    <div className="flex min-h-[55vh] items-center justify-center">
      <Window title="~/erreur" className="w-full max-w-xl" flush>
        <div className="p-6 font-mono text-sm leading-relaxed sm:p-8">
          <p className="text-faint">$ cd {window.location.pathname}</p>
          <p className="mt-2 text-rose">
            cd: no such file or directory: {window.location.pathname}
          </p>
          <p className="mt-4 text-4xl font-bold text-acid text-glow">404</p>
          <p className="mt-4 text-muted">
            Cette page n'existe pas — ou plus. Le reste du site, lui, répond toujours.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/"
              className="flex items-center gap-2 rounded-lg border border-acid/35 bg-acid/10 px-4 py-2 text-acid transition-colors hover:bg-acid/20"
            >
              cd ~
              <ArrowRightIcon className="size-4" />
            </Link>
            <Link
              to="/projects"
              className="rounded-lg border border-line bg-panel/60 px-4 py-2 text-muted transition-colors hover:text-ink"
            >
              voir les projets
            </Link>
          </div>
        </div>
      </Window>
    </div>
  );
}
