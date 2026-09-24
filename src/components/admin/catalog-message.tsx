export function CatalogMessage({
  success,
  error,
}: {
  success?: string;
  error?: string;
}) {
  if (!success && !error) return null;

  return (
    <div
      className={[
        "mb-6 flex items-start gap-3 rounded-lg border p-4 text-sm",
        success
          ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
          : "border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200",
      ].join(" ")}
      role="status"
    >
      <span>{success ?? error}</span>
    </div>
  );
}
