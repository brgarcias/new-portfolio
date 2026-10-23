// REACT
import { ReactNode } from 'react';

interface StatusPageProps {
  label: string;
  title: string;
  description: ReactNode;
  quote: string;
  author: string;
  action: ReactNode;
}

// Shared by the 404 and error pages, in the style of the sections' headers.
export default function StatusPage({
  label,
  title,
  description,
  quote,
  author,
  action,
}: Readonly<StatusPageProps>) {
  return (
    <div className="page status-page">
      <header className="bp-header cf">
        <span className="bp-header__present">{label}</span>
        <h1 className="bp-header__title">{title}</h1>
        <p className="bp-header__desc">{description}</p>
        {/* Single text nodes, so the browser kerns the quotes with the
            words as it does in the sections. */}
        <p className="info">
          {`"${quote}" \u2014`}
          <span className="blue">
            <em>{` ${author}`}</em>
          </span>
        </p>
        <nav className="bp-nav">{action}</nav>
      </header>
    </div>
  );
}
