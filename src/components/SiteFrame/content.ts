import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import {
  faGithub,
  faLinkedin,
  faWhatsapp,
} from '@fortawesome/free-brands-svg-icons';
// CONTENT
import type { SocialLink } from '@/src/content';
import type { SectionId } from '@/src/content/sections';

// What the bar and the menu show of each section, from its header in
// content/site/sections.json.
export interface NavItem {
  id: SectionId;
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
export const socialIcons: Record<SocialLink['id'], IconDefinition> = {
  email: faEnvelope,
  linkedin: faLinkedin,
  whatsapp: faWhatsapp,
  github: faGithub,
};
