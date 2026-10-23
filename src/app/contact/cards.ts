import {
  faEnvelope,
  faGraduationCap,
  faLanguage,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { calculateAge } from '@/src/app/contact/age.utils';

// A function, so the age is computed on every render instead of once when
// the module loads.
export const getContactCards = () => [
  {
    id: 'profile',
    icon: faUser,
    label: 'Profile',
    title: 'Bruno Garcia da Silva',
    subtitle: 'Full-Stack Developer',
    details: ['Married', calculateAge('1999-12-15')],
  },
  {
    id: 'education',
    icon: faGraduationCap,
    label: 'Education',
    title: 'Bachelor of Computer Science',
    subtitle: 'Universidade São Judas Tadeu - USJT',
    details: ['Concluded', '06/2018 - 06/2022'],
  },
  {
    id: 'contact',
    icon: faEnvelope,
    label: 'Contact',
    title: 'bruno-151299@hotmail.com',
    titleHref: 'mailto:bruno-151299@hotmail.com',
    subtitle: '+55 (11) 99696-9301',
    subtitleHref: 'tel:+5511996969301',
    details: ['Vila Nova Cachoeirinha - Limão', 'São Paulo, SP - Brazil'],
  },
  {
    id: 'languages',
    icon: faLanguage,
    label: 'Languages',
    title: 'Advanced English',
    subtitle: 'English Course - Number One',
    details: ['Available for travel and relocation', 'An exchange soon'],
  },
];
