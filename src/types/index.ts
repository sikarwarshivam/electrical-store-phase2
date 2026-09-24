/**
 * Core Domain Type Definitions
 */

export type UserRole = "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Cart items identify a purchasable SKU/variant, not merely a product.
 * Prices are stored in integer paise to avoid floating point money errors.
 */
export interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  sku: string;
  title: string;
  unitPricePaise: number;
  quantity: number;
  unitOfSale: string;
  image?: string;
  brand?: string;
}
