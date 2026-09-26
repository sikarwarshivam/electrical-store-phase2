/* eslint-disable @next/next/no-img-element */
"use client";

import { ChangeEvent, useRef, useState } from "react";

type CloudinaryImageUploadProps = {
  initialUrl?: string;
  folder: "products" | "categories" | "variants" | "banners";
  hiddenName?: string;
  label?: string;
};

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;

function isSupportedImage(file: File) {
  return new Set([
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/svg+xml",
  ]).has(file.type) || file.name.toLowerCase().endsWith(".svg");
}

export function CloudinaryImageUpload({
  initialUrl = "",
  folder,
  hiddenName = "imageUrl",
  label = "Choose image",
}: CloudinaryImageUploadProps) {
  const [imageUrl, setImageUrl] = useState(initialUrl);
  const [previewUrl, setPreviewUrl] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");

    if (!isSupportedImage(file)) {
      setError("Use a PNG, JPG, WEBP, or SVG image.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError("Image must be 8 MB or smaller.");
      event.target.value = "";
      return;
    }

    setUploading(true);

    try {
      const signatureResponse = await fetch("/api/admin/cloudinary-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder }),
      });

      const signatureData = await signatureResponse.json();

      if (!signatureResponse.ok) {
        throw new Error(signatureData.message || "Could not prepare image upload.");
      }

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

      setImageUrl(uploadData.secure_url);
      setPreviewUrl(uploadData.secure_url);
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

  function removeImage() {
    setImageUrl("");
    setPreviewUrl("");
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name={hiddenName} value={imageUrl} />

      {previewUrl ? (
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="aspect-[4/3]">
            <img src={previewUrl} alt="Selected product image" className="h-full w-full object-contain p-3" />
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-neutral-200 px-3 py-2 text-xs dark:border-neutral-800">
            <span className="truncate text-neutral-500">Image ready</span>
            <button type="button" onClick={removeImage} className="font-semibold text-red-600 hover:underline">
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-5 text-center dark:border-neutral-700 dark:bg-neutral-900/50">
          <p className="text-sm font-medium">No image selected</p>
          <p className="mt-1 text-xs text-neutral-500">PNG, JPG, WEBP, or SVG · up to 8 MB</p>
        </div>
      )}

      <label className="inline-flex cursor-pointer items-center rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800">
        {uploading ? "Uploading..." : previewUrl ? "Replace image" : label}
        <input
          ref={inputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.webp,.svg,image/png,image/jpeg,image/webp,image/svg+xml"
          className="sr-only"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </label>

      {uploading ? <p className="text-xs text-neutral-500">Uploading securely. Keep this page open until it finishes.</p> : null}
      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
      <p className="text-xs text-neutral-500">Stored in Cloudinary automatically. No image URL copying is required.</p>
    </div>
  );
}