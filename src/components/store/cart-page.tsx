"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronRight,
  Minus,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
} from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
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
        <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center text-sm text-neutral-500 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
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
        <div className="mx-auto max-w-2xl rounded-2xl border border-neutral-200 bg-white px-6 py-14 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/30">
            <ShoppingBag className="h-7 w-7 text-amber-600" />
          </div>
          <h2 className="mt-5 text-xl font-bold text-neutral-950 dark:text-white">
            Your cart is empty
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">
            Browse the catalog, choose the electrical products you need, and
            your selected items will appear here.
          </p>
          <Link href="/products" className="mt-6 inline-flex">
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
          className="bg-white dark:bg-neutral-950"
        >
          <RefreshCw className="mr-1.5 h-4 w-4" />
          Refresh
        </Button>
      }
    >
      {error ? (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/20 dark:text-red-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {reconciled.some((line) => line.priceChanged) ? (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
          One or more prices changed. The current store prices are now shown in
          your cart.
        </div>
      ) : null}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section aria-labelledby="cart-items-heading">
          <div className="mb-3 flex items-center justify-between">
            <h2
              id="cart-items-heading"
              className="text-sm font-semibold text-neutral-900 dark:text-neutral-100"
            >
              Your items
            </h2>
            <span className="text-xs text-neutral-500">
              Prices verified live
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
            {items.map((item, index) => {
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
                  className={
                    index === items.length - 1
                      ? "p-5"
                      : "border-b border-neutral-100 p-5 dark:border-neutral-900"
                  }
                >
                  <div className="flex gap-4 sm:gap-5">
                    <Link
                      href={
                        line?.productSlug
                          ? "/products/" + line.productSlug
                          : "/products"
                      }
                      className="group shrink-0"
                      aria-label={line?.title || item.title}
                    >
                      <div className="h-24 w-24 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:h-28 sm:w-28">
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.image}
                            alt={item.title}
                            className="h-full w-full object-contain p-2.5 transition-transform duration-300 group-hover:scale-[1.06]"
                          />
                        ) : (
                          <ShoppingBag className="h-full w-full p-8 text-neutral-400" />
                        )}
                      </div>
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <Link
                            href={
                              line?.productSlug
                                ? "/products/" + line.productSlug
                                : "/products"
                            }
                            className="line-clamp-2 text-sm font-semibold leading-5 text-neutral-950 transition-colors hover:text-amber-700 dark:text-white dark:hover:text-amber-400"
                          >
                            {line?.title || item.title}
                          </Link>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500">
                            <span>SKU: {line?.sku ?? item.sku}</span>
                            {line?.brand ? <span>· {line.brand}</span> : null}
                          </div>
                        </div>

                        <div className="shrink-0 sm:text-right">
                          <p className="font-bold text-neutral-950 dark:text-white">
                            {line?.unitPricePaise !== undefined
                              ? formatINRFromPaise(line.unitPricePaise)
                              : formatINRFromPaise(item.unitPricePaise)}
                          </p>
                          <p className="mt-0.5 text-[11px] text-neutral-400">
                            per{" "}
                            {(
                              line?.unitOfSale ?? item.unitOfSale
                            ).toLowerCase()}
                          </p>
                        </div>
                      </div>

                      {line?.issues.length ? (
                        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
                          {line.issues.map((issue) => (
                            <p key={issue}>• {issue}</p>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                          <Check className="h-3.5 w-3.5" />
                          {line?.stockStatus === "LOW_STOCK"
                            ? "Low stock"
                            : line?.stockStatus === "OUT_OF_STOCK"
                              ? "Out of stock"
                              : "Available"}
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="inline-flex h-9 items-center overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
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
                            className="inline-flex h-9 w-9 items-center justify-center text-neutral-600 transition-colors hover:bg-white hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>

                          <span className="min-w-12 border-x border-neutral-200 px-2 text-center text-xs font-semibold text-neutral-900 dark:border-neutral-800 dark:text-white">
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
                            className="inline-flex h-9 w-9 items-center justify-center text-neutral-600 transition-colors hover:bg-white hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-40 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeItem(item.id)}
                          className="h-9 px-2 text-xs text-neutral-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20"
                        >
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Link
            href="/products"
            className="mt-4 inline-flex items-center text-sm font-semibold text-amber-700 transition-colors hover:text-amber-800 hover:underline dark:text-amber-400 dark:hover:text-amber-300"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Continue shopping
          </Link>
        </section>

        <aside className="lg:sticky lg:top-24">
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
            <div className="border-b border-neutral-100 px-5 py-4 dark:border-neutral-900">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-bold text-neutral-950 dark:text-white">
                  Price details
                </h2>
                <span className="text-xs text-neutral-500">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </span>
              </div>
            </div>

            <div className="px-5 py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">Subtotal</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {formatINRFromPaise(authoritativeSubtotal)}
                </span>
              </div>

              <div className="mt-3 flex items-start justify-between gap-4 text-sm">
                <span className="text-neutral-500">Delivery &amp; tax</span>
                <span className="text-right text-xs font-medium text-neutral-500">
                  Calculated at checkout
                </span>
              </div>

              <div className="my-4 border-t border-dashed border-neutral-200 dark:border-neutral-800" />

              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    Total
                  </p>
                  <p className="mt-1 text-[11px] text-neutral-400">
                    Delivery and tax are calculated at checkout
                  </p>
                </div>
                <p className="text-lg font-bold tracking-tight text-neutral-950 dark:text-white">
                  {formatINRFromPaise(authoritativeSubtotal)}
                </p>
              </div>

              <Link
                href={checkoutBlocked ? "#" : "/checkout"}
                aria-disabled={checkoutBlocked}
                className={
                  checkoutBlocked ? "pointer-events-none mt-5 block" : "mt-5 block"
                }
              >
                <Button className="w-full" size="lg" disabled={checkoutBlocked}>
                  Proceed to checkout
                  <ChevronRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>

              <div className="mt-4 space-y-2.5 border-t border-neutral-100 pt-4 dark:border-neutral-900">
                <div className="flex items-center gap-2.5 text-xs text-neutral-500">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Secure checkout and payment verification
                </div>
                <div className="flex items-center gap-2.5 text-xs text-neutral-500">
                  <Truck className="h-4 w-4 text-amber-600" />
                  Delivery, tax and coupons recalculated at checkout
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
            <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">
              Price &amp; availability checked
            </p>
            <p className="mt-1 text-[11px] leading-5 text-neutral-500">
              Your cart uses the latest store catalog values before checkout.
            </p>
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}
