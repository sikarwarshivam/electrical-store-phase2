import Link from "next/link";
import { CheckCircle2, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/page-container";

export const metadata = {
  title: "Order Confirmed",
};

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const params = await searchParams;
  const orderNumber = params.order?.trim() || "";

  return (
    <PageContainer
      title="Order confirmed"
      description="Your payment has been verified and your order has been placed."
    >
      <div className="mx-auto max-w-2xl rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm dark:border-emerald-900 dark:bg-neutral-950 sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30">
          <CheckCircle2 className="h-7 w-7" />
        </div>

        <h2 className="mt-5 text-2xl font-bold tracking-tight">
          Thank you for your order
        </h2>

        {orderNumber ? (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-semibold dark:border-neutral-800 dark:bg-neutral-900">
            <PackageCheck className="h-4 w-4" />
            Order {orderNumber}
          </div>
        ) : null}

        <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-neutral-600 dark:text-neutral-400">
          Payment verification completed successfully. Keep your order number
          for future tracking. A full order-history and tracking area will be
          connected with the customer account and order-lifecycle modules.
        </p>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/products">
            <Button>Continue shopping</Button>
          </Link>
          <Link href="/">
            <Button variant="outline">Back to home</Button>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
