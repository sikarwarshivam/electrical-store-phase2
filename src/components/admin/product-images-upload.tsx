/* eslint-disable @next/next/no-img-element */
"use client";

import { ChangeEvent, useRef, useState } from "react";
import type { ProductImage } from "@/types/catalog";

type ProductImagesUploadProps = {
  initialImages?: ProductImage[];
};

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const MAX_IMAGES = 8;

function isSupportedImage(file: File) {
  return new Set([
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/svg+xml",
  ]).has(file.type) || file.name.toLowerCase().endsWith(".svg");
}

export function ProductImagesUpload({ initialImages = [] }: ProductImagesUploadProps) {
  const [images, setImages] = useState<ProductImage[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setError("");

    if (images.length + files.length > MAX_IMAGES) {
      setError("A product can have up to 8 images.");
      event.target.value = "";
      return;
    }

    for (const file of files) {
      if (!isSupportedImage(file)) {
        setError("Use PNG, JPG, WEBP, or SVG images.");
        event.target.value = "";
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError("Each image must be 8 MB or smaller.");
        event.target.value = "";
        return;
      }
    }

    setUploading(true);

    try {
      const signatureResponse = await fetch("/api/admin/cloudinary-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "products" }),
      });
      const signatureData = await signatureResponse.json();

      if (!signatureResponse.ok) {
        throw new Error(signatureData.message || "Could not prepare image upload.");
      }

      const uploaded: ProductImage[] = [];

      for (const file of files) {
        const uploadForm = new FormData();
        uploadForm.append("file", file);
        uploadForm.append("api_key", signatureData.apiKey);
        uploadForm.append("timestamp", String(signatureData.timestamp));
        uploadForm.append("folder", signatureData.folder);
        uploadForm.append("signature", signatureData.signature);

        const uploadResponse = await fetch(
          "https://api.cloudinary.com/v1_1/" + signatureData.cloudName + "/image/upload",
          { method: "POST", body: uploadForm }
        );
        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok || !uploadData.secure_url) {
          throw new Error(uploadData.error?.message || "Image upload failed.");
        }

        uploaded.push({
          url: uploadData.secure_url,
          publicId: uploadData.public_id,
          alt: file.name.replace(/.[^.]+$/, "").replace(/[-_]+/g, " ").slice(0, 160),
          sortOrder: images.length + uploaded.length,
          isPrimary: images.length === 0 && uploaded.length === 0,
        });
      }

      setImages((current) => {
        const merged = [...current, ...uploaded];
        return merged.map((image, index) => ({
          ...image,
          sortOrder: index,
          isPrimary: index === merged.findIndex((item) => item.isPrimary),
        }));
      });
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Image upload failed. Please try again."
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function updateImage(index: number, patch: Partial<ProductImage>) {
    setImages((current) => current.map((image, imageIndex) => imageIndex === index ? { ...image, ...patch } : image));
  }

  function makePrimary(index: number) {
    setImages((current) =>
      current.map((image, imageIndex) => ({
        ...image,
        isPrimary: imageIndex === index,
      }))
    );
  }

  function removeImage(index: number) {
    setImages((current) =>
      current
        .filter((_, imageIndex) => imageIndex !== index)
        .map((image, imageIndex) => ({
          ...image,
          sortOrder: imageIndex,
          isPrimary: imageIndex === 0 ? true : image.isPrimary,
        }))
    );
  }

  return (
    <div className="space-y-4">
      <input type="hidden" name="imagesJson" value={JSON.stringify(images)} />

      {images.length > 0 ? (
        <div className="space-y-3">
          {images.map((image, index) => (
            <div key={image.publicId || image.url + index} className="grid gap-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800 sm:grid-cols-[92px_1fr_auto] sm:items-start">
              <div className="aspect-square overflow-hidden rounded-md border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
                <img src={image.url} alt={image.alt || "Product image"} className="h-full w-full object-contain p-2" />
              </div>
              <div className="min-w-0 space-y-2">
                <input
                  value={image.alt || ""}
                  onChange={(event) => updateImage(index, { alt: event.target.value.slice(0, 160) })}
                  maxLength={160}
                  placeholder="Image alt text"
                  className="h-9 w-full rounded-md border border-neutral-300 bg-white px-3 text-xs dark:border-neutral-700 dark:bg-neutral-900"
                />
                <p className="truncate text-[11px] text-neutral-500">{image.url}</p>
              </div>
              <div className="flex items-center gap-2 sm:flex-col sm:items-stretch">
                <button
                  type="button"
                  onClick={() => makePrimary(index)}
                  className={"rounded-md border px-2.5 py-1.5 text-xs font-semibold " + (image.isPrimary ? "border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-300" : "border-neutral-300 text-neutral-700 dark:border-neutral-700 dark:text-neutral-200")}
                >
                  {image.isPrimary ? "Primary" : "Make primary"}
                </button>
                <button type="button" onClick={() => removeImage(index)} className="rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:hover:bg-red-950/20">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-5 text-center dark:border-neutral-700 dark:bg-neutral-900/50">
          <p className="text-sm font-medium">No product images selected</p>
          <p className="mt-1 text-xs text-neutral-500">Up to 8 images · PNG, JPG, WEBP, or SVG · 8 MB each</p>
        </div>
      )}

      <label className="inline-flex cursor-pointer items-center rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800">
        {uploading ? "Uploading..." : images.length ? "Add more images" : "Choose product images"}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml"
          className="sr-only"
          onChange={handleFileChange}
          disabled={uploading || images.length >= MAX_IMAGES}
        />
      </label>

      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
      <p className="text-xs text-neutral-500">Images upload directly to the secured product folder in Cloudinary.</p>
    </div>
  );
}