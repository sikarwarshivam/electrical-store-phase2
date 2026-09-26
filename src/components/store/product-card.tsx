/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowRight, PackageSearch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatINRFromPaise } from "@/lib/money";
import type { PublicProductCard } from "@/lib/catalog";

function stockLabel(status: PublicProductCard["stockStatus"]) {
  if (status === "IN_STOCK") return "In stock";
  if (status === "LOW_STOCK") return "Low stock";
  return "Out of stock";
}

export function ProductCard({ product }: { product: PublicProductCard }) {
  const primaryImage =
    product.images.find((image) => image.isPrimary)?.url ||
    product.images.slice().sort((a, b) => a.sortOrder - b.sortOrder)[0]?.url;

  const discount =
    product.mrpPaise > product.pricePaise
      ? Math.round((1 - product.pricePaise / product.mrpPaise) * 100)
      : 0;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-950">
      <Link href={"/products/" + product.slug} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100 dark:bg-neutral-900">
          {primaryImage ? (
<img
              src={primaryImage}
              alt={product.images.find((image) => image.url === primaryImage)?.alt || product.name}
              className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-[1.03]"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-neutral-400">
              <PackageSearch className="h-12 w-12" />
            </div>
          )}
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            <Badge variant={product.stockStatus === "IN_STOCK" ? "success" : product.stockStatus === "LOW_STOCK" ? "warning" : "destructive"}>
              {stockLabel(product.stockStatus)}
            </Badge>
            {product.isVariable ? <Badge variant="outline">Multiple options</Badge> : null}
          </div>
          {discount > 0 ? (
            <span className="absolute right-3 top-3 rounded-full bg-neutral-900 px-2.5 py-1 text-[11px] font-semibold text-white">
              {discount}% off
            </span>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-3.5">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-neutral-500">
          <span>{product.category.name}</span>
          {product.brand ? <span>· {product.brand.name}</span> : null}
        </div>

        <Link href={"/products/" + product.slug} className="block">
          <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-neutral-900 hover:text-amber-700 dark:text-neutral-100 dark:hover:text-amber-400">
            {product.name}
          </h3>
        </Link>

        {product.shortDescription ? (
          <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-neutral-500">
            {product.shortDescription}
          </p>
        ) : null}

        <div className="mt-auto pt-3">
          <div className="flex items-end gap-2">
            <span className="text-base font-bold text-neutral-950 dark:text-white">
              {product.isVariable ? "From " : ""}
              {formatINRFromPaise(product.pricePaise)}
            </span>
            {product.mrpPaise > product.pricePaise ? (
              <span className="text-xs text-neutral-400 line-through">
                {formatINRFromPaise(product.mrpPaise)}
              </span>
            ) : null}
          </div>

          <Link
            href={"/products/" + product.slug}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-800 transition-colors hover:border-amber-400 hover:bg-amber-50 hover:text-amber-800 dark:border-neutral-700 dark:text-neutral-100 dark:hover:border-amber-700 dark:hover:bg-amber-950/30 dark:hover:text-amber-300"
          >
            View product
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
