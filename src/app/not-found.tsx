// NEXT
import type { Metadata } from 'next';
// LAYOUT
import LocaleLayout from './[lang]/layout';
// COMPONENTS
import NotFound from '@/src/components/StatusPage/NotFound';
// I18N
import { defaultLocale } from '@/src/i18n/config';
import { getMessages } from '@/src/i18n/messages';

const messages = getMessages(defaultLocale);

export const metadata: Metadata = {
  title: `${messages.notFound.heading} | ${messages.meta.title}`,
  description: messages.meta.description,
  // Replaces the layout's "index, follow" so it does not contradict the
  // noindex that Next.js adds to 404 responses.
  robots: { index: false, follow: true },
};

// Any address outside the pages of the languages, such as
// /pagina-inexistente. It shows the 404 in the default language, inside the
// same layout as the pages, with the bar and the menu.
export default function RootNotFound() {
  return (
    <LocaleLayout params={Promise.resolve({ lang: defaultLocale })}>
      <NotFound />
    </LocaleLayout>
  );
}
