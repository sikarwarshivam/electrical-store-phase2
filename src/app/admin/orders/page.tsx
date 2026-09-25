import { PageContainer } from "@/components/layout/page-container";
import { ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getAdminOrders } from "@/lib/order-commerce";
import { formatINRFromPaise } from "@/lib/money";
import { updateOrderStatusAction } from "@/actions/order";
import { CatalogMessage } from "@/components/admin/catalog-message";

export const metadata = {
  title: "Orders Management",
};

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" {
  if (status === "PLACED" || status === "CONFIRMED" || status === "DELIVERED") return "success";
  if (status === "PAYMENT_PENDING" || status === "PACKED" || status === "SHIPPED" || status === "OUT_FOR_DELIVERY") return "warning";
  if (status === "FAILED" || status === "CANCELLED" || status === "REFUNDED") return "destructive";
  return "secondary";
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string; status?: string; error?: string }>;
}) {
  const params = await searchParams;
  const orders = await getAdminOrders();
  const failedOrders = orders.filter(
    (order) => order.status === "FAILED" || order.payment.status === "FAILED"
  );
  const activeOrders = orders.filter(
    (order) => order.status !== "FAILED" && order.payment.status !== "FAILED"
  );
  const afterTitle = (
    <CatalogMessage
      success={
        params.updated
          ? params.updated +
            " updated to " +
            (params.status || "new status").replaceAll("_", " ") +
            "."
          : undefined
      }
      error={params.error}
    />
  );

  return (
    <PageContainer
      title="Customer & Contractor Orders"
      description="Track payment, customer details, order status, and delivery progress."
      actions={
        <Badge variant="outline" className="text-xs">
          {activeOrders.length} active order{activeOrders.length === 1 ? "" : "s"}
        </Badge>
      }
    >
      {afterTitle}
      {activeOrders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center dark:border-neutral-800 dark:bg-neutral-950">
          <ClipboardList className="mx-auto h-8 w-8 text-neutral-400" />
          <h2 className="mt-3 text-base font-bold">No active orders</h2>
          <p className="mt-1 text-sm text-neutral-500">
            New and in-progress orders will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeOrders.map((order) => (
            <div
              key={String(order._id)}
              className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold">{order.orderNumber}</h2>
                    <Badge variant={statusVariant(order.status)}>
                      {order.status.replaceAll("_", " ")}
                    </Badge>
                    <Badge variant={order.payment.status === "CAPTURED" ? "success" : order.payment.status === "FAILED" ? "destructive" : "warning"}>
                      Payment: {order.payment.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm font-medium">{order.customer.name}</p>
                  <p className="text-xs text-neutral-500">
                    {order.customer.phone}
                    {order.customer.email ? " · " + order.customer.email : ""}
                  </p>
                  <p className="mt-2 text-xs text-neutral-500">
                    {order.items.length} item{order.items.length === 1 ? "" : "s"} · Qty {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </p>
                </div>

                <div className="shrink-0 lg:text-right">
                  <p className="text-lg font-bold">
                    {formatINRFromPaise(order.pricing.grandTotalPaise)}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {new Date(order.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      Order lifecycle
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      Move the order through the configured manual fulfilment states.
                    </p>
                  </div>
                  {order.status === "PLACED" ||
                  order.status === "CONFIRMED" ||
                  order.status === "PACKED" ||
                  order.status === "SHIPPED" ||
                  order.status === "OUT_FOR_DELIVERY" ? (
                    <form action={updateOrderStatusAction} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <input type="hidden" name="orderId" value={String(order._id)} />
                      <select
                        name="status"
                        defaultValue={
                          order.status === "PLACED"
                            ? "CONFIRMED"
                            : order.status === "CONFIRMED"
                              ? "PACKED"
                              : order.status === "PACKED"
                                ? "SHIPPED"
                                : order.status === "SHIPPED"
                                  ? "OUT_FOR_DELIVERY"
                                  : "DELIVERED"
                        }
                        className="h-9 rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                      >
                        {order.status === "PLACED" ? <option value="CONFIRMED">Confirm</option> : null}
                        {order.status === "CONFIRMED" ? <option value="PACKED">Mark packed</option> : null}
                        {order.status === "PACKED" ? <option value="SHIPPED">Mark shipped</option> : null}
                        {order.status === "SHIPPED" ? <option value="OUT_FOR_DELIVERY">Out for delivery</option> : null}
                        {order.status === "OUT_FOR_DELIVERY" ? <option value="DELIVERED">Mark delivered</option> : null}
                      </select>
                      <input
                        type="text"
                        name="note"
                        maxLength={300}
                        placeholder="Optional note"
                        className="h-9 min-w-0 rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                      />
                      <button
                        type="submit"
                        className="inline-flex h-9 items-center justify-center rounded-md bg-amber-600 px-4 text-sm font-medium text-white hover:bg-amber-700"
                      >
                        Update status
                      </button>
                    </form>
                  ) : (
                    <Badge variant="secondary">
                      No manual transition available
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mt-4 grid gap-3 border-t border-neutral-200 pt-4 text-sm dark:border-neutral-800 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-neutral-500">Delivery</p>
                  <p className="mt-1 font-medium">
                    {order.shippingAddress.city}, {order.shippingAddress.state} · {order.shippingAddress.pincode}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Items</p>
                  <p className="mt-1 font-medium">
                    {order.items.map((item) => item.sku).join(", ")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Inventory</p>
                  <p className="mt-1 font-medium">
                    {order.reservation.status === "CONSUMED" ? "Sale finalized" : order.reservation.status === "ACTIVE" ? "Reserved" : "Released"}
                  </p>
                </div>
              </div>

              {order.statusHistory?.length ? (
                <details className="mt-4 border-t border-neutral-200 pt-4 dark:border-neutral-800">
                  <summary className="cursor-pointer text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                    Status history ({order.statusHistory.length})
                  </summary>
                  <div className="mt-3 space-y-2">
                    {order.statusHistory.map((entry, index) => (
                      <div
                        key={entry.status + String(entry.changedAt) + index}
                        className="flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:justify-between"
                      >
                        <span className="font-medium">
                          {entry.status.replaceAll("_", " ")}
                          {entry.note ? " — " + entry.note : ""}
                        </span>
                        <span className="text-neutral-500">
                          {new Date(entry.changedAt).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {failedOrders.length > 0 ? (
        <details className="mt-6 rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
          <summary className="cursor-pointer list-none p-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-bold">Failed payment attempts</h2>
                <p className="mt-1 text-xs text-neutral-500">
                  Kept for audit and troubleshooting, but hidden from the main order list.
                </p>
              </div>
              <Badge variant="destructive">
                {failedOrders.length} failed
              </Badge>
            </div>
          </summary>

          <div className="border-t border-neutral-200 dark:border-neutral-800">
            {failedOrders.map((order) => (
              <div
                key={String(order._id)}
                className="flex flex-col gap-3 border-b border-neutral-200 p-4 last:border-b-0 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{order.orderNumber}</span>
                    <Badge variant="destructive">Payment failed</Badge>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    {order.customer.name} · {order.customer.phone} · Qty{" "}
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {order.payment.failureDescription || "Payment attempt failed."}
                  </p>
                </div>

                <div className="shrink-0 text-left sm:text-right">
                  <p className="font-semibold">
                    {formatINRFromPaise(order.pricing.grandTotalPaise)}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {new Date(order.createdAt).toLocaleString("en-IN")}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Inventory: {order.reservation.status === "RELEASED" ? "Released" : order.reservation.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </PageContainer>
  );
}
