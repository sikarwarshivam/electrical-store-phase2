"use server";

import { randomBytes } from "node:crypto";
import mongoose from "mongoose";
import { getCurrentUser, requireAdmin } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { logger } from "@/lib/logger";
import { createRazorpayOrder, fetchRazorpayPayment, getRazorpayKeyId, verifyRazorpayPaymentSignature } from "@/lib/razorpay";
import { consumeOrderReservation, releaseExpiredOrderReservations, releaseOrderInventory, reserveOrderInventory } from "@/lib/order-commerce";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import {
  adminOrderStatusSchema,
  createPaymentOrderSchema,
  verifyPaymentSchema,
} from "@/schemas/order";
import { reconcileCartAction } from "@/actions/cart";
import type { IOrderLine } from "@/models/Order";

function parseConfiguredPaise(name: string, fallback = 0) {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;

  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(name + " must be a non-negative integer in paise.");
  }

  return value;
}

function getReservationMinutes() {
  const raw = process.env.PAYMENT_RESERVATION_MINUTES?.trim();
  if (!raw) return 10;

  const value = Number(raw);
  if (!Number.isInteger(value) || value < 5 || value > 30) {
    throw new Error("PAYMENT_RESERVATION_MINUTES must be an integer from 5 to 30.");
  }

  return value;
}

function calculateTax(
  subtotalPaise: number,
  gstRate: number | undefined,
  isGstInclusive: boolean
) {
  if (!gstRate || gstRate <= 0) {
    return {
      taxPaise: 0,
      taxIncludedPaise: 0,
      taxAddedPaise: 0,
    };
  }

  if (isGstInclusive) {
    const taxPaise = Math.round(
      (subtotalPaise * gstRate) / (100 + gstRate)
    );
    return {
      taxPaise,
      taxIncludedPaise: taxPaise,
      taxAddedPaise: 0,
    };
  }

  const taxPaise = Math.round((subtotalPaise * gstRate) / 100);
  return {
    taxPaise,
    taxIncludedPaise: 0,
    taxAddedPaise: taxPaise,
  };
}


const ADMIN_ORDER_TRANSITIONS: Record<string, string[]> = {
  PLACED: ["CONFIRMED"],
  CONFIRMED: ["PACKED"],
  PACKED: ["SHIPPED"],
  SHIPPED: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
  FAILED: [],
  PAYMENT_PENDING: [],
  RETURNED: [],
  REFUNDED: [],
};

