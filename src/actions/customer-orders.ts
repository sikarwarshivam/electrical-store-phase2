"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { getGuestOrder, restockCancelledOrderInventory } from "@/lib/order-commerce";
import { requireAuth } from "@/lib/auth-utils";
import { connectToDatabase } from "@/lib/db";
import { logger } from "@/lib/logger";
import { refundRazorpayPayment, fetchRazorpayPayment } from "@/lib/razorpay";
import { StoreSettings } from "@/models/StoreSettings";
import { DEFAULT_STORE_SETTINGS } from "@/models/StoreSettings";
import { Order } from "@/models/Order";
import { cancelCustomerOrderSchema } from "@/schemas/order";

const guestTrackSchema = z.object({
  orderNumber: z.string().trim().min(5).max(40),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number"),
});

export async function trackGuestOrderAction(input: unknown) {
  const parsed = guestTrackSchema.safeParse(input);
  if (!parsed.success) return { success: false as const, error: "Enter a valid order number and 10-digit phone number." };

  const order = await getGuestOrder(parsed.data.orderNumber, parsed.data.phone);
  if (!order) return { success: false as const, error: "We could not find a paid order with those details." };

  return {
    success: true as const,
    order: {
      orderNumber: order.orderNumber,
      status: order.status,
      payment: order.payment.status,
      pricing: { grandTotalPaise: order.pricing.grandTotalPaise },
      createdAt: order.createdAt.toISOString(),
      statusHistory: order.statusHistory.map((entry) => ({
        status: entry.status,
        changedAt: entry.changedAt.toISOString(),
        note: entry.note,
      })),
    },
  };
}

const CANCELLATION_STATUS_RANK: Record<string, number> = {
  PLACED: 1,
  CONFIRMED: 2,
  PACKED: 3,
};

export async function cancelCustomerOrderAction(formData: FormData): Promise<never> {
  const parsed = cancelCustomerOrderSchema.safeParse({
    orderNumber: formData.get("orderNumber"),
  });

  if (!parsed.success) {
    redirect("/account/orders?error=" + encodeURIComponent("Invalid order identifier."));
  }

  const user = await requireAuth("/account/orders");
  await connectToDatabase();

  const order = await Order.findOne({
    orderNumber: parsed.data.orderNumber.trim().toUpperCase(),
    "customer.userId": user.id,
  });

  if (!order) {
    redirect(
      "/account/orders?error=" +
        encodeURIComponent("Order not found.")
    );
  }

  if (order.status === "CANCELLED") {
    redirect(
      "/account/orders/" +
        encodeURIComponent(order!.orderNumber) +
        "?success=" +
        encodeURIComponent("This order has already been cancelled.")
    );
  }

  const settings = await StoreSettings.findOne({ key: "default" })
    .select("delivery.cancellation")
    .lean();

  const cancellationSettings =
    settings?.delivery?.cancellation ??
    DEFAULT_STORE_SETTINGS.delivery.cancellation;

  if (!cancellationSettings.enabled) {
    redirect(
      "/account/orders/" +
        encodeURIComponent(order!.orderNumber) +
        "?error=" +
        encodeURIComponent("Order cancellation is currently unavailable.")
    );
  }

  const currentRank = CANCELLATION_STATUS_RANK[order!.status] ?? Number.POSITIVE_INFINITY;
  const cutoffRank =
    CANCELLATION_STATUS_RANK[cancellationSettings.freeCancellationThroughStatus] ?? 0;

  if (currentRank > cutoffRank || currentRank === Number.POSITIVE_INFINITY) {
    redirect(
      "/account/orders/" +
        encodeURIComponent(order!.orderNumber) +
        "?error=" +
        encodeURIComponent("This order can no longer be cancelled because shipping has started.")
    );
  }

  if (order!.payment.status !== "CAPTURED" || !order!.payment.gatewayPaymentId) {
    redirect(
      "/account/orders/" +
        encodeURIComponent(order!.orderNumber) +
        "?error=" +
        encodeURIComponent("This order cannot be cancelled because its payment is not refundable through the online gateway.")
    );
  }

  // Restock first. The RETURN transaction is idempotent, so a retry after a
  // gateway failure will not double-restock the same order.
  try {
    await restockCancelledOrderInventory(
      order!._id.toString(),
      "Customer cancelled order before shipment."
    );
  } catch (error) {
    logger.error("Customer cancellation inventory restock failed", error, {
      orderId: order!._id.toString(),
    });
    redirect(
      "/account/orders/" +
        encodeURIComponent(order!.orderNumber) +
        "?error=" +
        encodeURIComponent("We could not restore inventory for this cancellation. Please try again.")
    );
  }

  order!.status = "CANCELLED";
  order!.statusHistory.push({
    status: "CANCELLED",
    changedAt: new Date(),
    note: "Customer cancelled the order before shipment. Refund initiated for the full paid amount.",
    changedBy: undefined,
  });

  order!.payment.refundAmountPaise = order!.pricing.grandTotalPaise;
  order!.payment.refundRequestedAt = new Date();
  order!.payment.refundStatus = "PENDING";
  order!.payment.refundFailureDescription = undefined;

  await order!.save();

  try {
    const refund = await refundRazorpayPayment({
      paymentId: order!.payment.gatewayPaymentId,
      amountPaise: order!.pricing.grandTotalPaise,
    });

    order!.payment.gatewayRefundId = refund.id;
    order!.payment.refundStatus =
      refund.status === "processed" ? "PROCESSED" : "PENDING";

    if (refund.status === "processed") {
      order!.payment.status = "REFUNDED";
      order!.payment.refundedAt = new Date();
    }

    await order!.save();

    const message =
      refund.status === "processed"
        ? "Order cancelled successfully. Your full payment refund has been initiated."
        : "Order cancelled successfully. Your full payment refund is being processed.";

    redirect(
      "/account/orders/" +
        encodeURIComponent(order!.orderNumber) +
        "?success=" +
        encodeURIComponent(message)
    );
  } catch (error) {
    logger.error("Customer order refund failed", error, {
      orderId: order!._id.toString(),
      paymentId: order!.payment.gatewayPaymentId,
    });

    // If the refund request succeeded externally but our first response was
    // lost, Razorpay's payment status can still show the payment as refunded.
    try {
      const payment = await fetchRazorpayPayment(order!.payment.gatewayPaymentId);

      if (payment.status === "refunded") {
        order!.payment.status = "REFUNDED";
        order!.payment.refundStatus = "PROCESSED";
        order!.payment.refundedAt = new Date();
        order!.payment.refundFailureDescription = undefined;
      } else {
        order!.payment.refundStatus = "FAILED";
        order!.payment.refundFailureDescription =
          error instanceof Error
            ? error.message
            : "Refund request could not be completed.";
      }
    } catch (statusError) {
      logger.error("Unable to verify Razorpay refund status", statusError, {
        orderId: order!._id.toString(),
        paymentId: order!.payment.gatewayPaymentId,
      });
      order!.payment.refundStatus = "FAILED";
      order!.payment.refundFailureDescription =
        "Refund status could not be verified. Please contact support.";
    }

    await order!.save();

    redirect(
      "/account/orders/" +
        encodeURIComponent(order!.orderNumber) +
        "?error=" +
        encodeURIComponent(
          order!.payment.refundStatus === "FAILED"
            ? "Order cancelled, but the payment refund could not be completed automatically. Please contact support."
            : "Order cancelled. The payment refund has been processed."
        )
    );
  }
}
