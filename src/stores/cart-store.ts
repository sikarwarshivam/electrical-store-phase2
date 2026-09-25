import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { CartItem } from "@/types";

export interface CartStoreState {
  items: CartItem[];
  isOpen: boolean;
}

export interface CartStoreActions {
  addItem: (item: Omit<CartItem, "id" | "quantity"> & { id?: string; quantity?: number }) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setCartOpen: (isOpen: boolean) => void;
  syncItem: (variantId: string, data: Partial<Pick<CartItem, "sku" | "title" | "unitPricePaise" | "unitOfSale" | "image" | "brand">>) => void;
  getItemCount: () => number;
  getSubtotalPaise: () => number;
}

export type CartStore = CartStoreState & CartStoreActions;

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (newItem) => {
        const addQty = newItem.quantity ?? 1;

        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) => item.variantId === newItem.variantId
          );

          if (existingIndex >= 0) {
            const updatedItems = [...state.items];
            updatedItems[existingIndex] = {
              ...updatedItems[existingIndex],
              quantity: updatedItems[existingIndex].quantity + addQty,
            };
            return { items: updatedItems, isOpen: true };
          }

          return {
            items: [
              ...state.items,
              {
                ...newItem,
                id:
                  newItem.id ||
                  `cart_${newItem.variantId}_${Date.now()}_${Math.random()
                    .toString(36)
                    .slice(2, 7)}`,
                quantity: addQty,
              },
            ],
            isOpen: true,
          };
        });
      },

      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
        }));
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [], isOpen: false });
      },

      toggleCart: () => {
        set((state) => ({ isOpen: !state.isOpen }));
      },

      setCartOpen: (isOpen) => {
        set({ isOpen });
      },

      syncItem: (variantId, data) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.variantId === variantId ? { ...item, ...data } : item
          ),
        }));
      },

      getItemCount: () =>
        get().items.reduce((total, item) => total + item.quantity, 0),

      getSubtotalPaise: () =>
        get().items.reduce(
          (total, item) => total + item.unitPricePaise * item.quantity,
          0
        ),
    }),
    {
      // v2 intentionally invalidates the old productId/price-based cart format.
      name: "elec_store_cart_v2",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);
