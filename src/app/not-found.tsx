import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/layout/empty-state";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <PageContainer className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-lg">
        <EmptyState
          icon={<FileQuestion className="h-8 w-8 text-amber-600" />}
          title="Page Not Found"
          description="The requested page or electrical product catalog section could not be located."
        />
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-700"
          >
            Return to Storefront
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
