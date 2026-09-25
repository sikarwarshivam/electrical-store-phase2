import { PageContainer } from "@/components/layout/page-container";
import { ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getAdminOrders } from "@/lib/order-commerce";
import { formatINRFromPaise } from "@/lib/money";

export const metadata = {
  title: "Orders Management",
};

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" {
  if (status === "PLACED" || status === "CONFIRMED" || status === "DELIVERED") return "success";
  if (status === "PAYMENT_PENDING" || status === "PACKED" || status === "SHIPPED" || status === "OUT_FOR_DELIVERY") return "warning";
  if (status === "FAILED" || status === "CANCELLED" || status === "REFUNDED") return "destructive";
  return "secondary";
}

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  return (
    <PageContainer
      title="Customer & Contractor Orders"
      description="Track payment, customer details, order status, and delivery progress."
      actions={
        <Badge variant="outline" className="text-xs">
          {orders.length} recent order{orders.length === 1 ? "" : "s"}
        </Badge>
      }
    >
      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center dark:border-neutral-800 dark:bg-neutral-950">
          <ClipboardList className="mx-auto h-8 w-8 text-neutral-400" />
          <h2 className="mt-3 text-base font-bold">No orders yet</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Completed and in-progress checkout attempts will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
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
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
