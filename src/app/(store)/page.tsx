/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowRight, FolderTree, Search, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { siteConfig } from "@/config/site";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/store/product-card";
import { getPublicCategories, getPublicProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, catalog] = await Promise.all([
    getPublicCategories(),
    getPublicProducts({ page: 1, pageSize: 8, sort: "newest" }),
  ]);

  return (
    <div>
      <section className="border-b border-neutral-200 bg-linear-to-b from-amber-500/15 via-amber-500/5 to-transparent py-16 dark:border-neutral-800">
        <PageContainer>
          <div className="max-w-3xl space-y-5">
            <Badge variant="outline" className="border-amber-400 bg-amber-100/80 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
              Electrical supplies · Online catalog
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight text-neutral-950 sm:text-5xl dark:text-white">
              {siteConfig.name}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-neutral-600 dark:text-neutral-300">
              {siteConfig.tagline}. Browse products, compare technical specifications, and select the exact SKU you need.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-700"
              >
                Shop products
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/categories"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
              >
                Browse categories
                <FolderTree className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </PageContainer>
      </section>

      <section id="categories" className="py-12">
        <PageContainer
          title="Shop by category"
          description="Start with a broad product group, then narrow down to a subcategory."
          actions={
            <Link href="/categories" className="text-sm font-semibold text-amber-700 hover:underline dark:text-amber-400">
              View all
            </Link>
          }
        >
          {categories.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categories.slice(0, 8).map((category) => (
                <Link
                  key={category.id}
                  href={"/categories/" + category.slug}
                  className="group overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                    {category.imageUrl ? (
                      <img
                        src={category.imageUrl}
                        alt={category.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-neutral-400">
                        <FolderTree className="h-10 w-10" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-neutral-900 group-hover:text-amber-700 dark:text-white dark:group-hover:text-amber-400">
                      {category.name}
                    </h3>
                    <p className="mt-1 text-xs text-neutral-500">
                      {category.children.length} {category.children.length === 1 ? "subcategory" : "subcategories"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-500 dark:border-neutral-800">
              Categories will appear here once they are published in the admin catalog.
            </div>
          )}
        </PageContainer>
      </section>

      <section id="products" className="border-y border-neutral-200 bg-neutral-50 py-12 dark:border-neutral-800 dark:bg-neutral-900/30">
        <PageContainer
          title="Latest products"
          description="Published products are pulled from the live catalog and inventory records."
          actions={
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 hover:underline dark:text-amber-400"
            >
              See catalog
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
        >
          {catalog.products.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {catalog.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center dark:border-neutral-800 dark:bg-neutral-950">
              <p className="font-semibold">No published products yet.</p>
              <p className="mt-2 text-sm text-neutral-500">
                Add an active product with at least one active SKU from the admin portal.
              </p>
              <Link
                href="/admin/products"
                className="mt-4 inline-flex rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
              >
                Open product admin
              </Link>
            </div>
          )}
        </PageContainer>
      </section>

      <section className="py-12">
        <PageContainer
          title="Find the right electrical specification"
          description="The catalog is designed around SKU-level data rather than generic product names alone."
        >
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Search className="h-5 w-5 text-amber-600" />
                  Search by need
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                Search product names, SKUs, keywords, and catalog specifications from one place.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <SlidersHorizontal className="h-5 w-5 text-amber-600" />
                  Filter by specification
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                Narrow the catalog with category, brand, price, and technical specification filters.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-5 w-5 text-amber-600" />
                  SKU-level stock status
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                Product variants use their own SKU, pricing, sale unit, and inventory status.
              </CardContent>
            </Card>
          </div>
        </PageContainer>
      </section>

      <section id="about" className="border-t border-neutral-200 bg-white py-12 dark:border-neutral-800 dark:bg-neutral-950">
        <PageContainer title="About the store" description="Store information can be finalized from the central site configuration.">
          <div className="max-w-3xl text-sm leading-7 text-neutral-600 dark:text-neutral-300">
            <p>
              {siteConfig.name} is being built as a focused electrical catalog and commerce experience for
              retail customers, electricians, contractors, and project buyers. Product content, specifications,
              pricing, and availability are maintained through the admin catalog.
            </p>
          </div>
        </PageContainer>
      </section>

      <section id="contact" className="border-t border-neutral-200 py-12 dark:border-neutral-800">
        <PageContainer title="Contact" description="Client contact details are configured centrally and will be replaced with the shop's approved information.">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Email</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-neutral-600 dark:text-neutral-300">
                {siteConfig.contact.email}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Phone</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-neutral-600 dark:text-neutral-300">
                {siteConfig.contact.phone}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Address</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-neutral-600 dark:text-neutral-300">
                {siteConfig.contact.address}
              </CardContent>
            </Card>
          </div>
        </PageContainer>
      </section>
    </div>
  );
}
