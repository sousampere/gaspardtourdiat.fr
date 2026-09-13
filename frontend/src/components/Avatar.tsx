import { useState } from 'react';

import { useSiteContent } from '../content/SiteContent';
import { cx } from '../lib/cx';

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

/**
 * The profile picture, degrading to monogram initials if the image is missing
 * or fails to load — a broken avatar should never be the first thing a visitor
 * sees.
 */
export function Avatar({ className }: { className?: string }) {
  const [failed, setFailed] = useState(false);
  const { profile } = useSiteContent();

  if (failed) {
    return (
      <div
        role="img"
        aria-label={`Monogramme de ${profile.fullName}`}
        className={cx(
          'grid place-items-center bg-gradient-to-br from-acid/15 via-panel to-cyan/10 font-mono text-2xl font-semibold text-acid',
          className,
        )}
      >
        {initialsOf(profile.fullName)}
      </div>
    );
  }

  return (
    <img
      src={profile.avatarUrl}
      alt={`Portrait de ${profile.fullName}`}
      width={512}
      height={512}
      loading="eager"
      decoding="async"
      onError={() => setFailed(true)}
      className={cx('object-cover', className)}
    />
  );
}
