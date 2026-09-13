import { Link } from 'react-router-dom';
import { ICON_BY_ID } from './Icons';
import { useSiteContent } from '../content/SiteContent';

export function Footer() {
  const year = new Date().getFullYear();
  const { profile, socials } = useSiteContent();

  return (
    <footer className="hairline-top mt-24">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-mono text-xs text-muted">
            <span className="text-acid">▸</span> {profile.fullName}
          </p>
          <p className="mt-1 font-mono text-[11px] text-faint">© {year}</p>
        </div>

        <nav aria-label="Liens de bas de page" className="flex flex-wrap items-center gap-2">
          {socials.map((social) => {
            const Icon = ICON_BY_ID[social.id];
            return (
              <a
                key={social.id}
                href={social.href}
                {...(social.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                aria-label={social.label}
                title={social.label}
                className="grid size-9 place-items-center rounded-lg border border-line bg-panel/60 text-muted transition-colors hover:border-acid/40 hover:text-acid"
              >
                <Icon className="size-4" />
              </a>
            );
          })}

          <span className="mx-1 hidden h-5 w-px bg-line sm:block" aria-hidden="true" />

          <Link
            to="/admin"
            className="rounded-lg border border-line bg-panel/60 px-3 py-2 font-mono text-[11px] text-faint transition-colors hover:border-line-hi hover:text-muted"
          >
            admin
          </Link>
        </nav>
      </div>
    </footer>
  );
}
