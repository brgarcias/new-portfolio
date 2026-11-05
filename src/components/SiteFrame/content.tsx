// I18N
import type { Locale } from '@/src/i18n/config';
// CONTENT
import type { SocialLink } from '@/src/content';
import type { PageId } from '@/src/content/sections';
// ICONS
import {
  ArrowDownIcon,
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

// The résumé in each language, in public/documents/cv/. A page offers the one
// of its language, downloaded under the file's own name; the old addresses, in
// links shared before, lead to the English one (next.config.mjs).
const resumes: Record<Locale, string> = {
  en: '/documents/cv/EN/Bruno_Garcia_Full_Stack.pdf',
  pt: '/documents/cv/PT/Bruno_Garcia_Full_Stack_PTBR.pdf',
  es: '/documents/cv/ES/Bruno_Garcia_Full_Stack_ES.pdf',
};

export interface Resume {
  href: string;
  fileName: string;
}

export const resume = (locale: Locale): Resume => {
  const href = resumes[locale];
  return { href, fileName: href.slice(href.lastIndexOf('/') + 1) };
};

// The résumé's short label, as in the bar: the arrow and "CV", which a screen
// reader hears as "Download CV".
export function ResumeShort({
  t,
}: Readonly<{ t: { download: string; cv: string } }>) {
  return (
    <>
      <ArrowDownIcon />
      <span className="visually-hidden">{t.download} </span>
      {t.cv}
    </>
  );
}

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
