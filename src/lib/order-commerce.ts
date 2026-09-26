import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Inventory } from "@/models/Inventory";
import { InventoryTransaction } from "@/models/InventoryTransaction";
import { Order } from "@/models/Order";

function calculateStockStatus(
  trackInventory: boolean,
  availableQuantity: number,
  lowStockThreshold: number
) {
  if (!trackInventory) return "IN_STOCK" as const;
  if (availableQuantity <= 0) return "OUT_OF_STOCK" as const;
  if (availableQuantity <= lowStockThreshold) return "LOW_STOCK" as const;
  return "IN_STOCK" as const;
}

function isObjectId(value: string) {
  return mongoose.Types.ObjectId.isValid(value);
}

async function updateStockStatus(
  inventoryId: mongoose.Types.ObjectId,
  availableQuantity: number,
  trackInventory: boolean,
  lowStockThreshold: number
) {
  await Inventory.updateOne(
    { _id: inventoryId },
    {
      $set: {
        stockStatus: calculateStockStatus(
          trackInventory,
          availableQuantity,
          lowStockThreshold
        ),
      },
    }
  );
}

function referenceKey(orderId: string, variantId: string, type: string) {
  return orderId + ":" + variantId + ":" + type;
}

async function transactionExists(
  orderId: string,
  variantId: string,
  type: "RESERVATION" | "RELEASE" | "SALE" | "RETURN"
) {
  return Boolean(
    await InventoryTransaction.exists({
      referenceType: "ORDER",
      referenceId: referenceKey(orderId, variantId, type),
    })
  );
}

export async function reserveOrderInventory(orderId: string) {
  if (!isObjectId(orderId)) throw new Error("Invalid order identifier.");

  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found.");

  for (const item of order.items) {
    const variantKey = item.variant.toString();

    if (await transactionExists(orderId, variantKey, "RESERVATION")) {
      continue;
    }

    const inventory = await Inventory.findOneAndUpdate(
      {
        variant: item.variant,
        trackInventory: true,
        availableQuantity: { $gte: item.quantity },
      },
      {
        $inc: {
          availableQuantity: -item.quantity,
          reservedQuantity: item.quantity,
        },
      },
      { returnDocument: "after" }
    );

    if (!inventory) {
      await releaseOrderInventory(orderId, "Reservation rollback after insufficient stock.");
      throw new Error(
        "Stock changed while checking out. Please return to the cart and try again."
      );
    }

    await updateStockStatus(
      inventory._id,
      inventory.availableQuantity,
      inventory.trackInventory,
      inventory.lowStockThreshold
    );

    await InventoryTransaction.create({
      variant: item.variant,
      type: "RESERVATION",
      quantityDelta: -item.quantity,
      balanceAfter: inventory.availableQuantity,
      reservedDelta: item.quantity,
      reservedAfter: inventory.reservedQuantity,
      reason: "Checkout inventory reservation",
      referenceType: "ORDER",
      referenceId: referenceKey(orderId, variantKey, "RESERVATION"),
      note: "Reserved until payment succeeds or the reservation expires.",
    });
  }

  order.reservation.status = "ACTIVE";
  order.reservation.reservedAt = order.reservation.reservedAt || new Date();
  await order.save();
}

