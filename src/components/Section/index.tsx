// REACT
import { ReactNode } from 'react';
// COMPONENTS
import Reveal from '@/src/components/Reveal';
// CONTENT
import { navItems, type SectionId } from '@/src/components/SiteFrame/content';

interface SectionProps {
  id: SectionId;
  description?: ReactNode;
  quote?: { text: string; author: string };
  className?: string;
  children?: ReactNode;
}

// A home page section with the shared numbered header. The number, label and
// title come from the navigation, so the menu and the page always agree.
export default function Section({
  id,
  description,
  quote,
  className,
  children,
}: Readonly<SectionProps>) {
  const index = navItems.findIndex((item) => item.id === id);
  const { label, title } = navItems[index];

  return (
    <section
      id={id}
      className={['section', className].filter(Boolean).join(' ')}
      aria-labelledby={`${id}-title`}
      tabIndex={-1}
    >
      <Reveal className="section__header">
        <p className="eyebrow">
          <span className="eyebrow__index">
            {String(index + 1).padStart(2, '0')}
          </span>
          {label}
        </p>
        <h2 id={`${id}-title`} className="section__title">
          {title}
        </h2>
        {description && <p className="section__description">{description}</p>}
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
