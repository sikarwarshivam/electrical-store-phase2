import mongoose from "mongoose";
import { logger } from "@/lib/logger";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

/**
 * Reusable MongoDB / Mongoose connection utility.
 * 
 * Reuses the existing connection during Next.js Hot Module Replacement (HMR)
 * in development, preventing connection pool exhaustion.
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    const errorMsg = "MONGODB_URI is not defined in environment variables.";
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  // If already connected, reuse connection
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // If a connection promise is already in flight, wait for it
  if (!cached.promise) {
    const options: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    };

    logger.debug("Establishing new MongoDB connection...");

    cached.promise = mongoose
      .connect(uri, options)
      .then((m) => {
        logger.info("MongoDB connection successfully established.");
        return m;
      })
      .catch((err) => {
        logger.error("Failed to connect to MongoDB", err);
        cached.promise = null; // Reset promise so subsequent requests can retry
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

/**
 * Check current database connection health.
 */
export function getDbStatus(): { isConnected: boolean; state: string } {
  const stateMap: Record<number, string> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const stateCode = mongoose.connection.readyState;
  return {
    isConnected: stateCode === 1,
    state: stateMap[stateCode] || "unknown",
  };
}
