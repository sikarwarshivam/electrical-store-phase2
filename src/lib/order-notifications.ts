import { sendTransactionalEmail, escapeHtml } from "@/lib/email";

type OrderEmailData = {
  id?: unknown;
  orderNumber: string;
  status: string;
  customer: {
    name: string;
    email?: string;
  };
  items: Array<{
    productName: string;
    sku: string;
    quantity: number;
    lineTotalPaise: number;
  }>;
  pricing: {
    subtotalPaise: number;
    shippingPaise: number;
    taxAddedPaise: number;
    discountPaise: number;
    grandTotalPaise: number;
  };
  payment: {
    status: string;
    refundStatus?: "PENDING" | "PROCESSED" | "FAILED";
    refundAmountPaise?: number;
  };
};

const STATUS_LABELS: Record<string, string> = {
  PAYMENT_PENDING: "Payment pending",
  PLACED: "Order placed",
  CONFIRMED: "Order confirmed",
  PACKED: "Order packed",
  SHIPPED: "Order shipped",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Order delivered",
  CANCELLED: "Order cancelled",
  FAILED: "Payment failed",
  RETURNED: "Order returned",
  REFUNDED: "Order refunded",
};

function money(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format((Number.isFinite(paise) ? paise : 0) / 100);
}

function emailAddress(value?: string) {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return null;
  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(normalized)
    ? normalized
    : null;
}

function baseUrl() {
  const configured = process.env.NEXTAUTH_URL?.trim();
  if (!configured) return "http://localhost:3000";
  return configured.replace(/\\/$/, "");
}

function orderUrl(orderNumber: string) {
  return baseUrl() + "/account/orders/" + encodeURIComponent(orderNumber);
}

function displayName(name: string) {
  return name.trim() || "Customer";
}

function itemRows(order: OrderEmailData) {
  return order.items
    .map(
      (item) =>
        "<tr>" +
        '<td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">' +
        escapeHtml(item.productName) +
        '<div style="margin-top:2px;font-size:12px;color:#6b7280;">SKU ' +
        escapeHtml(item.sku) +
        "</div></td>" +
        '<td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">' +
        String(item.quantity) +
        "</td>" +
        '<td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">' +
        money(item.lineTotalPaise) +
        "</td>" +
        "</tr>"
    )
    .join("");
}

function layout(title: string, intro: string, content: string) {
  return (
    '<div style="margin:0;background:#f5f5f5;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#171717;">' +
    '<div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">' +
    '<div style="padding:20px 24px;border-bottom:1px solid #e5e7eb;">' +
    '<div style="font-size:18px;font-weight:700;">Electrical Retail Store</div>' +
    '<div style="margin-top:4px;font-size:12px;color:#6b7280;">Transactional order notification</div>' +
    "</div>" +
    '<div style="padding:24px;">' +
    '<h1 style="margin:0;font-size:22px;line-height:1.3;">' +
    escapeHtml(title) +
    "</h1>" +
    '<p style="margin:10px 0 20px;font-size:14px;line-height:1.6;color:#525252;">' +
    intro +
    "</p>" +
    content +
    "</div>" +
    '<div style="padding:16px 24px;border-top:1px solid #e5e7eb;font-size:11px;line-height:1.5;color:#737373;">' +
    "This is a transactional email about your order. Please do not reply to this automated message." +
    "</div>" +
    "</div></div>"
  );
}

function orderSummary(order: OrderEmailData) {
  const url = escapeHtml(orderUrl(order.orderNumber));
  return (
    '<div style="margin-bottom:20px;padding:14px 16px;background:#fafafa;border:1px solid #e5e7eb;border-radius:8px;">' +
    '<div style="font-size:12px;color:#737373;">Order number</div>' +
    '<div style="margin-top:3px;font-size:16px;font-weight:700;">' +
    escapeHtml(order.orderNumber) +
    "</div>" +
    "</div>" +
    '<table style="width:100%;border-collapse:collapse;margin-top:12px;">' +
    "<thead><tr>" +
    '<th style="padding:10px 12px;background:#fafafa;text-align:left;font-size:12px;">Item</th>' +
    '<th style="padding:10px 12px;background:#fafafa;text-align:center;font-size:12px;">Qty</th>' +
    '<th style="padding:10px 12px;background:#fafafa;text-align:right;font-size:12px;">Total</th>' +
    "</tr></thead><tbody>" +
    itemRows(order) +
    "</tbody></table>" +
    '<div style="margin-top:16px;padding-top:14px;border-top:1px solid #e5e7eb;">' +
    '<div style="display:flex;justify-content:space-between;margin:5px 0;font-size:13px;"><span>Subtotal</span><span>' +
    money(order.pricing.subtotalPaise) +
    "</span></div>" +
    '<div style="display:flex;justify-content:space-between;margin:5px 0;font-size:13px;"><span>Discount</span><span>-' +
    money(order.pricing.discountPaise) +
    "</span></div>" +
    '<div style="display:flex;justify-content:space-between;margin:5px 0;font-size:13px;"><span>Shipping</span><span>' +
    money(order.pricing.shippingPaise) +
    "</span></div>" +
    '<div style="display:flex;justify-content:space-between;margin:5px 0;font-size:13px;"><span>Tax added</span><span>' +
    money(order.pricing.taxAddedPaise) +
    "</span></div>" +
    '<div style="display:flex;justify-content:space-between;margin-top:10px;padding-top:10px;border-top:1px solid #e5e7eb;font-size:16px;font-weight:700;"><span>Total</span><span>' +
    money(order.pricing.grandTotalPaise) +
    "</span></div>" +
    "</div>" +
    '<div style="margin-top:22px;"><a href="' +
    url +
    '" style="display:inline-block;padding:10px 14px;border-radius:8px;background:#171717;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;">View order</a></div>'
  );
}

