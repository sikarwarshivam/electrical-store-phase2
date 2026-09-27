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

function normalizedPincode(value: string) {
  return value.trim();
}

function findSelfDeliveryDistance(
  pincode: string,
  settings: StoreDeliverySettings
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
  const normalized = normalizedPincode(pincode);

  if (!/^\d{6}$/.test(normalized)) {
    return {
      success: false,
      error: "Enter a valid 6-digit pincode to calculate delivery.",
    };
  }

  const selfServiceable =
    settings.delivery.serviceability.selfDeliveryPincodes.includes(normalized);

  const courierServiceable =
    settings.delivery.serviceability.courierPincodes.includes(normalized);

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

    const mapping = findSelfDeliveryDistance(normalized, settings);

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

    if (!courierServiceable) {
      return {
        success: false,
        error:
          "Local delivery is available for this pincode, but its delivery distance has not been configured yet.",
      };
    }
  }

  return {
    success: true,
    method: "COURIER",
    label: "Courier delivery",
    shippingPaise: settings.delivery.courier.flatFeePaise,
    freeDelivery: settings.delivery.courier.flatFeePaise === 0,
    freeAboveOrderValuePaise:
      settings.delivery.selfDelivery.freeAboveOrderValuePaise,
  };
}

export function calculateDiscountedTaxLines<T extends {
  subtotalPaise: number;
  gstRate?: number;
  taxIncluded: boolean;
}>(
  lines: T[],
  discountPaise: number
) {
  if (lines.length === 0) return [];

  const subtotalPaise = lines.reduce(
    (sum, line) => sum + line.subtotalPaise,
    0
  );
  const safeDiscount = Math.min(Math.max(discountPaise, 0), subtotalPaise);

  let allocated = 0;

  return lines.map((line, index) => {
    let lineDiscount = 0;

    if (safeDiscount > 0 && subtotalPaise > 0) {
      if (index === lines.length - 1) {
        lineDiscount = safeDiscount - allocated;
      } else {
        lineDiscount = Math.floor(
          (safeDiscount * line.subtotalPaise) / subtotalPaise
        );
        allocated += lineDiscount;
      }
    }

    const taxablePaise = Math.max(0, line.subtotalPaise - lineDiscount);
    const rate = line.gstRate ?? 0;

    if (!rate || rate <= 0) {
      return {
        ...line,
        discountPaise: lineDiscount,
        taxablePaise,
        taxPaise: 0,
        taxIncludedPaise: 0,
        taxAddedPaise: 0,
        lineTotalPaise: taxablePaise,
      };
    }

    if (line.taxIncluded) {
      const taxPaise = Math.round((taxablePaise * rate) / (100 + rate));
      return {
        ...line,
        discountPaise: lineDiscount,
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
      discountPaise: lineDiscount,
      taxablePaise,
      taxPaise,
      taxIncludedPaise: 0,
      taxAddedPaise: taxPaise,
      lineTotalPaise: taxablePaise + taxPaise,
    };
  });
}
