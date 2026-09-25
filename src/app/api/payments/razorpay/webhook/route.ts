import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { logger } from "@/lib/logger";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";
import { consumeOrderReservation, releaseOrderInventory } from "@/lib/order-commerce";
import { Order } from "@/models/Order";

export const runtime = "nodejs";

interface RazorpayWebhookPayment {
  id?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  status?: string;
  error_code?: string | null;
  error_description?: string | null;
}

interface RazorpayWebhookBody {
  event?: string;
  payload?: {
    payment?: {
      entity?: RazorpayWebhookPayment;
    };
  };
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");
  const eventId = request.headers.get("x-razorpay-event-id");

  if (!signature) {
    return NextResponse.json({ success: false, error: "Missing webhook signature." }, { status: 400 });
  }

  try {
    if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ success: false, error: "Invalid webhook signature." }, { status: 400 });
    }

    const body = JSON.parse(rawBody) as RazorpayWebhookBody;
    const event = body.event;
    const payment = body.payload?.payment?.entity;

    if (!event || !payment?.order_id) {
      return NextResponse.json({ success: true, ignored: true });
    }

    await connectToDatabase();

    const order = await Order.findOne({
      "payment.gatewayOrderId": payment.order_id,
    });

    if (!order) {
      return NextResponse.json({ success: true, ignored: true });
    }

    if (eventId && order.processedWebhookEventIds.includes(eventId)) {
      return NextResponse.json({ success: true, duplicate: true });
    }

    if (payment.currency !== "INR" || payment.amount !== order.pricing.grandTotalPaise) {
      logger.error("Rejected Razorpay webhook due to amount/currency mismatch", {
        orderId: order._id.toString(),
        event,
      });
      return NextResponse.json({ success: false, error: "Payment details do not match the order." }, { status: 400 });
    }

    if (event === "payment.captured" && payment.id) {
      if (order.payment.status !== "CAPTURED") {
        await consumeOrderReservation(order._id.toString(), "Razorpay payment.captured webhook.");
      }

      await Order.updateOne(
        { _id: order._id },
        {
          $set: {
            status: order.status === "FAILED" ? "FAILED" : "PLACED",
            "payment.status": "CAPTURED",
            "payment.gatewayPaymentId": payment.id,
            "payment.webhookVerifiedAt": new Date(),
          },
          ...(eventId ? { $addToSet: { processedWebhookEventIds: eventId } } : {}),
        }
      );

      return NextResponse.json({ success: true });
    }

    if (event === "payment.failed") {
      if (order.status === "PAYMENT_PENDING") {
        await releaseOrderInventory(order._id.toString(), "Razorpay payment.failed webhook.");
        await Order.updateOne(
          { _id: order._id, status: "PAYMENT_PENDING" },
          {
            $set: {
              status: "FAILED",
              "payment.status": "FAILED",
              "payment.failedAt": new Date(),
              "payment.failureCode": payment.error_code || "PAYMENT_FAILED",
              "payment.failureDescription": payment.error_description || "Razorpay reported a failed payment.",
              "payment.webhookVerifiedAt": new Date(),
            },
            ...(eventId ? { $addToSet: { processedWebhookEventIds: eventId } } : {}),
          }
        );
      } else if (eventId) {
        await Order.updateOne(
          { _id: order._id },
          {
            $addToSet: { processedWebhookEventIds: eventId },
            $set: { "payment.webhookVerifiedAt": new Date() },
          }
        );
      }

      return NextResponse.json({ success: true });
    }

    if (eventId) {
      await Order.updateOne(
        { _id: order._id },
        { $addToSet: { processedWebhookEventIds: eventId } }
      );
    }

    return NextResponse.json({ success: true, ignored: true });
  } catch (error) {
    logger.error("Razorpay webhook processing failed", error);
    return NextResponse.json(
      { success: false, error: "Webhook processing failed." },
      { status: 500 }
    );
  }
}
