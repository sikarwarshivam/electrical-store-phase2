import { getCurrentUser, isAdmin } from "@/lib/auth-utils";
import {
  getCloudinaryServerConfig,
  signCloudinaryParams,
} from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function POST() {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json({ message: "Authentication required." }, { status: 401 });
  }

  if (!isAdmin(user.role)) {
    return Response.json({ message: "Admin access required." }, { status: 403 });
  }

  const config = getCloudinaryServerConfig();

  if (!config) {
    return Response.json(
      { message: "Cloudinary is not configured on this server." },
      { status: 503 }
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "electrical-store/banners";
  const signature = signCloudinaryParams(
    { folder, timestamp },
    config.apiSecret
  );

  return Response.json({
    cloudName: config.cloudName,
    apiKey: config.apiKey,
    folder,
    timestamp,
    signature,
  });
}
