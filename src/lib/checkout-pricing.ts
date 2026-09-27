type StoreDeliverySettings = {
  delivery: {
    selfDelivery: {
      freeAboveOrderValuePaise: number;
      distanceSlabs: Array<{
        fromKm: number;
        toKm: number;
        feePaise: number;
      }>;
    };
    courier: {
      flatFeePaise: number;
    };
    serviceability: {
      selfDeliveryPincodes: string[];
      selfDeliveryPincodeDistances: Array<{
        pincode: string;
        distanceKm: number;
      }>;
      courierPincodes: string[];
    };
  };
};

export type DeliveryMethod = "SELF_DELIVERY" | "COURIER";

export type DeliveryQuote =
  | {
      success: true;
      method: DeliveryMethod;
      label: string;
      shippingPaise: number;
      distanceKm?: number;
      freeDelivery: boolean;
      freeAboveOrderValuePaise: number;
    }
  | {
      success: false;
      error: string;
    };

export type TaxableLine = {
  subtotalPaise: number;
  gstRate?: number;
  taxIncluded: boolean;
};

function findDistanceMapping(
  settings: StoreDeliverySettings,
  pincode: string
) {
  return settings.delivery.serviceability.selfDeliveryPincodeDistances.find(
    (entry) => entry.pincode === pincode
  );
}

function findDistanceSlab(
  distanceKm: number,
  slabs: Array<{ fromKm: number; toKm: number; feePaise: number }>
) {
  for (let index = 0; index < slabs.length; index += 1) {
    const slab = slabs[index];
    const isLast = index === slabs.length - 1;

    if (
      distanceKm >= slab.fromKm &&
      (distanceKm < slab.toKm || (isLast && distanceKm <= slab.toKm))
    ) {
      return slab;
    }
  }

  return null;
}

export function calculateDeliveryQuote(
  settings: StoreDeliverySettings,
  pincode: string,
  qualifyingOrderValuePaise: number
): DeliveryQuote {
  const normalizedPincode = pincode.trim();

  if (!/^\d{6}$/.test(normalizedPincode)) {
    return {
      success: false,
      error: "Enter a valid 6-digit pincode to calculate delivery.",
    };
  }

  const selfServiceable =
    settings.delivery.serviceability.selfDeliveryPincodes.includes(
      normalizedPincode
    );
  const courierServiceable =
    settings.delivery.serviceability.courierPincodes.includes(
      normalizedPincode
    );

  if (!selfServiceable && !courierServiceable) {
    return {
      success: false,
      error: "Delivery is currently unavailable for this pincode.",
    };
  }

  if (selfServiceable) {
    const freeAbove =
      settings.delivery.selfDelivery.freeAboveOrderValuePaise;

    if (freeAbove > 0 && qualifyingOrderValuePaise >= freeAbove) {
      return {
        success: true,
        method: "SELF_DELIVERY",
        label: "Local delivery",
        shippingPaise: 0,
        freeDelivery: true,
        freeAboveOrderValuePaise: freeAbove,
      };
    }

    const mapping = findDistanceMapping(settings, normalizedPincode);

    if (mapping) {
      const slab = findDistanceSlab(
        mapping.distanceKm,
        settings.delivery.selfDelivery.distanceSlabs
      );

      if (slab) {
        return {
          success: true,
          method: "SELF_DELIVERY",
          label: "Local delivery",
          shippingPaise: slab.feePaise,
          distanceKm: mapping.distanceKm,
          freeDelivery: slab.feePaise === 0,
          freeAboveOrderValuePaise: freeAbove,
        };
      }
    }

    // A pincode can be eligible for courier as a fallback when local-distance
    // pricing is not configured or is outside the configured local range.
    if (!courierServiceable) {
      return {
        success: false,
        error:
          "Local delivery is available for this pincode, but its delivery distance is not configured for the current pricing slabs.",
      };
    }
  }

  const courierFee = settings.delivery.courier.flatFeePaise;
  return {
    success: true,
    method: "COURIER",
    label: "Courier delivery",
    shippingPaise: courierFee,
    freeDelivery: courierFee === 0,
    freeAboveOrderValuePaise:
      settings.delivery.selfDelivery.freeAboveOrderValuePaise,
  };
}

export function calculateDiscountedTaxLines<T extends TaxableLine>(
  lines: T[],
  discountPaise: number
) {
  const subtotalPaise = lines.reduce(
    (sum, line) => sum + line.subtotalPaise,
    0
  );
  const safeDiscount = Math.min(Math.max(discountPaise, 0), subtotalPaise);
  let allocatedDiscountPaise = 0;

  return lines.map((line, index) => {
    let lineDiscountPaise = 0;

    if (safeDiscount > 0 && subtotalPaise > 0) {
      if (index === lines.length - 1) {
        lineDiscountPaise = safeDiscount - allocatedDiscountPaise;
      } else {
        lineDiscountPaise = Math.floor(
          (safeDiscount * line.subtotalPaise) / subtotalPaise
        );
        allocatedDiscountPaise += lineDiscountPaise;
      }
    }

    const taxablePaise = Math.max(
      0,
      line.subtotalPaise - lineDiscountPaise
    );
    const rate = line.gstRate ?? 0;

    if (rate <= 0) {
      return {
        ...line,
        discountPaise: lineDiscountPaise,
        taxablePaise,
        taxPaise: 0,
        taxIncludedPaise: 0,
        taxAddedPaise: 0,
        lineTotalPaise: taxablePaise,
      };
    }

    if (line.taxIncluded) {
      const taxPaise = Math.round(
        (taxablePaise * rate) / (100 + rate)
      );
      return {
        ...line,
        discountPaise: lineDiscountPaise,
        taxablePaise,
        taxPaise,
        taxIncludedPaise: taxPaise,
        taxAddedPaise: 0,
        lineTotalPaise: taxablePaise,
      };
    }

    const taxPaise = Math.round((taxablePaise * rate) / 100);
    return {
      ...line,
      discountPaise: lineDiscountPaise,
      taxablePaise,
      taxPaise,
      taxIncludedPaise: 0,
      taxAddedPaise: taxPaise,
      lineTotalPaise: taxablePaise + taxPaise,
    };
  });
}
