'use client'; // Error components must be Client Components

// COMPONENTS
import ErrorPage from '@/src/components/StatusPage/ErrorPage';

// Shown, without the bar, when the game fails.
export default function Error({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return <ErrorPage error={error} />;
}
