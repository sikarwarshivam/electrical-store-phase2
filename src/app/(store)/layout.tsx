import { Header } from "@/components/layout/header";
import { siteConfig } from "@/config/site";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-950">
      <Header />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-neutral-200 bg-white py-8 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div>
            <span className="font-semibold text-neutral-900 dark:text-neutral-200">
              {siteConfig.name}
            </span>{" "}
            &copy; {new Date().getFullYear()}. All rights reserved.
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <span>Email: {siteConfig.contact.email}</span>
            <span>Phone: {siteConfig.contact.phone}</span>
            <span>Address: {siteConfig.contact.address}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
