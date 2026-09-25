"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { reconcileCartAction } from "@/actions/cart";
import type { CartReconcileLine } from "@/actions/cart";
import { useCart } from "@/hooks/use-cart";
import { formatINRFromPaise } from "@/lib/money";

interface AddressState {
  fullName: string;
  phone: string;
  email: string;
  pincode: string;
  house: string;
  street: string;
  landmark: string;
  city: string;
  state: string;
}

const initialAddress: AddressState = {
  fullName: "",
  phone: "",
  email: "",
  pincode: "",
  house: "",
  street: "",
  landmark: "",
  city: "",
  state: "",
};

function validPhone(value: string) {
  return /^[6-9]\d{9}$/.test(value);
}

function validPincode(value: string) {
  return /^\d{6}$/.test(value);
}

function sanitizeName(value: string) {
  return value
    .replace(/[^\p{L}\s.'-]/gu, "")
    .replace(/\s{2,}/g, " ")
    .slice(0, 120);
}

function sanitizeDigits(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

export function CheckoutPage() {
  const { items, isHydrated } = useCart();
  const [lines, setLines] = useState<CartReconcileLine[]>([]);
  const [issues, setIssues] = useState<Array<{ variantId: string; message: string }>>([]);
  const [verifiedSignature, setVerifiedSignature] = useState("");
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState(initialAddress);
  const [submitted, setSubmitted] = useState(false);

  const signature = useMemo(
    () =>
      items
        .map((item) => item.variantId + ":" + item.quantity)
        .sort()
        .join("|"),
    [items]
  );

  useEffect(() => {
    if (!isHydrated || items.length === 0) return;

    let active = true;
    setLoading(true);
    setIssues([]);

    void reconcileCartAction({
      items: items.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
        unitPricePaise: item.unitPricePaise,
      })),
    })
      .then((result) => {
        if (!active) return;
        setLines(result.lines);
        setIssues(result.issues);
        setVerifiedSignature(signature);
      })
      .catch(() => {
        if (!active) return;
        setLines([]);
        setIssues([
          {
            variantId: "",
            message:
              "Unable to verify your cart right now. Please return to the cart and try again.",
          },
        ]);
        setVerifiedSignature("");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // Cart metadata changes do not require a second server reconciliation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, signature]);

  const subtotalPaise = lines.reduce(
    (total, line) =>
      line.purchasable && line.unitPricePaise !== undefined
        ? total + line.unitPricePaise * line.quantity
        : total,
    0
  );

  function updateField(field: keyof AddressState, value: string) {
    setAddress((current) => ({ ...current, [field]: value }));
    setSubmitted(false);
  }

  function submitSkeleton(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  if (!isHydrated) {
    return (
      <PageContainer title="Checkout" description="Loading checkout..." />
    );
  }

  if (items.length === 0) {
    return (
      <PageContainer
        title="Checkout"
        description="Complete your purchase securely."
      >
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center dark:border-neutral-800 dark:bg-neutral-950">
          <h2 className="text-lg font-bold">Your cart is empty</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Add a product before entering checkout.
          </p>
          <Link href="/products" className="mt-5 inline-flex">
            <Button>Browse products</Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  const cartVerified =
    verifiedSignature === signature &&
    lines.length === items.length &&
    issues.length === 0;

  const addressComplete =
    address.fullName.trim().length >= 2 &&
    validPhone(address.phone) &&
    validPincode(address.pincode) &&
    address.house.trim().length >= 1 &&
    address.street.trim().length >= 2 &&
    address.city.trim().length >= 2 &&
    address.state.trim().length >= 2;

  const continueDisabled = loading || !cartVerified || !addressComplete;

  return (
    <PageContainer
      title="Checkout"
      description="Review your cart and enter delivery details."
    >
      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
        This phase establishes the checkout structure and server-side cart
        verification. Order creation, Razorpay verification, COD rules, and
        delivery charges are connected in the following commerce phases.
      </div>

      {issues.length > 0 ? (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <div>
              <p className="text-sm font-semibold text-red-900 dark:text-red-200">
                Cart needs attention
              </p>
              <div className="mt-1 space-y-1 text-xs text-red-800 dark:text-red-300">
                {issues.map((issue, index) => (
                  <p key={issue.variantId + issue.message + index}>
                    • {issue.message}
                  </p>
                ))}
              </div>
              <Link
                href="/cart"
                className="mt-3 inline-flex text-xs font-semibold text-red-800 underline dark:text-red-300"
              >
                Return to cart
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <form onSubmit={submitSkeleton} className="space-y-6">
          <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-amber-600" />
              <div>
                <h2 className="text-base font-bold">Delivery address</h2>
                <p className="text-xs text-neutral-500">
                  Guest checkout is supported. Saved addresses are added with
                  the account phase.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["fullName", "Full name", "text"],
                  ["phone", "Phone", "tel"],
                  ["email", "Email (optional)", "email"],
                  ["pincode", "Pincode", "text"],
                  ["house", "House / Flat", "text"],
                  ["street", "Street / Locality", "text"],
                  ["landmark", "Landmark (optional)", "text"],
                  ["city", "City", "text"],
                  ["state", "State", "text"],
                ] as Array<[keyof AddressState, string, string]>
              ).map(([field, label, type]) => (
                <label
                  key={field}
                  className={
                    field === "street" || field === "landmark"
                      ? "sm:col-span-2"
                      : ""
                  }
                >
                  <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                    {label}
                  </span>
                  <input
                    type={type}
                    value={address[field]}
                    onChange={(event) => {
                      const rawValue = event.target.value;
                      const value =
                        field === "fullName"
                          ? sanitizeName(rawValue)
                          : field === "phone"
                            ? sanitizeDigits(rawValue, 10)
                            : field === "pincode"
                              ? sanitizeDigits(rawValue, 6)
                              : rawValue;

                      updateField(field, value);
                    }}
                    inputMode={
                      field === "phone" || field === "pincode"
                        ? "numeric"
                        : undefined
                    }
                    pattern={
                      field === "fullName"
                        ? "[\\p{L} .'-]{2,120}"
                        : field === "phone"
                          ? "[6-9][0-9]{9}"
                          : field === "pincode"
                            ? "[0-9]{6}"
                            : undefined
                    }
                    maxLength={
                      field === "fullName"
                        ? 120
                        : field === "phone"
                          ? 10
                          : field === "pincode"
                            ? 6
                            : undefined
                    }
                    autoComplete={
                      field === "fullName"
                        ? "name"
                        : field === "phone"
                          ? "tel"
                          : field === "email"
                            ? "email"
                            : field === "pincode"
                              ? "postal-code"
                              : undefined
                    }
                    required={!["email", "landmark"].includes(field)}
                    className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-amber-500 dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </label>
              ))}
            </div>

            {submitted && !addressComplete ? (
              <p className="mt-4 text-xs font-medium text-red-600">
                Enter a valid 10-digit Indian phone number, 6-digit pincode,
                and all required address fields.
              </p>
            ) : null}
          </section>

          <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-amber-600" />
              <div>
                <h2 className="text-base font-bold">Payment method</h2>
                <p className="text-xs text-neutral-500">
                  Razorpay and COD rules are added after the checkout skeleton.
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-lg border border-dashed border-neutral-300 p-4 text-sm text-neutral-500 dark:border-neutral-700">
              Payment selection is intentionally disabled until the payment
              and order models are in place.
            </div>
          </section>

          <Button
            type="submit"
            size="lg"
            className="w-full sm:w-auto"
            disabled={continueDisabled}
          >
            Continue to payment
          </Button>
        </form>

        <aside className="h-fit rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950 lg:sticky lg:top-24">
          <h2 className="text-base font-bold">Order summary</h2>

          <div className="mt-4 space-y-3">
            {lines.map((line) => (
              <div
                key={line.variantId}
                className="flex justify-between gap-4 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {line.title || line.sku}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Qty {line.quantity}
                  </p>
                </div>
                <span className="shrink-0 font-semibold">
                  {line.unitPricePaise !== undefined
                    ? formatINRFromPaise(
                        line.unitPricePaise * line.quantity
                      )
                    : "—"}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Subtotal</span>
              <span className="font-semibold">
                {formatINRFromPaise(subtotalPaise)}
              </span>
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-neutral-500">Shipping</span>
              <span className="font-semibold">To be calculated</span>
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-neutral-500">Tax</span>
              <span className="font-semibold">To be calculated</span>
            </div>
            <div className="mt-4 flex justify-between border-t border-neutral-200 pt-4 text-base dark:border-neutral-800">
              <span className="font-bold">Grand total</span>
              <span className="font-bold">
                {formatINRFromPaise(subtotalPaise)}
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 text-xs text-neutral-500">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            Final order totals will be recalculated on the server when order
            creation is enabled.
          </div>

          <Link
            href="/cart"
            className="mt-5 inline-flex items-center text-sm font-semibold text-amber-700 hover:underline dark:text-amber-400"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to cart
          </Link>
        </aside>
      </div>
    </PageContainer>
  );
}
