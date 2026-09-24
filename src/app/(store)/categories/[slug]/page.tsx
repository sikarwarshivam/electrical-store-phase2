/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowLeft, ChevronRight, Search } from "lucide-react";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { ProductCard } from "@/components/store/product-card";
import { getPublicCategoryBySlug, getPublicProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getPublicCategoryBySlug(slug);

  if (!category) {
    return { title: "Category not found" };
  }

  return {
    title: category.name,
    description:
      category.description ||
      "Browse " + category.name + " electrical products and related subcategories.",
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const category = await getPublicCategoryBySlug(slug);

  if (!category) notFound();

  const catalog = await getPublicProducts({
    categorySlug: slug,
    q: query.q,
    spec: query.spec,
    sort:
      query.sort === "price-asc" ||
      query.sort === "price-desc" ||
      query.sort === "name"
        ? query.sort
        : "newest",
    page: Number.isInteger(Number(query.page)) && Number(query.page) > 0 ? Number(query.page) : 1,
    pageSize: 24,
  });

  function categoryPageHref(page?: number) {
    const search = new URLSearchParams();
    if (query.q) search.set("q", query.q);
    if (query.spec) search.set("spec", query.spec);
    if (query.sort) search.set("sort", query.sort);
    if (page && page > 1) search.set("page", String(page));
    const value = search.toString();
    return "/categories/" + slug + (value ? "?" + value : "");
  }

  return (
    <PageContainer title={category.name} description={category.description}>
      <div className="space-y-8">
        <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
          <Link href="/categories" className="hover:text-amber-700 dark:hover:text-amber-400">
            Categories
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span>{category.name}</span>
          {category.parent ? (
            <>
              <span className="text-neutral-300">·</span>
              <span>Subcategory</span>
            </>
          ) : null}
        </div>

        {category.imageUrl ? (
          <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
<img
              src={category.imageUrl}
              alt={category.name}
              className="max-h-72 w-full object-cover"
              loading="eager"
              decoding="async"
            />
            <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-neutral-950/55 via-neutral-950/20 to-transparent" />
            <div className="absolute inset-y-0 left-0 flex max-w-xl flex-col justify-center px-6 py-8 text-white sm:px-10">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                Electrical catalog
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                {category.name}
              </h1>
            </div>
          </div>
        ) : null}

        {category.children.length > 0 ? (
          <section>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold">Browse subcategories</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Jump directly to a more specific product group.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {category.children.map((child) => (
                <Link
                  key={child.id}
                  href={"/categories/" + child.slug}
                  className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-amber-400 hover:bg-amber-50 hover:text-amber-800 dark:border-neutral-700 dark:text-neutral-200 dark:hover:border-amber-700 dark:hover:bg-amber-950/30 dark:hover:text-amber-300"
                >
                  {child.name}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <form
            action={"/categories/" + slug}
            method="get"
            className="grid gap-3 rounded-xl border border-neutral-200 bg-white p-4 md:grid-cols-[2fr_1.5fr_1fr_auto] dark:border-neutral-800 dark:bg-neutral-950"
          >
            <label className="relative">
              <span className="sr-only">Search within category</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                name="q"
                defaultValue={query.q || ""}
                placeholder="Search this category..."
                className="h-10 w-full rounded-md border border-neutral-300 bg-white pl-9 pr-3 text-sm focus:border-amber-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
              />
            </label>
            <input
              name="spec"
              defaultValue={query.spec || ""}
              placeholder="Spec, e.g. wattage:9"
              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm focus:border-amber-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
            />
            <select
              name="sort"
              defaultValue={query.sort || "newest"}
              className="h-10 rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to high</option>
              <option value="price-desc">Price: High to low</option>
              <option value="name">Name: A to Z</option>
            </select>
            <button
              type="submit"
              className="h-10 rounded-md bg-amber-600 px-4 text-sm font-semibold text-white hover:bg-amber-700"
            >
              Filter
            </button>
          </form>

          <div className="mb-4 mt-6 flex items-center justify-between gap-3">
            <p className="text-sm text-neutral-500">
              {catalog.total} {catalog.total === 1 ? "product" : "products"}
            </p>
            <Link href="/products" className="text-sm font-medium text-amber-700 hover:underline dark:text-amber-400">
              View all products
            </Link>
          </div>

          {catalog.products.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {catalog.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-neutral-300 px-6 py-14 text-center dark:border-neutral-800">
              <p className="font-semibold">No products in this category yet.</p>
              <p className="mt-2 text-sm text-neutral-500">
                Try another specification or browse the complete catalog.
              </p>
            </div>
          )}

          {catalog.totalPages > 1 ? (
            <div className="mt-6 flex items-center justify-center gap-3">
              {catalog.page > 1 ? (
                <Link
                  href={categoryPageHref(catalog.page - 1)}
                  className="inline-flex items-center gap-1 rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Link>
              ) : null}
              <span className="text-sm text-neutral-500">
                Page {catalog.page} of {catalog.totalPages}
              </span>
              {catalog.page < catalog.totalPages ? (
                <Link
                  href={categoryPageHref(catalog.page + 1)}
                  className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
                >
                  Next
                </Link>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>
    </PageContainer>
  );
}
