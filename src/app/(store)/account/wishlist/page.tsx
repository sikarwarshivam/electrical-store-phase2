import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import { requireAuth } from "@/lib/auth-utils";
import { getWishlistItems } from "@/actions/wishlist";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { WishlistItem } from "@/components/store/wishlist-item";

export const metadata = {
  title: "My Wishlist",
};

export default async function WishlistPage() {
  await requireAuth("/account/wishlist");
  const items = await getWishlistItems();

  return (
    <PageContainer
      title="My Wishlist"
      description="Save products you want to revisit and move them to your cart when ready."
      actions={
        items.length > 0 ? (
          <span className="text-sm text-neutral-500">
            {items.length} saved
          </span>
        ) : undefined
      }
    >
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center dark:border-neutral-800 dark:bg-neutral-950">
          <Heart className="mx-auto h-9 w-9 text-neutral-400" />
          <h2 className="mt-3 text-lg font-bold">Your wishlist is empty</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Save products from their product pages and they will stay here across sessions.
          </p>
          <Link href="/products" className="mt-5 inline-flex">
            <Button>
              <ShoppingBag className="mr-2 h-4 w-4" />
              Browse products
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <WishlistItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
