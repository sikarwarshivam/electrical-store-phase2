/**
 * Shared server-side checkout pricing helpers.
 *
 * These helpers keep the checkout quote and final payment-order creation
 * on the same configured pricing rules.
 */

export function parseConfiguredPaise(name: string, fallback = 0) {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;

  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(name + " must be a non-negative integer in paise.");
  }

  return value;
}

export function calculateTax(
  subtotalPaise: number,
  gstRate: number | undefined,
  isGstInclusive: boolean
) {
  if (!gstRate || gstRate <= 0) {
    return {
      taxPaise: 0,
      taxIncludedPaise: 0,
      taxAddedPaise: 0,
    };
  }

  if (isGstInclusive) {
    const taxPaise = Math.round(
      (subtotalPaise * gstRate) / (100 + gstRate)
    );

    return {
      taxPaise,
      taxIncludedPaise: taxPaise,
      taxAddedPaise: 0,
    };
  }

  const taxPaise = Math.round((subtotalPaise * gstRate) / 100);

  return {
    taxPaise,
    taxIncludedPaise: 0,
    taxAddedPaise: taxPaise,
  };
}

export function calculateShipping(subtotalPaise: number) {
  const configuredShippingPaise = parseConfiguredPaise(
    "SHIPPING_FLAT_RATE_PAISE",
    0
  );
  const freeShippingThresholdPaise = parseConfiguredPaise(
    "SHIPPING_FREE_THRESHOLD_PAISE",
    0
  );

  const qualifiesForFreeShipping =
    freeShippingThresholdPaise > 0 &&
    subtotalPaise >= freeShippingThresholdPaise;

  return {
    shippingPaise: qualifiesForFreeShipping ? 0 : configuredShippingPaise,
    freeShippingThresholdPaise,
  };
}
