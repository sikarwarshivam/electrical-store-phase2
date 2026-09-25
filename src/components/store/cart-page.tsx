"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Minus,
  Plus,
  RefreshCw,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { reconcileCartAction } from "@/actions/cart";
import type { CartReconcileLine } from "@/actions/cart";
import { formatINRFromPaise } from "@/lib/money";

function precisionForStep(step: number) {
  return Math.max(0, (step.toString().split(".")[1] || "").length);
}

function roundQuantity(value: number, step: number) {
  const precision = precisionForStep(step);
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function formatQuantity(value: number, step: number) {
  const precision = precisionForStep(step);
  return value
    .toFixed(precision)
    .replace(/\.0+$/, "")
    .replace(/(\.\d*?)0+$/, "$1");
}

export function CartPage() {
  const {
    items,
    isHydrated,
    removeItem,
    updateQuantity,
    syncItem,
    itemCount,
  } = useCart();

  const [reconciled, setReconciled] = useState<CartReconcileLine[]>([]);
  const [reconciledSignature, setReconciledSignature] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const signature = useMemo(
    () =>
      items
        .map((item) => item.variantId + ":" + item.quantity)
        .sort()
        .join("|"),
    [items]
  );

  const lineMap = useMemo(
    () => new Map(reconciled.map((line) => [line.variantId, line])),
    [reconciled]
  );

  function clearReconcileState() {
    setReconciled([]);
    setReconciledSignature("");
  }

  async function reconcile() {
    if (!items.length) {
      setReconciled([]);
      setReconciledSignature(signature);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await reconcileCartAction({
        items: items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
          unitPricePaise: item.unitPricePaise,
        })),
      });

      setReconciled(result.lines);
      setReconciledSignature(signature);

      for (const line of result.lines) {
        if (line.purchasable && line.unitPricePaise !== undefined) {
          syncItem(line.variantId, {
            sku: line.sku,
            title: line.title,
            unitPricePaise: line.unitPricePaise,
            unitOfSale: line.unitOfSale,
            image: line.image,
            brand: line.brand,
          });
        }
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to refresh cart right now."
      );
      setReconciledSignature("");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isHydrated) return;

    const timer = window.setTimeout(() => {
      if (signature) {
        void reconcile();
      } else {
        clearReconcileState();
      }
    }, 0);

    return () => window.clearTimeout(timer);
    // Re-run only when cart contents/quantities change, not when server metadata is synced.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, signature]);

  if (!isHydrated) {
    return (
      <PageContainer
        title="Shopping Cart"
        description="Review your selected electrical products."
      >
        <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950">
          Loading cart…
        </div>
      </PageContainer>
    );
  }

  if (items.length === 0) {
    return (
      <PageContainer
        title="Shopping Cart"
        description="Review your selected electrical products."
      >
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center dark:border-neutral-800 dark:bg-neutral-950">
          <ShoppingBag className="mx-auto h-12 w-12 text-neutral-400" />
          <h2 className="mt-4 text-lg font-bold">Your cart is empty</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Browse the catalog and add products to continue.
          </p>
          <Link href="/products" className="mt-5 inline-flex">
            <Button>Browse products</Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  const allLinesVerified =
    reconciledSignature === signature && reconciled.length === items.length;
  const checkoutBlocked =
    loading ||
    !allLinesVerified ||
    reconciled.some((line) => !line.purchasable);

  const authoritativeSubtotal = reconciled.reduce(
    (total, line) =>
      line.purchasable && line.unitPricePaise !== undefined
        ? total + line.unitPricePaise * line.quantity
        : total,
    0
  );

  return (
    <PageContainer
      title="Shopping Cart"
      description="Current price and stock are verified against the store catalog."
      actions={
        <Button
          type="button"
          variant="outline"
          onClick={() => void reconcile()}
          isLoading={loading}
        >
          <RefreshCw className="mr-1.5 h-4 w-4" />
          Refresh
        </Button>
      }
    >
      {error ? (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/20 dark:text-red-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {reconciled.some((line) => line.priceChanged) ? (
        <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
          One or more prices changed. The current store prices are now shown in
          your cart.
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {items.map((item) => {
            const line = lineMap.get(item.variantId);
            const step = line?.orderQuantityStep ?? 1;
            const minimum = line?.minOrderQuantity ?? 1;
            const quantity = line?.quantity ?? item.quantity;
            const stockLimited =
              line?.trackInventory === true &&
              line.availableQuantity !== undefined;
            const maxReached =
              stockLimited &&
              line.availableQuantity !== undefined &&
              quantity + step > line.availableQuantity;

            return (
              <div
                key={item.id}
                className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
              >
                <div className="flex gap-4">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-full w-full object-contain p-2"
                      />
                    ) : (
                      <ShoppingBag className="h-full w-full p-7 text-neutral-400" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <Link
                          href={
                            line?.productSlug
                              ? "/products/" + line.productSlug
                              : "/products"
                          }
                          className="font-semibold hover:text-amber-700 dark:hover:text-amber-400"
                        >
                          {line?.title || item.title}
                        </Link>
                        <p className="mt-1 text-xs text-neutral-500">
                          SKU: {line?.sku ?? item.sku}
                        </p>
                        {line?.brand ? (
                          <p className="mt-1 text-xs text-neutral-500">
                            {line.brand}
                          </p>
                        ) : null}
                      </div>

                      <div className="text-right">
                        <p className="font-bold">
                          {line?.unitPricePaise !== undefined
                            ? formatINRFromPaise(line.unitPricePaise)
                            : formatINRFromPaise(item.unitPricePaise)}
                        </p>
                        <p className="text-xs text-neutral-500">
                          per{" "}
                          {(
                            line?.unitOfSale ?? item.unitOfSale
                          ).toLowerCase()}
                        </p>
                      </div>
                    </div>

                    {line?.issues.length ? (
                      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
                        {line.issues.map((issue) => (
                          <p key={issue}>• {issue}</p>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-3">
                        <Badge
                          variant={
                            line?.stockStatus === "IN_STOCK"
                              ? "success"
                              : line?.stockStatus === "LOW_STOCK"
                                ? "warning"
                                : "destructive"
                          }
                        >
                          {line?.stockStatus === "LOW_STOCK"
                            ? "Low stock"
                            : line?.stockStatus === "OUT_OF_STOCK"
                              ? "Out of stock"
                              : "Available"}
                        </Badge>
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex h-10 items-center rounded-md border border-neutral-300 dark:border-neutral-700">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              roundQuantity(
                                Math.max(minimum, quantity - step),
                                step
                              )
                            )
                          }
                          className="px-3 text-neutral-600 hover:text-neutral-950 dark:text-neutral-300 dark:hover:text-white"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-4 w-4" />
                        </button>

                        <span className="w-16 text-center text-sm font-semibold">
                          {formatQuantity(quantity, step)}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            const next = roundQuantity(quantity + step, step);
                            if (
                              !stockLimited ||
                              line?.availableQuantity === undefined ||
                              next <= line.availableQuantity
                            ) {
                              updateQuantity(item.id, next);
                            }
                          }}
                          disabled={maxReached}
                          className="px-3 text-neutral-600 hover:text-neutral-950 disabled:opacity-40 dark:text-neutral-300 dark:hover:text-white"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="mr-1.5 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <aside className="h-fit rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950 lg:sticky lg:top-24">
          <h2 className="text-base font-bold">Order summary</h2>

          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-neutral-500">Items</span>
            <span className="font-semibold">{itemCount}</span>
          </div>

          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-neutral-500">Subtotal</span>
            <span className="font-semibold">
              {formatINRFromPaise(authoritativeSubtotal)}
            </span>
          </div>

          <p className="mt-3 text-xs leading-5 text-neutral-500">
            Shipping, tax, and the final payable amount will be recalculated
            from server-side order data during checkout.
          </p>

          <Link
            href={checkoutBlocked ? "#" : "/checkout"}
            aria-disabled={checkoutBlocked}
            className={
              checkoutBlocked ? "pointer-events-none mt-5 block" : "mt-5 block"
            }
          >
            <Button
              className="w-full"
              size="lg"
              disabled={checkoutBlocked}
            >
              Proceed to checkout
            </Button>
          </Link>

          <Link
            href="/products"
            className="mt-3 inline-flex items-center text-sm font-semibold text-amber-700 hover:underline dark:text-amber-400"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Continue shopping
          </Link>
        </aside>
      </div>
    </PageContainer>
  );
}
