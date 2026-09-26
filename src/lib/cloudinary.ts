import { createHash } from "node:crypto";

type CloudinaryConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

function isPlaceholder(value: string) {
  return /^(your_|replace_|placeholder|example|changeme)/i.test(value);
}

function readConfig(): CloudinaryConfig | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (
    !cloudName ||
    !apiKey ||
    !apiSecret ||
    isPlaceholder(cloudName) ||
    isPlaceholder(apiKey) ||
    isPlaceholder(apiSecret)
  ) {
    return null;
  }

  return { cloudName, apiKey, apiSecret };
}

export function getCloudinaryServerConfig() {
  return readConfig();
}

export function signCloudinaryParams(
  params: Record<string, string | number>,
  apiSecret: string
) {
  const payload = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([key, value]) => key + "=" + String(value))
    .join("&");

  return createHash("sha1")
    .update(payload + apiSecret)
    .digest("hex");
}
