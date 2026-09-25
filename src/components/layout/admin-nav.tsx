"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingCart,
  Boxes,
  Users,
  Tag,
  Settings,
  BadgeCheck,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingCart,
  Boxes,
  Users,
  Tag,
  Settings,
  BadgeCheck,
};

interface AdminNavProps {
  onItemClick?: () => void;
  className?: string;
}

export function AdminNav({ onItemClick, className }: AdminNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("space-y-1 px-2 py-4", className)}>
      {siteConfig.adminNav.map((item) => {
        const Icon = ICON_MAP[item.icon] || LayoutDashboard;
        const isActive =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            onClick={() => {
              const main = document.getElementById("admin-main");
              main?.scrollTo({ top: 0, behavior: "smooth" });
              onItemClick?.();
            }}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-amber-600 text-white shadow-sm"
                : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
