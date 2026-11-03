// The site's content, read from content/ for one language. Each section's
// texts and entries live there, as the panel (Decap CMS) edits them, and
// these functions turn them into what the components show.

// I18N
import type { Locale } from '@/src/i18n/config';
import type { Messages } from '@/src/i18n/messages';
// DATES
import {
  calculateDuration,
  formatDateRange,
} from '@/src/app/professional-experience/date-format';
// CONTENT
import { contentImage, type ContentImage } from './image';
import { readCollection, readSingleton } from './read';
import { pageIds } from './sections';
import type {
  AboutContent,
  CaseEntry,
  ContactContent,
  ContributingContent,
  CourseEntry,
  EducationEntry,
  ExperienceEntry,
  ExpertiseContent,
  HeroContent,
  HolocronsContent,
  InitiativeEntry,
  ProfileContent,
  ProjectEntry,
  PageId,
  SectionHeader,
  SectionsContent,
} from './types';

export type * from './types';
export type { ContentImage };

// "Node.js, GraphQL" becomes a list.
const splitList = (text: string) =>
  text
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

// Paragraphs are separated by a blank line.
const splitParagraphs = (text: string) =>
  text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

const byOrder = (a: { order: number }, b: { order: number }) =>
  a.order - b.order;

export function getProfile(locale: Locale) {
  const profile = readSingleton<ProfileContent>('profile', locale);
  const digits = profile.phone.replace(/\D/g, '');
  // The message keeps its commas, as WhatsApp's own links do.
  const message = encodeURIComponent(profile.whatsappMessage).replace(
    /%2C/g,
    ',',
  );
  return {
    ...profile,
    phoneHref: `tel:+${digits}`,
    whatsapp: `https://api.whatsapp.com/send?phone=${digits}&text=${message}`,
  };
}

export type Profile = ReturnType<typeof getProfile>;

// The channels shown as icons in the top, the menu and the footer, and as
// buttons in the contact section.
export function getSocialLinks(profile: Profile, messages: Messages) {
  return [
    {
      id: 'email',
      href: `mailto:${profile.email}`,
      text: messages.frame.email,
    },
    { id: 'linkedin', href: profile.linkedin, text: 'LinkedIn' },
    { id: 'whatsapp', href: profile.whatsapp, text: 'WhatsApp' },
    { id: 'github', href: profile.github, text: 'GitHub' },
  ] as const;
}

export type SocialLink = ReturnType<typeof getSocialLinks>[number];

// The headers of the sections, numbered in page order. A link to
// "whatsapp" or "email" in a description leads to that channel.
export function getSections(locale: Locale, profile: Profile) {
  const sections = readSingleton<SectionsContent>('sections', locale);
  const channels: Record<string, string> = {
    whatsapp: profile.whatsapp,
    email: `mailto:${profile.email}`,
  };
  return Object.fromEntries(
    pageIds.map((id, index) => {
      const { description, quote, author, ...header } = sections[id];
      return [
        id,
        {
          ...header,
          id,
          number: String(index + 1).padStart(2, '0'),
          description: description?.replace(
            /\]\((whatsapp|email)\)/g,
            (_, channel: string) => `](${channels[channel]})`,
          ),
          quote: quote && author ? { text: quote, author } : undefined,
        },
      ];
    }),
  ) as Record<PageId, SectionHeader>;
}

export function getHero(locale: Locale) {
  const hero = readSingleton<HeroContent>('hero', locale);
  return {
    ...hero,
    highlights: splitList(hero.highlights),
    companies: splitList(hero.companies),
  };
}

export type Hero = ReturnType<typeof getHero>;

export function getAbout(locale: Locale) {
  const about = readSingleton<AboutContent>('about', locale);
  return { ...about, body: splitParagraphs(about.body) };
}

export type About = ReturnType<typeof getAbout>;

export function getExpertise(locale: Locale) {
  const expertise = readSingleton<ExpertiseContent>('expertise', locale);
  return {
    ...expertise,
    areas: expertise.areas.map((area) => ({
      ...area,
      stack: splitList(area.stack),
    })),
  };
}

export type Expertise = ReturnType<typeof getExpertise>;

// From the most recent role. A function, so the current role's duration is
// computed on every render instead of once when the module loads.
export function getExperiences(locale: Locale, messages: Messages) {
  const { present, years, months } = messages.experience;
  const { dateLocale } = messages.meta;
  return readCollection<ExperienceEntry>('experiences', locale)
    .sort((a, b) => b.start.localeCompare(a.start))
    .map(({ slug, company, title, start, end, icon, stack, details, earlier }) => ({
      slug,
      company,
      title,
      icon,
      earlier: Boolean(earlier),
      current: !end,
      stack: splitList(stack),
      date: formatDateRange(start, end || undefined, { dateLocale, present }),
      duration: calculateDuration(start, end || undefined, { years, months }),
      details,
    }));
}

export type Experience = ReturnType<typeof getExperiences>[number];

export function getEducation(locale: Locale) {
  return readCollection<EducationEntry>('education', locale).sort(byOrder);
}

export type EducationStep = ReturnType<typeof getEducation>[number];

export function getCourses(locale: Locale) {
  return readCollection<CourseEntry>('courses', locale).sort(byOrder);
}

export type Course = ReturnType<typeof getCourses>[number];

export function getProjects(locale: Locale) {
  return readCollection<ProjectEntry>('projects', locale)
    .sort(byOrder)
    .map((project) => ({
      ...project,
      preview: contentImage(project.preview),
      image: contentImage(project.image),
    }));
}

export type Project = ReturnType<typeof getProjects>[number];

// The case studies of the projects section, in their order.
export function getCases(locale: Locale) {
  return readCollection<CaseEntry>('cases', locale)
    .sort(byOrder)
    .map((entry) => ({
      ...entry,
      stack: splitList(entry.stack),
      image: entry.image ? contentImage(entry.image) : undefined,
    }));
}

export type CaseStudy = ReturnType<typeof getCases>[number];

export function getContributing(locale: Locale) {
  const contributing = readSingleton<ContributingContent>(
    'contributing',
    locale,
  );
  return { ...contributing, story: splitParagraphs(contributing.story) };
}

export type Contributing = ReturnType<typeof getContributing>;

// The grid shows the smaller copy, when there is one, and the viewer the
// full photo.
export function getInitiatives(locale: Locale) {
  return readCollection<InitiativeEntry>('initiatives', locale)
    .sort(byOrder)
    .map((initiative) => ({
      ...initiative,
      image: contentImage(initiative.image),
      thumb: contentImage(initiative.thumb || initiative.image),
    }));
}

export type Initiative = ReturnType<typeof getInitiatives>[number];

// The records of the game's archive, one per section.
export function getHolocrons(locale: Locale) {
  return readSingleton<HolocronsContent>('holocrons', locale);
}

export type Holocrons = ReturnType<typeof getHolocrons>;

// The channels of the contact section, from the profile, and what goes with
// them.
export function getContact(locale: Locale, profile: Profile) {
  return {
    ...readSingleton<ContactContent>('contact', locale),
    email: profile.email,
    emailHref: `mailto:${profile.email}`,
    phone: profile.phone,
    phoneHref: profile.phoneHref,
  };
}

export type Contact = ReturnType<typeof getContact>;
