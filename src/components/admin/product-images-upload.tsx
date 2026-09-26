"use client";

import { ChangeEvent, useRef, useState } from "react";

type ProductImage = {
  url: string;
  publicId?: string;
  alt: string;
  sortOrder: number;
  isPrimary: boolean;
};

type ProductImagesUploadProps = {
  initialImages?: ProductImage[];
  maxImages?: number;
};

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;

function isSupportedImage(file: File) {
  const allowedTypes = new Set([
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/svg+xml",
  ]);
  return allowedTypes.has(file.type) || file.name.toLowerCase().endsWith(".svg");
}

export function ProductImagesUpload({
  initialImages = [],
  maxImages = 8,
}: ProductImagesUploadProps) {
  const [images, setImages] = useState<ProductImage[]>(
    initialImages.map((image, index) => ({
      ...image,
      sortOrder: image.sortOrder ?? index,
      isPrimary: Boolean(image.isPrimary),
    }))
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    if (!isSupportedImage(file)) {
      throw new Error("Use PNG, JPG, WEBP, or SVG images.");
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error("Each image must be 8 MB or smaller.");
    }

    const signatureResponse = await fetch("/api/admin/cloudinary-signature", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder: "products" }),
    });
    const signatureData = await signatureResponse.json();

    if (!signatureResponse.ok) {
      throw new Error(
        signatureData.message || "Could not prepare image upload."
      );
    }

    const uploadForm = new FormData();
    uploadForm.append("file", file);
    uploadForm.append("api_key", signatureData.apiKey);
    uploadForm.append("timestamp", String(signatureData.timestamp));
    uploadForm.append("folder", signatureData.folder);
    uploadForm.append(
      "signature",
      signatureData.signature
    );

    const uploadResponse = await fetch(
      "https://api.cloudinary.com/v1_1/" +
        signatureData.cloudName +
        "/image/upload",
      {
        method: "POST",
        body: uploadForm,
      }
    );
    const uploadData = await uploadResponse.json();

    if (!uploadResponse.ok || !uploadData.secure_url) {
      throw new Error(uploadData.error?.message || "Image upload failed.");
    }

    return {
      url: uploadData.secure_url as string,
      publicId: uploadData.public_id as string | undefined,
    };
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setError("");

    if (images.length + files.length > maxImages) {
      setError("A product can have up to " + maxImages + " images.");
      event.target.value = "";
      return;
    }

    setUploading(true);

    try {
      const uploaded: ProductImage[] = [];

      for (const file of files) {
        const result = await uploadFile(file);
        uploaded.push({
          url: result.url,
          publicId: result.publicId,
          alt: "",
          sortOrder: images.length + uploaded.length,
          isPrimary: images.length === 0 && uploaded.length === 0,
        });
      }

      setImages((current) => [...current, ...uploaded]);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "One or more images failed to upload."
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function removeImage(index: number) {
    setImages((current) => {
      const next = current.filter((_, imageIndex) => imageIndex !== index);
      if (next.length > 0 && !next.some((image) => image.isPrimary)) {
        next[0] = { ...next[0], isPrimary: true };
      }
      return next.map((image, imageIndex) => ({
        ...image,
        sortOrder: imageIndex,
      }));
    });
  }

  function setPrimary(index: number) {
    setImages((current) =>
      current.map((image, imageIndex) => ({
        ...image,
        isPrimary: imageIndex === index,
      }))
    );
  }

  function setAlt(index: number, alt: string) {
    setImages((current) =>
      current.map((image, imageIndex) =>
        imageIndex === index ? { ...image, alt } : image
      )
    );
  }

  return (
    <div className="space-y-3">
      <input
        type="hidden"
        name="imagesJson"
        value={JSON.stringify(images)}
      />

      {images.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image, index) => (
            <div
              key={image.url}
              className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950"
            >
              <div className="relative aspect-square bg-neutral-100 dark:bg-neutral-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={image.alt || "Product image " + (index + 1)}
                  className="h-full w-full object-contain p-3"
                />
                {image.isPrimary ? (
                  <span className="absolute left-2 top-2 rounded-full bg-neutral-900 px-2 py-1 text-[10px] font-bold text-white">
                    Primary
                  </span>
                ) : null}
              </div>

              <div className="space-y-2 border-t border-neutral-200 p-2.5 dark:border-neutral-800">
                <input
                  value={image.alt}
                  onChange={(event) => setAlt(index, event.target.value)}
                  placeholder="Image alt text"
                  maxLength={160}
                  className="h-8 w-full rounded-md border border-neutral-300 bg-white px-2 text-xs dark:border-neutral-700 dark:bg-neutral-900"
                />
                <div className="flex gap-2">
                  {!image.isPrimary ? (
                    <button
                      type="button"
                      onClick={() => setPrimary(index)}
                      className="flex-1 rounded-md border border-neutral-300 px-2 py-1.5 text-[11px] font-semibold hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
                    >
                      Make primary
                    </button>
                  ) : (
                    <span className="flex-1 rounded-md bg-neutral-100 px-2 py-1.5 text-center text-[11px] font-medium text-neutral-500 dark:bg-neutral-900">
                      Primary image
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="rounded-md border border-red-200 px-2 py-1.5 text-[11px] font-semibold text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:hover:bg-red-950/20"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-5 text-center dark:border-neutral-700 dark:bg-neutral-900/50">
          <p className="text-sm font-medium">No product images yet</p>
          <p className="mt-1 text-xs text-neutral-500">
            Upload up to {maxImages} product images. The first image becomes
            primary automatically.
          </p>
        </div>
      )}

      <label className="inline-flex cursor-pointer items-center rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800">
        {uploading ? "Uploading..." : "Add product images"}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml"
          className="sr-only"
          onChange={handleFileChange}
          disabled={uploading || images.length >= maxImages}
        />
      </label>

      {uploading ? (
        <p className="text-xs text-neutral-500">
          Uploading image{images.length + 1 === maxImages ? "" : "s"} securely...
        </p>
      ) : null}

      {error ? (
        <p className="text-xs font-medium text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
