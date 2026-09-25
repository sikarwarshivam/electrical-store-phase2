import Link from "next/link";
import { ClipboardList, ChevronRight } from "lucide-react";
import { requireAuth } from "@/lib/auth-utils";
import { getCustomerOrders } from "@/lib/order-commerce";
import { formatINRFromPaise } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/page-container";

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" {
  if (["PLACED", "CONFIRMED", "DELIVERED"].includes(status)) return "success";
  if (["PACKED", "SHIPPED", "OUT_FOR_DELIVERY"].includes(status)) return "warning";
  if (["FAILED", "CANCELLED", "REFUNDED"].includes(status)) return "destructive";
  return "secondary";
}

export default async function AccountOrdersPage() {
  const user = await requireAuth("/account/orders");
  const orders = await getCustomerOrders(user.id);
  const paymentAttempts = orders.filter(
    (order) =>
      order.status === "PAYMENT_PENDING" ||
      order.status === "FAILED" ||
      order.payment.status === "FAILED"
  );
  const customerOrders = orders.filter(
    (order) =>
      order.status !== "PAYMENT_PENDING" &&
      order.status !== "FAILED" &&
      order.payment.status !== "FAILED"
  );

  return (
    <PageContainer
      title="My Orders"
      description="View your orders and follow their delivery progress."
    >
      {customerOrders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center dark:border-neutral-800 dark:bg-neutral-950">
          <ClipboardList className="mx-auto h-8 w-8 text-neutral-400" />
          <h2 className="mt-3 text-lg font-bold">No orders yet</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Orders you place with this account will appear here.
          </p>
          <Link href="/products" className="mt-5 inline-flex">
            <Button>Browse products</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {customerOrders.map((order) => (
            <Link
              key={String(order._id)}
              href={"/account/orders/" + encodeURIComponent(order.orderNumber)}
              className="block rounded-xl border border-neutral-200 bg-white p-5 transition-colors hover:border-amber-400 dark:border-neutral-800 dark:bg-neutral-950"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold">{order.orderNumber}</h2>
                    <Badge variant={statusVariant(order.status)}>
                      {order.status.replaceAll("_", " ")}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-neutral-500">
                    {new Date(order.createdAt).toLocaleString("en-IN")}
                  </p>
                  <p className="mt-2 text-sm">
                    {order.items.length} item{order.items.length === 1 ? "" : "s"} · Qty{" "}
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </p>
                </div>
                <div className="flex items-center gap-3 sm:text-right">
                  <div>
                    <p className="text-lg font-bold">
                      {formatINRFromPaise(order.pricing.grandTotalPaise)}
                    </p>
                    <p className="text-xs text-neutral-500">
                      Payment: {order.payment.status}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-neutral-400" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {paymentAttempts.length > 0 ? (
        <details className="mt-6 rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
          <summary className="cursor-pointer list-none p-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-bold">Payment attempts</h2>
                <p className="mt-1 text-xs text-neutral-500">
                  Failed or unfinished payment attempts are kept separately from completed order history.
                </p>
              </div>
              <Badge variant="outline">
                {paymentAttempts.length} attempt{paymentAttempts.length === 1 ? "" : "s"}
              </Badge>
            </div>
          </summary>

          <div className="border-t border-neutral-200 dark:border-neutral-800">
            {paymentAttempts.map((order) => {
              const failed =
                order.status === "FAILED" || order.payment.status === "FAILED";
              return (
                <Link
                  key={String(order._id)}
                  href={"/account/orders/" + encodeURIComponent(order.orderNumber)}
                  className="flex flex-col gap-3 border-b border-neutral-200 p-4 last:border-b-0 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900/60 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{order.orderNumber}</span>
                      <Badge variant={failed ? "destructive" : "warning"}>
                        {failed ? "Payment failed" : "Payment pending"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">
                      {new Date(order.createdAt).toLocaleString("en-IN")} · Qty{" "}
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                    </p>
                    {failed && order.payment.failureDescription ? (
                      <p className="mt-1 text-xs text-neutral-500">
                        {order.payment.failureDescription}
                      </p>
                    ) : null}
                  </div>

                  <div className="shrink-0 sm:text-right">
                    <p className="font-semibold">
                      {formatINRFromPaise(order.pricing.grandTotalPaise)}
                    </p>
                    <p className="text-xs text-neutral-500">
                      Payment: {order.payment.status}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </details>
      ) : null}
    </PageContainer>
  );
}
