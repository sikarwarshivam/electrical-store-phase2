import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { requireAuth } from "@/lib/auth-utils";
import { getCustomerOrder } from "@/lib/order-commerce";
import { formatINRFromPaise } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { PageContainer } from "@/components/layout/page-container";
import { notFound } from "next/navigation";

const STEPS = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"] as const;

export default async function CustomerOrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const user = await requireAuth("/account/orders/" + orderNumber);
  const order = await getCustomerOrder(user.id, orderNumber);

  if (!order) notFound();

  const currentStep = STEPS.indexOf(order.status as (typeof STEPS)[number]);
  const failed = order.status === "FAILED" || order.payment.status === "FAILED";

  return (
    <PageContainer
      title={"Order " + order.orderNumber}
      description="Order details and delivery tracking."
      actions={
        <Link href="/account/orders" className="inline-flex items-center text-sm font-semibold text-amber-700 hover:underline dark:text-amber-400">
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          My orders
        </Link>
      }
    >
      {failed ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/20 dark:text-red-200">
          This order was not completed. Payment status: {order.payment.status}.
        </div>
      ) : (
        <>
          <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="success">{order.status.replaceAll("_", " ")}</Badge>
              <Badge variant={order.payment.status === "CAPTURED" ? "success" : "warning"}>
                Payment {order.payment.status}
              </Badge>
            </div>

            <div className="relative mt-7 grid gap-5 md:grid-cols-6 md:gap-3">
              <div className="pointer-events-none absolute left-[8.333%] right-[8.333%] top-4 hidden h-1 -translate-y-1/2 rounded-full bg-neutral-200 dark:bg-neutral-800 md:block" />
              <div
                className="pointer-events-none absolute left-[8.333%] top-4 hidden h-1 -translate-y-1/2 rounded-full bg-amber-600 transition-[width] duration-300 md:block"
                style={{
                  width:
                    currentStep > 0
                      ? ((Math.min(currentStep, STEPS.length - 1) /
                          (STEPS.length - 1)) *
                          83.334) +
                        "%"
                      : "0%",
                }}
              />

              {STEPS.map((step, index) => {
                const completed = currentStep >= index;
                return (
                  <div key={step} className="relative z-10 flex md:block">
                    <div
                      className={
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors " +
                        (completed
                          ? "border-amber-600 bg-amber-600 text-white"
                          : "border-neutral-300 bg-white text-neutral-400 dark:border-neutral-700 dark:bg-neutral-950")
                      }
                    >
                      {completed ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <p className="ml-3 mt-1 text-xs font-medium md:ml-0 md:max-w-24">
                      {step.replaceAll("_", " ")}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
            <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
              <h2 className="text-base font-bold">Status history</h2>
              <div className="mt-4 space-y-4">
                {order.statusHistory.map((entry, index) => (
                  <div key={entry.status + String(entry.changedAt) + index} className="flex gap-3">
                    <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-amber-600" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{entry.status.replaceAll("_", " ")}</p>
                      <p className="text-xs text-neutral-500">
                        {new Date(entry.changedAt).toLocaleString("en-IN")}
                      </p>
                      {entry.note ? <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">{entry.note}</p> : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <aside className="h-fit rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
              <h2 className="text-base font-bold">Order summary</h2>
              <div className="mt-4 space-y-3">
                {order.items.map((item) => (
                  <div key={item.sku} className="flex justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.productName}</p>
                      <p className="text-xs text-neutral-500">{item.sku} · Qty {item.quantity}</p>
                    </div>
                    <span className="shrink-0 font-semibold">{formatINRFromPaise(item.lineTotalPaise)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 space-y-2 border-t border-neutral-200 pt-4 text-sm dark:border-neutral-800">
                <div className="flex justify-between"><span className="text-neutral-500">Subtotal</span><span>{formatINRFromPaise(order.pricing.subtotalPaise)}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Shipping</span><span>{formatINRFromPaise(order.pricing.shippingPaise)}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Tax</span><span>{formatINRFromPaise(order.pricing.taxAddedPaise)}</span></div>
                <div className="flex justify-between border-t border-neutral-200 pt-3 text-base font-bold dark:border-neutral-800"><span>Total</span><span>{formatINRFromPaise(order.pricing.grandTotalPaise)}</span></div>
              </div>
              <div className="mt-5 border-t border-neutral-200 pt-4 text-sm dark:border-neutral-800">
                <p className="text-xs text-neutral-500">Delivery address</p>
                <p className="mt-1 font-medium">{order.shippingAddress.house}, {order.shippingAddress.street}</p>
                {order.shippingAddress.landmark ? <p className="text-sm">{order.shippingAddress.landmark}</p> : null}
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
              </div>
            </aside>
          </div>
        </>
      )}
    </PageContainer>
  );
}