export async function releaseOrderInventory(orderId: string, reason: string) {
  if (!isObjectId(orderId)) throw new Error("Invalid order identifier.");

  const order = await Order.findById(orderId);
  if (!order) return;

  if (order.reservation.status === "CONSUMED") return;

  for (const item of order.items) {
    const variantKey = item.variant.toString();

    if (await transactionExists(orderId, variantKey, "RELEASE")) {
      continue;
    }

    const reservationExists = await transactionExists(
      orderId,
      variantKey,
      "RESERVATION"
    );
    if (!reservationExists) continue;

    const inventory = await Inventory.findOneAndUpdate(
      {
        variant: item.variant,
        trackInventory: true,
        reservedQuantity: { $gte: item.quantity },
      },
      {
        $inc: {
          availableQuantity: item.quantity,
          reservedQuantity: -item.quantity,
        },
      },
      { returnDocument: "after" }
    );

    if (!inventory) {
      throw new Error("Unable to release the reserved inventory for this order.");
    }

    await updateStockStatus(
      inventory._id,
      inventory.availableQuantity,
      inventory.trackInventory,
      inventory.lowStockThreshold
    );

    await InventoryTransaction.create({
      variant: item.variant,
      type: "RELEASE",
      quantityDelta: item.quantity,
      balanceAfter: inventory.availableQuantity,
      reservedDelta: -item.quantity,
      reservedAfter: inventory.reservedQuantity,
      reason,
      referenceType: "ORDER",
      referenceId: referenceKey(orderId, variantKey, "RELEASE"),
      note: "Released inventory reservation back to available stock.",
    });
  }

  order.reservation.status = "RELEASED";
  order.reservation.releasedAt = new Date();
  await order.save();
}

export async function consumeOrderReservation(orderId: string, reason: string) {
  if (!isObjectId(orderId)) throw new Error("Invalid order identifier.");

  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found.");

  if (order.reservation.status === "CONSUMED") return;

  for (const item of order.items) {
    const variantKey = item.variant.toString();

    if (await transactionExists(orderId, variantKey, "SALE")) {
      continue;
    }

    const reservationExists = await transactionExists(
      orderId,
      variantKey,
      "RESERVATION"
    );
    if (!reservationExists) continue;

    const inventory = await Inventory.findOneAndUpdate(
      {
        variant: item.variant,
        trackInventory: true,
        reservedQuantity: { $gte: item.quantity },
      },
      {
        $inc: {
          reservedQuantity: -item.quantity,
        },
      },
      { returnDocument: "after" }
    );

    if (!inventory) {
      throw new Error("Unable to finalize reserved inventory for this order.");
    }

    await InventoryTransaction.create({
      variant: item.variant,
      type: "SALE",
      quantityDelta: 0,
      balanceAfter: inventory.availableQuantity,
      reservedDelta: -item.quantity,
      reservedAfter: inventory.reservedQuantity,
      reason,
      referenceType: "ORDER",
      referenceId: referenceKey(orderId, variantKey, "SALE"),
      note: "Payment captured; reserved inventory converted to a completed sale.",
    });
  }

  order.reservation.status = "CONSUMED";
  order.reservation.consumedAt = new Date();
  await order.save();
}

export async function restockCancelledOrderInventory(
  orderId: string,
  reason: string
) {
  if (!isObjectId(orderId)) throw new Error("Invalid order identifier.");

  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found.");

  for (const item of order.items) {
    const variantKey = item.variant.toString();

    if (await transactionExists(orderId, variantKey, "RETURN")) {
      continue;
    }

    const inventory = await Inventory.findOneAndUpdate(
      {
        variant: item.variant,
        trackInventory: true,
      },
      {
        $inc: {
          availableQuantity: item.quantity,
        },
      },
      { returnDocument: "after" }
    );

    if (!inventory) continue;

    await updateStockStatus(
      inventory._id,
      inventory.availableQuantity,
      inventory.trackInventory,
      inventory.lowStockThreshold
    );

    await InventoryTransaction.create({
      variant: item.variant,
      type: "RETURN",
      quantityDelta: item.quantity,
      balanceAfter: inventory.availableQuantity,
      reservedDelta: 0,
      reservedAfter: inventory.reservedQuantity,
      reason,
      referenceType: "ORDER",
      referenceId: referenceKey(orderId, variantKey, "RETURN"),
      note: "Cancelled order restocked back into available inventory.",
    });
  }
}

