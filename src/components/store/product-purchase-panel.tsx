"use client";

import { useMemo, useState } from "react";
import { Check, Minus, Plus, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { formatINRFromPaise } from "@/lib/money";
import type { PublicVariant } from "@/lib/catalog";

function roundQuantity(value: number, step: number) {
  const precision = Math.max(0, (step.toString().split(".")[1] || "").length);
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function stockLabel(status: PublicVariant["stockStatus"]) {
  if (status === "IN_STOCK") return "In stock";
  if (status === "LOW_STOCK") return "Low stock";
  return "Out of stock";
}

export function ProductPurchasePanel({
  productId,
  productName,
  brandName,
  productImage,
  variants,
}: {
  productId: string;
  productName: string;
  brandName?: string;
  productImage?: string;
  variants: PublicVariant[];
}) {
  const { addItem } = useCart();
  const defaultVariant = variants.find((variant) => {
    return variants.findIndex((candidate) => candidate.id === variant.id) === 0 || variant.stockStatus === "IN_STOCK";
  }) || variants[0];

  const [selectedId, setSelectedId] = useState(defaultVariant.id);
  const selected = useMemo(
    () => variants.find((variant) => variant.id === selectedId) || variants[0],
    [selectedId, variants]
  );
  const [quantity, setQuantity] = useState(selected.minOrderQuantity);
  const [added, setAdded] = useState(false);

  const discount =
    selected.mrpPaise > selected.pricePaise
      ? Math.round((1 - selected.pricePaise / selected.mrpPaise) * 100)
      : 0;

  function changeVariant(id: string) {
    const next = variants.find((variant) => variant.id === id);
    if (!next) return;
    setSelectedId(id);
    setQuantity(next.minOrderQuantity);
    setAdded(false);
  }

  function changeQuantity(value: number) {
    if (!Number.isFinite(value)) return;
    const next = Math.max(selected.minOrderQuantity, value);
    setQuantity(roundQuantity(next, selected.orderQuantityStep));
    setAdded(false);
  }

  function addToCart() {
    const safeQuantity = Math.max(
      selected.minOrderQuantity,
      roundQuantity(quantity, selected.orderQuantityStep)
    );

    addItem({
      productId,
      variantId: selected.id,
      sku: selected.sku,
      title: selected.title ? productName + " — " + selected.title : productName,
      unitPricePaise: selected.pricePaise,
      quantity: safeQuantity,
      unitOfSale: selected.unitOfSale,
      image: selected.imageUrl || productImage,
      brand: brandName,
    });

    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
      {variants.length > 1 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Choose an option</span>
            <span className="text-xs text-neutral-500">{variants.length} available</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {variants.map((variant) => {
              const active = variant.id === selected.id;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => changeVariant(variant.id)}
                  className={
                    "rounded-lg border p-3 text-left transition-colors " +
                    (active
                      ? "border-amber-500 bg-amber-50 ring-1 ring-amber-500 dark:bg-amber-950/30"
                      : "border-neutral-200 hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600")
                  }
                  aria-pressed={active}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{variant.title || variant.sku}</p>
                      {variant.options.length > 0 ? (
                        <p className="mt-1 text-xs text-neutral-500">
                          {variant.options.map((option) => option.name + ": " + option.value).join(" · ")}
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs text-neutral-500">SKU: {variant.sku}</p>
                    </div>
                    {active ? <Check className="mt-0.5 h-4 w-4 text-amber-600" /> : null}
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="font-semibold">{formatINRFromPaise(variant.pricePaise)}</span>
                    <Badge
                      variant={
                        variant.stockStatus === "IN_STOCK"
                          ? "success"
                          : variant.stockStatus === "LOW_STOCK"
                            ? "warning"
                            : "destructive"
                      }
                    >
                      {stockLabel(variant.stockStatus)}
                    </Badge>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-5 border-t border-neutral-200 pt-5 dark:border-neutral-800">
        <div className="flex flex-wrap items-end gap-3">
          <span className="text-3xl font-bold tracking-tight">{formatINRFromPaise(selected.pricePaise)}</span>
          {selected.mrpPaise > selected.pricePaise ? (
            <>
              <span className="pb-1 text-sm text-neutral-400 line-through">
                {formatINRFromPaise(selected.mrpPaise)}
              </span>
              <Badge variant="warning">{discount}% off</Badge>
            </>
          ) : null}
        </div>

        <p className="mt-1 text-xs text-neutral-500">
          Price per {selected.unitOfSale.toLowerCase()}. Server-side price and stock verification will be applied during checkout.
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <div className="flex h-11 items-center rounded-md border border-neutral-300 dark:border-neutral-700">
            <button
              type="button"
              onClick={() => changeQuantity(quantity - selected.orderQuantityStep)}
              className="px-3 text-neutral-600 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white"
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              value={quantity}
              onChange={(event) => changeQuantity(Number(event.target.value))}
              type="number"
              min={selected.minOrderQuantity}
              step={selected.orderQuantityStep}
              className="h-full w-20 border-x border-neutral-300 bg-transparent text-center text-sm font-semibold outline-none dark:border-neutral-700"
              aria-label="Quantity"
            />
            <button
              type="button"
              onClick={() => changeQuantity(quantity + selected.orderQuantityStep)}
              className="px-3 text-neutral-600 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <Button
            type="button"
            className="h-11 flex-1"
            onClick={addToCart}
            disabled={selected.stockStatus === "OUT_OF_STOCK"}
          >
            {added ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Added to cart
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to cart
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
