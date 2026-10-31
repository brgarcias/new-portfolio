// FONT AWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// CONTENT
import { socialIcons } from './content';
import type { SocialLink } from '@/src/content';

interface SocialLinksProps {
  links: readonly SocialLink[];
  // Round icons, as at the top and in the menu, or outlined buttons with
  // the names, as in the contact section.
  variant?: 'icons' | 'buttons';
  className?: string;
  // The name of the list, for screen readers.
  label?: string;
}

// The ways to reach Bruno. The email opens the visitor's mail app in place;
// the other channels are sites, which open in a new tab.
export default function SocialLinks({
  links,
  variant = 'icons',
  className,
  label,
}: Readonly<SocialLinksProps>) {
  const icons = variant === 'icons';

  return (
    <ul
      className={[icons && 'social-links', className].filter(Boolean).join(' ')}
      aria-label={label}
    >
      {links.map(({ id, href, text }) => (
        <li key={id}>
          <a
            className={icons ? 'social-links__link' : 'btn btn--ghost'}
            href={href}
            aria-label={icons ? text : undefined}
            {...(/^https?:/.test(href) && {
              target: '_blank',
              rel: 'noopener noreferrer',
            })}
          >
            <FontAwesomeIcon icon={socialIcons[id]} />
            {!icons && text}
          </a>
        </li>
      ))}
    </ul>
  );
}
