import { ExternalIcon, ICON_BY_ID } from './Icons';
import { Reveal } from './Reveal';
import { useSiteContent } from '../content/SiteContent';
import { cx } from '../lib/cx';

export function SocialGrid({ className }: { className?: string }) {
  const { socials } = useSiteContent();

  return (
    <div className={cx('grid gap-4 sm:grid-cols-2', className)}>
      {socials.map((social, index) => {
        const Icon = ICON_BY_ID[social.id];

        return (
          <Reveal key={social.id} delay={index * 70} className="h-full">
            <a
              href={social.href}
              {...(social.external
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
              className="group flex h-full items-start gap-4 rounded-xl border border-line bg-panel/60 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-acid/40 hover:bg-raised"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-line bg-void/60 text-muted transition-colors group-hover:border-acid/40 group-hover:text-acid">
                <Icon className="size-5" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 font-mono text-sm text-ink">
                  {social.label}
                  {social.external ? <ExternalIcon className="size-3 text-faint" /> : null}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-muted">
                  {social.description}
                </span>
              </span>
            </a>
          </Reveal>
        );
      })}
    </div>
  );
}
