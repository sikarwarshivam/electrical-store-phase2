/**
 * Razorpay Payment Gateway Configuration Architecture
 * 
 * Phase 1 Scope: Architectural types and configuration parameters only.
 * Payment processing, order creation, signature verification, and webhooks
 * are strictly reserved for Phase 2.
 */

export interface RazorpayConfig {
  keyId?: string;
  keySecret?: string;
  currency: string;
  receiptPrefix: string;
  webhookSecret?: string;
}

export const razorpayConfig: RazorpayConfig = {
  keyId: process.env.RAZORPAY_KEY_ID,
  keySecret: process.env.RAZORPAY_KEY_SECRET,
  currency: "INR",
  receiptPrefix: "rcpt_elec_",
  webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
};
