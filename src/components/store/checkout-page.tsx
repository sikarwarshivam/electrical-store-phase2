"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSession } from "next-auth/react";
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
import { getCheckoutSavedAddressesAction } from "@/actions/address";
import {
  createPaymentOrderAction,
  verifyRazorpayPaymentAction,
  type CreatePaymentOrderResult,
} from "@/actions/order";
import type { CartReconcileLine } from "@/actions/cart";
import { useCart } from "@/hooks/use-cart";
import { formatINRFromPaise } from "@/lib/money";

interface CheckoutSavedAddress {
  id: string;
  label: "HOME" | "WORK" | "OTHER";
  fullName: string;
  phone: string;
  pincode: string;
  house: string;
  street: string;
  landmark: string;
  city: string;
  state: string;
  isDefault: boolean;
}

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

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: "INR";
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void | Promise<void>;
  modal?: {
    ondismiss?: () => void;
  };
};

type RazorpayCheckoutInstance = {
  open: () => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckoutInstance;
  }
}

function loadRazorpayCheckoutScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Payment checkout is unavailable."));
  }

  if (window.Razorpay) return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>(
    'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
  );

  return new Promise<void>((resolve, reject) => {
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Unable to load Razorpay checkout.")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Unable to load Razorpay checkout."));
    document.body.appendChild(script);
  });
}

