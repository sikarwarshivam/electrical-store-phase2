"use server";

import mongoose from "mongoose";
import { reconcileCartAction } from "@/actions/cart";
import { calculateCouponDiscount } from "@/lib/order-commerce";
import {
  calculateDeliveryQuote,
  calculateDiscountedTaxLines,
} from "@/lib/checkout-pricing";
import { getStoreSettings } from "@/actions/store-settings";
import { Product } from "@/models/Product";
import { checkoutQuoteSchema } from "@/schemas/order";

export type CheckoutQuoteLine = {
  variantId: string;
  title?: string;
  quantity: number;
  unitPricePaise: number;
  mrpPaise: number;
  subtotalPaise: number;
  discountPaise: number;
  taxablePaise: number;
  gstRate?: number;
  taxPaise: number;
  taxIncludedPaise: number;
  taxAddedPaise: number;
  taxIncluded: boolean;
  lineTotalPaise: number;
};

export type CheckoutQuoteResult =
  | {
      success: true;
      lines: CheckoutQuoteLine[];
      subtotalPaise: number;
      mrpSubtotalPaise: number;
      productSavingsPaise: number;
      discountPaise: number;
      couponCode?: string;
      deliveryMethod: "SELF_DELIVERY" | "COURIER";
      deliveryLabel: string;
      deliveryDistanceKm?: number;
      shippingPaise: number;
      freeDelivery: boolean;
      freeAboveOrderValuePaise: number;
      taxPaise: number;
      taxIncludedPaise: number;
      taxAddedPaise: number;
      grandTotalPaise: number;
      currency: "INR";
    }
  | {
      success: false;
      error: string;
    };

export async function getCheckoutQuoteAction(
  input: unknown
): Promise<CheckoutQuoteResult> {
  const parsed = checkoutQuoteSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Enter a valid delivery pincode and review your cart.",
    };
  }

  try {
    const reconciliation = await reconcileCartAction({
      items: parsed.data.items,
    });

    if (
      reconciliation.issues.length > 0 ||
      reconciliation.lines.length !== parsed.data.items.length ||
      reconciliation.lines.some(
        (line) =>
          !line.purchasable ||
          !line.productId ||
          line.unitPricePaise === undefined ||
          line.mrpPaise === undefined
      )
    ) {
      return {
        success: false,
        error:
          reconciliation.issues[0]?.message ||
          "Your cart changed. Please return to the cart and review it.",
      };
    }

    const productIds = reconciliation.lines.map(
      (line) => new mongoose.Types.ObjectId(line.productId!)
    );

    const products = await Product.find({ _id: { $in: productIds } })
      .select("_id tax")
      .lean();
    const productMap = new Map(
      products.map((product) => [String(product._id), product])
    );

    const baseLines = reconciliation.lines.map((line) => {
      const product = productMap.get(line.productId!);

      return {
        variantId: line.variantId,
        title: line.title,
        quantity: line.quantity,
        unitPricePaise: line.unitPricePaise!,
        mrpPaise: line.mrpPaise!,
        subtotalPaise: line.unitPricePaise! * line.quantity,
        gstRate: product?.tax?.gstRate,
        taxIncluded: product?.tax?.isGstInclusive ?? true,
      };
    });

    const subtotalPaise = baseLines.reduce(
      (sum, line) => sum + line.subtotalPaise,
      0
    );
    const mrpSubtotalPaise = baseLines.reduce(
      (sum, line) => sum + line.mrpPaise * line.quantity,
      0
    );
    const productSavingsPaise = Math.max(
      0,
      mrpSubtotalPaise - subtotalPaise
    );

    let discountPaise = 0;
    let couponCode: string | undefined;

    if (parsed.data.couponCode) {
      const coupon = await calculateCouponDiscount(
        parsed.data.couponCode,
        subtotalPaise
      );
      if (!coupon.success) {
        return { success: false, error: coupon.error };
      }
      discountPaise = coupon.discountPaise;
      couponCode = coupon.code;
    }

    const qualifyingOrderValuePaise = Math.max(
      0,
      subtotalPaise - discountPaise
    );
    const settings = await getStoreSettings();
    const delivery = calculateDeliveryQuote(
      settings,
      parsed.data.pincode,
      qualifyingOrderValuePaise
    );

    if (!delivery.success) {
      return delivery;
    }

    const pricedLines = calculateDiscountedTaxLines(
      baseLines,
      discountPaise
    );

    const taxPaise = pricedLines.reduce(
      (sum, line) => sum + line.taxPaise,
      0
    );
    const taxIncludedPaise = pricedLines.reduce(
      (sum, line) => sum + line.taxIncludedPaise,
      0
    );
    const taxAddedPaise = pricedLines.reduce(
      (sum, line) => sum + line.taxAddedPaise,
      0
    );
    const grandTotalPaise =
      subtotalPaise -
      discountPaise +
      delivery.shippingPaise +
      taxAddedPaise;

    if (grandTotalPaise <= 0) {
      return {
        success: false,
        error: "Online payment requires a positive order total.",
      };
    }

    return {
      success: true,
      lines: pricedLines.map((line) => ({
        variantId: line.variantId,
        title: line.title,
        quantity: line.quantity,
        unitPricePaise: line.unitPricePaise,
        mrpPaise: line.mrpPaise,
        subtotalPaise: line.subtotalPaise,
        discountPaise: line.discountPaise,
        taxablePaise: line.taxablePaise,
        gstRate: line.gstRate,
        taxPaise: line.taxPaise,
        taxIncludedPaise: line.taxIncludedPaise,
        taxAddedPaise: line.taxAddedPaise,
        taxIncluded: line.taxIncluded,
        lineTotalPaise: line.lineTotalPaise,
      })),
      subtotalPaise,
      mrpSubtotalPaise,
      productSavingsPaise,
      discountPaise,
      couponCode,
      deliveryMethod: delivery.method,
      deliveryLabel: delivery.label,
      deliveryDistanceKm: delivery.distanceKm,
      shippingPaise: delivery.shippingPaise,
      freeDelivery: delivery.freeDelivery,
      freeAboveOrderValuePaise: delivery.freeAboveOrderValuePaise,
      taxPaise,
      taxIncludedPaise,
      taxAddedPaise,
      grandTotalPaise,
      currency: "INR",
    };
  } catch {
    return {
      success: false,
      error: "Unable to calculate the checkout total right now.",
    };
  }
}