function canAdminTransition(from: string, to: string) {
  return ADMIN_ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

function buildStatusEntry(
  status: import("@/models/Order").OrderStatus,
  changedBy?: string,
  note?: string
) {
  return {
    status,
    changedAt: new Date(),
    note: note || undefined,
    changedBy:
      changedBy && mongoose.Types.ObjectId.isValid(changedBy)
        ? new mongoose.Types.ObjectId(changedBy)
        : undefined,
  };
}

function createOrderNumber() {
  const date = new Date();
  const yyyy = date.getUTCFullYear().toString();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return "ELC-" + yyyy + mm + dd + "-" + randomBytes(4).toString("hex").toUpperCase();
}

export type CreatePaymentOrderResult =
  | {
      success: true;
      orderId: string;
      orderNumber: string;
      razorpayOrderId: string;
      razorpayKeyId: string;
      amountPaise: number;
      subtotalPaise: number;
      shippingPaise: number;
      taxPaise: number;
      currency: "INR";
      reservationExpiresAt: string;
    }
  | {
      success: false;
      error: string;
    };

export async function createPaymentOrderAction(
  input: unknown
): Promise<CreatePaymentOrderResult> {
  const parsed = createPaymentOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Please correct the checkout details and try again." };
  }

  try {
    await connectToDatabase();
    await releaseExpiredOrderReservations();

    const { checkoutId, items, address } = parsed.data;
    const existing = await Order.findOne({ checkoutId });

    if (existing) {
      if (
        existing.status === "PAYMENT_PENDING" &&
        existing.payment.gatewayOrderId
      ) {
        return {
          success: true,
          orderId: existing._id.toString(),
          orderNumber: existing.orderNumber,
          razorpayOrderId: existing.payment.gatewayOrderId,
          razorpayKeyId: getRazorpayKeyId(),
          amountPaise: existing.pricing.grandTotalPaise,
          subtotalPaise: existing.pricing.subtotalPaise,
          shippingPaise: existing.pricing.shippingPaise,
          taxPaise: existing.pricing.taxPaise,
          currency: "INR",
          reservationExpiresAt: existing.reservation.expiresAt.toISOString(),
        };
      }

      return {
        success: false,
        error: "This checkout attempt has already been processed. Please refresh checkout and try again.",
      };
    }

    const reconciliation = await reconcileCartAction({
      items: items.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
        unitPricePaise: item.unitPricePaise,
      })),
    });

    if (
      reconciliation.issues.length > 0 ||
      reconciliation.lines.length !== items.length ||
      reconciliation.lines.some(
        (line) =>
          !line.purchasable ||
          !line.productId ||
          line.unitPricePaise === undefined
      )
    ) {
      return {
        success: false,
        error: reconciliation.issues[0]?.message || "Your cart changed. Please return to the cart and recheck it.",
      };
    }

    const productIds = reconciliation.lines.map(
      (line) => new mongoose.Types.ObjectId(line.productId!)
    );
    const products = await Product.find({ _id: { $in: productIds } })
      .select("_id name tax")
      .lean();
    const productMap = new Map(products.map((product) => [String(product._id), product]));

    const lines = reconciliation.lines.map((line) => {
      const product = productMap.get(line.productId!);
      const subtotalPaise = line.unitPricePaise! * line.quantity;
      const tax = calculateTax(
        subtotalPaise,
        product?.tax?.gstRate,
        product?.tax?.isGstInclusive ?? true
      );

      return {
        product: new mongoose.Types.ObjectId(line.productId!),
        variant: new mongoose.Types.ObjectId(line.variantId),
        sku: line.sku!,
        productName: product?.name || line.title || line.sku!,
        variantTitle: line.title?.includes(" — ")
          ? line.title.slice(line.title.indexOf(" — ") + 3)
          : undefined,
        imageUrl: line.image,
        unitOfSale: line.unitOfSale! as IOrderLine["unitOfSale"],
        quantity: line.quantity,
        unitPricePaise: line.unitPricePaise!,
        mrpPaise: line.mrpPaise!,
        subtotalPaise,
        hsnCode: product?.tax?.hsnCode,
        gstRate: product?.tax?.gstRate,
        taxIncluded: product?.tax?.isGstInclusive ?? true,
        taxPaise: tax.taxPaise,
        lineTotalPaise: subtotalPaise + tax.taxAddedPaise,
        taxIncludedPaise: tax.taxIncludedPaise,
        taxAddedPaise: tax.taxAddedPaise,
      };
    });

    const subtotalPaise = lines.reduce((total, line) => total + line.subtotalPaise, 0);
    const taxPaise = lines.reduce((total, line) => total + line.taxPaise, 0);
    const taxIncludedPaise = lines.reduce((total, line) => total + line.taxIncludedPaise, 0);
    const taxAddedPaise = lines.reduce((total, line) => total + line.taxAddedPaise, 0);
    const discountPaise = 0;
    const shippingPaise = parseConfiguredPaise("SHIPPING_FLAT_RATE_PAISE", 0);
    const grandTotalPaise =
      subtotalPaise - discountPaise + shippingPaise + taxAddedPaise;

    if (grandTotalPaise <= 0) {
      return {
        success: false,
        error: "Online payment requires a positive order total.",
      };
    }

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + getReservationMinutes() * 60 * 1000
    );
    const user = await getCurrentUser();
    const userId =
      user?.id && mongoose.Types.ObjectId.isValid(user.id)
        ? new mongoose.Types.ObjectId(user.id)
        : undefined;
    const customerEmail = address.email || user?.email || undefined;

    const orderItems = lines.map((line) => {
      const orderLine = {
        ...line,
      } as IOrderLine & {
        taxIncludedPaise?: number;
        taxAddedPaise?: number;
      };

      delete orderLine.taxIncludedPaise;
      delete orderLine.taxAddedPaise;
      return orderLine;
    });

    const order = new Order({
      orderNumber: createOrderNumber(),
      checkoutId,
      customer: {
        userId,
        name: address.fullName,
        phone: address.phone,
        email: customerEmail,
      },
      shippingAddress: {
        ...address,
        email: address.email || undefined,
        landmark: address.landmark || undefined,
      },
      items: orderItems,
      pricing: {
        currency: "INR",
        subtotalPaise,
        discountPaise,
        shippingPaise,
        taxPaise,
        taxIncludedPaise,
        taxAddedPaise,
        grandTotalPaise,
      },
      status: "PAYMENT_PENDING",
      statusHistory: [
        buildStatusEntry("PAYMENT_PENDING", userId?.toString(), "Checkout payment initiated."),
      ],
      payment: {
        method: "RAZORPAY",
        status: "PENDING",
      },
      reservation: {
        status: "ACTIVE",
        reservedAt: now,
        expiresAt,
      },
    });

    await order.save();

    try {
      await reserveOrderInventory(order._id.toString());
    } catch (inventoryError) {
      await Order.updateOne(
        { _id: order._id },
        {
          $set: {
            status: "FAILED",
            "payment.status": "FAILED",
            "payment.failedAt": new Date(),
            "payment.failureCode": "STOCK_RESERVATION_FAILED",
            "payment.failureDescription":
              inventoryError instanceof Error
                ? inventoryError.message
                : "Unable to reserve stock.",
          },
        }
      );

      return {
        success: false,
        error:
          inventoryError instanceof Error
            ? inventoryError.message
            : "Unable to reserve stock for this order.",
      };
    }

    try {
      const razorpayOrder = await createRazorpayOrder({
        amountPaise: grandTotalPaise,
        receipt: order.orderNumber,
        notes: {
          order_number: order.orderNumber,
        },
      });

      order.payment.gatewayOrderId = razorpayOrder.id;
      await order.save();

      return {
        success: true,
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        razorpayOrderId: razorpayOrder.id,
        razorpayKeyId: getRazorpayKeyId(),
        amountPaise: grandTotalPaise,
        subtotalPaise,
        shippingPaise,
        taxPaise,
        currency: "INR",
        reservationExpiresAt: expiresAt.toISOString(),
      };
    } catch (razorpayError) {
      const gatewayMessage =
        razorpayError instanceof Error
          ? razorpayError.message
          : "Razorpay order creation failed.";

      logger.error("Razorpay order creation failed", razorpayError, {
        orderId: order._id.toString(),
      });

      try {
        await releaseOrderInventory(
          order._id.toString(),
          "Payment order creation failed."
        );
      } catch (releaseError) {
        logger.error(
          "Failed to release inventory after Razorpay order creation failure",
          releaseError,
          { orderId: order._id.toString() }
        );
      }

      await Order.updateOne(
        { _id: order._id },
        {
          $set: {
            status: "FAILED",
            "payment.status": "FAILED",
            "payment.failedAt": new Date(),
            "payment.failureCode": "RAZORPAY_ORDER_CREATE_FAILED",
            "payment.failureDescription": gatewayMessage,
          },
        }
      );

      return {
        success: false,
        error:
          process.env.NODE_ENV === "development"
            ? "Payment setup failed: " +
              gatewayMessage +
              " Your stock reservation has been released."
            : "Payment setup failed. Your stock reservation has been released. Please try checkout again.",
      };
    }
  } catch (error) {
    logger.error("Payment order creation failed", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to start payment. Please try again.",
    };
  }
}

