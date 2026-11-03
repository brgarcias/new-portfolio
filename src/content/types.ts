// The fields of each content file, as they are saved in content/. Texts may
// use **highlight**, *emphasis* and [link](address), see Markup.

import type { PageId, SectionId } from './sections';

export type { PageId, SectionId };

// content/site/profile.json: who Bruno is and how to reach him.
export interface ProfileContent {
  name: string;
  fullName: string;
  role: string;
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
  // The technologies around the illustration, separated by commas.
  highlights: string;
  // The line along the foot of the top: where Bruno has worked.
  companiesLabel: string;
  // Separated by commas, from the most recent.
  companies: string;
}

// content/site/about.json
export interface AboutContent {
  lead: string;
  // Paragraphs separated by a blank line.
  body: string;
  principlesTitle: string;
  principles: { title: string; text: string }[];
}

// content/site/expertise.json: what Bruno does, by area, and where he has done
// it. Nothing goes in without a place to back it up.
export interface ExpertiseContent {
  whereLabel: string;
  areas: {
    title: string;
    text: string;
    // Separated by commas.
    stack: string;
    // The companies, separated by commas.
    where: string;
    // A result from a real project, as "40%" and what it measures. Optional.
    metric?: string;
    metricLabel?: string;
  }[];
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
export type SectionsContent = Record<PageId, SectionHeaderContent>;

export interface SectionHeader {
  id: PageId;
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
  // Early roles, shown behind a button so the timeline leads with the work
  // that matters most today.
  earlier?: boolean;
}

// content/education/*.json, one file per step.
export interface EducationEntry {
  order: number;
  label: string;
  title: string;
  text: string;
}

// content/courses/*.json, one file per course.
export interface CourseEntry {
  order: number;
  title: string;
  subtitle: string;
  // The details, when the course has modules to show. Without them, the course
  // is only a line.
  dialogTitle?: string;
  dialogSubtitle?: string;
  modules?: { title: string; description: string }[];
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
  // Empty when the site is no longer online.
  link?: string;
}

// content/cases/*.json, one file per case study of the projects section.
// The result, the decisions and what it taught are optional: an empty part does
// not show. The first by order is the featured one.
export interface CaseEntry {
  order: number;
  company: string;
  period: string;
  title: string;
  summary: string;
  context: string;
  role: string;
  built: string;
  // Why the system is built the way it is, only from what is on record.
  decisions?: { title: string; text: string }[];
  result?: string;
  learned?: string;
  // Separated by commas.
  stack: string;
  // The system, step by step, as the diagram draws it.
  flow: { label: string; detail?: string }[];
  link?: string;
  // A real screenshot of the system, a path in public/.
  image?: string;
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

// content/site/contact.json: what goes with the channels of the contact
// section, which come from the profile.
export interface ContactContent {
  location: string;
  languages: string;
  availability: string;
}
