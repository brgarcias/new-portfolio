// I18N
import type { Locale } from '../config';
import en, { type Messages } from './en';

export type { Messages };

const messages: Record<Locale, Messages> = { en };

export const getMessages = (locale: Locale) => messages[locale];

// Fills the {names} of a text, as in "Currently {role} at {company}".
export function format(text: string, values: Record<string, string | number>) {
  return text.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in values ? String(values[name]) : whole,
  );
}

// Splits a text with one [link] into the parts before, inside and after it.
export function splitLink(text: string) {
  const match = /^(.*?)\[(.+?)\](.*)$/s.exec(text);
  return match
    ? { before: match[1], link: match[2], after: match[3] }
    : { before: text, link: '', after: '' };
}
