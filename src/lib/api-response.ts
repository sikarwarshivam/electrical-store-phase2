import { NextResponse } from "next/server";
import { ApiResponse, ApiErrorDetail } from "@/types";
import { logger } from "@/lib/logger";

/**
 * Creates a standardized JSON success response.
 */
export function apiSuccess<T>(data: T, message?: string, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message ? { message } : {}),
    },
    { status }
  );
}

/**
 * Creates a standardized JSON error response.
 * Sanitizes internal technical errors so production clients do not receive sensitive information.
 */
export function apiError(
  message: string,
  code = "BAD_REQUEST",
  status = 400,
  details?: ApiErrorDetail[],
  rawError?: unknown
): NextResponse<ApiResponse<never>> {
  if (rawError) {
    logger.error(`API Error [${code}]: ${message}`, rawError);
  }

  // Never leak internal stack trace or raw system error details in production
  const safeMessage =
    status >= 500 && process.env.NODE_ENV === "production"
      ? "An internal server error occurred. Please try again later."
      : message;

  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message: safeMessage,
        ...(details && details.length > 0 ? { details } : {}),
      },
    },
    { status }
  );
}
