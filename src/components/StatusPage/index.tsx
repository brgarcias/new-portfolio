// REACT
import { ReactNode } from 'react';

interface StatusPageProps {
  label: string;
  code?: string;
  title: string;
  description: ReactNode;
  quote: string;
  author: string;
  actions: ReactNode;
}

// Shared by the 404 and error pages, in the style of the hero.
export default function StatusPage({
  label,
  code,
  title,
  description,
  quote,
  author,
  actions,
}: Readonly<StatusPageProps>) {
  return (
    <div className="status-page">
      <div className="status-page__backdrop" aria-hidden="true" />
      <div className="status-page__inner">
        <p className="eyebrow">{label}</p>
        {code && (
          <p className="status-page__code" aria-hidden="true">
            {code}
          </p>
        )}
        <h1 className="status-page__title">{title}</h1>
        <p className="status-page__description">{description}</p>
        <blockquote className="section__quote">
          <p>{`“${quote}”`}</p>
          <cite>{author}</cite>
        </blockquote>
        <div className="status-page__actions">{actions}</div>
      </div>
    </div>
  );
}
