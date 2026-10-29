'use client'; // Error components must be Client Components

// COMPONENTS
import ErrorPage from '@/src/components/StatusPage/ErrorPage';

// Shown, with the bar and the menu, when the home page fails.
export default function Error({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return <ErrorPage error={error} />;
}
