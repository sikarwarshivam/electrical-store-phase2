"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/layout/error-state";
import { logger } from "@/lib/logger";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Admin section runtime failure", error);
  }, [error]);

  return (
    <div className="py-6">
      <ErrorState
        title="Admin Module Error"
        message="An error occurred while loading this admin interface. Please refresh or retry."
        onRetry={() => reset()}
      />
    </div>
  );
}
