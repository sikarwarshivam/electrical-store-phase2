import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/layout/empty-state";
import { ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Orders Management",
};

export default function AdminOrdersPage() {
  return (
    <PageContainer
      title="Customer & Contractor Orders"
      description="Track order processing, dispatch status, invoices, and delivery updates."
      actions={
        <Badge variant="outline" className="text-xs">
          Phase 1 Shell
        </Badge>
      }
    >
      <EmptyState
        icon={<ShoppingCart className="h-8 w-8 text-amber-600" />}
        title="Order Processing Module Inactive"
        description="Razorpay webhook handling, order lifecycle state machine, and shipping integrations will be established in Phase 2."
      />
    </PageContainer>
  );
}
