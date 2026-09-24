"use client";

import { useSession, signOut } from "next-auth/react";
import { Menu, LogOut, ShieldCheck } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function AdminHeader() {
  const { toggleAdminSidebar } = useUIStore();
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-neutral-200 bg-white px-4 sm:px-6 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleAdminSidebar}
          className="rounded p-2 text-neutral-600 hover:bg-neutral-100 md:hidden dark:text-neutral-300 dark:hover:bg-neutral-800"
          aria-label="Toggle Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          Store Administration
        </span>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                {user.name || user.email}
              </span>
              <div className="flex items-center justify-end gap-1">
                <ShieldCheck className="h-3 w-3 text-amber-600" />
                <Badge variant="warning" className="text-[10px] py-0 px-1">
                  {user.role}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-xs text-neutral-600 hover:text-red-600"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
