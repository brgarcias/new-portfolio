import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import {
  faGithub,
  faLinkedin,
  faWhatsapp,
} from '@fortawesome/free-brands-svg-icons';

// Sections of the home page, in order. The id is the section's anchor.
export const navItems = [
  { id: 'about', label: 'About', title: 'About Me' },
  { id: 'experience', label: 'Experience', title: 'Professional Experience' },
  { id: 'education', label: 'Education', title: 'Academic Education' },
  { id: 'courses', label: 'Courses', title: 'Courses & Certifications' },
  { id: 'projects', label: 'Projects', title: 'My Projects' },
  { id: 'contributing', label: 'Contributing', title: 'Contributing' },
  { id: 'contact', label: 'Contact', title: 'Contact' },
] as const;

export type SectionId = (typeof navItems)[number]['id'];

export const resume = {
  href: '/documents/cv/Bruno_Garcia_Resume.zip',
  fileName: 'Bruno_Garcia_Resume.zip',
} as const;

export const socialLinks = [
  { icon: faEnvelope, href: 'mailto:bruno-151299@hotmail.com', text: 'Email' },
  {
    icon: faLinkedin,
    href: 'https://www.linkedin.com/in/bruno-garcia-9854b1161/',
    text: 'LinkedIn',
  },
  {
    icon: faWhatsapp,
    href: 'https://api.whatsapp.com/send?phone=5511996969301&text=Hello,%20Bruno!%20Really%20liked%20your%20portfolio.',
    text: 'WhatsApp',
  },
  { icon: faGithub, href: 'https://github.com/brgarcias', text: 'GitHub' },
];
