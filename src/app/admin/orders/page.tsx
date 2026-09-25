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
          Payment foundation active
        </Badge>
      }
    >
      <EmptyState
        icon={<ShoppingCart className="h-8 w-8 text-amber-600" />}
        title="Order management is the next layer"
        description="Payment-backed order creation, signed Razorpay webhook verification, inventory reservations, and payment failure handling are now active. Admin order listing and lifecycle controls are the next commerce step."
      />
    </PageContainer>
  );
}
