import { PageContainer } from "@/components/layout/page-container";
import { EmptyState } from "@/components/layout/empty-state";
import { Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Coupons & Discounts",
};

export default function AdminCouponsPage() {
  return (
    <PageContainer
      title="Coupons & Promotional Discounts"
      description="Create promotional codes, bulk contractor discounts, and seasonal festival offers."
      actions={
        <Badge variant="outline" className="text-xs">
          Phase 1 Shell
        </Badge>
      }
    >
      <EmptyState
        icon={<Tag className="h-8 w-8 text-amber-600" />}
        title="Promotions Engine Uninitialized"
        description="Coupon validation rules, minimum cart value thresholds, and category restrictions will be enabled in future phases."
      />
    </PageContainer>
  );
}
