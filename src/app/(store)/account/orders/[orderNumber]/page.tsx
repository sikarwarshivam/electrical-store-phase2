import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { requireAuth } from "@/lib/auth-utils";
import { getCustomerOrder } from "@/lib/order-commerce";
import { cancelCustomerOrderAction } from "@/actions/customer-orders";
import { getStoreSettings } from "@/actions/store-settings";
import { formatINRFromPaise } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { PageContainer } from "@/components/layout/page-container";
import { CatalogMessage } from "@/components/admin/catalog-message";
import { notFound } from "next/navigation";

const STEPS = ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"] as const;

export default async function CustomerOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const { orderNumber } = await params;
  const paramsData = await searchParams;
  const user = await requireAuth("/account/orders/" + orderNumber);
  const [order, storeSettings] = await Promise.all([
    getCustomerOrder(user.id, orderNumber),
    getStoreSettings(),
  ]);

  if (!order) notFound();

  const currentStep = STEPS.indexOf(order.status as (typeof STEPS)[number]);
  const failed = order.status === "FAILED" || order.payment.status === "FAILED";
  const cutoffIndex = STEPS.indexOf(
    storeSettings.delivery.cancellation.freeCancellationThroughStatus
  );
  const orderStep = STEPS.indexOf(order.status as (typeof STEPS)[number]);
  const canCancel =
    storeSettings.delivery.cancellation.enabled &&
    orderStep >= 0 &&
    cutoffIndex >= 0 &&
    orderStep <= cutoffIndex &&
    order.payment.status === "CAPTURED" &&
    !!order.payment.gatewayPaymentId;

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
      <CatalogMessage success={paramsData.success} error={paramsData.error} />
      {failed ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/20 dark:text-red-200">
          This order was not completed. Payment status: {order.payment.status}.
        </div>
      ) : order.status === "CANCELLED" ? (
        <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="destructive">CANCELLED</Badge>
            <Badge
              variant={
                order.payment.refundStatus === "PROCESSED"
                  ? "success"
                  : order.payment.refundStatus === "FAILED"
                    ? "destructive"
                    : "warning"
              }
            >
              Refund{" "}
              {order.payment.refundStatus === "PROCESSED"
                ? "PROCESSED"
                : order.payment.refundStatus === "FAILED"
                  ? "FAILED"
                  : "PENDING"}
            </Badge>
          </div>
          <p className="mt-4 text-sm text-neutral-700 dark:text-neutral-300">
            Your order has been cancelled and its inventory has been returned to stock.
          </p>
          <p className="mt-2 text-xs text-neutral-500">
            Refund amount:{" "}
            {formatINRFromPaise(
              order.payment.refundAmountPaise ?? order.pricing.grandTotalPaise
            )}
          </p>
          {order.payment.refundStatus === "PENDING" ? (
            <p className="mt-2 text-xs text-neutral-500">
              The refund has been initiated with Razorpay. The credit timeline depends
              on the original payment method.
            </p>
          ) : null}
          {order.payment.refundStatus === "FAILED" ? (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">
              We could not complete the automatic refund. Please contact support with
              this order number.
            </p>
          ) : null}
        </section>
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
                  <div
                    key={step}
                    className="relative z-10 flex flex-col items-center text-center"
                  >
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
                    <p className="mt-2 max-w-28 text-xs font-medium leading-4">
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

              {canCancel ? (
                <div className="mt-5 border-t border-neutral-200 pt-4 dark:border-neutral-800">
                  <p className="text-xs text-neutral-500">
                    Cancellation is available until {storeSettings.delivery.cancellation.freeCancellationThroughStatus.replaceAll("_", " ")}.
                  </p>
                  <form action={cancelCustomerOrderAction} className="mt-3">
                    <input type="hidden" name="orderNumber" value={order.orderNumber} />
                    <button
                      type="submit"
                      className="inline-flex h-9 items-center justify-center rounded-md border border-red-300 px-4 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                      Cancel order
                    </button>
                  </form>
                </div>
              ) : null}
            </aside>
          </div>
        </>
      )}
    </PageContainer>
  );
}
