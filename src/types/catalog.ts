/**
 * Phase 2 catalog domain types.
 *
 * These types describe the shape exchanged between the server/domain layer
 * and the admin/store UI. Money is represented in paise internally.
 */

export type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type ProductType = "SIMPLE" | "VARIABLE";
export type VariantStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export type UnitOfSale =
  | "PIECE"
  | "METER"
  | "ROLL"
  | "PACK"
  | "SET"
  | "BOX"
  | "PAIR"
  | "KG"
  | "GRAM"
  | "LITER"
  | "ML"
  | "OTHER";

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export interface ProductImage {
  url: string;
  publicId?: string;
  alt: string;
  sortOrder: number;
  isPrimary: boolean;
}

export type AttributePrimitive = string | number | boolean;
export type AttributeValue = AttributePrimitive | string[];

export interface ProductAttribute {
  key: string;
  label: string;
  value: AttributeValue;
  unit?: string;
  group?: string;
  sortOrder: number;
}

export interface VariantOption {
  name: string;
  value: string;
}

export interface TaxConfig {
  hsnCode?: string;
  gstRate?: number;
  isGstInclusive: boolean;
}
