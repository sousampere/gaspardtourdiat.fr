import { useState } from 'react';

import { Reveal } from './Reveal';
import { Window } from './Window';
import { useSiteContent } from '../content/SiteContent';
import type { Skill, SkillGroup } from '../content/profile';
import { cx } from '../lib/cx';

/**
 * Class names must be written out in full — Tailwind scans this file as plain
 * text, so a computed class name like `bg-${accent}` would never be generated.
 */
const ACCENT: Record<SkillGroup['accent'], { bar: string; text: string; border: string }> = {
  acid: { bar: 'bg-acid', text: 'text-acid', border: 'hover:border-acid/50' },
  cyan: { bar: 'bg-cyan', text: 'text-cyan', border: 'hover:border-cyan/50' },
  amber: { bar: 'bg-amber', text: 'text-amber', border: 'hover:border-amber/50' },
  violet: { bar: 'bg-violet', text: 'text-violet', border: 'hover:border-violet/50' },
};

function LevelBar({ level, barClass }: { level: number; barClass: string }) {
  return (
    <>
      <span className="flex shrink-0 gap-[3px]" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((step) => (
          <span
            key={step}
            className={cx('h-3 w-[4px] rounded-[1px]', step <= level ? barClass : 'bg-line')}
          />
        ))}
      </span>
      <span className="sr-only">niveau {level} sur 5</span>
    </>
  );
}

function SkillWindow({ group }: { group: SkillGroup }) {
  const [focus, setFocus] = useState<Skill | null>(null);
  const accent = ACCENT[group.accent];

  return (
    <Window
      title={`~/skills/${group.id}`}
      className="h-full"
      bodyClassName="flex h-full flex-col p-4 sm:p-5"
      actions={<span className="font-mono text-[10px] text-faint">{group.items.length}</span>}
    >
      <p className={cx('font-mono text-xs tracking-wide uppercase', accent.text)}>{group.label}</p>
      <p className="mt-1 text-xs leading-relaxed text-faint">{group.blurb}</p>

      <ul className="mt-4 flex flex-wrap gap-2">
        {group.items.map((skill) => {
          const active = focus?.name === skill.name;
          return (
            <li key={skill.name}>
              <button
                type="button"
                onMouseEnter={() => setFocus(skill)}
                onFocus={() => setFocus(skill)}
                onMouseLeave={() => setFocus(null)}
                onBlur={() => setFocus(null)}
                // Tapping also works, so the detail is reachable on a phone.
                onClick={() => setFocus(active ? null : skill)}
                aria-pressed={active}
                className={cx(
                  'flex items-center gap-2.5 rounded-lg border bg-panel/60 px-2.5 py-1.5 font-mono text-xs transition-colors',
                  active ? 'border-line-hi text-ink' : 'border-line text-muted',
                  accent.border,
                )}
              >
                {skill.name}
                <LevelBar level={skill.level} barClass={accent.bar} />
              </button>
            </li>
          );
        })}
      </ul>

      {/*
        The live region stays mounted so the detail is announced when it
        appears; the height is reserved either way, otherwise the three cards
        would resize every time the pointer moves between them.
      */}
      <div className="mt-4 min-h-[3.25rem]" aria-live="polite">
        {focus ? (
          <p className="rounded-lg border border-line bg-void/60 px-3 py-2 text-xs leading-relaxed text-muted">
            {focus.detail}
          </p>
        ) : null}
      </div>
    </Window>
  );
}

export function SkillWall() {
  const { skillGroups } = useSiteContent();

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {skillGroups.map((group, index) => (
        <Reveal key={group.id} delay={index * 90} className="h-full">
          <SkillWindow group={group} />
        </Reveal>
      ))}
    </div>
  );
}
