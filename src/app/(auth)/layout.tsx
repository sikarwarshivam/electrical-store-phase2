import Link from "next/link";
import { Zap } from "lucide-react";
import { siteConfig } from "@/config/site";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 p-4 dark:bg-neutral-950">
      <div className="mb-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-600 text-white shadow-sm">
            <Zap className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            {siteConfig.name}
          </span>
        </Link>
      </div>
      <div className="w-full max-w-md">{children}</div>
      <div className="mt-8 text-center text-xs text-neutral-500">
        <Link href="/" className="hover:underline">
          &larr; Back to storefront
        </Link>
      </div>
    </div>
  );
}
