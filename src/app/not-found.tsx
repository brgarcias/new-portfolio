// NEXT
import type { Metadata } from 'next';
// LAYOUTS
import LocaleLayout from './[lang]/layout';
import SiteLayout from './[lang]/(site)/layout';
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
// same layouts as the home page, with the bar and the menu.
export default function RootNotFound() {
  const params = Promise.resolve({ lang: defaultLocale });
  return (
    <LocaleLayout params={params}>
      <SiteLayout params={params}>
        <NotFound />
      </SiteLayout>
    </LocaleLayout>
  );
}
