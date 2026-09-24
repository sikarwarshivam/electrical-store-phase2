import { LoadingState } from "@/components/layout/loading-state";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <LoadingState message="Loading store resources..." />
    </div>
  );
}
