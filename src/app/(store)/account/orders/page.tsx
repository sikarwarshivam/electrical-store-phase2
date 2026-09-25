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

  return (
    <PageContainer
      title="My Orders"
      description="View your orders and follow their delivery progress."
    >
      {orders.length === 0 ? (
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
          {orders.map((order) => (
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
    </PageContainer>
  );
}
