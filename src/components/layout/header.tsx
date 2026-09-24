"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Zap, ShoppingCart, User, ShieldAlert, LogOut, Menu, X } from "lucide-react";
import { siteConfig } from "@/config/site";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUIStore } from "@/stores/ui-store";

export function Header() {
  const { data: session, status } = useSession();
  const { itemCount, toggleCart } = useCart();
  const { isMobileMenuOpen, toggleMobileMenu } = useUIStore();

  const user = session?.user;
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white/95 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-950/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-600 text-white shadow-sm">
            <Zap className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              {siteConfig.name}
            </span>
            <span className="hidden text-[10px] text-neutral-500 sm:inline-block">
              {siteConfig.currency.symbol} Retail & Commercial Supplies
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {siteConfig.mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-neutral-600 transition-colors hover:text-amber-600 dark:text-neutral-300 dark:hover:text-amber-500"
            >
              {item.title}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-600 hover:text-amber-700"
            >
              <ShieldAlert className="h-4 w-4" />
              Admin Portal
            </Link>
          )}
        </nav>

        {/* Actions (Cart, User, Mobile toggle) */}
        <div className="flex items-center gap-3">
          {/* Cart Trigger */}
          <button
            onClick={toggleCart}
            className="relative flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900"
            aria-label="Shopping Cart"
          >
            <ShoppingCart className="h-4 w-4" />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-600 px-1 text-[10px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </button>

          {/* Auth Status */}
          {status === "loading" ? (
            <div className="h-8 w-20 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
          ) : user ? (
            <div className="flex items-center gap-2">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                  {user.name || user.email}
                </span>
                <Badge variant={isAdmin ? "warning" : "secondary"} className="text-[10px] py-0 px-1.5 self-end">
                  {user.role}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-xs text-neutral-600 hover:text-red-600"
                title="Sign out"
              >
                <LogOut className="h-4 w-4 md:mr-1" />
                <span className="hidden md:inline">Sign Out</span>
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button size="sm" variant="default">
                <User className="mr-1.5 h-4 w-4" />
                Sign In
              </Button>
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={toggleMobileMenu}
            className="rounded p-2 text-neutral-600 md:hidden hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="border-b border-neutral-200 bg-white p-4 md:hidden dark:border-neutral-800 dark:bg-neutral-950">
          <nav className="flex flex-col gap-3">
            {siteConfig.mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={toggleMobileMenu}
                className="text-sm font-medium text-neutral-700 hover:text-amber-600 dark:text-neutral-200"
              >
                {item.title}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={toggleMobileMenu}
                className="flex items-center gap-2 text-sm font-semibold text-amber-600"
              >
                <ShieldAlert className="h-4 w-4" />
                Admin Portal
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
