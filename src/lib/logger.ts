/**
 * Structured Safe Logger
 * 
 * Automatically sanitizes and redacts sensitive data (passwords, tokens, secrets)
 * before emitting logs to the console or log sinks.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "token",
  "secret",
  "authorization",
  "cookie",
  "nextauth_secret",
  "razorpay_key_secret",
  "cloudinary_api_secret",
]);

/**
 * Recursively redacts sensitive keys in objects or arrays.
 */
function sanitize(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data !== "object") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitize);
  }

  const sanitizedObj: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitizedObj[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitizedObj[key] = sanitize(value);
    } else {
      sanitizedObj[key] = value;
    }
  }

  return sanitizedObj;
}

function formatLog(level: LogLevel, message: string, meta?: unknown): string {
  const timestamp = new Date().toISOString();
  const metaString = meta ? ` | meta: ${JSON.stringify(sanitize(meta))}` : "";
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaString}`;
}

export const logger = {
  debug(message: string, meta?: unknown) {
    if (process.env.NODE_ENV === "development") {
      console.debug(formatLog("debug", message, meta));
    }
  },

  info(message: string, meta?: unknown) {
    console.info(formatLog("info", message, meta));
  },

  warn(message: string, meta?: unknown) {
    console.warn(formatLog("warn", message, meta));
  },

  error(message: string, error?: unknown, meta?: unknown) {
    const errorDetails =
      error instanceof Error
        ? { message: error.message, stack: process.env.NODE_ENV === "development" ? error.stack : undefined }
        : error;

    console.error(formatLog("error", message, { error: errorDetails, ...((meta as object) || {}) }));
  },
};
