import { getCurrentUser, isAdmin } from "@/lib/auth-utils";
import {
  getCloudinaryServerConfig,
  signCloudinaryParams,
} from "@/lib/cloudinary";

export const runtime = "nodejs";

const FOLDERS = {
  banners: "electrical-store/banners",
  products: "electrical-store/products",
  categories: "electrical-store/categories",
  variants: "electrical-store/variants",
} as const;

type FolderKey = keyof typeof FOLDERS;

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

  let folderKey: FolderKey = "banners";

  try {
    const body = await request.json();
    if (body && typeof body.folder === "string" && body.folder in FOLDERS) {
      folderKey = body.folder as FolderKey;
    }
  } catch {
    // No body means the default banners folder is used.
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = FOLDERS[folderKey];
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
