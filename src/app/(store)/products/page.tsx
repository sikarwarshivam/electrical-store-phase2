import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { ProductCard } from "@/components/store/product-card";
import { getPublicBrands, getPublicCategories, getPublicProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to high" },
  { value: "price-desc", label: "Price: High to low" },
  { value: "name", label: "Name: A to Z" },
] as const;

function pageNumber(value?: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function buildProductsHref(values: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value) query.set(key, value);
  }
  const encoded = query.toString();
  return encoded ? "/products?" + encoded : "/products";
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const currentPage = pageNumber(params.page);

  const [catalog, categories, brands] = await Promise.all([
    getPublicProducts({
      q: params.q,
      spec: params.spec,
      categorySlug: params.category,
      brandSlug: params.brand,
      sort:
        params.sort === "price-asc" ||
        params.sort === "price-desc" ||
        params.sort === "name"
          ? params.sort
          : "newest",
      page: currentPage,
      pageSize: 24,
    }),
    getPublicCategories(),
    getPublicBrands(),
  ]);

  const hasFilters = Boolean(params.q || params.spec || params.category || params.brand);
  const previousHref =
    currentPage > 1
      ? buildProductsHref({ ...params, page: String(currentPage - 1) })
      : undefined;
  const nextHref =
    currentPage < catalog.totalPages
      ? buildProductsHref({ ...params, page: String(currentPage + 1) })
      : undefined;

  return (
    <PageContainer
      title="Products"
      description="Browse electrical products by category, brand, price, and technical specification."
    >
      <div className="space-y-6">
        <form
          action="/products"
          method="get"
          className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950"
        >
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <SlidersHorizontal className="h-4 w-4 text-amber-600" />
            Search & filters
          </div>

          <div className="grid gap-3 lg:grid-cols-[2fr_1.2fr_1.2fr_1fr_auto]">
            <label className="relative">
              <span className="sr-only">Search products</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                name="q"
                defaultValue={params.q || ""}
                placeholder="Search bulbs, MCBs, cables, SKU..."
                className="h-10 w-full rounded-md border border-neutral-300 bg-white pl-9 pr-3 text-sm outline-none transition-colors focus:border-amber-500 dark:border-neutral-700 dark:bg-neutral-900"
              />
            </label>

            <label>
              <span className="sr-only">Category</span>
              <select
                name="category"
                defaultValue={params.category || ""}
                className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              >
                <option value="">All categories</option>
                {categories.flatMap((category) => [
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>,
                  ...category.children.map((child) => (
                    <option key={child.id} value={child.slug}>
                      {"↳ " + child.name}
                    </option>
                  )),
                ])}
              </select>
            </label>

            <label>
              <span className="sr-only">Brand</span>
              <select
                name="brand"
                defaultValue={params.brand || ""}
                className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              >
                <option value="">All brands</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.slug}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="sr-only">Sort</span>
              <select
                name="sort"
                defaultValue={params.sort || "newest"}
                className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-md bg-amber-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-amber-700"
            >
              Apply
            </button>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              name="spec"
              defaultValue={params.spec || ""}
              placeholder="Technical spec filter, e.g. wattage:9 or ipRating:65"
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-amber-500 dark:border-neutral-700 dark:bg-neutral-900"
            />
            {hasFilters ? (
              <Link
                href="/products"
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border border-neutral-300 px-4 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-900"
              >
                <X className="h-4 w-4" />
                Clear filters
              </Link>
            ) : null}
          </div>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-neutral-500">
            {catalog.total === 0
              ? "No products found"
              : "Showing " +
                ((catalog.page - 1) * catalog.pageSize + 1) +
                "–" +
                Math.min(catalog.page * catalog.pageSize, catalog.total) +
                " of " +
                catalog.total +
                " products"}
          </p>
          {params.spec ? (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
              Spec: {params.spec}
            </span>
          ) : null}
        </div>

        {catalog.products.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {catalog.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center dark:border-neutral-800 dark:bg-neutral-950">
            <p className="text-base font-semibold">No matching products</p>
            <p className="mt-2 text-sm text-neutral-500">
              Try a broader search term or remove one of the filters.
            </p>
            <Link
              href="/products"
              className="mt-5 inline-flex rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
            >
              Browse all products
            </Link>
          </div>
        )}

        {catalog.totalPages > 1 ? (
          <div className="flex items-center justify-center gap-3 pt-2">
            {previousHref ? (
              <Link
                href={previousHref}
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
              >
                Previous
              </Link>
            ) : (
              <span className="rounded-md border border-neutral-200 px-4 py-2 text-sm text-neutral-400 dark:border-neutral-800">
                Previous
              </span>
            )}
            <span className="text-sm text-neutral-500">
              Page {catalog.page} of {catalog.totalPages}
            </span>
            {nextHref ? (
              <Link
                href={nextHref}
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
              >
                Next
              </Link>
            ) : (
              <span className="rounded-md border border-neutral-200 px-4 py-2 text-sm text-neutral-400 dark:border-neutral-800">
                Next
              </span>
            )}
          </div>
        ) : null}
      </div>
    </PageContainer>
  );
}
