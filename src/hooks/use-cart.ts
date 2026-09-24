"use client";

import { useSyncExternalStore } from "react";
import { useCartStore } from "@/stores/cart-store";

const emptySubscribe = () => () => {};

export function useCart() {
  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const cart = useCartStore();

  return {
    ...cart,
    isHydrated,
    itemCount: isHydrated ? cart.getItemCount() : 0,
    subtotalPaise: isHydrated ? cart.getSubtotalPaise() : 0,
    items: isHydrated ? cart.items : [],
  };
}
