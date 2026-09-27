"use server";

import mongoose from "mongoose";
import { reconcileCartAction, type CartReconcileLine } from "@/actions/cart";
import {
  calculateCouponDiscount,
} from "@/lib/order-commerce";
import {
  calculateShipping,
  calculateTax,
} from "@/lib/checkout-pricing";
import { Product } from "@/models/Product";
import { checkoutQuoteSchema } from "@/schemas/order";

export type CheckoutQuoteLine = {
  variantId: string;
  title?: string;
  quantity: number;
  unitPricePaise: number;
  mrpPaise: number;
  subtotalPaise: number;
  gstRate?: number;
  taxPaise: number;
  taxIncludedPaise: number;
  taxAddedPaise: number;
  taxIncluded: boolean;
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
      shippingPaise: number;
      freeShippingThresholdPaise: number;
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
      error: "Unable to calculate the checkout total. Please refresh and try again.",
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

    const lines: CheckoutQuoteLine[] = reconciliation.lines.map(
      (line: CartReconcileLine) => {
        const product = productMap.get(line.productId!);
        const subtotalPaise = line.unitPricePaise! * line.quantity;
        const tax = calculateTax(
          subtotalPaise,
          product?.tax?.gstRate,
          product?.tax?.isGstInclusive ?? true
        );

        return {
          variantId: line.variantId,
          title: line.title,
          quantity: line.quantity,
          unitPricePaise: line.unitPricePaise!,
          mrpPaise: line.mrpPaise!,
          subtotalPaise,
          gstRate: product?.tax?.gstRate,
          taxPaise: tax.taxPaise,
          taxIncludedPaise: tax.taxIncludedPaise,
          taxAddedPaise: tax.taxAddedPaise,
          taxIncluded: product?.tax?.isGstInclusive ?? true,
        };
      }
    );

    const subtotalPaise = lines.reduce(
      (total, line) => total + line.subtotalPaise,
      0
    );
    const mrpSubtotalPaise = lines.reduce(
      (total, line) => total + line.mrpPaise * line.quantity,
      0
    );
    const productSavingsPaise = Math.max(
      0,
      mrpSubtotalPaise - subtotalPaise
    );

    let discountPaise = 0;
    let appliedCouponCode: string | undefined;

    if (parsed.data.couponCode) {
      const couponResult = await calculateCouponDiscount(
        parsed.data.couponCode,
        subtotalPaise
      );

      if (!couponResult.success) {
        return {
          success: false,
          error: couponResult.error,
        };
      }

      discountPaise = couponResult.discountPaise;
      appliedCouponCode = couponResult.code;
    }

    const shipping = calculateShipping(subtotalPaise);

    const taxPaise = lines.reduce(
      (total, line) => total + line.taxPaise,
      0
    );
    const taxIncludedPaise = lines.reduce(
      (total, line) => total + line.taxIncludedPaise,
      0
    );
    const taxAddedPaise = lines.reduce(
      (total, line) => total + line.taxAddedPaise,
      0
    );

    const grandTotalPaise =
      subtotalPaise -
      discountPaise +
      shipping.shippingPaise +
      taxAddedPaise;

    if (grandTotalPaise <= 0) {
      return {
        success: false,
        error: "Online payment requires a positive order total.",
      };
    }

    return {
      success: true,
      lines,
      subtotalPaise,
      mrpSubtotalPaise,
      productSavingsPaise,
      discountPaise,
      couponCode: appliedCouponCode,
      shippingPaise: shipping.shippingPaise,
      freeShippingThresholdPaise: shipping.freeShippingThresholdPaise,
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
