import { requireAdmin } from "@/lib/auth-utils";
import { Sidebar } from "@/components/layout/sidebar";
import { AdminHeader } from "@/components/admin/admin-header";

export const metadata = {
  title: "Admin Dashboard",
  description: "Electrical Retail Store Management Shell",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side authorization guard (Defense-in-depth in addition to Edge Middleware)
  await requireAdmin("/admin");

  return (
    <div className="flex min-h-screen bg-neutral-100 dark:bg-neutral-900">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AdminHeader />
        <main
          id="admin-main"
          className="flex-1 min-w-0 overflow-x-hidden overflow-y-auto overscroll-contain scroll-smooth p-4 sm:p-6 lg:p-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
