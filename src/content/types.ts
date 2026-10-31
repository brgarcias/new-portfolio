// The fields of each content file, as they are saved in content/. Texts may
// use **highlight**, *emphasis* and [link](address), see Markup.

import type { SectionId } from './sections';

export type { SectionId };

// content/site/profile.json: who Bruno is and how to reach him.
export interface ProfileContent {
  name: string;
  fullName: string;
  role: string;
  // "YYYY-MM-DD", for the age in the contact section.
  birthDate: string;
  email: string;
  // As shown, such as "+55 (11) 99696-9301". The links use its digits.
  phone: string;
  // The message WhatsApp suggests when a visitor opens the chat.
  whatsappMessage: string;
  linkedin: string;
  github: string;
}

// content/site/hero.json: the top of the page.
export interface HeroContent {
  // The two lines of the title. A **highlight** takes the gradient.
  titleTop: string;
  titleBottom: string;
  tagline: string;
  // Technologies floating around the illustration, separated by commas.
  highlights: string;
}

// content/site/about.json
export interface AboutContent {
  lead: string;
  // Paragraphs separated by a blank line.
  body: string;
  stackTitle: string;
  // Separated by commas. They repeat the ones the text names.
  technologies: string;
}

interface SectionHeaderContent {
  // Short name, for the bar and the narrow menu.
  label: string;
  title: string;
  description?: string;
  quote?: string;
  author?: string;
}

// content/site/sections.json: the header of each section.
export type SectionsContent = Record<SectionId, SectionHeaderContent>;

export interface SectionHeader {
  id: SectionId;
  // "01" for the first section.
  number: string;
  label: string;
  title: string;
  description?: string;
  quote?: { text: string; author: string };
}

// content/experiences/*.json, one file per role.
export interface ExperienceEntry {
  company: string;
  title: string;
  // "YYYY-MM". The role without an end is the current one.
  start: string;
  end: string;
  icon: 'code' | 'desktop' | 'mobile' | 'users';
  // Technologies the details name, separated by commas, shown as tags.
  stack: string;
  // Groups of items, each with an optional heading.
  details: { heading?: string; items: string[] }[];
}

// content/education/*.json, one file per step.
export interface EducationEntry {
  order: number;
  label: string;
  title: string;
  text: string;
  // Steps that are still ahead.
  upcoming: boolean;
}

// content/courses/*.json, one file per course.
export interface CourseEntry {
  order: number;
  title: string;
  subtitle: string;
  // Takes two columns of the grid.
  wide: boolean;
  dialogTitle: string;
  dialogSubtitle: string;
  modules: { title: string; description: string }[];
}

// content/projects/*.json, one file per project.
export interface ProjectEntry {
  order: number;
  eyebrow: string;
  title: string;
  // The device frame around the preview.
  device: 'iphone' | 'ipad' | 'macbook' | 'imac' | 'watch';
  // Paths in public/, such as /images/projects/css-solucoes-preview.webp.
  preview: string;
  image: string;
  dialogTitle: string;
  dialogSubtitle: string;
  description: string;
  link: string;
}

// content/site/contributing.json
export interface ContributingContent {
  storyLabel: string;
  // Paragraphs separated by a blank line.
  story: string;
  galleryLabel: string;
  galleryTitle: string;
  galleryHint: string;
  stats: { value: string; suffix?: string; label: string }[];
  closing: string;
  // The closing line. An *emphasis* takes the gradient.
  highlight: string;
}

// content/initiatives/*.json, one file per photo of the contributing section.
export interface InitiativeEntry {
  order: number;
  title: string;
  description: string;
  // The caption on the photo in the grid.
  label: string;
  alt: string;
  image: string;
  // A smaller copy for the grid, twice the size it is shown at.
  thumb?: string;
}

// content/site/holocrons.json: the record each holocron of the game
// unlocks, one per section, on the section's planet.
export type HolocronsContent = Record<
  SectionId,
  { title: string; text: string }
>;

interface CardContent {
  label: string;
  title: string;
  subtitle: string;
  details: string[];
}

// content/site/contact.json: the cards of the contact section. The profile
// and contact cards take the name, role, e-mail and phone from the profile.
export interface ContactContent {
  profile: { label: string; status: string };
  education: CardContent;
  contact: { label: string; details: string[] };
  languages: CardContent;
}
