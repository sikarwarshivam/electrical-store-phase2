import { getCurrentUser, isAdmin } from "@/lib/auth-utils";
import {
  getCloudinaryServerConfig,
  signCloudinaryParams,
} from "@/lib/cloudinary";

export const runtime = "nodejs";

const ALLOWED_FOLDERS = new Set([
  "banners",
  "products",
  "categories",
  "variants",
]);

export async function POST(request: Request) {
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

  let requestedFolder = "banners";
  try {
    const body = (await request.json()) as { folder?: unknown };
    if (typeof body.folder === "string" && body.folder.trim()) {
      requestedFolder = body.folder.trim();
    }
  } catch {
    // Banner uploader historically sends no body; keep banners as the default.
  }

  if (!ALLOWED_FOLDERS.has(requestedFolder)) {
    return Response.json({ message: "Unsupported media folder." }, { status: 400 });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "electrical-store/" + requestedFolder;
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
