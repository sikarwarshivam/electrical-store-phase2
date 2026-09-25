import { createHmac, timingSafeEqual } from "node:crypto";

const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";

interface RazorpayOrderResponse {
  id: string;
  entity: "order";
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt?: string;
  status: string;
}

interface RazorpayPaymentResponse {
  id: string;
  entity: "payment";
  amount: number;
  currency: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  order_id?: string | null;
  method?: string;
  error_code?: string | null;
  error_description?: string | null;
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(name + " is not configured.");
  }
  return value;
}

function getRazorpayCredentials() {
  return {
    keyId: getRequiredEnv("RAZORPAY_KEY_ID"),
    keySecret: getRequiredEnv("RAZORPAY_KEY_SECRET"),
  };
}

export function getRazorpayKeyId() {
  return getRequiredEnv("RAZORPAY_KEY_ID");
}

async function razorpayRequest<T>(
  path: string,
  init: RequestInit
): Promise<T> {
  const { keyId, keySecret } = getRazorpayCredentials();
  const basicToken = Buffer.from(keyId + ":" + keySecret).toString("base64");

  const response = await fetch(RAZORPAY_API_BASE + path, {
    ...init,
    headers: {
      Authorization: "Basic " + basicToken,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  const body = (await response.json().catch(() => null)) as
    | T
    | { error?: { description?: string } }
    | null;

  if (!response.ok) {
    const message =
      body && "error" in body && body.error?.description
        ? body.error.description
        : "Razorpay request failed.";
    throw new Error(message);
  }

  return body as T;
}

export async function createRazorpayOrder(input: {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}) {
  const response = await razorpayRequest<RazorpayOrderResponse>("/orders", {
    method: "POST",
    body: JSON.stringify({
      amount: input.amountPaise,
      currency: "INR",
      receipt: input.receipt,
      notes: input.notes,
    }),
  });

  if (
    response.currency !== "INR" ||
    response.amount !== input.amountPaise ||
    !response.id
  ) {
    throw new Error("Razorpay returned an invalid order response.");
  }

  return response;
}

export async function fetchRazorpayPayment(paymentId: string) {
  return razorpayRequest<RazorpayPaymentResponse>(
    "/payments/" + encodeURIComponent(paymentId),
    { method: "GET" }
  );
}

function safeCompareHex(leftHex: string, rightHex: string) {
  const left = Buffer.from(leftHex, "hex");
  const right = Buffer.from(rightHex, "hex");

  return left.length === right.length && timingSafeEqual(left, right);
}

export function verifyRazorpayPaymentSignature(
  gatewayOrderId: string,
  paymentId: string,
  signature: string
) {
  const secret = getRazorpayCredentials().keySecret;
  const expected = createHmac("sha256", secret)
    .update(gatewayOrderId + "|" + paymentId)
    .digest("hex");

  return safeCompareHex(expected, signature);
}

export function verifyRazorpayWebhookSignature(body: string, signature: string) {
  const webhookSecret = getRequiredEnv("RAZORPAY_WEBHOOK_SECRET");
  const expected = createHmac("sha256", webhookSecret)
    .update(body)
    .digest("hex");

  return safeCompareHex(expected, signature);
}
