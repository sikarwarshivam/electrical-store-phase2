import Link from "next/link";
import { ChevronRight, Package, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/store/product-card";
import { ProductPurchasePanel } from "@/components/store/product-purchase-panel";
import { getPublicProductBySlug } from "@/lib/catalog";

export const dynamic = "force-dynamic";

function attributeValue(value: unknown) {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === null || value === undefined) return "";
  return String(value);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);

  if (!product) {
    return { title: "Product not found" };
  }

  return {
    title: product.name,
    description:
      product.shortDescription ||
      product.description.slice(0, 160) ||
      "Electrical product details, specifications, pricing, and stock information.",
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);

  if (!product) notFound();

  const sortedImages = product.images.slice().sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return a.sortOrder - b.sortOrder;
  });
  const primaryImage = sortedImages[0]?.url;
  const defaultVariant = product.variants[0];

  const groupedAttributes = new Map<string, typeof product.attributes>();
  for (const attribute of product.attributes) {
    const group = attribute.group || "Specifications";
    const list = groupedAttributes.get(group) || [];
    list.push(attribute);
    groupedAttributes.set(group, list);
  }

  return (
    <PageContainer>
      <div className="space-y-8">
        <nav className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
          <Link href="/" className="hover:text-amber-700 dark:hover:text-amber-400">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/products" className="hover:text-amber-700 dark:hover:text-amber-400">
            Products
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link
            href={"/categories/" + product.category.slug}
            className="hover:text-amber-700 dark:hover:text-amber-400"
          >
            {product.category.name}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="truncate">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <div className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
              {primaryImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={primaryImage}
                  alt={sortedImages[0]?.alt || product.name}
                  className="aspect-square w-full object-contain p-8 transition-transform duration-500 group-hover:scale-105 sm:p-12"
                  loading="eager"
                  decoding="async"
                />
              ) : (
                <div className="flex aspect-square items-center justify-center bg-neutral-100 text-neutral-400 dark:bg-neutral-900">
                  <Package className="h-16 w-16" />
                </div>
              )}
            </div>

            {sortedImages.length > 1 ? (
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
                {sortedImages.map((image) => (
                  <a
                    key={image.url}
                    href={image.url}
                    target="_blank"
                    rel="noreferrer"
                    className="overflow-hidden rounded-lg border border-neutral-200 bg-white p-2 hover:border-amber-400 dark:border-neutral-800 dark:bg-neutral-950"
                    title="Open image"
                  >
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image.url}
                      alt={image.alt || product.name}
                      className="aspect-square w-full object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-5">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {product.brand ? <Badge variant="outline">{product.brand.name}</Badge> : null}
                <Badge variant="secondary">{product.category.name}</Badge>
                {product.productType === "VARIABLE" ? (
                  <Badge variant="outline">{product.variants.length} options</Badge>
                ) : null}
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-neutral-950 dark:text-white sm:text-4xl">
                {product.name}
              </h1>
              {product.shortDescription ? (
                <p className="mt-3 text-base leading-7 text-neutral-600 dark:text-neutral-300">
                  {product.shortDescription}
                </p>
              ) : null}
            </div>

            <ProductPurchasePanel
              productId={product.id}
              productName={product.name}
              brandName={product.brand?.name}
              productImage={primaryImage}
              variants={product.variants}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
                <ShieldCheck className="h-5 w-5 text-amber-600" />
                <p className="mt-2 text-sm font-semibold">Verified catalog data</p>
                <p className="mt-1 text-xs leading-5 text-neutral-500">
                  Pricing and availability are sourced from the store catalog and inventory records.
                </p>
              </div>
              <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
                <Package className="h-5 w-5 text-amber-600" />
                <p className="mt-2 text-sm font-semibold">SKU-level selection</p>
                <p className="mt-1 text-xs leading-5 text-neutral-500">
                  Select the exact variant or SKU before adding the item to your cart.
                </p>
              </div>
            </div>

            {product.description ? (
              <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
                <h2 className="text-base font-bold">Product description</h2>
                <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-neutral-600 dark:text-neutral-300">
                  {product.description}
                </div>
              </section>
            ) : null}
          </div>
        </div>

        {groupedAttributes.size > 0 ? (
          <section className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
            <div className="border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
              <h2 className="text-lg font-bold">Technical specifications</h2>
              <p className="mt-1 text-xs text-neutral-500">
                Product-level technical data supplied through the catalog.
              </p>
            </div>
            <div className="grid gap-6 p-5 md:grid-cols-2">
              {Array.from(groupedAttributes.entries()).map(([group, attributes]) => (
                <div key={group} className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
                  <div className="bg-neutral-50 px-4 py-3 text-sm font-semibold dark:bg-neutral-900">
                    {group}
                  </div>
                  <dl className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {attributes
                      .slice()
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((attribute) => (
                        <div key={attribute.key} className="grid grid-cols-[1fr_1.3fr] gap-4 px-4 py-3 text-sm">
                          <dt className="font-medium text-neutral-500">{attribute.label}</dt>
                          <dd className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {attributeValue(attribute.value)}
                            {attribute.unit ? " " + attribute.unit : ""}
                          </dd>
                        </div>
                      ))}
                  </dl>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {product.tax.gstRate !== undefined || product.tax.hsnCode ? (
          <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
            <h2 className="text-base font-bold">Tax reference</h2>
            <div className="mt-3 flex flex-wrap gap-6 text-sm">
              {product.tax.hsnCode ? (
                <div>
                  <p className="text-xs text-neutral-500">HSN / SAC</p>
                  <p className="mt-1 font-semibold">{product.tax.hsnCode}</p>
                </div>
              ) : null}
              {product.tax.gstRate !== undefined ? (
                <div>
                  <p className="text-xs text-neutral-500">GST rate</p>
                  <p className="mt-1 font-semibold">{product.tax.gstRate}%</p>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {product.relatedProducts.length > 0 ? (
          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Related products</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  More products from the same category.
                </p>
              </div>
              <Link
                href={"/categories/" + product.category.slug}
                className="text-sm font-semibold text-amber-700 hover:underline dark:text-amber-400"
              >
                View category
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {product.relatedProducts.map((related) => (
                <ProductCard key={related.id} product={related} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </PageContainer>
  );
}
