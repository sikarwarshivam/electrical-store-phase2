/**
 * Centralized Site Configuration
 * 
 * Provides neutral placeholders for all client-specific metadata and branding.
 * Phase 1 architecture ensures all store metadata is retrieved from this single source of truth.
 */
export const siteConfig = {
  name: "Electrical Retail Store",
  tagline: "Quality Electrical Products, Cables, Switchgear & Accessories",
  description:
    "Production-oriented retail e-commerce platform for electrical supplies, wiring, lighting, appliances, and industrial electrical hardware.",
  
  // Explicit client placeholders (strictly no realistic fake data)
  contact: {
    email: "[CLIENT_EMAIL]",
    phone: "[CLIENT_PHONE]",
    address: "[CLIENT_ADDRESS]",
    supportHours: "Mon - Sat: 9:00 AM - 8:00 PM IST",
  },

  // Indian currency and locale settings
  currency: {
    code: "INR",
    symbol: "₹",
    locale: "en-IN",
  },

  // Navigation Links
  mainNav: [
    { title: "Home", href: "/" },
    { title: "Products", href: "/#products" },
    { title: "Categories", href: "/#categories" },
    { title: "About Us", href: "/#about" },
    { title: "Contact", href: "/#contact" },
  ],

  // Admin Navigation Links
  adminNav: [
    { title: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
    { title: "Products", href: "/admin/products", icon: "Package" },
    { title: "Categories", href: "/admin/categories", icon: "Layers" },
    { title: "Brands", href: "/admin/brands", icon: "BadgeCheck" },
    { title: "Orders", href: "/admin/orders", icon: "ShoppingCart" },
    { title: "Inventory", href: "/admin/inventory", icon: "Boxes" },
    { title: "Customers", href: "/admin/customers", icon: "Users" },
    { title: "Coupons", href: "/admin/coupons", icon: "Tag" },
    { title: "Settings", href: "/admin/settings", icon: "Settings" },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