export type VerifyPaymentResult =
  | { success: true; orderId: string; orderNumber: string }
  | { success: false; error: string };

export async function verifyRazorpayPaymentAction(
  input: unknown
): Promise<VerifyPaymentResult> {
  const parsed = verifyPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid payment verification request." };
  }

  try {
    await connectToDatabase();

    const order = await Order.findById(parsed.data.orderId);
    if (!order) {
      return { success: false, error: "Order could not be found." };
    }

    if (order.status === "PLACED" && order.payment.gatewayPaymentId) {
      if (order.payment.gatewayPaymentId === parsed.data.razorpayPaymentId) {
        return {
          success: true,
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
        };
      }
      return { success: false, error: "This order has already been processed." };
    }

    if (order.status !== "PAYMENT_PENDING") {
      return { success: false, error: "This order is no longer awaiting payment." };
    }

    const gatewayOrderId = order.payment.gatewayOrderId;
    if (!gatewayOrderId) {
      return { success: false, error: "Payment order is not initialized." };
    }

    if (
      !verifyRazorpayPaymentSignature(
        gatewayOrderId,
        parsed.data.razorpayPaymentId,
        parsed.data.razorpaySignature
      )
    ) {
      return { success: false, error: "Payment signature verification failed." };
    }

    const payment = await fetchRazorpayPayment(parsed.data.razorpayPaymentId);

    if (
      payment.order_id !== gatewayOrderId ||
      payment.currency !== "INR" ||
      payment.amount !== order.pricing.grandTotalPaise
    ) {
      return { success: false, error: "Payment amount or order verification failed." };
    }

    if (payment.status !== "captured") {
      if (payment.status === "failed") {
        await releaseOrderInventory(order._id.toString(), "Razorpay payment failed.");
        await Order.updateOne(
          { _id: order._id, status: "PAYMENT_PENDING" },
          {
            $set: {
              status: "FAILED",
              "payment.status": "FAILED",
              "payment.failedAt": new Date(),
              "payment.failureCode": payment.error_code || "PAYMENT_FAILED",
              "payment.failureDescription": payment.error_description || "Razorpay payment failed.",
            },
            $push: {
              statusHistory: buildStatusEntry("FAILED", undefined, "Razorpay payment failed."),
            },
          }
        );
        return { success: false, error: "Payment failed. Your reserved stock has been released." };
      }

      return {
        success: false,
        error: "Payment has not been captured yet. Please wait for confirmation and try again.",
      };
    }

    await consumeOrderReservation(order._id.toString(), "Razorpay payment captured.");

    await Order.updateOne(
      { _id: order._id, status: "PAYMENT_PENDING" },
      {
        $set: {
          status: "PLACED",
          "payment.status": "CAPTURED",
          "payment.gatewayPaymentId": parsed.data.razorpayPaymentId,
          "payment.signatureVerifiedAt": new Date(),
        },
        $push: {
          statusHistory: buildStatusEntry("PLACED", undefined, "Razorpay payment verified."),
        },
      }
    );

    return {
      success: true,
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
    };
  } catch (error) {
    logger.error("Razorpay payment verification failed", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Payment verification failed. Please do not retry repeatedly; check your order status.",
    };
  }
}


