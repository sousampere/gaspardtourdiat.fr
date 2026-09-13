import { Avatar } from '../components/Avatar';
import { ICON_BY_ID, MapPinIcon } from '../components/Icons';
import { Reveal } from '../components/Reveal';
import { SectionHeading } from '../components/SectionHeading';
import { Window } from '../components/Window';
import { useSiteContent } from '../content/SiteContent';
import { cx } from '../lib/cx';

function LanguageBar({ ratio, label }: { ratio: number; label: string }) {
  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-line"
      role="img"
      aria-label={`Niveau ${label}`}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-acid to-cyan"
        style={{ width: `${Math.round(ratio * 100)}%` }}
      />
    </div>
  );
}

export function About() {
  const { profile, aboutIntro, education, school42, passions, languages, notCoding } =
    useSiteContent();

  return (
    <div className="flex flex-col gap-20 sm:gap-24">
      {/* ---- Intro ------------------------------------------------------- */}
      <section aria-labelledby="about-title">
        <Reveal>
          <Window
            title={`${profile.handle}@tourdiat: ~/à-propos`}
            actions={
              <span className="flex items-center gap-1.5 font-mono text-[10px] text-faint">
                <MapPinIcon className="size-3" />
                {aboutIntro.city}
              </span>
            }
            lights
            flush
          >
            <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
              <div className="min-w-0">
                <h1
                  id="about-title"
                  className="font-mono text-2xl font-bold tracking-tight text-ink sm:text-3xl"
                >
                  Qui je suis<span className="text-acid">.</span>
                </h1>

                <div className="mt-5 space-y-4">
                  {aboutIntro.paragraphs.map((paragraph) => (
                    <p key={paragraph.slice(0, 40)} className="text-sm leading-relaxed text-muted">
                      {paragraph}
                    </p>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-4 font-mono text-[11px] text-faint">
                  <span>
                    <span className="text-muted">ville</span> {aboutIntro.city}
                  </span>
                  <span>
                    <span className="text-muted">école</span> 42
                  </span>
                  <span>
                    <span className="text-muted">focus</span> cybersécurité
                  </span>
                </div>
              </div>

              <div className="mx-auto w-full max-w-[12rem] md:mx-0">
                <Avatar className="aspect-square w-full rounded-xl border border-line" />
                <p className="mt-3 text-center font-mono text-[11px] text-faint">
                  {aboutIntro.cityNote}
                </p>
              </div>
            </div>
          </Window>
        </Reveal>
      </section>

      {/* ---- Passions ---------------------------------------------------- */}
      <section aria-labelledby="passions-title">
        <SectionHeading index={1} title="Ce qui me passionne" />
        <h2 id="passions-title" className="sr-only">
          Passions
        </h2>

        <div className="grid gap-5 md:grid-cols-3">
          {passions.map((passion, index) => {
            const Icon = ICON_BY_ID[passion.icon];
            return (
              <Reveal key={passion.title} delay={index * 80} className="h-full">
                <Window title={`~/${passion.icon}`} className="h-full">
                  <span className="grid size-10 place-items-center rounded-lg border border-line bg-void/60 text-acid">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-mono text-sm font-semibold text-ink">{passion.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{passion.body}</p>
                </Window>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ---- Scolarité --------------------------------------------------- */}
      <section aria-labelledby="education-title">
        <SectionHeading index={2} title="Mon parcours" />
        <h2 id="education-title" className="sr-only">
          Parcours scolaire
        </h2>

        <Reveal>
          <Window title="~/parcours" flush>
            <ol className="relative">
              {education.map((entry, index) => (
                <li
                  key={entry.title}
                  className={cx(
                    'relative pl-10 sm:pl-12',
                    index !== education.length - 1 && 'pb-8',
                  )}
                >
                  {/* Rail + node */}
                  {index !== education.length - 1 ? (
                    <span
                      className="absolute top-3 bottom-0 left-[15px] w-px bg-line sm:left-[19px]"
                      aria-hidden="true"
                    />
                  ) : null}
                  <span
                    className={cx(
                      'absolute top-1.5 left-[9px] size-3.5 rounded-full border-2 sm:left-[13px]',
                      entry.current
                        ? 'border-acid bg-acid/25 shadow-[0_0_12px_-1px_var(--color-acid)]'
                        : 'border-line-hi bg-void',
                    )}
                    aria-hidden="true"
                  />

                  <div className="py-1.5 pr-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] text-acid">{entry.period}</span>
                      {entry.current ? (
                        <span className="rounded border border-acid/35 px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-acid uppercase">
                          en cours
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-1.5 font-mono text-sm font-semibold text-ink">{entry.title}</h3>
                    <p className="font-mono text-[11px] text-faint">{entry.place}</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{entry.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Window>
        </Reveal>
      </section>

      {/* ---- École 42 ---------------------------------------------------- */}
      <section aria-labelledby="school-title">
        <SectionHeading
          index={3}
          title={school42.title}
          subtitle={school42.intro}
        />
        <h2 id="school-title" className="sr-only">
          L'école 42
        </h2>

        <div className="grid gap-5 sm:grid-cols-2">
          {school42.pillars.map((pillar, index) => (
            <Reveal key={pillar.title} delay={index * 70} className="h-full">
              <Window title={`~/42/${pillar.title.toLowerCase().replace(/\s+/g, '-')}`} className="h-full">
                <h3 className="font-mono text-sm font-semibold text-ink">{pillar.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{pillar.body}</p>
              </Window>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---- Langues ----------------------------------------------------- */}
      <section aria-labelledby="languages-title">
        <SectionHeading index={4} title="Langues" />
        <h2 id="languages-title" className="sr-only">
          Langues
        </h2>

        <Reveal>
          <Window title="~/langues" flush>
            <ul className="divide-y divide-line">
              {languages.map((language) => (
                <li
                  key={language.name}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-6"
                >
                  <div className="w-40 shrink-0">
                    <span className="font-mono text-sm text-ink">{language.name}</span>
                    <span className="ml-2 font-mono text-[11px] text-acid">{language.level}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <LanguageBar
                      ratio={language.ratio}
                      label={`${language.level} en ${language.name}`}
                    />
                    <p className="mt-2 text-xs leading-relaxed text-faint">{language.note}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Window>
        </Reveal>
      </section>

      {/* ---- Et sinon ---------------------------------------------------- */}
      <section aria-labelledby="notcoding-title">
        <SectionHeading index={5} title={notCoding.title} />
        <h2 id="notcoding-title" className="sr-only">
          {notCoding.title}
        </h2>

        <Reveal>
          <Window title="~/et-sinon">
            <p className="text-sm leading-relaxed text-muted">{notCoding.body}</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {notCoding.alternatives.map((alternative) => (
                <li
                  key={alternative}
                  className="rounded-lg border border-line bg-void/60 px-2.5 py-1.5 font-mono text-xs text-faint"
                >
                  {alternative}
                </li>
              ))}
            </ul>
          </Window>
        </Reveal>
      </section>
    </div>
  );
}
