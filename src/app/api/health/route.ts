import { NextResponse } from "next/server";
import { connectToDatabase, getDbStatus } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/api-response";
import { siteConfig } from "@/config/site";

export async function GET(): Promise<NextResponse> {
  const startTime = Date.now();
  let dbConnected = false;
  let dbError: string | undefined;

  try {
    await connectToDatabase();
    dbConnected = true;
  } catch (err) {
    dbError = err instanceof Error ? err.message : "Database connection failed";
  }

  const status = getDbStatus();
  const responseTimeMs = Date.now() - startTime;

  const healthData = {
    status: dbConnected ? "healthy" : "degraded",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    responseTimeMs,
    store: siteConfig.name,
    database: {
      connected: dbConnected,
      state: status.state,
      ...(process.env.NODE_ENV === "development" && dbError ? { error: dbError } : {}),
    },
  };

  if (!dbConnected) {
    return apiError("Database service is currently unreachable", "SERVICE_DEGRADED", 503, undefined, dbError);
  }

  return apiSuccess(healthData, "System is operational");
}
