"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Fatal global application failure", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-neutral-100 p-4 font-sans text-neutral-900">
        <div className="w-full max-w-md rounded-lg border border-red-200 bg-white p-6 shadow-sm text-center">
          <h2 className="text-xl font-bold text-red-600">Critical System Error</h2>
          <p className="mt-2 text-sm text-neutral-600">
            A critical error occurred while initializing the application.
          </p>
          <button
            onClick={() => reset()}
            className="mt-4 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            Attempt Recovery
          </button>
        </div>
      </body>
    </html>
  );
}
