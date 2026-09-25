"use client";

import { useEffect } from "react";

function findScrollContainer(element: HTMLElement): HTMLElement {
  let parent = element.parentElement;

  while (parent) {
    const styles = window.getComputedStyle(parent);
    const canScroll =
      (styles.overflowY === "auto" || styles.overflowY === "scroll") &&
      parent.scrollHeight > parent.clientHeight;

    if (canScroll) return parent;
    parent = parent.parentElement;
  }

  return document.scrollingElement as HTMLElement;
}

export function FocusCreatedVariant({ variantId }: { variantId?: string }) {
  useEffect(() => {
    if (!variantId) return;

    let cancelled = false;
    let highlightedElement: HTMLElement | null = null;
    const timers: number[] = [];

    const scrollToVariant = () => {
      if (cancelled) return;

      const element = document.getElementById("variant-" + variantId) as HTMLElement | null;
      if (!element) return;

      const container = findScrollContainer(element);
      const targetTop =
        element.getBoundingClientRect().top -
        container.getBoundingClientRect().top +
        container.scrollTop -
        16;

      container.scrollTo({
        top: Math.max(0, targetTop),
        behavior: "smooth",
      });

      highlightedElement?.classList.remove("ring-2", "ring-amber-500");
      highlightedElement = element;
      element.classList.add("ring-2", "ring-amber-500");

      window.setTimeout(() => {
        element.classList.remove("ring-2", "ring-amber-500");
      }, 2200);

      // Remove the one-time creation marker without triggering another navigation.
      const url = new URL(window.location.href);
      url.searchParams.delete("createdVariant");
      url.hash = "";
      window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    };

    [0, 80, 180, 350, 650, 1000, 1400].forEach((delay) => {
      timers.push(window.setTimeout(scrollToVariant, delay));
    });

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [variantId]);

  return null;
}
