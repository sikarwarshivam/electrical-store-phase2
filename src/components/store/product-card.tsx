import Link from "next/link";
import { ArrowRight, PackageSearch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ImageCarousel } from "@/components/store/image-carousel";
import { formatINRFromPaise } from "@/lib/money";
import type { PublicProductCard } from "@/lib/catalog";

function stockLabel(status: PublicProductCard["stockStatus"]) {
  if (status === "IN_STOCK") return "In stock";
  if (status === "LOW_STOCK") return "Low stock";
  return "Out of stock";
}

export function ProductCard({ product }: { product: PublicProductCard }) {
  const images = product.images
    .slice()
    .sort(
      (a, b) =>
        Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary)) ||
        a.sortOrder - b.sortOrder
    );

  const primaryImage = images[0]?.url;

  const discount =
    product.mrpPaise > product.pricePaise
      ? Math.round((1 - product.pricePaise / product.mrpPaise) * 100)
      : 0;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md hover:shadow-neutral-900/5 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-700">
      <Link
        href={"/products/" + product.slug}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500"
        aria-label={"View " + product.name}
      >
        <div className="relative aspect-[5/4] overflow-hidden bg-neutral-50 dark:bg-neutral-900">
          {primaryImage ? (
            <ImageCarousel
              images={images}
              fallbackAlt={product.name}
              sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-neutral-400">
              <PackageSearch className="h-10 w-10" />
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-neutral-950/5 to-transparent dark:from-black/15" />

          <div className="absolute left-2.5 top-2.5 flex max-w-[78%] flex-wrap gap-1.5">
            <Badge
              variant={
                product.stockStatus === "IN_STOCK"
                  ? "success"
                  : product.stockStatus === "LOW_STOCK"
                    ? "warning"
                    : "destructive"
              }
              className="px-2 py-0.5 text-[10px] shadow-sm"
            >
              {stockLabel(product.stockStatus)}
            </Badge>
            {product.isVariable ? (
              <Badge
                variant="outline"
                className="bg-white/90 px-2 py-0.5 text-[10px] backdrop-blur-sm dark:bg-neutral-950/90"
              >
                {product.variants.length} options
              </Badge>
            ) : null}
          </div>

          {discount > 0 ? (
            <span className="absolute right-2.5 top-2.5 rounded-full bg-neutral-950 px-2 py-1 text-[10px] font-semibold text-white shadow-sm">
              {discount}% off
            </span>
          ) : null}

          {images.length > 1 ? (
            <span className="pointer-events-none absolute bottom-2.5 right-2.5 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-neutral-600 shadow-sm backdrop-blur-sm dark:bg-neutral-950/90 dark:text-neutral-300">
              {images.length} photos
            </span>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col px-3.5 pb-3.5 pt-3">
        <div className="mb-1.5 flex min-w-0 items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-neutral-400">
          <span className="truncate">{product.category.name}</span>
          {product.brand ? (
            <>
              <span aria-hidden="true">•</span>
              <span className="truncate">{product.brand.name}</span>
            </>
          ) : null}
        </div>

        <Link
          href={"/products/" + product.slug}
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
        >
          <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-neutral-900 transition-colors group-hover:text-amber-700 dark:text-neutral-100 dark:group-hover:text-amber-400">
            {product.name}
          </h3>
        </Link>

        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-1.5">
              <span className="text-base font-bold tracking-tight text-neutral-950 dark:text-white">
                {product.isVariable ? "From " : ""}
                {formatINRFromPaise(product.pricePaise)}
              </span>
              {product.mrpPaise > product.pricePaise ? (
                <span className="text-[11px] text-neutral-400 line-through">
                  {formatINRFromPaise(product.mrpPaise)}
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-[10px] text-neutral-400">Inclusive of applicable taxes</p>
          </div>

          <Link
            href={"/products/" + product.slug}
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md border border-neutral-200 px-2.5 text-[11px] font-semibold text-neutral-700 transition-colors hover:border-amber-400 hover:bg-amber-50 hover:text-amber-800 dark:border-neutral-700 dark:text-neutral-200 dark:hover:border-amber-700 dark:hover:bg-amber-950/30 dark:hover:text-amber-300"
          >
            Details
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
