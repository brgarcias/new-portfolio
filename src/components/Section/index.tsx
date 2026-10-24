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
  // Shown right after the description, such as an icon.
  descriptionEnd?: ReactNode;
  className?: string;
  children?: ReactNode;
}

// A home page section with the shared numbered header.
export default function Section({
  header,
  descriptionEnd,
  className,
  children,
}: Readonly<SectionProps>) {
  const { id, number, label, title, description, quote } = header;

  return (
    <section
      id={id}
      className={['section', className].filter(Boolean).join(' ')}
      aria-labelledby={`${id}-title`}
      tabIndex={-1}
    >
      <Reveal className="section__header">
        <p className="eyebrow">
          <span className="eyebrow__index">{number}</span>
          {label}
        </p>
        <h2 id={`${id}-title`} className="section__title">
          {title}
        </h2>
        {description && (
          <p className="section__description">
            {markup(description)}
            {descriptionEnd}
          </p>
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
