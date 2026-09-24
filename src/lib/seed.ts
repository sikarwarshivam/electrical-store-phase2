import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { logger } from "@/lib/logger";

/**
 * Development database seed utility.
 * Strictly gated to development environment only.
 */
export async function seedDevUsers() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Seeding database is strictly prohibited in production.");
  }

  await connectToDatabase();

  const existingAdmin = await User.findOne({ email: "admin@dev.local" });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("DevAdmin@123", 10);
    await User.create({
      name: "Development Admin",
      email: "admin@dev.local",
      phone: "9876543210",
      passwordHash,
      role: "ADMIN",
      isActive: true,
    });
    logger.info("Dev seed: Created default development admin user (admin@dev.local)");
  }

  const existingCustomer = await User.findOne({ email: "customer@dev.local" });
  if (!existingCustomer) {
    const passwordHash = await bcrypt.hash("DevCustomer@123", 10);
    await User.create({
      name: "Development Customer",
      email: "customer@dev.local",
      phone: "9876543211",
      passwordHash,
      role: "CUSTOMER",
      isActive: true,
    });
    logger.info("Dev seed: Created default development customer user (customer@dev.local)");
  }
}
