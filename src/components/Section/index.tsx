// REACT
import { ReactNode } from 'react';
// COMPONENTS
import Reveal from '@/src/components/Reveal';
import { markup } from '@/src/components/Markup';
// CONTENT
import type { SectionHeader } from '@/src/content/types';

interface SectionProps {
  // From content/site/sections.json, which the menu also reads, so the menu
  // and the page always agree.
  header: SectionHeader;
  className?: string;
  children?: ReactNode;
}

// A home page section with the shared header: its number, as in the menu,
// the title, and the description and quote when the content has them. The
// short label is the bar's; the title already says it here.
export default function Section({
  header,
  className,
  children,
}: Readonly<SectionProps>) {
  const { id, number, title, description, quote } = header;

  return (
    <section
      id={id}
      className={['section', className].filter(Boolean).join(' ')}
      aria-labelledby={`${id}-title`}
      tabIndex={-1}
    >
      <Reveal className="section__header">
        <p className="section__index" aria-hidden="true">
          {number}
        </p>
        <h2 id={`${id}-title`} className="section__title">
          {title}
        </h2>
        {description && (
          <p className="section__description">{markup(description)}</p>
        )}
        {quote && (
          <blockquote className="section__quote">
            <p>{`“${quote.text}”`}</p>
            <cite>{quote.author}</cite>
          </blockquote>
        )}
      </Reveal>
      {children}
    </section>
  );
}