export function CheckoutPage() {
  const { items, isHydrated, clearCart } = useCart();
  const { status: sessionStatus } = useSession();
  const [lines, setLines] = useState<CartReconcileLine[]>([]);
  const [issues, setIssues] = useState<Array<{ variantId: string; message: string }>>([]);
  const [verifiedSignature, setVerifiedSignature] = useState("");
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState(initialAddress);
  const [submitted, setSubmitted] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<
    Extract<CreatePaymentOrderResult, { success: true }> | null
  >(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [savedAddresses, setSavedAddresses] = useState<CheckoutSavedAddress[]>([]);
  const [savedAddressesLoading, setSavedAddressesLoading] = useState(false);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState("");

  function isAddressBlank(value: AddressState) {
    return !Object.values(value).some((field) => field.trim());
  }

  function applySavedAddress(saved: CheckoutSavedAddress) {
    setAddress({
      fullName: saved.fullName,
      phone: saved.phone,
      email: address.email,
      pincode: saved.pincode,
      house: saved.house,
      street: saved.street,
      landmark: saved.landmark,
      city: saved.city,
      state: saved.state,
    });
    setSelectedSavedAddressId(saved.id);
    setSubmitted(false);
    setPaymentOrder(null);
    setPaymentError("");
  }

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

    setPaymentOrder(null);
    setPaymentError("");

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

  useEffect(() => {
    if (sessionStatus !== "authenticated") {
      setSavedAddresses([]);
      setSelectedSavedAddressId("");
      return;
    }

    let active = true;
    setSavedAddressesLoading(true);

    void getCheckoutSavedAddressesAction()
      .then((addresses) => {
        if (!active) return;

        setSavedAddresses(addresses);
        const defaultAddress = addresses.find((item) => item.isDefault) || addresses[0];

        if (defaultAddress) {
          setAddress((current) => {
            if (!isAddressBlank(current)) return current;

            setSelectedSavedAddressId(defaultAddress.id);
            return {
              fullName: defaultAddress.fullName,
              phone: defaultAddress.phone,
              email: current.email,
              pincode: defaultAddress.pincode,
              house: defaultAddress.house,
              street: defaultAddress.street,
              landmark: defaultAddress.landmark,
              city: defaultAddress.city,
              state: defaultAddress.state,
            };
          });
        }
      })
      .catch(() => {
        if (active) setSavedAddresses([]);
      })
      .finally(() => {
        if (active) setSavedAddressesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [sessionStatus]);

  const subtotalPaise = lines.reduce(
    (total, line) =>
      line.purchasable && line.unitPricePaise !== undefined
        ? total + line.unitPricePaise * line.quantity
        : total,
    0
  );

  function updateField(field: keyof AddressState, value: string) {
    setAddress((current) => ({ ...current, [field]: value }));
    setSelectedSavedAddressId("");
    setSubmitted(false);
    setPaymentOrder(null);
    setPaymentError("");
  }

  async function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setPaymentError("");

    if (!addressComplete || !cartVerified || loading) return;

    setPaymentLoading(true);

    try {
      const order =
        paymentOrder ||
        (await createPaymentOrderAction({
          checkoutId:
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : "checkout-" + Date.now() + "-" + Math.random().toString(36).slice(2, 10),
          items: items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
            unitPricePaise: item.unitPricePaise,
          })),
          address,
        }));

      if (!order.success) {
        setPaymentError(order.error);
        return;
      }

      setPaymentOrder(order);
      await loadRazorpayCheckoutScript();

      if (!window.Razorpay) {
        throw new Error("Razorpay checkout did not initialize.");
      }

      const checkout = new window.Razorpay({
        key: order.razorpayKeyId,
        amount: order.amountPaise,
        currency: "INR",
        name: "Electrical Retail Store",
        description: "Order " + order.orderNumber,
        order_id: order.razorpayOrderId,
        prefill: {
          name: address.fullName,
          email: address.email || undefined,
          contact: address.phone,
        },
        notes: {
          order_number: order.orderNumber,
        },
        handler: async (response) => {
          setPaymentLoading(true);
          setPaymentError("");

          try {
            if (response.razorpay_order_id !== order.razorpayOrderId) {
              setPaymentError("Payment order mismatch. Please contact support before retrying.");
              return;
            }

            const verified = await verifyRazorpayPaymentAction({
              orderId: order.orderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (!verified.success) {
              setPaymentError(verified.error);
              return;
            }

            clearCart();
            window.location.assign(
              "/order-success?order=" + encodeURIComponent(verified.orderNumber)
            );
          } catch {
            setPaymentError(
              "Payment was received by the gateway but verification could not be completed yet. Please wait for confirmation before retrying."
            );
          } finally {
            setPaymentLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentLoading(false);
          },
        },
      });

      checkout.open();
    } catch (error) {
      setPaymentError(
        error instanceof Error ? error.message : "Unable to start payment. Please try again."
      );
    } finally {
      setPaymentLoading(false);
    }
  }

  if (!isHydrated) {
    return (
      <PageContainer title="Checkout" description="Loading checkout...">
        <div className="min-h-32" />
      </PageContainer>
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
        Your cart is rechecked on the server before payment. The server creates the Razorpay
        payment order from the verified current price, stock, tax, and configured delivery charge.
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
        <form onSubmit={submitPayment} className="space-y-6">
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

            {sessionStatus === "authenticated" ? (
              <div className="mb-5 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Saved addresses</p>
                    <p className="mt-1 text-xs text-neutral-500">
                      Choose a saved address to fill the checkout form automatically.
                    </p>
                  </div>
                  {savedAddressesLoading ? (
                    <span className="text-xs text-neutral-500">Loading...</span>
                  ) : null}
                </div>

                {savedAddresses.length > 0 ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {savedAddresses.map((saved) => {
                      const selectedSaved = selectedSavedAddressId === saved.id;
                      return (
                        <button
                          key={saved.id}
                          type="button"
                          onClick={() => applySavedAddress(saved)}
                          className={
                            "rounded-lg border p-3 text-left transition-colors " +
                            (selectedSaved
                              ? "border-amber-500 bg-amber-50 ring-1 ring-amber-500 dark:bg-amber-950/20"
                              : "border-neutral-200 bg-white hover:border-amber-400 dark:border-neutral-800 dark:bg-neutral-950")
                          }
                          aria-pressed={selectedSaved}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold">{saved.label}</span>
                            {saved.isDefault ? (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                                Default
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 text-xs font-medium">{saved.fullName} · {saved.phone}</p>
                          <p className="mt-1 text-xs leading-5 text-neutral-500">
                            {saved.house}, {saved.street}
                            {saved.landmark ? ", " + saved.landmark : ""}
                            <br />
                            {saved.city}, {saved.state} - {saved.pincode}
                          </p>
                          <p className="mt-2 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                            {selectedSaved ? "Selected" : "Use this address"}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-neutral-500">
                    No saved addresses yet. Add one from My Account → Saved Addresses.
                  </p>
                )}
              </div>
            ) : null}

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
                <h2 className="text-base font-bold">Payment</h2>
                <p className="text-xs text-neutral-500">
                  Secure payment through Razorpay. Your card or UPI details are handled by Razorpay.
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
              <p className="text-sm font-semibold">Online payment</p>
              <p className="mt-1 text-xs leading-5 text-neutral-500">
                Supports the payment methods enabled for your Razorpay account. The order is
                created from server-verified price and stock, and payment is verified on the server.
              </p>
            </div>

            {paymentError ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/20 dark:text-red-200">
                {paymentError}
              </div>
            ) : null}
          </section>

          <Button
            type="submit"
            size="lg"
            className="w-full sm:w-auto"
            disabled={continueDisabled || paymentLoading}
          >
            {paymentLoading
              ? "Opening secure payment..."
              : paymentOrder
                ? "Retry payment"
                : "Continue to payment"}
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
                {formatINRFromPaise(
                  paymentOrder?.subtotalPaise ?? subtotalPaise
                )}
              </span>
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-neutral-500">Shipping</span>
              <span className="font-semibold">
                {paymentOrder
                  ? formatINRFromPaise(paymentOrder.shippingPaise)
                  : "Calculated securely"}
              </span>
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-neutral-500">Tax</span>
              <span className="font-semibold">
                {paymentOrder
                  ? formatINRFromPaise(paymentOrder.taxPaise)
                  : "Calculated securely"}
              </span>
            </div>
            <div className="mt-4 flex justify-between border-t border-neutral-200 pt-4 text-base dark:border-neutral-800">
              <span className="font-bold">Grand total</span>
              <span className="font-bold">
                {formatINRFromPaise(
                  paymentOrder?.amountPaise ?? subtotalPaise
                )}
              </span>
            </div>
            {paymentOrder ? (
              <p className="mt-3 text-xs text-neutral-500">
                Payment order {paymentOrder.razorpayOrderId} is reserved until{" "}
                {new Date(paymentOrder.reservationExpiresAt).toLocaleTimeString(
                  "en-IN",
                  { hour: "2-digit", minute: "2-digit" }
                )}
                .
              </p>
            ) : null}
          </div>

          <div className="mt-4 flex items-start gap-2 text-xs text-neutral-500">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            Final payment amount and stock are verified on the server before
            the payment order is created.
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
