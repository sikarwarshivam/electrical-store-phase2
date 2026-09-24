import { create } from "zustand";

interface UIStoreState {
  isAdminSidebarOpen: boolean;
  isMobileMenuOpen: boolean;
  isSearchOpen: boolean;
}

interface UIStoreActions {
  toggleAdminSidebar: () => void;
  setAdminSidebarOpen: (isOpen: boolean) => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (isOpen: boolean) => void;
  toggleSearch: () => void;
  setSearchOpen: (isOpen: boolean) => void;
}

export type UIStore = UIStoreState & UIStoreActions;

export const useUIStore = create<UIStore>((set) => ({
  isAdminSidebarOpen: true,
  isMobileMenuOpen: false,
  isSearchOpen: false,

  toggleAdminSidebar: () => {
    set((state) => ({ isAdminSidebarOpen: !state.isAdminSidebarOpen }));
  },
  setAdminSidebarOpen: (isOpen) => {
    set({ isAdminSidebarOpen: isOpen });
  },

  toggleMobileMenu: () => {
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen }));
  },
  setMobileMenuOpen: (isOpen) => {
    set({ isMobileMenuOpen: isOpen });
  },

  toggleSearch: () => {
    set((state) => ({ isSearchOpen: !state.isSearchOpen }));
  },
  setSearchOpen: (isOpen) => {
    set({ isSearchOpen: isOpen });
  },
}));
