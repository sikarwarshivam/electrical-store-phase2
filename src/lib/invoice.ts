import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { getStateCode, splitGst } from "@/lib/gst";
import { InvoiceCounter } from "@/models/InvoiceCounter";
import { Order, type IOrderInvoice } from "@/models/Order";
import {
  DEFAULT_STORE_TAX_PROFILE,
  StoreTaxProfile,
} from "@/models/StoreTaxProfile";

export type InvoiceResult =
  | { success: true; invoice: IOrderInvoice }
  | {
      success: false;
      code: "NOT_CONFIGURED" | "INVALID_TAX_DATA" | "NOT_FOUND" | "NOT_READY";
      error: string;
    };

function indiaDateParts(date: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
  };
}

export function getIndianFinancialYear(date = new Date()) {
  const { year, month } = indiaDateParts(date);
  const startYear = month >= 4 ? year : year - 1;
  return startYear + "-" + String(startYear + 1).slice(-2);
}

async function nextInvoiceNumber(financialYear: string, prefix: string) {
  const counter = await InvoiceCounter.findOneAndUpdate(
    { financialYear },
    { $inc: { sequence: 1 } },
    {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true,
    }
  );

  if (!counter) {
    throw new Error("Unable to allocate an invoice number.");
  }

  const invoiceNumber =
    prefix.toUpperCase() +
    "/" +
    financialYear.slice(2) +
    "/" +
    String(counter.sequence).padStart(6, "0");

  if (invoiceNumber.length > 16) {
    throw new Error(
      "Invoice number is too long. Use a shorter invoice prefix."
    );
  }

  return invoiceNumber;
}

function normalizedGstin(value?: string) {
  const gstin = value?.trim().toUpperCase();
  return gstin || undefined;
}

function validGstin(value?: string) {
  return !!value && /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(value);
}