export async function sendOrderPlacedEmail(order: OrderEmailData) {
  const to = emailAddress(order.customer.email);
  if (!to) return;

  const customer = escapeHtml(displayName(order.customer.name));
  const orderNumber = escapeHtml(order.orderNumber);
  const html = layout(
    "Order placed successfully",
    "Hi " +
      customer +
      ", your payment has been captured and order " +
      orderNumber +
      " has been placed.",
    orderSummary(order)
  );
  const text =
    "Hi " +
    displayName(order.customer.name) +
    ", your order " +
    order.orderNumber +
    " has been placed successfully. Total: " +
    money(order.pricing.grandTotalPaise) +
    ". View your order: " +
    orderUrl(order.orderNumber);

  await sendTransactionalEmail({
    to,
    subject: "Order " + order.orderNumber + " placed successfully",
    html,
    text,
    idempotencyKey: "order-placed/" + String(order.id || order.orderNumber),
  });
}

export async function sendOrderStatusEmail(
  order: OrderEmailData,
  note?: string
) {
  const to = emailAddress(order.customer.email);
  if (!to) return;

  const label = STATUS_LABELS[order.status] || order.status.replaceAll("_", " ");
  const customer = escapeHtml(displayName(order.customer.name));
  const orderNumber = escapeHtml(order.orderNumber);
  const noteHtml = note
    ? '<div style="margin-top:16px;padding:12px 14px;border-left:3px solid #d4d4d4;background:#fafafa;font-size:13px;color:#525252;">' +
      escapeHtml(note) +
      "</div>"
    : "";
  const html = layout(
    label,
    "Hi " +
      customer +
      ", the status of order " +
      orderNumber +
      " is now " +
      escapeHtml(label.toLowerCase()) +
      ".",
    orderSummary(order) + noteHtml
  );
  const text =
    "Hi " +
    displayName(order.customer.name) +
    ", order " +
    order.orderNumber +
    " is now " +
    label +
    "." +
    (note ? " Note: " + note : "") +
    " View your order: " +
    orderUrl(order.orderNumber);

  await sendTransactionalEmail({
    to,
    subject: order.orderNumber + " — " + label,
    html,
    text,
    idempotencyKey:
      "order-status/" + String(order.id || order.orderNumber) + "/" + order.status,
  });
}

export async function sendOrderCancelledEmail(order: OrderEmailData) {
  const to = emailAddress(order.customer.email);
  if (!to) return;

  const refundText =
    order.payment.refundStatus === "PROCESSED"
      ? "Your refund has been processed."
      : order.payment.refundStatus === "PENDING"
        ? "Your refund has been initiated and is being processed."
        : order.payment.refundStatus === "FAILED"
          ? "The automatic refund could not be completed. Please contact support."
          : "Refund status is being updated.";

  const html = layout(
    "Order cancelled",
    "Hi " +
      escapeHtml(displayName(order.customer.name)) +
      ", order " +
      escapeHtml(order.orderNumber) +
      " has been cancelled. " +
      escapeHtml(refundText),
    orderSummary(order) +
      '<div style="margin-top:18px;padding:13px 15px;background:#fafafa;border:1px solid #e5e7eb;border-radius:8px;font-size:13px;line-height:1.5;">' +
      escapeHtml(refundText) +
      "</div>"
  );

  const text =
    "Hi " +
    displayName(order.customer.name) +
    ", order " +
    order.orderNumber +
    " has been cancelled. " +
    refundText +
    " Order total: " +
    money(order.pricing.grandTotalPaise) +
    ".";

  await sendTransactionalEmail({
    to,
    subject: "Order " + order.orderNumber + " cancelled",
    html,
    text,
    idempotencyKey:
      "order-cancelled/" + String(order.id || order.orderNumber),
  });
}

export async function sendRefundProcessedEmail(order: OrderEmailData) {
  const to = emailAddress(order.customer.email);
  if (!to) return;

  const amount =
    order.payment.refundAmountPaise ?? order.pricing.grandTotalPaise;
  const html = layout(
    "Refund processed",
    "Hi " +
      escapeHtml(displayName(order.customer.name)) +
      ", the refund for order " +
      escapeHtml(order.orderNumber) +
      " has been processed.",
    '<div style="margin-top:8px;padding:16px;background:#fafafa;border:1px solid #e5e7eb;border-radius:8px;">' +
      '<div style="font-size:12px;color:#737373;">Refund amount</div>' +
      '<div style="margin-top:4px;font-size:20px;font-weight:700;">' +
      money(amount) +
      "</div>" +
      '<div style="margin-top:10px;font-size:13px;color:#525252;">Order: ' +
      escapeHtml(order.orderNumber) +
      "</div>" +
      "</div>" +
      '<div style="margin-top:18px;"><a href="' +
      escapeHtml(orderUrl(order.orderNumber)) +
      '" style="display:inline-block;padding:10px 14px;border-radius:8px;background:#171717;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;">View order</a></div>"
  );

  const text =
    "Hi " +
    displayName(order.customer.name) +
    ", the refund for order " +
    order.orderNumber +
    " has been processed for " +
    money(amount) +
    ". View your order: " +
    orderUrl(order.orderNumber);

  await sendTransactionalEmail({
    to,
    subject: "Refund processed for order " + order.orderNumber,
    html,
    text,
    idempotencyKey:
      "order-refund-processed/" + String(order.id || order.orderNumber),
  });
}
