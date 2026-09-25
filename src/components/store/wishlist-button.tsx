"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toggleWishlistAction } from "@/actions/wishlist";

export function WishlistButton({
  productId,
  initialWishlisted = false,
  compact = false,
}: {
  productId: string;
  initialWishlisted?: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    setLoading(true);
    setError("");

    try {
      const result = await toggleWishlistAction({ productId });

      if (result.success) {
        setWishlisted(result.wishlisted);
      } else if (result.requiresLogin) {
        router.push(
          "/login?callbackUrl=" +
            encodeURIComponent(window.location.pathname + window.location.search)
        );
      } else {
        setError(result.error);
      }
    } catch {
      setError("Unable to update wishlist. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        aria-pressed={wishlisted}
        aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        className={
          compact
            ? "inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 bg-white transition-colors hover:border-amber-500 dark:border-neutral-700 dark:bg-neutral-950"
            : "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-4 text-sm font-semibold transition-colors hover:border-amber-500 hover:bg-amber-50 dark:border-neutral-700 dark:bg-neutral-950 dark:hover:bg-amber-950/20"
        }
      >
        <Heart
          className={
            "h-4 w-4 " +
            (wishlisted ? "fill-amber-600 text-amber-600" : "text-neutral-600 dark:text-neutral-300")
          }
        />
        {compact ? null : wishlisted ? "Wishlisted" : "Add to wishlist"}
      </button>
      {error ? (
        <p className="absolute left-0 top-full z-20 mt-2 w-64 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-800 shadow-md dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </p>
      ) : null}
    </div>
  );
}
