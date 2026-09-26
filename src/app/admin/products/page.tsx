import Link from "next/link";
import { Package, Plus, ExternalLink, Trash2, Undo2 } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CatalogMessage } from "@/components/admin/catalog-message";
import { FieldLabel } from "@/components/admin/field-label";
import { ProductImagesUpload } from "@/components/admin/product-images-upload";
import {
  archiveProductAction,
  createProductAction,
  deleteProductAction,
  unarchiveProductAction,
} from "@/actions/catalog";
import { getAdminBrands, getAdminCategories, getAdminProducts } from "@/lib/catalog";

export const metadata = {
  title: "Products Management",
};

export const dynamic = "force-dynamic";

function id(value: unknown) {
  return String(value);
}

function prettyStatus(status: string) {
  return status.replace("_", " ");
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const params = await searchParams;
  const [categories, brands, products] = await Promise.all([
    getAdminCategories(),
    getAdminBrands(),
    getAdminProducts(),
  ]);

  const topLevel = categories.filter((category) => !category.parent);
  const subcategories = categories.filter((category) => category.parent && category.isActive);
  const activeBrands = brands.filter((brand) => brand.isActive);

  return (
    <PageContainer
      title="Products"
      description="Create and maintain products, specifications, tax references, images, and SKU strategy."
      actions={
        <Badge variant="outline">
          <Package className="mr-1.5 h-3.5 w-3.5" />
          {products.length} loaded
        </Badge>
      }
    >
      <CatalogMessage success={params.success} error={params.error} />

      <div className="grid gap-6 xl:grid-cols-[460px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus className="h-4 w-4" />
              Add Product
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createProductAction} className="space-y-4">
              <div>
                <FieldLabel htmlFor="product-name">Name</FieldLabel>
                <input
                  id="product-name"
                  name="name"
                  required
                  className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  placeholder="Product name"
                />
              </div>

              <div>
                <FieldLabel htmlFor="product-slug" hint="Optional. Generated from the product name when blank.">
                  Slug
                </FieldLabel>
                <input
                  id="product-slug"
                  name="slug"
                  className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>

              <div>
                <FieldLabel htmlFor="product-short">Short description</FieldLabel>
                <input
                  id="product-short"
                  name="shortDescription"
                  maxLength={300}
                  className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>

              <div>
                <FieldLabel htmlFor="product-description">Description</FieldLabel>
                <textarea
                  id="product-description"
                  name="description"
                  rows={5}
                  className="mt-1.5 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="product-category">Category</FieldLabel>
                  <select
                    id="product-category"
                    name="categoryId"
                    required
                    defaultValue=""
                    className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  >
                    <option value="" disabled>
                      Select category
                    </option>
                    {topLevel.filter((category) => category.isActive).map((category) => (
                      <option key={id(category._id)} value={id(category._id)}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel htmlFor="product-subcategory">Subcategory</FieldLabel>
                  <select
                    id="product-subcategory"
                    name="subcategoryId"
                    defaultValue=""
                    className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  >
                    <option value="">No subcategory</option>
                    {subcategories.map((category) => (
                      <option key={id(category._id)} value={id(category._id)}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="product-brand">Brand</FieldLabel>
                  <select
                    id="product-brand"
                    name="brandId"
                    defaultValue=""
                    className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  >
                    <option value="">No brand</option>
                    {activeBrands.map((brand) => (
                      <option key={id(brand._id)} value={id(brand._id)}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel htmlFor="product-type">Product type</FieldLabel>
                  <select
                    id="product-type"
                    name="productType"
                    defaultValue="SIMPLE"
                    className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  >
                    <option value="SIMPLE">Simple (one SKU)</option>
                    <option value="VARIABLE">Variable (multiple SKUs)</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="product-status">Status</FieldLabel>
                  <select
                    id="product-status"
                    name="status"
                    defaultValue="DRAFT"
                    className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>

                <div>
                  <FieldLabel htmlFor="product-gst">GST rate</FieldLabel>
                  <input
                    id="product-gst"
                    name="gstRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="Client/CA supplied"
                    className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </div>
              </div>

              <div>
                <FieldLabel htmlFor="product-hsn" hint="Enter the business-approved HSN/SAC; do not guess it.">
                  HSN / SAC
                </FieldLabel>
                <input
                  id="product-hsn"
                  name="hsnCode"
                  className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isGstInclusive" defaultChecked />
                Selling prices are GST-inclusive for this product
              </label>

              <div>
                <FieldLabel htmlFor="product-keywords" hint="Comma-separated search terms.">
                  Search keywords
                </FieldLabel>
                <input
                  id="product-keywords"
                  name="searchKeywords"
                  className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  placeholder="led, bulb, lighting"
                />
              </div>

              <div>
                <FieldLabel
                  htmlFor="product-attributes"
                  hint='JSON array. Example: [{"key":"wattage","label":"Wattage","value":12,"unit":"W"}]'
                >
                  Electrical attributes JSON
                </FieldLabel>
                <textarea
                  id="product-attributes"
                  name="attributesJson"
                  rows={5}
                  className="mt-1.5 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 font-mono text-xs dark:border-neutral-700 dark:bg-neutral-900"
                  placeholder="[]"
                />
              </div>

              <div>
                <FieldLabel hint="Upload up to 8 product images. The first image is used as the primary image.">
                  Product images
                </FieldLabel>
                <div className="mt-1.5">
                  <ProductImagesUpload />
                </div>
              </div>

              <Button type="submit" className="w-full">
                Create Product
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Product Catalog</CardTitle>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
                No products yet. Create a real catalog item from the form.
              </div>
            ) : (
              <div className="space-y-3">
                {products.map((product) => {
                  const productCategory =
                    product.category && typeof product.category === "object"
                      ? (product.category as { name?: string }).name
                      : "Unknown category";
                  const brandName =
                    product.brand && typeof product.brand === "object"
                      ? (product.brand as { name?: string }).name
                      : undefined;

                  return (
                    <div
                      key={id(product._id)}
                      className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold">{product.name}</span>
                            <Badge
                              variant={
                                product.status === "ACTIVE"
                                  ? "success"
                                  : product.status === "DRAFT"
                                    ? "warning"
                                    : "secondary"
                              }
                            >
                              {prettyStatus(product.status)}
                            </Badge>
                            <Badge variant="outline">{product.productType}</Badge>
                          </div>
                          <p className="mt-1 text-xs text-neutral-500">
                            {brandName ? `${brandName} · ` : ""}
                            {productCategory} · /{product.slug}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link href={`/admin/products/${id(product._id)}`}>
                            <Button size="sm" variant="outline">
                              Manage
                              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          {product.status !== "ARCHIVED" ? (
                            <form action={archiveProductAction}>
                              <input type="hidden" name="id" value={id(product._id)} />
                              <Button type="submit" size="sm" variant="destructive">
                                Archive
                              </Button>
                            </form>
                          ) : (
                            <>
                              <form action={unarchiveProductAction}>
                                <input type="hidden" name="id" value={id(product._id)} />
                                <Button type="submit" size="sm" variant="outline">
                                  <Undo2 className="mr-1.5 h-3.5 w-3.5" />
                                  Unarchive
                                </Button>
                              </form>
                              <form action={deleteProductAction}>
                                <input type="hidden" name="id" value={id(product._id)} />
                                <Button type="submit" size="sm" variant="destructive">
                                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                  Delete permanently
                                </Button>
                              </form>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
