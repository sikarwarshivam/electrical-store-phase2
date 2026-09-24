import * as React from "react";

export function FieldLabel({
  htmlFor,
  children,
  hint,
}: {
  htmlFor: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="space-y-1.5">
      <span className="block text-sm font-medium text-neutral-800 dark:text-neutral-200">
        {children}
      </span>
      {hint ? (
        <span className="block text-xs text-neutral-500 dark:text-neutral-400">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
