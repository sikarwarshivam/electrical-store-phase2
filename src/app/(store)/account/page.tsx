import Link from "next/link";
import { ChevronRight, UserRound } from "lucide-react";
import { requireAuth } from "@/lib/auth-utils";
import { PageContainer } from "@/components/layout/page-container";

export default async function AccountPage() {
  const user = await requireAuth("/account");
  return (
    <PageContainer title="My Account" description={"Signed in as " + user.name}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/account/orders" className="rounded-xl border border-neutral-200 bg-white p-5 hover:border-amber-400 dark:border-neutral-800 dark:bg-neutral-950">
          <UserRound className="h-5 w-5 text-amber-600" />
          <p className="mt-3 font-bold">My Orders</p>
          <div className="mt-1 flex items-center text-xs text-neutral-500">View order history and tracking <ChevronRight className="ml-1 h-4 w-4" /></div>
        </Link>
        <Link href="/track-order" className="rounded-xl border border-neutral-200 bg-white p-5 hover:border-amber-400 dark:border-neutral-800 dark:bg-neutral-950">
          <p className="font-bold">Track an order</p>
          <p className="mt-1 text-xs text-neutral-500">Useful for guest checkout and shared order tracking.</p>
        </Link>
      </div>
    </PageContainer>
  );
}
