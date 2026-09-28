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
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-lg hover:shadow-neutral-900/5 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-amber-800">
      <Link href={"/products/" + product.slug} className="block">
        <div className="relative aspect-square overflow-hidden bg-neutral-50 dark:bg-neutral-900">
          {primaryImage ? (
            <ImageCarousel
              images={images}
              fallbackAlt={product.name}
              sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-neutral-400">
              <PackageSearch className="h-12 w-12" />
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-neutral-950/5 to-transparent dark:from-black/15" />

          <div className="absolute left-3 top-3 flex max-w-[75%] flex-wrap gap-2">
            <Badge
              variant={
                product.stockStatus === "IN_STOCK"
                  ? "success"
                  : product.stockStatus === "LOW_STOCK"
                    ? "warning"
                    : "destructive"
              }
            >
              {stockLabel(product.stockStatus)}
            </Badge>
            {product.isVariable ? (
              <Badge variant="outline" className="bg-white/90 backdrop-blur-sm dark:bg-neutral-950/90">
                Multiple options
              </Badge>
            ) : null}
          </div>

          {discount > 0 ? (
            <span className="absolute right-3 top-3 rounded-full bg-neutral-950 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
              {discount}% off
            </span>
          ) : null}

          {images.length > 1 ? (
            <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-neutral-600 shadow-sm backdrop-blur-sm dark:bg-neutral-950/90 dark:text-neutral-300">
              {images.length} photos
            </span>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-neutral-500">
          <span>{product.category.name}</span>
          {product.brand ? <span>· {product.brand.name}</span> : null}
        </div>

        <Link href={"/products/" + product.slug} className="block">
          <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-neutral-900 transition-colors hover:text-amber-700 dark:text-neutral-100 dark:hover:text-amber-400">
            {product.name}
          </h3>
        </Link>

        {product.shortDescription ? (
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-neutral-500">
            {product.shortDescription}
          </p>
        ) : null}

        <div className="mt-auto pt-4">
          <div className="flex items-end gap-2">
            <span className="text-lg font-bold text-neutral-950 dark:text-white">
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
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-800 transition-all hover:border-amber-400 hover:bg-amber-50 hover:text-amber-800 group-hover:border-amber-300 dark:border-neutral-700 dark:text-neutral-100 dark:hover:border-amber-700 dark:hover:bg-amber-950/30 dark:hover:text-amber-300"
          >
            View product
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
