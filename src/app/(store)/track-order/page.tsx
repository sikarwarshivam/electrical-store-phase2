import { PageContainer } from "@/components/layout/page-container";
import { TrackOrderForm } from "@/components/store/track-order-form";

export const metadata = { title: "Track Order" };

export default function TrackOrderPage() {
  return (
    <PageContainer
      title="Track your order"
      description="Guests can check a paid order using the order number and phone number used at checkout."
    >
      <TrackOrderForm />
    </PageContainer>
  );
}
