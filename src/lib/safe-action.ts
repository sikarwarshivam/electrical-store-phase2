import { ZodSchema } from "zod";
import { logger } from "@/lib/logger";

export interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Higher-order utility for creating type-safe Server Actions with Zod validation.
 * 
 * Ensures all write operations perform strict server-side validation before execution.
 */
export function createSafeAction<TInput, TOutput>(
  schema: ZodSchema<TInput>,
  handler: (validatedData: TInput) => Promise<TOutput>
) {
  return async (input: unknown): Promise<ActionResponse<TOutput>> => {
    const parseResult = schema.safeParse(input);

    if (!parseResult.success) {
      const fieldErrors = parseResult.error.flatten().fieldErrors;
      const firstErrorMessage =
        parseResult.error.issues[0]?.message || "Validation failed";

      return {
        success: false,
        error: firstErrorMessage,
        fieldErrors: fieldErrors as Record<string, string[]>,
      };
    }

    try {
      const data = await handler(parseResult.data);
      return {
        success: true,
        data,
      };
    } catch (err) {
      logger.error("Server Action execution failed", err);
      const message =
        err instanceof Error ? err.message : "An unexpected server error occurred";

      return {
        success: false,
        error:
          process.env.NODE_ENV === "production"
            ? "An unexpected error occurred. Please try again."
            : message,
      };
    }
  };
}
