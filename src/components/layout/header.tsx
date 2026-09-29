"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  ChevronDown,
  Grid2X2,
  Home,
  LogOut,
  Menu,
  Package,
  ShoppingCart,
  ShieldAlert,
  User,
  X,
  Zap,
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUIStore } from "@/stores/ui-store";
import { PredictiveSearch } from "@/components/store/predictive-search";

const primaryNav = [
  { title: "Products", href: "/products" },
  { title: "Categories", href: "/categories" },
  { title: "Deals", href: "/campaigns" },
] as const;

function navLinkClasses(active: boolean) {
  return [
    "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
    active
      ? "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
      : "text-neutral-600 hover:bg-neutral-50 hover:text-amber-700 dark:text-neutral-300 dark:hover:bg-neutral-900 dark:hover:text-amber-400",
  ].join(" ");
}

export function Header() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { itemCount } = useCart();
  const { isMobileMenuOpen, toggleMobileMenu, setMobileMenuOpen } = useUIStore();
  const [isAccountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  const user = session?.user;
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  useEffect(() => {
    if (!isAccountOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!accountRef.current?.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAccountOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAccountOpen]);

  const isActive = (href: string) =>
    href === "/campaigns"
      ? pathname.startsWith("/campaigns")
      : pathname === href || pathname.startsWith(`${href}/`);

  function closeMenus() {
    setAccountOpen(false);
    setMobileMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200/80 bg-white/95 shadow-[0_1px_8px_rgba(15,23,42,0.04)] backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/95 dark:shadow-none">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:gap-5 lg:px-8">
        <Link
          href="/"
          onClick={closeMenus}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-600 transition-colors hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:border-amber-800 dark:hover:bg-amber-950/30 dark:hover:text-amber-300"
          aria-label="Home"
          title="Home"
        >
          <Home className="h-4 w-4" />
        </Link>

        <Link
          href="/"
          onClick={closeMenus}
          className="flex min-w-0 shrink-0 items-center gap-2.5"
          aria-label={`${siteConfig.name} home`}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-600 text-white shadow-sm">
            <Zap className="h-5 w-5" />
          </div>
          <div className="hidden min-[380px]:flex min-w-0 flex-col">
            <span className="truncate text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-base">
              {siteConfig.name}
            </span>
            <span className="hidden text-[10px] text-neutral-500 lg:block">
              Electrical supplies &amp; commercial essentials
            </span>
          </div>
        </Link>

        <div className="hidden min-w-0 flex-1 md:flex">
          <PredictiveSearch />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            href="/track-order"
            className="hidden rounded-md px-2.5 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-amber-700 lg:inline-flex dark:text-neutral-300 dark:hover:bg-neutral-900 dark:hover:text-amber-400"
          >
            Track Order
          </Link>

          <div className="relative" ref={accountRef}>
            {status === "loading" ? (
              <div className="h-9 w-24 animate-pulse rounded-md bg-neutral-100 dark:bg-neutral-900" />
            ) : user ? (
              <>
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={isAccountOpen}
                  onClick={() => setAccountOpen((open) => !open)}
                  className="inline-flex h-9 max-w-44 items-center gap-2 rounded-md border border-neutral-200 bg-white px-2.5 text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:bg-neutral-900 dark:hover:text-amber-400"
                >
                  <User className="h-4 w-4 shrink-0" />
                  <span className="hidden max-w-24 truncate text-sm font-semibold sm:inline">
                    {user.name || user.email}
                  </span>
                  <ChevronDown
                    className={`hidden h-3.5 w-3.5 transition-transform sm:block ${isAccountOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isAccountOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+0.5rem)] w-64 overflow-hidden rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl shadow-neutral-900/10 dark:border-neutral-800 dark:bg-neutral-950"
                  >
                    <div className="border-b border-neutral-100 px-3 pb-2.5 pt-2 dark:border-neutral-800">
                      <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {user.name || "Account"}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-neutral-500">
                        {user.email}
                      </p>
                      <Badge
                        variant={isAdmin ? "warning" : "secondary"}
                        className="mt-2 px-1.5 py-0 text-[10px]"
                      >
                        {user.role}
                      </Badge>
                    </div>

                    {isAdmin ? (
                      <Link
                        role="menuitem"
                        href="/admin"
                        onClick={closeMenus}
                        className="mt-1 flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/30"
                      >
                        <ShieldAlert className="h-4 w-4" />
                        Admin Portal
                      </Link>
                    ) : null}

                    {!isAdmin ? (
                      <>
                        <Link
                          role="menuitem"
                          href="/account"
                          onClick={closeMenus}
                          className="mt-1 flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-900"
                        >
                          <User className="h-4 w-4 text-neutral-400" />
                          My Account
                        </Link>
                        <Link
                          role="menuitem"
                          href="/account/orders"
                          onClick={closeMenus}
                          className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-900"
                        >
                          <Package className="h-4 w-4 text-neutral-400" />
                          My Orders
                        </Link>
                      </>
                    ) : null}

                    <Link
                      role="menuitem"
                      href="/track-order"
                      onClick={closeMenus}
                      className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-900"
                    >
                      <Package className="h-4 w-4 text-neutral-400" />
                      Track Order
                    </Link>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="mt-1 flex w-full items-center gap-2.5 rounded-md border-t border-neutral-100 px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:border-neutral-800 dark:hover:bg-red-950/20"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <Link href="/login" onClick={closeMenus}>
                <Button size="sm" className="px-3">
                  <User className="mr-1.5 h-4 w-4" />
                  <span>Sign In</span>
                </Button>
              </Link>
            )}
          </div>

          <Link
            href="/cart"
            onClick={closeMenus}
            className="relative inline-flex h-9 items-center gap-2 rounded-md border border-neutral-200 bg-white px-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-amber-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200 dark:hover:bg-neutral-900 dark:hover:text-amber-400"
            aria-label={`Shopping Cart, ${itemCount} items`}
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
            {itemCount > 0 ? (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-600 px-1 text-[10px] font-bold leading-none text-white">
                {itemCount}
              </span>
            ) : null}
          </Link>

          <button
            type="button"
            onClick={() => {
              setAccountOpen(false);
              toggleMobileMenu();
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-amber-700 md:hidden dark:border-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-900 dark:hover:text-amber-400"
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="border-t border-neutral-100 dark:border-neutral-900">
        <div className="mx-auto hidden h-11 max-w-7xl items-center justify-between px-4 md:flex sm:px-6 lg:px-8">
          <nav aria-label="Store navigation" className="flex items-center gap-1">
            <Link
              href="/categories"
              className={navLinkClasses(pathname.startsWith("/categories"))}
            >
              <Grid2X2 className="h-4 w-4" />
              Categories
            </Link>

            {primaryNav
              .filter((item) => item.href !== "/categories")
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={navLinkClasses(isActive(item.href))}
                >
                  {item.title}
                </Link>
              ))}
          </nav>

          <div className="text-xs font-medium text-neutral-500 dark:text-neutral-500">
            Quality electrical products for home &amp; commercial use
          </div>
        </div>
      </div>

      <div className="border-t border-neutral-100 px-4 py-2.5 md:hidden dark:border-neutral-900">
        <PredictiveSearch mobile />
      </div>

      {isMobileMenuOpen ? (
        <div className="border-t border-neutral-100 bg-white px-4 pb-4 pt-2 md:hidden dark:border-neutral-900 dark:bg-neutral-950">
          <nav aria-label="Mobile store navigation" className="grid gap-1">
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenus}
                className={navLinkClasses(isActive(item.href))}
              >
                {item.href === "/categories" ? <Grid2X2 className="h-4 w-4" /> : null}
                {item.title}
              </Link>
            ))}

            <Link
              href="/track-order"
              onClick={closeMenus}
              className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:text-amber-700 dark:text-neutral-300 dark:hover:bg-neutral-900 dark:hover:text-amber-400"
            >
              Track Order
            </Link>

            {!user ? (
              <Link
                href="/login"
                onClick={closeMenus}
                className="inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/30"
              >
                <User className="mr-2 h-4 w-4" />
                Sign In
              </Link>
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
