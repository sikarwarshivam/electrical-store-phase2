/**
 * Cloudinary Media Storage Configuration Architecture
 * 
 * Phase 1 Scope: Configuration definitions and folder conventions only.
 * Full upload pipelines, transformations, and asset delivery belong to Phase 2.
 */

export interface CloudinaryConfig {
  cloudName?: string;
  apiKey?: string;
  apiSecret?: string;
  folders: {
    products: string;
    categories: string;
    banners: string;
    brands: string;
  };
  uploadLimits: {
    maxFileSizeBytes: number;
    allowedMimeTypes: readonly string[];
  };
}

export const cloudinaryConfig: CloudinaryConfig = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
  folders: {
    products: "electrical_store/products",
    categories: "electrical_store/categories",
    banners: "electrical_store/banners",
    brands: "electrical_store/brands",
  },
  uploadLimits: {
    maxFileSizeBytes: 5 * 1024 * 1024, // 5MB max image size
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
};
