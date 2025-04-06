'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    // Log the error to an error reporting service
    /* eslint-disable no-console */
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-4">
      <h2 className="text-xl font-bold mb-4">Something went wrong!</h2>
      <p className="mb-4 text-gray-600">{error.message || 'An unexpected error occurred'}</p>
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={() => {
          // Safely attempt to recover by trying to re-render the segment
          try {
            reset();
          } catch (e) {
            console.error('Failed to reset:', e);
            // Force reload as fallback
            window.location.reload();
          }
        }}
      >
        Try again
      </button>
    </div>
  );
}
