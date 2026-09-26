import * as React from "react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  className?: string;
  variant?: "spinner" | "skeleton";
}

export function LoadingState({
  message = "Loading...",
  className,
  variant = "spinner",
}: LoadingStateProps) {
  if (variant === "skeleton") {
    return (
      <div className={cn("space-y-4 animate-pulse p-4", className)}>
        <div className="h-8 bg-neutral-200 rounded w-1/3 dark:bg-neutral-800"></div>
        <div className="h-4 bg-neutral-200 rounded w-2/3 dark:bg-neutral-800"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="h-32 bg-neutral-200 rounded dark:bg-neutral-800"></div>
          <div className="h-32 bg-neutral-200 rounded dark:bg-neutral-800"></div>
          <div className="h-32 bg-neutral-200 rounded dark:bg-neutral-800"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-250px flex-col items-center justify-center p-8 text-center",
        className
      )}
    >
      <div className="relative mb-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600 dark:border-amber-900 dark:border-t-amber-500"></div>
      </div>
      <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
        {message}
      </p>
    </div>
  );
}
