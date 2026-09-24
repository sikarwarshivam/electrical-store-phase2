import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/layout/empty-state";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Customers Directory",
};

export default function AdminCustomersPage() {
  return (
    <PageContainer
      title="Customer & Electrician Accounts"
      description="View retail customer accounts, registered electrical contractors, and access permissions."
      actions={
        <Badge variant="outline" className="text-xs">
          Phase 1 Shell
        </Badge>
      }
    >
      <EmptyState
        icon={<Users className="h-8 w-8 text-amber-600" />}
        title="Customer Directory Shell Ready"
        description="Customer account management, GSTIN verification for B2B electricians, and credit accounts will be added in Phase 2."
      />
    </PageContainer>
  );
}
