import { useEffect, useState } from 'react';

import { GithubIcon, LinkedinIcon, MailIcon } from '../components/Icons';
import { Reveal } from '../components/Reveal';
import { SectionHeading } from '../components/SectionHeading';
import { Window } from '../components/Window';
import { useSiteContent } from '../content/SiteContent';
import { cx } from '../lib/cx';

const CHANNELS = [
  {
    id: 'linkedin' as const,
    icon: LinkedinIcon,
    label: 'LinkedIn',
    detail: 'Le plus direct pour une proposition de stage ou d’alternance.',
    accent: 'text-cyan',
  },
  {
    id: 'github' as const,
    icon: GithubIcon,
    label: 'GitHub',
    detail: 'Tout mon code public, avec l’historique complet des commits.',
    accent: 'text-acid',
  },
  {
    id: 'mail' as const,
    icon: MailIcon,
    label: 'E-mail',
    detail: 'Pour tout ce qui demande plus qu’un message LinkedIn.',
    accent: 'text-amber',
  },
];

export function Contact() {
  const [copied, setCopied] = useState(false);
  const { profile, socials } = useSiteContent();

  // Reset the "copied" confirmation so it can be triggered again.
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
    } catch {
      // Clipboard access can be denied; the mailto link below still works.
      window.location.href = `mailto:${profile.email}`;
    }
  };

  return (
    <div className="flex flex-col gap-16 sm:gap-20">
      <SectionHeading
        index={0}
        title="Contact"
      />

      {/* ---- Primary mail call-to-action --------------------------------- */}
      <Reveal>
        <Window
          title="~/contact — mail"
          actions={<span className="font-mono text-[10px] text-acid">prioritaire</span>}
        >
          <p className="font-mono text-xs text-faint">$ mail -s &quot;on travaille ensemble ?&quot;</p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href={`mailto:${profile.email}`}
              className="text-glow-cyan truncate font-mono text-base text-cyan underline decoration-cyan/30 underline-offset-4 transition-colors hover:decoration-cyan sm:text-lg"
            >
              {profile.email}
            </a>

            <button
              type="button"
              onClick={copyEmail}
              className={cx(
                'shrink-0 self-start rounded-lg border px-3 py-2 font-mono text-xs transition-colors sm:self-auto',
                copied
                  ? 'border-acid/40 bg-acid/10 text-acid'
                  : 'border-line bg-panel/60 text-muted hover:border-line-hi hover:text-ink',
              )}
            >
              {copied ? '✓ copié' : 'copier'}
            </button>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-muted">
            Dis-moi en deux lignes ce que tu cherches et pourquoi mon profil t'intéresse — je réponds
            à tout le monde, même quand c'est un refus.
          </p>
        </Window>
      </Reveal>

      {/* ---- Secondary channels ------------------------------------------ */}
      <section aria-labelledby="channels-title">
        <SectionHeading index={1} title="Les autres canaux" />
        <h2 id="channels-title" className="sr-only">
          Autres canaux
        </h2>

        <div className="grid gap-5 md:grid-cols-3">
          {CHANNELS.map((channel, index) => {
            const social = socials.find((entry) => entry.id === channel.id);
            if (!social) return null;
            const Icon = channel.icon;

            return (
              <Reveal key={channel.id} delay={index * 80} className="h-full">
                <a
                  href={social.href}
                  {...(social.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="group window-chrome flex h-full flex-col p-5 transition-[transform,border-color] duration-200 hover:-translate-y-1 hover:border-acid/40"
                >
                  <span
                    className={cx(
                      'grid size-10 place-items-center rounded-lg border border-line bg-void/60 transition-colors',
                      channel.accent,
                    )}
                  >
                    <Icon className="size-5" />
                  </span>

                  <h3 className="mt-4 font-mono text-sm font-semibold text-ink">{channel.label}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{channel.detail}</p>

                  <span className="mt-4 truncate font-mono text-[11px] text-faint transition-colors group-hover:text-acid">
                    {social.href.replace(/^mailto:/, '')}
                  </span>
                </a>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ---- Where I am --------------------------------------------------- */}
      <Reveal>
        <Window title="~/contact — localisation">
          <div className="flex flex-col gap-2 font-mono text-sm">
            <p className="text-muted">
              <span className="text-faint">ville </span>
              {profile.location}
            </p>
            <p className="text-muted">
              <span className="text-faint">statut </span>
              <span className="text-acid">ouvert aux opportunités</span>
            </p>
            <p className="text-muted">
              <span className="text-faint">réponse </span>sous 24 h
            </p>
          </div>
        </Window>
      </Reveal>
    </div>
  );
}
