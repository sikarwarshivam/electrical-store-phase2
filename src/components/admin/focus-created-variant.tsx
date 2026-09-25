"use client";

import { useEffect } from "react";

export function FocusCreatedVariant({ variantId }: { variantId?: string }) {
  useEffect(() => {
    if (!variantId) return;

    let attempts = 0;
    const scrollToVariant = () => {
      const element = document.getElementById("variant-" + variantId);
      if (!element) {
        if (attempts++ < 12) window.setTimeout(scrollToVariant, 100);
        return;
      }

      element.scrollIntoView({ behavior: "smooth", block: "start" });
      element.classList.add("ring-2", "ring-amber-500");
      window.setTimeout(() => {
        element.classList.remove("ring-2", "ring-amber-500");
      }, 2200);
    };

    const firstFrame = window.requestAnimationFrame(scrollToVariant);
    return () => window.cancelAnimationFrame(firstFrame);
  }, [variantId]);

  return null;
}
