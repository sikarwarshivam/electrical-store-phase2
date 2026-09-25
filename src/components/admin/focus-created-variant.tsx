"use client";

import { useLayoutEffect } from "react";

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

function focusAndScroll(variantId: string) {
  const element = document.getElementById("variant-" + variantId) as HTMLElement | null;
  if (!element) return false;

  const container = findScrollContainer(element);
  const top =
    element.getBoundingClientRect().top -
    container.getBoundingClientRect().top +
    container.scrollTop -
    24;

  // Explicitly scroll the actual overflow container instead of relying on
  // scrollIntoView(), which can choose a different ancestor in nested layouts.
  container.scrollTo({
    top: Math.max(0, top),
    behavior: "smooth",
  });

  // Native focus gives the browser a second, accessibility-friendly way to
  // bring the new SKU into view.
  const input = element.querySelector("input") as HTMLInputElement | null;
  input?.focus({ preventScroll: true });

  element.classList.add("ring-2", "ring-amber-500");
  window.setTimeout(() => {
    element.classList.remove("ring-2", "ring-amber-500");
  }, 2200);

  return true;
}

export function FocusCreatedVariant({ variantId }: { variantId?: string }) {
  useLayoutEffect(() => {
    if (!variantId) return;

    let cancelled = false;
    const timers: number[] = [];

    const attempt = () => {
      if (cancelled) return;
      focusAndScroll(variantId);
    };

    // Next.js can restore the route's scroll position after the RSC payload
    // is committed. Retry after that lifecycle point without changing the
    // global page scrolling behavior.
    window.requestAnimationFrame(attempt);
    [40, 120, 250, 450, 750, 1100].forEach((delay) => {
      timers.push(window.setTimeout(attempt, delay));
    });

    const url = new URL(window.location.href);
    url.searchParams.delete("createdVariant");
    url.hash = "";
    window.history.replaceState(window.history.state, "", url.pathname + url.search);

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [variantId]);

  return null;
}
