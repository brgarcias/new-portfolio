// CONTENT
import type { SocialLink } from '@/src/content';
import type { PageId } from '@/src/content/sections';
// ICONS
import {
  GithubIcon,
  LinkedinIcon,
  MailIcon,
  WhatsappIcon,
  type IconComponent,
} from '@/src/components/Icon';

// What the bar and the menu show of each section, from its header in
// content/site/sections.json.
export interface NavItem {
  id: PageId;
  label: string;
  title: string;
}

export const resume = {
  href: '/documents/cv/Bruno_Garcia_Resume.pdf',
  fileName: 'Bruno_Garcia_Resume.pdf',
} as const;

// A site opens in a new tab; an email or a phone number stays on the page,
// which hands it to the right app, instead of leaving an empty tab behind.
export const linkTarget = (href: string) =>
  /^https?:/.test(href)
    ? ({ target: '_blank', rel: 'noopener noreferrer' } as const)
    : {};

// The icon of each channel of content/site/profile.json.
const socialIcons = {
  email: MailIcon,
  linkedin: LinkedinIcon,
  whatsapp: WhatsappIcon,
  github: GithubIcon,
} satisfies Record<SocialLink['id'], IconComponent>;

export function SocialIcon({ id }: Readonly<{ id: SocialLink['id'] }>) {
  const Icon = socialIcons[id];
  return <Icon />;
}
