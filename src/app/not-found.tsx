// NEXT
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Page Not Found',
  // Replaces the layout's "index, follow" so it does not contradict the
  // noindex that Next.js adds to 404 responses.
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="page not-found">
      <header className="bp-header cf">
        <span className="bp-header__present">Error 404</span>
        <h1 className="bp-header__title">Page Not Found</h1>
        <p className="bp-header__desc">
          This page does not exist, but you can{' '}
          <Link href="/">go back to the portfolio</Link>!
        </p>
        <p className="info">
          &quot;Not all those who wander are lost.&quot; &mdash;
          <span className="blue">
            <em> J.R.R. Tolkien</em>
          </span>
        </p>
        <nav className="bp-nav">
          <Link
            className="bp-nav__item bp-icon bp-icon--prev"
            href="/"
            aria-label="Back to the portfolio"
            data-info="Back to the portfolio"
          >
            <span>Back to the portfolio</span>
          </Link>
        </nav>
      </header>
    </div>
  );
}
