"use server";

import { z } from "zod";
import { getGuestOrder } from "@/lib/order-commerce";

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
