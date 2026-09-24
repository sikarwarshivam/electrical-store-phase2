import { LoadingState } from "@/components/layout/loading-state";

export default function AdminLoading() {
  return <LoadingState variant="skeleton" message="Loading admin module..." />;
}
