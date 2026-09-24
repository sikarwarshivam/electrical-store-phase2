"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/layout/error-state";
import { PageContainer } from "@/components/layout/page-container";
import { logger } from "@/lib/logger";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Application runtime error caught by root boundary", error);
  }, [error]);

  return (
    <PageContainer>
      <ErrorState
        title="Application Error"
        message="An unexpected error occurred while processing your request. Please try reloading the page."
        onRetry={() => reset()}
      />
    </PageContainer>
  );
}
