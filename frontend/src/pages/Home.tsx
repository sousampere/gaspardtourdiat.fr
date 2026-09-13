import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { Avatar } from '../components/Avatar';
import { ArrowRightIcon, MapPinIcon, TerminalIcon } from '../components/Icons';
import { Marquee } from '../components/Marquee';
import { Reveal } from '../components/Reveal';
import { SectionHeading } from '../components/SectionHeading';
import { SkillWall } from '../components/SkillWall';
import { SocialGrid } from '../components/SocialGrid';
import { StatCounter } from '../components/StatCounter';
import { Terminal } from '../components/Terminal';
import { Typewriter } from '../components/Typewriter';
import { Window } from '../components/Window';
import { useSiteContent } from '../content/SiteContent';
import { useProjects, useStats } from '../hooks/useApi';

export function Home() {
  const { data: projects } = useProjects();
  const { data: stats, error: statsError } = useStats();
  const { profile, fallbackStats } = useSiteContent();

  const pinned = useMemo(
    () => (projects ?? []).filter((project) => project.pinned).slice(0, 4),
    [projects],
  );

  // If the API can't be reached, fall back to the numbers authored in
  // `content/profile.ts` rather than leaving the row empty — but say so.
  const offline = statsError !== null;
  const projectCount = stats?.projects ?? (offline ? fallbackStats.projects : null);
  const commitCount = stats?.commits ?? (offline ? fallbackStats.commits : null);
  const years = stats?.yearsOfCode ?? (offline ? fallbackStats.yearsOfCode : null);

  return (
    <div className="flex flex-col gap-20 sm:gap-24">
      {/* ---- Scrolling status banner ------------------------------------ */}
      <Reveal className="-mt-6 sm:-mt-10">
        <div className="window-chrome overflow-hidden py-2.5">
          <Marquee items={profile.status} />
        </div>
      </Reveal>

      {/* ---- Hero -------------------------------------------------------- */}
      <section aria-labelledby="hero-title">
        <Reveal>
          <Window
            title={`${profile.handle}@tourdiat: ~ — présentation`}
            actions={
              <span className="flex items-center gap-2 font-mono text-[10px] text-acid">
                <span className="size-1.5 animate-pulse-dot rounded-full bg-acid" />
                disponible
              </span>
            }
            lights
            flush
          >
            <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <div className="min-w-0">
                <p className="font-mono text-[11px] tracking-wide text-acid sm:text-xs">
                  {'// '}
                  {profile.role}
                </p>

                <h1
                  id="hero-title"
                  className="text-glow mt-3 font-mono text-3xl leading-[1.1] font-bold tracking-tight text-ink sm:text-4xl lg:text-5xl"
                >
                  {profile.firstName}
                  <span className="text-acid">.</span>
                  {profile.lastName}
                </h1>

                <p className="mt-5 max-w-xl font-mono text-base leading-relaxed text-ink sm:text-lg">
                  <Typewriter text={profile.tagline} />
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Link
                    to="/projects"
                    className="group flex items-center gap-2 rounded-lg border border-acid/35 bg-acid/10 px-4 py-2.5 font-mono text-sm text-acid transition-colors hover:bg-acid/20"
                  >
                    Voir mes projets
                    <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>

                  <Link
                    to="/contact"
                    className="rounded-lg border border-line bg-panel/60 px-4 py-2.5 font-mono text-sm text-muted transition-colors hover:border-line-hi hover:text-ink"
                  >
                    Me contacter
                  </Link>
                </div>

                <p className="mt-6 flex items-center gap-2 font-mono text-[11px] text-faint">
                  <MapPinIcon className="size-3.5" />
                  {profile.location}
                </p>
              </div>

              <div className="mx-auto w-full max-w-[15rem] md:mx-0">
                <div className="relative">
                  <div className="absolute -inset-3 rounded-2xl bg-acid/10 blur-2xl" aria-hidden="true" />
                  <Avatar className="relative aspect-square w-full rounded-xl border border-line" />
                </div>
              </div>
            </div>
          </Window>
        </Reveal>
      </section>

      {/* ---- Statistics -------------------------------------------------- */}
      <section aria-labelledby="stats-title">
        <SectionHeading index={1} title="Quelques chiffres" />
        <h2 id="stats-title" className="sr-only">
          Statistiques
        </h2>

        <Reveal>
          <Window title="~/stats — live" flush>
            <div className="grid grid-cols-2 gap-x-4 gap-y-7 p-6 sm:grid-cols-4 sm:p-7">
              <StatCounter value={projectCount} label="Projets" hint="dépôts publics" />
              <StatCounter
                value={commitCount}
                label="Commits"
                hint={stats?.commits === null ? 'jeton GitHub requis' : 'depuis mes débuts'}
              />
              <StatCounter value={years} label="Années" hint="à écrire du code" />
              <StatCounter value={stats?.stars ?? null} label="Étoiles" hint="récoltées" />
            </div>

            {offline ? (
              <p className="border-t border-line px-6 py-3 font-mono text-[11px] text-amber">
                API momentanément injoignable — chiffres indicatifs issus du contenu local.
              </p>
            ) : null}
          </Window>
        </Reveal>

        {pinned.length > 0 ? (
          <Reveal delay={80}>
            <div className="mt-5">
              <Window title="~/projets — épinglés" flush>
                <ul className="divide-y divide-line">
                  {pinned.map((project) => (
                    <li key={project.id}>
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-baseline gap-3 px-5 py-3 transition-colors hover:bg-raised"
                      >
                        <span className="font-mono text-xs text-acid">▸</span>
                        <span className="font-mono text-sm text-ink">{project.displayName}</span>
                        <span className="truncate text-xs text-faint">
                          {project.description ?? ''}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </Window>
            </div>
          </Reveal>
        ) : null}
      </section>

      {/* ---- Skills ------------------------------------------------------ */}
      <section aria-labelledby="skills-title">
        <SectionHeading index={2} title="Langages, frameworks & outils" />
        <h2 id="skills-title" className="sr-only">
          Compétences
        </h2>
        <SkillWall />
      </section>

      {/* ---- Terminal ---------------------------------------------------- */}
      <section aria-labelledby="terminal-title">
        <SectionHeading index={3} title="Le terminal" />
        <h2 id="terminal-title" className="sr-only">
          Terminal interactif
        </h2>

        <Reveal>
          <Terminal projects={projects} stats={stats} />
        </Reveal>

        <Reveal delay={60}>
          <p className="mt-3 flex items-center gap-2 font-mono text-[11px] text-faint">
            <TerminalIcon className="size-3.5" />
            astuce : <kbd className="rounded border border-line px-1">Tab</kbd> complète,{' '}
            <kbd className="rounded border border-line px-1">↑</kbd> remonte l'historique.
          </p>
        </Reveal>
      </section>

      {/* ---- Links ------------------------------------------------------- */}
      <section aria-labelledby="links-title">
        <SectionHeading index={4} title="Me retrouver" />
        <h2 id="links-title" className="sr-only">
          Liens
        </h2>
        <SocialGrid />
      </section>

      {/* ---- Projects call-to-action ------------------------------------- */}
      <Reveal>
        <Link
          to="/projects"
          className="group window-chrome flex flex-col gap-4 p-6 transition-colors hover:border-acid/40 sm:flex-row sm:items-center sm:justify-between sm:p-8"
        >
          <div>
            <p className="font-mono text-xs text-acid">cat ./projets</p>
            <p className="mt-2 font-mono text-lg text-ink sm:text-xl">
              Tous mes projets, récupérés directement depuis GitHub.
            </p>
            <p className="mt-1 text-sm text-muted">
              {projects
                ? `${projects.length} dépôts affichés, filtrables par langage.`
                : 'Chargement de la liste…'}
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-2 font-mono text-sm text-acid">
            explorer
            <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
      </Reveal>
    </div>
  );
}