export async function ensureInvoiceForOrder(
  orderId: string
): Promise<InvoiceResult> {
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return { success: false, code: "NOT_FOUND", error: "Order not found." };
  }

  await connectToDatabase();

  const order = await Order.findById(orderId);
  if (!order) {
    return { success: false, code: "NOT_FOUND", error: "Order not found." };
  }

  const paidStatuses = [
    "PLACED",
    "CONFIRMED",
    "PACKED",
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
  ] as const;

  if (!paidStatuses.includes(order.status as (typeof paidStatuses)[number]) ||
      order.payment.status !== "CAPTURED") {
    return {
      success: false,
      code: "NOT_READY",
      error: "An invoice is available only for successfully paid orders.",
    };
  }

  if (order.invoice) {
    return { success: true, invoice: order.invoice };
  }

  const storedProfile = await StoreTaxProfile.findOne({ key: "default" }).lean();
  const profile = storedProfile
    ? { ...DEFAULT_STORE_TAX_PROFILE, ...storedProfile }
    : DEFAULT_STORE_TAX_PROFILE;

  if (
    !profile.legalName ||
    !profile.addressLine1 ||
    !profile.city ||
    !profile.state ||
    !profile.stateCode
  ) {
    return {
      success: false,
      code: "NOT_CONFIGURED",
      error:
        "Complete the store GST / invoicing business profile before issuing an invoice.",
    };
  }

  const registered = order.pricing.gstRegistered === true;
  const sellerGstin = normalizedGstin(profile.gstin);

  if (registered) {
    if (!validGstin(sellerGstin)) {
      return {
        success: false,
        code: "INVALID_TAX_DATA",
        error: "The store GSTIN is not configured correctly.",
      };
    }

    const missingTaxData = order.items.find(
      (item) => !item.hsnCode || item.gstRate === undefined
    );

    if (missingTaxData) {
      return {
        success: false,
        code: "INVALID_TAX_DATA",
        error:
          "One or more order items are missing HSN / GST data. Update the product tax configuration before issuing the invoice.",
      };
    }
  }

  const buyerStateCode = getStateCode(order.shippingAddress.state);

  if (registered && !buyerStateCode) {
    return {
      success: false,
      code: "INVALID_TAX_DATA",
      error:
        "The customer's state is not recognized for GST place-of-supply calculation.",
    };
  }

  const buyerGstin = normalizedGstin(order.customer.gstin);
  if (registered && buyerGstin && !validGstin(buyerGstin)) {
    return {
      success: false,
      code: "INVALID_TAX_DATA",
      error: "The buyer GSTIN is not valid.",
    };
  }

  if (
    registered &&
    buyerGstin &&
    buyerStateCode &&
    buyerGstin.slice(0, 2) !== buyerStateCode
  ) {
    return {
      success: false,
      code: "INVALID_TAX_DATA",
      error: "The buyer GSTIN state code does not match the delivery state.",
    };
  }

  const financialYear = getIndianFinancialYear(order.createdAt);
  const invoiceNumber = await nextInvoiceNumber(
    financialYear,
    profile.invoicePrefix || "INV"
  );

  const lines = order.items.map((item) => {
    const taxPaise = registered ? item.taxPaise : 0;
    const split = registered
      ? splitGst(taxPaise, profile.stateCode, buyerStateCode)
      : {
          cgstPaise: 0,
          sgstPaise: 0,
          igstPaise: 0,
        };

    return {
      sku: item.sku,
      productName: item.productName,
      variantTitle: item.variantTitle,
      hsnCode: registered ? item.hsnCode : undefined,
      quantity: item.quantity,
      unitOfSale: item.unitOfSale,
      unitPricePaise: item.unitPricePaise,
      subtotalPaise: item.subtotalPaise,
      discountPaise: item.discountPaise,
      taxablePaise: registered
        ? item.taxablePaise
        : item.subtotalPaise - item.discountPaise,
      gstRate: registered ? item.gstRate : undefined,
      taxPaise,
      cgstPaise: split.cgstPaise,
      sgstPaise: split.sgstPaise,
      igstPaise: split.igstPaise,
      lineTotalPaise: registered
        ? item.lineTotalPaise
        : item.subtotalPaise - item.discountPaise,
    };
  });

  const invoice: IOrderInvoice = {
    documentType: registered ? "TAX_INVOICE" : "SALES_RECEIPT",
    invoiceNumber,
    financialYear,
    issuedAt: new Date(),
    supplier: {
      legalName: profile.legalName,
      tradeName: profile.tradeName || undefined,
      gstin: registered ? sellerGstin : undefined,
      addressLine1: profile.addressLine1,
      addressLine2: profile.addressLine2 || undefined,
      city: profile.city,
      state: profile.state,
      stateCode: profile.stateCode,
      phone: profile.phone || undefined,
      email: profile.email || undefined,
    },
    buyer: {
      name: order.customer.name,
      phone: order.customer.phone,
      email: order.customer.email,
      gstin: buyerGstin,
      address: order.shippingAddress,
    },
    placeOfSupply: {
      state: order.shippingAddress.state,
      stateCode: buyerStateCode,
    },
    reverseCharge: registered && profile.reverseChargeApplicable,
    deliveryMethod: order.pricing.deliveryMethod || "COURIER",
    shippingPaise: order.pricing.shippingPaise,
    taxPaise: registered ? order.pricing.taxPaise : 0,
    taxIncludedPaise: registered ? order.pricing.taxIncludedPaise : 0,
    taxAddedPaise: registered ? order.pricing.taxAddedPaise : 0,
    grandTotalPaise: order.pricing.grandTotalPaise,
    lines,
  };

  const updated = await Order.findOneAndUpdate(
    { _id: order._id, invoice: { $exists: false } },
    { $set: { invoice } },
    { returnDocument: "after" }
  );

  if (updated?.invoice) {
    return { success: true, invoice: updated.invoice };
  }

  const existing = await Order.findById(order._id).lean();
  if (existing?.invoice) {
    return { success: true, invoice: existing.invoice };
  }

  return {
    success: false,
    code: "INVALID_TAX_DATA",
    error: "Invoice could not be issued. Please try again.",
  };
}

export async function getInvoiceForCustomer(
  orderNumber: string,
  userId: string
): Promise<InvoiceResult> {
  if (
    !mongoose.Types.ObjectId.isValid(userId) ||
    !orderNumber.trim()
  ) {
    return { success: false, code: "NOT_FOUND", error: "Order not found." };
  }

  await connectToDatabase();

  const order = await Order.findOne({
    orderNumber: orderNumber.trim().toUpperCase(),
    "customer.userId": new mongoose.Types.ObjectId(userId),
  }).lean();

  if (!order) {
    return { success: false, code: "NOT_FOUND", error: "Order not found." };
  }

  return ensureInvoiceForOrder(order._id.toString());
}
