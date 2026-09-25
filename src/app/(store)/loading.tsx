import { PageContainer } from "@/components/layout/page-container";

export default function StoreLoading() {
  return (
    <PageContainer>
      <div className="space-y-6 animate-pulse">
        <div className="h-9 w-56 rounded-md bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-4 w-96 max-w-full rounded-md bg-neutral-200 dark:bg-neutral-800" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950"
            >
              <div className="aspect-square bg-neutral-200 dark:bg-neutral-800" />
              <div className="space-y-3 p-4">
                <div className="h-3 w-1/3 rounded bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-4 w-4/5 rounded bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-3 w-3/5 rounded bg-neutral-200 dark:bg-neutral-800" />
                <div className="h-9 w-full rounded bg-neutral-200 dark:bg-neutral-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
