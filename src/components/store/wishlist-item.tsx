"use client";

import Link from "next/link";
import { useState } from "react";
import { HeartOff, ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { removeWishlistItemAction } from "@/actions/wishlist";
import { Button } from "@/components/ui/button";
import { formatINRFromPaise } from "@/lib/money";

export interface WishlistItemData {
  id: string;
  productId: string;
  name: string;
  slug: string;
  shortDescription: string;
  imageUrl: string;
  productType: "SIMPLE" | "VARIABLE";
  available: boolean;
  variantId: string;
  sku: string;
  pricePaise: number;
  unitOfSale: string;
  availableQuantity: number;
  trackInventory: boolean;
  minOrderQuantity: number;
  orderQuantityStep: number;
}

export function WishlistItem({ item }: { item: WishlistItemData }) {
  const { addItem } = useCart();
  const [visible, setVisible] = useState(true);
  const [removing, setRemoving] = useState(false);
  const [added, setAdded] = useState(false);

  if (!visible) return null;

  async function remove() {
    setRemoving(true);
    const result = await removeWishlistItemAction({ productId: item.productId });
    if (result.success) setVisible(false);
    else setRemoving(false);
  }

  function addToCart() {
    if (!item.available || !item.variantId) return;

    const quantity =
      item.trackInventory
        ? Math.min(item.minOrderQuantity, item.availableQuantity)
        : item.minOrderQuantity;

    if (quantity < item.minOrderQuantity) return;

    addItem({
      productId: item.productId,
      variantId: item.variantId,
      sku: item.sku,
      title: item.name,
      unitPricePaise: item.pricePaise,
      quantity,
      unitOfSale: item.unitOfSale,
      image: item.imageUrl || undefined,
    });

    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }

  return (
    <article className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href={"/products/" + item.slug}
          className="h-28 w-28 shrink-0 overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-900"
        >
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="h-full w-full object-contain p-3"
            />
          ) : null}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Link
                href={"/products/" + item.slug}
                className="font-bold hover:text-amber-700 dark:hover:text-amber-400"
              >
                {item.name}
              </Link>
              <p className="mt-1 text-xs text-neutral-500">
                SKU: {item.sku || "Unavailable"} · {item.productType === "VARIABLE" ? "Default option" : item.unitOfSale}
              </p>
            </div>
            <p className="text-lg font-bold">{item.available ? formatINRFromPaise(item.pricePaise) : "Unavailable"}</p>
          </div>

          {item.shortDescription ? (
            <p className="mt-2 line-clamp-2 text-sm text-neutral-500">{item.shortDescription}</p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              onClick={addToCart}
              disabled={!item.available || added}
            >
              <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
              {added
                ? "Added"
                : item.productType === "VARIABLE"
                  ? "Add default option"
                  : "Add to cart"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={remove}
              isLoading={removing}
            >
              <HeartOff className="mr-1.5 h-3.5 w-3.5" />
              Remove
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