export type UpdateOrderStatusResult =
  | { success: true; orderNumber: string; status: string }
  | { success: false; error: string };

export async function updateOrderStatusAction(
  input: FormData | unknown
): Promise<UpdateOrderStatusResult> {
  const normalizedInput =
    input instanceof FormData
      ? {
          orderId: input.get("orderId"),
          status: input.get("status"),
          note: input.get("note"),
        }
      : input;
  const parsed = adminOrderStatusSchema.safeParse(normalizedInput);
  if (!parsed.success) {
    return { success: false, error: "Invalid order status update request." };
  }

  try {
    const admin = await requireAdmin("/admin/orders");
    await connectToDatabase();

    const order = await Order.findById(parsed.data.orderId);
    if (!order) {
      return { success: false, error: "Order not found." };
    }

    if (!canAdminTransition(order.status, parsed.data.status)) {
      return {
        success: false,
        error:
          "Order cannot move from " +
          order.status.replaceAll("_", " ") +
          " to " +
          parsed.data.status.replaceAll("_", " ") +
          ".",
      };
    }

    order.status = parsed.data.status;
    order.statusHistory.push(
      buildStatusEntry(
        parsed.data.status,
        admin.id,
        parsed.data.note || undefined
      )
    );
    await order.save();

    redirect(
      "/admin/orders?updated=" +
        encodeURIComponent(order.orderNumber) +
        "&status=" +
        encodeURIComponent(order.status)
    );
  } catch (error) {
    logger.error("Admin order status update failed", error);
    redirect(
      "/admin/orders?error=" +
        encodeURIComponent(
          error instanceof Error
            ? error.message
            : "Unable to update the order status."
        )
    );
  }
}
