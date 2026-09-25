import Link from "next/link";
import { CheckCircle2, PackageCheck } from "lucide-react";
import { getVerifiedOrderByNumber } from "@/lib/order-commerce";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/page-container";

export const metadata = { title: "Order Confirmed" };

export default async function OrderSuccessPage({
  searchParams,
}: { searchParams: Promise<{ order?: string }> }) {
  const params = await searchParams;
  const orderNumber = params.order?.trim() || "";
  const order = orderNumber ? await getVerifiedOrderByNumber(orderNumber) : null;

  if (!order) {
    return (
      <PageContainer title="Order confirmation" description="The requested order confirmation could not be verified.">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/20 dark:text-red-200">
          We could not verify this order as a successfully paid order.
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Order confirmed" description="Your payment has been verified and your order has been placed.">
      <div className="mx-auto max-w-2xl rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm dark:border-emerald-900 dark:bg-neutral-950 sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="mt-5 text-2xl font-bold tracking-tight">Thank you for your order</h2>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-semibold dark:border-neutral-800 dark:bg-neutral-900">
          <PackageCheck className="h-4 w-4" />
          Order {order.orderNumber}
        </div>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-neutral-600 dark:text-neutral-400">
          Payment verification completed successfully. You can track this order from your account or with your order number and phone.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/account/orders"><Button>My orders</Button></Link>
          <Link href="/track-order"><Button variant="outline">Track order</Button></Link>
          <Link href="/products"><Button variant="outline">Continue shopping</Button></Link>
        </div>
      </div>
    </PageContainer>
  );
}
