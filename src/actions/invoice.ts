"use server";

import { requireAdmin, requireAuth } from "@/lib/auth-utils";
import { ensureInvoiceForOrder, getInvoiceForCustomer } from "@/lib/invoice";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/models/Order";

export async function getCustomerInvoiceAction(orderNumber: string) {
  const user = await requireAuth(
    "/account/orders/" + encodeURIComponent(orderNumber) + "/invoice"
  );
  return getInvoiceForCustomer(orderNumber, user.id);
}

export async function getAdminInvoiceAction(orderNumber: string) {
  await requireAdmin("/admin/orders");
  await connectToDatabase();

  const order = await Order.findOne({
    orderNumber: orderNumber.trim().toUpperCase(),
  }).lean();

  if (!order) {
    return { success: false as const, code: "NOT_FOUND" as const, error: "Order not found." };
  }

  return ensureInvoiceForOrder(order._id.toString());
}
