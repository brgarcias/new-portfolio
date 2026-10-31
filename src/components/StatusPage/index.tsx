// REACT
import { ReactNode } from 'react';

interface StatusPageProps {
  // Above the title, when the code does not already say it.
  label?: string;
  code?: string;
  title: string;
  description: ReactNode;
  actions: ReactNode;
}

// Shared by the 404 and error pages, in the style of the hero. It is the
// page's main landmark, where the skip link leads.
export default function StatusPage({
  label,
  code,
  title,
  description,
  actions,
}: Readonly<StatusPageProps>) {
  return (
    <main id="main" className="status-page" tabIndex={-1}>
      <div className="status-page__backdrop" aria-hidden="true" />
      <div className="status-page__inner">
        {label && <p className="status-page__label">{label}</p>}
        {code && (
          <p className="status-page__code" aria-hidden="true">
            {code}
          </p>
        )}
        <h1 className="status-page__title">{title}</h1>
        <p className="status-page__description">{description}</p>
        <div className="status-page__actions">{actions}</div>
      </div>
    </main>
  );
}
