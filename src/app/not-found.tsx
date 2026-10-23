// NEXT
import type { Metadata } from 'next';
import Link from 'next/link';
// FONT AWESOME
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
// COMPONENTS
import StatusPage from '@/src/components/StatusPage';

export const metadata: Metadata = {
  title: 'Page Not Found',
  // Replaces the layout's "index, follow" so it does not contradict the
  // noindex that Next.js adds to 404 responses.
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <StatusPage
      label="Error 404"
      code="404"
      title="Page Not Found"
      description={
        <>
          This page does not exist, but you can{' '}
          <Link href="/">go back to the portfolio</Link>!
        </>
      }
      quote="Not all those who wander are lost."
      author="J.R.R. Tolkien"
      actions={
        <Link className="btn btn--primary" href="/">
          Back to the portfolio
          <FontAwesomeIcon icon={faArrowRight} />
        </Link>
      }
    />
  );
}
