import { logger } from "@/lib/logger";

type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
};

function isEnabled() {
  const raw = process.env.EMAIL_NOTIFICATIONS_ENABLED?.trim().toLowerCase();
  return raw !== "false";
}

function getConfig() {
  if (!isEnabled()) return null;

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();

  if (!apiKey || !from) {
    logger.warn(
      "Email notifications are enabled but RESEND_API_KEY or EMAIL_FROM is not configured. Email delivery is skipped."
    );
    return null;
  }

  return {
    apiKey,
    from,
    replyTo: process.env.EMAIL_REPLY_TO?.trim() || undefined,
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendTransactionalEmail(message: EmailMessage) {
  const config = getConfig();
  if (!config) return;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + config.apiKey,
        "Content-Type": "application/json",
        "Idempotency-Key": message.idempotencyKey,
      },
      body: JSON.stringify({
        from: config.from,
        to: [message.to],
        ...(config.replyTo ? { reply_to: config.replyTo } : {}),
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const providerBody = await response.text().catch(() => "");
      logger.error("Transactional email provider rejected the message", undefined, {
        status: response.status,
        body: providerBody.slice(0, 500),
        to: message.to,
        subject: message.subject,
      });
      return;
    }

    const result = (await response.json().catch(() => null)) as
      | { id?: string }
      | null;

    logger.info("Transactional email accepted by provider", {
      emailId: result?.id,
      eventKey: message.idempotencyKey,
    });
  } catch (error) {
    logger.error("Transactional email delivery failed", error, {
      eventKey: message.idempotencyKey,
    });
  }
}

export { escapeHtml };
