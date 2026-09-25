"use client";

import Link from "next/link";
import { Zap, X } from "lucide-react";
import { AdminNav } from "@/components/layout/admin-nav";
import { useUIStore } from "@/stores/ui-store";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { isAdminSidebarOpen, toggleAdminSidebar } = useUIStore();

  return (
    <>
      {/* Mobile Backdrop */}
      {isAdminSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={toggleAdminSidebar}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-neutral-200 bg-white transition-transform duration-200 ease-in-out dark:border-neutral-800 dark:bg-neutral-950 md:static md:translate-x-0",
          isAdminSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-800">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600 text-white">
              <Zap className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-100 line-clamp-1">
                {siteConfig.name}
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-amber-600 uppercase">
                Admin Portal
              </span>
            </div>
          </Link>
          <button
            onClick={toggleAdminSidebar}
            className="rounded p-1 text-neutral-500 hover:bg-neutral-100 md:hidden dark:text-neutral-400 dark:hover:bg-neutral-800"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto">
          <AdminNav onItemClick={() => {
            if (window.innerWidth < 768) {
              toggleAdminSidebar();
            }
          }} />
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-neutral-200 p-4 dark:border-neutral-800">
          <Link
            href="/"
            className="flex items-center justify-center rounded-md border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900"
          >
            View Customer Store
          </Link>
        </div>
      </aside>
    </>
  );
}