export async function releaseExpiredOrderReservations() {
  const now = new Date();
  const expiredOrders = await Order.find({
    status: "PAYMENT_PENDING",
    "reservation.status": "ACTIVE",
    "reservation.expiresAt": { $lte: now },
  })
    .select("_id")
    .limit(50);

  for (const order of expiredOrders) {
    const claimed = await Order.findOneAndUpdate(
      {
        _id: order._id,
        status: "PAYMENT_PENDING",
        "reservation.status": "ACTIVE",
        "reservation.expiresAt": { $lte: now },
      },
      { $set: { status: "FAILED" } },
      { returnDocument: "after" }
    );

    if (!claimed) continue;

    try {
      await releaseOrderInventory(
        claimed._id.toString(),
        "Payment reservation expired."
      );
      await Order.updateOne(
        { _id: claimed._id },
        {
          $set: {
            "payment.status": "FAILED",
            "payment.failedAt": new Date(),
            "payment.failureCode": "RESERVATION_EXPIRED",
            "payment.failureDescription": "Payment was not completed within the reservation window.",
          },
        }
      );
    } catch {
      await Order.updateOne(
        { _id: claimed._id },
        {
          $set: {
            "payment.failureDescription":
              "Reservation expired but inventory release requires manual reconciliation.",
          },
        }
      );
    }
  }
}


export async function getAdminOrders(limit = 50) {
  await connectToDatabase();

  const orders = await Order.find({})
    .sort({ createdAt: -1 })
    .limit(Math.min(Math.max(limit, 1), 100))
    .lean();

  return orders;
}


export async function getCustomerOrders(userId: string, limit = 50) {
  if (!isObjectId(userId)) return [];
  await connectToDatabase();

  return Order.find({ "customer.userId": new mongoose.Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .limit(Math.min(Math.max(limit, 1), 100))
    .lean();
}

export async function getCustomerOrder(userId: string, orderNumber: string) {
  if (!isObjectId(userId) || !orderNumber.trim()) return null;
  await connectToDatabase();

  return Order.findOne({
    orderNumber: orderNumber.trim().toUpperCase(),
    "customer.userId": new mongoose.Types.ObjectId(userId),
  }).lean();
}

export async function getVerifiedOrderByNumber(orderNumber: string) {
  if (!orderNumber.trim()) return null;
  await connectToDatabase();

  return Order.findOne({
    orderNumber: orderNumber.trim().toUpperCase(),
    "payment.status": "CAPTURED",
    status: {
      $in: [
        "PLACED",
        "CONFIRMED",
        "PACKED",
        "SHIPPED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
      ],
    },
  }).lean();
}

export async function getGuestOrder(orderNumber: string, phone: string) {
  if (!orderNumber.trim() || !/^[6-9]\d{9}$/.test(phone)) return null;
  await connectToDatabase();

  return Order.findOne({
    orderNumber: orderNumber.trim().toUpperCase(),
    "customer.phone": phone,
    "payment.status": "CAPTURED",
    status: {
      $in: [
        "PLACED",
        "CONFIRMED",
        "PACKED",
        "SHIPPED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
      ],
    },
  }).lean();
}


export async function getAdminSalesStats() {
  await connectToDatabase();

  const orders = await Order.find({
    "payment.status": "CAPTURED",
    status: {
      $in: [
        "PLACED",
        "CONFIRMED",
        "PACKED",
        "SHIPPED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
      ],
    },
  })
    .select("pricing items createdAt")
    .sort({ createdAt: -1 })
    .lean();

  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

  let revenuePaise = 0;
  let units = 0;
  let last30DaysRevenuePaise = 0;
  let last30DaysOrders = 0;

  for (const order of orders) {
    revenuePaise += order.pricing.grandTotalPaise;
    units += order.items.reduce((sum, item) => sum + item.quantity, 0);

    if (new Date(order.createdAt).getTime() >= thirtyDaysAgo) {
      last30DaysRevenuePaise += order.pricing.grandTotalPaise;
      last30DaysOrders += 1;
    }
  }

  const pendingOrders = await Order.countDocuments({
    status: { $in: ["PAYMENT_PENDING", "PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY"] },
  });

  return {
    paidOrders: orders.length,
    revenuePaise,
    units,
    last30DaysRevenuePaise,
    last30DaysOrders,
    pendingOrders,
  };
}
