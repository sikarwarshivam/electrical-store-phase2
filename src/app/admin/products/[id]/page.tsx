import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Boxes, Package, Plus, Save, Archive, Undo2 } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CatalogMessage } from "@/components/admin/catalog-message";
import { FieldLabel } from "@/components/admin/field-label";
import { FocusCreatedVariant } from "@/components/admin/focus-created-variant";
import {
  adjustInventoryAction,
  archiveVariantAction,
  setInventoryStockAction,
  createVariantAction,
  unarchiveProductAction,
  unarchiveVariantAction,
  updateProductAction,
  updateVariantAction,
} from "@/actions/catalog";
import { getAdminBrands, getAdminCategories, getAdminProductById } from "@/lib/catalog";
import { formatINRFromPaise } from "@/lib/money";
import { UnitOfSale } from "@/types/catalog";

export const dynamic = "force-dynamic";

function id(value: unknown) {
  return String(value);
}

const unitOptions: Array<[UnitOfSale, string]> = [
  ["PIECE", "Piece"],
  ["METER", "Meter"],
  ["ROLL", "Roll"],
  ["PACK", "Pack"],
  ["SET", "Set"],
  ["BOX", "Box"],
  ["PAIR", "Pair"],
  ["KG", "Kg"],
  ["GRAM", "Gram"],
  ["LITER", "Liter"],
  ["ML", "Ml"],
  ["OTHER", "Other"],
];

function safeJson(value: unknown) {
  return JSON.stringify(value ?? [], null, 2);
}

export default async function AdminProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    success?: string;
    error?: string;
    createdVariant?: string;
  }>;
}) {
  const [{ id: productId }, messages] = await Promise.all([params, searchParams]);
  const data = await getAdminProductById(productId);

  if (!data) notFound();

  const { product, variants, inventory } = data;
  const createdVariantId = messages.createdVariant || "";
  const [categories, brands] = await Promise.all([
    getAdminCategories(),
    getAdminBrands(),
  ]);

  const topLevel = categories.filter((category) => !category.parent);
  const subcategories = categories.filter((category) => category.parent);
  const activeBrands = brands.filter((brand) => brand.isActive);

  const categoryId = id(product.category);
  const subcategoryId = product.subcategory ? id(product.subcategory) : "";
  const brandId = product.brand ? id(product.brand) : "";

  const inventoryMap = new Map(inventory.map((item) => [id(item.variant), item]));

  return (
    <PageContainer
      title={product.name}
      description={`Manage product metadata, variants, SKU pricing, and inventory setup.`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/products">
            <Button variant="outline">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to Products
            </Button>
          </Link>
          {product.status === "ARCHIVED" ? (
            <form action={unarchiveProductAction}>
              <input type="hidden" name="id" value={productId} />
              <Button type="submit" variant="outline">
                <Undo2 className="mr-1.5 h-4 w-4" />
                Unarchive Product
              </Button>
            </form>
          ) : null}
        </div>
      }
    >
      <CatalogMessage success={messages.success} error={messages.error} />
      <FocusCreatedVariant variantId={createdVariantId} />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4" />
              Product Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateProductAction} className="grid gap-5 md:grid-cols-2">
              <input type="hidden" name="id" value={productId} />

              <div>
                <FieldLabel htmlFor="detail-name">Name</FieldLabel>
                <input
                  id="detail-name"
                  name="name"
                  required
                  defaultValue={product.name}
                  className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>

              <div>
                <FieldLabel htmlFor="detail-slug">Slug</FieldLabel>
                <input
                  id="detail-slug"
                  name="slug"
                  defaultValue={product.slug}
                  className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>

              <div className="md:col-span-2">
                <FieldLabel htmlFor="detail-short">Short description</FieldLabel>
                <input
                  id="detail-short"
                  name="shortDescription"
                  defaultValue={product.shortDescription ?? ""}
                  className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>

              <div className="md:col-span-2">
                <FieldLabel htmlFor="detail-description">Description</FieldLabel>
                <textarea
                  id="detail-description"
                  name="description"
                  rows={5}
                  defaultValue={product.description ?? ""}
                  className="mt-1.5 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>

              <div>
                <FieldLabel htmlFor="detail-category">Category</FieldLabel>
                <select
                  id="detail-category"
                  name="categoryId"
                  required
                  defaultValue={categoryId}
                  className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                >
                  {topLevel.map((category) => (
                    <option
                      key={id(category._id)}
                      value={id(category._id)}
                      disabled={!category.isActive}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel htmlFor="detail-subcategory">Subcategory</FieldLabel>
                <select
                  id="detail-subcategory"
                  name="subcategoryId"
                  defaultValue={subcategoryId}
                  className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                >
                  <option value="">No subcategory</option>
                  {subcategories.map((category) => (
                    <option
                      key={id(category._id)}
                      value={id(category._id)}
                      disabled={!category.isActive}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel htmlFor="detail-brand">Brand</FieldLabel>
                <select
                  id="detail-brand"
                  name="brandId"
                  defaultValue={brandId}
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
                <FieldLabel htmlFor="detail-type">Product type</FieldLabel>
                <select
                  id="detail-type"
                  name="productType"
                  defaultValue={product.productType}
                  className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                >
                  <option value="SIMPLE">Simple</option>
                  <option value="VARIABLE">Variable</option>
                </select>
              </div>

              <div>
                <FieldLabel
                  htmlFor="detail-status"
                  hint={
                    product.status === "ACTIVE"
                      ? "Published to the customer storefront."
                      : "Draft and archived products stay hidden from the customer storefront. Add an active SKU, then set this to Active to publish."
                  }
                >
                  Status
                </FieldLabel>
                <select
                  id="detail-status"
                  name="status"
                  defaultValue={product.status}
                  className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              <div>
                <FieldLabel htmlFor="detail-gst">GST rate</FieldLabel>
                <input
                  id="detail-gst"
                  name="gstRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  defaultValue={product.tax?.gstRate ?? ""}
                  className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>

              <div>
                <FieldLabel htmlFor="detail-hsn" hint="Business/CA supplied value only.">
                  HSN / SAC
                </FieldLabel>
                <input
                  id="detail-hsn"
                  name="hsnCode"
                  defaultValue={product.tax?.hsnCode ?? ""}
                  className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>

              <label className="flex items-center gap-2 pt-7 text-sm">
                <input
                  type="checkbox"
                  name="isGstInclusive"
                  defaultChecked={product.tax?.isGstInclusive ?? true}
                />
                Selling prices are GST-inclusive
              </label>

              <div className="md:col-span-2">
                <FieldLabel htmlFor="detail-keywords">Search keywords</FieldLabel>
                <input
                  id="detail-keywords"
                  name="searchKeywords"
                  defaultValue={product.searchKeywords.join(", ")}
                  className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>

              <div>
                <FieldLabel htmlFor="detail-attrs">Electrical attributes JSON</FieldLabel>
                <textarea
                  id="detail-attrs"
                  name="attributesJson"
                  rows={8}
                  defaultValue={safeJson(product.attributes)}
                  className="mt-1.5 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 font-mono text-xs dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>

              <div>
                <FieldLabel htmlFor="detail-images">Images JSON</FieldLabel>
                <textarea
                  id="detail-images"
                  name="imagesJson"
                  rows={8}
                  defaultValue={safeJson(product.images)}
                  className="mt-1.5 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 font-mono text-xs dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>

              <div className="md:col-span-2">
                <Button type="submit">
                  <Save className="mr-1.5 h-4 w-4" />
                  Save Product
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-4 text-base">
              <span className="flex items-center gap-2">
                <Boxes className="h-4 w-4" />
                Variants & SKUs ({variants.length})
              </span>
              <Badge variant="outline">
                {product.productType === "VARIABLE" ? "Multi-SKU" : "Single-SKU"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
              <p className="font-semibold">Unit-of-sale rule</p>
              <p className="mt-1 text-xs leading-5">
                A variant price is the price of one selected sale unit. For example, a cable sold by meter
                uses a per-meter price, while a roll uses a per-roll price. Quantity can be decimal for measurable units.
              </p>
            </div>

            <form action={createVariantAction} className="rounded-lg border border-dashed border-neutral-300 p-4 dark:border-neutral-700">
              <input type="hidden" name="productId" value={productId} />
              <div className="mb-4 flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span className="font-semibold">Add SKU / Variant</span>
              </div>

              {product.productType === "SIMPLE" && variants.length > 0 ? (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
                  <p className="font-semibold">This product is currently Simple.</p>
                  <p className="mt-1 text-xs leading-5">
                    A Simple product supports one non-archived SKU. To add another variant, change
                    <strong> Product type</strong> to <strong>Variable</strong> in Product Details, save the product,
                    and then create the new SKU here.
                  </p>
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <FieldLabel htmlFor="variant-sku" hint="Globally unique; stored uppercase.">
                    SKU
                  </FieldLabel>
                  <input
                    id="variant-sku"
                    name="sku"
                    required
                    placeholder="STORE-LED-12W-6500K"
                    className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="variant-title">Variant title</FieldLabel>
                  <input
                    id="variant-title"
                    name="title"
                    placeholder="12W 6500K"
                    className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="variant-unit">Unit of sale</FieldLabel>
                  <select
                    id="variant-unit"
                    name="unitOfSale"
                    defaultValue="PIECE"
                    className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  >
                    {unitOptions.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel htmlFor="variant-price">Selling price (₹)</FieldLabel>
                  <input
                    id="variant-price"
                    name="price"
                    required
                    inputMode="decimal"
                    placeholder="149.00"
                    className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="variant-mrp">MRP (₹)</FieldLabel>
                  <input
                    id="variant-mrp"
                    name="mrp"
                    required
                    inputMode="decimal"
                    placeholder="199.00"
                    className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </div>

                <div>
                  <FieldLabel
                    htmlFor="variant-stock"
                    hint="Used only when creating this SKU. To change stock later, use the Inventory adjustment below."
                  >
                    Initial stock (new SKU)
                  </FieldLabel>
                  <input
                    id="variant-stock"
                    name="initialStock"
                    type="number"
                    min="0"
                    step="0.001"
                    defaultValue="0"
                    className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="variant-min">Minimum order quantity</FieldLabel>
                  <input
                    id="variant-min"
                    name="minOrderQuantity"
                    type="number"
                    min="0.001"
                    step="0.001"
                    defaultValue="1"
                    className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="variant-step">Order quantity step</FieldLabel>
                  <input
                    id="variant-step"
                    name="orderQuantityStep"
                    type="number"
                    min="0.001"
                    step="0.001"
                    defaultValue="1"
                    className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="variant-low">Low-stock threshold</FieldLabel>
                  <input
                    id="variant-low"
                    name="lowStockThreshold"
                    type="number"
                    min="0"
                    step="0.001"
                    defaultValue="5"
                    className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="variant-status">Status</FieldLabel>
                  <select
                    id="variant-status"
                    name="status"
                    defaultValue="ACTIVE"
                    className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>

                <div>
                  <FieldLabel htmlFor="variant-image">Variant image URL</FieldLabel>
                  <input
                    id="variant-image"
                    name="imageUrl"
                    type="url"
                    className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </div>

                <div>
                  <FieldLabel htmlFor="variant-image-alt">Variant image alt text</FieldLabel>
                  <input
                    id="variant-image-alt"
                    name="imageAlt"
                    className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </div>

                <div className="md:col-span-3">
                  <FieldLabel
                    htmlFor="variant-options"
                    hint='JSON array, e.g. [{"name":"wattage","value":"12W"},{"name":"colorTemperature","value":"6500K"}]'
                  >
                    Variant options JSON
                  </FieldLabel>
                  <textarea
                    id="variant-options"
                    name="optionsJson"
                    rows={4}
                    className="mt-1.5 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 font-mono text-xs dark:border-neutral-700 dark:bg-neutral-900"
                    placeholder="[]"
                  />
                </div>

                <div className="md:col-span-3">
                  <FieldLabel
                    htmlFor="variant-attributes"
                    hint='Use variant-level electrical specs only when they differ between SKUs.'
                  >
                    Variant attributes JSON
                  </FieldLabel>
                  <textarea
                    id="variant-attributes"
                    name="attributesJson"
                    rows={5}
                    className="mt-1.5 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 font-mono text-xs dark:border-neutral-700 dark:bg-neutral-900"
                    placeholder="[]"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm md:col-span-3">
                  <input type="checkbox" name="trackInventory" defaultChecked />
                  Track inventory for this SKU
                </label>
              </div>

              <Button
                type="submit"
                className="mt-4"
                disabled={product.productType === "SIMPLE" && variants.length > 0}
              >
                Create Variant
              </Button>
            </form>

            {variants.length === 0 ? (
              <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
                No SKUs created yet.
              </div>
            ) : (
              <div className="space-y-4">
                {variants.map((variant) => {
                  const stock = inventoryMap.get(id(variant._id));
                  return (
                    <details
                      id={"variant-" + id(variant._id)}
                      key={id(variant._id)}
                      open={createdVariantId === id(variant._id)}
                      className="scroll-mt-24 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
                    >
                      <summary className="cursor-pointer list-none">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold">{variant.sku}</span>
                              {variant.isDefault ? <Badge variant="warning">Default</Badge> : null}
                              <Badge
                                variant={
                                  variant.status === "ACTIVE"
                                    ? "success"
                                    : variant.status === "INACTIVE"
                                      ? "secondary"
                                      : "outline"
                                }
                              >
                                {variant.status}
                              </Badge>
                            </div>
                            <p className="mt-1 text-xs text-neutral-500">
                              {variant.title ? `${variant.title} · ` : ""}
                              {formatINRFromPaise(variant.pricePaise)} / {variant.unitOfSale.toLowerCase()}
                              {" · "}stock {stock?.availableQuantity ?? 0}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">
                              {formatINRFromPaise(variant.pricePaise)}
                            </span>
                          </div>
                        </div>
                      </summary>

                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <form action={updateVariantAction} className="space-y-4 rounded-lg bg-neutral-50 p-4 dark:bg-neutral-900/60">
                          <input type="hidden" name="id" value={id(variant._id)} />
                          <input type="hidden" name="productId" value={productId} />

                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <FieldLabel htmlFor={`edit-sku-${id(variant._id)}`}>SKU</FieldLabel>
                              <input
                                id={`edit-sku-${id(variant._id)}`}
                                name="sku"
                                required
                                defaultValue={variant.sku}
                                className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                              />
                            </div>
                            <div>
                              <FieldLabel htmlFor={`edit-title-${id(variant._id)}`}>Title</FieldLabel>
                              <input
                                id={`edit-title-${id(variant._id)}`}
                                name="title"
                                defaultValue={variant.title ?? ""}
                                className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                              />
                            </div>
                            <div>
                              <FieldLabel htmlFor={`edit-price-${id(variant._id)}`}>Selling price (₹)</FieldLabel>
                              <input
                                id={`edit-price-${id(variant._id)}`}
                                name="price"
                                required
                                defaultValue={(variant.pricePaise / 100).toFixed(2)}
                                className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                              />
                            </div>
                            <div>
                              <FieldLabel htmlFor={`edit-mrp-${id(variant._id)}`}>MRP (₹)</FieldLabel>
                              <input
                                id={`edit-mrp-${id(variant._id)}`}
                                name="mrp"
                                required
                                defaultValue={(variant.mrpPaise / 100).toFixed(2)}
                                className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                              />
                            </div>
                            <div>
                              <FieldLabel htmlFor={`edit-unit-${id(variant._id)}`}>Unit of sale</FieldLabel>
                              <select
                                id={`edit-unit-${id(variant._id)}`}
                                name="unitOfSale"
                                defaultValue={variant.unitOfSale}
                                className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                              >
                                {unitOptions.map(([value, label]) => (
                                  <option key={value} value={value}>{label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <FieldLabel htmlFor={`edit-status-${id(variant._id)}`}>Status</FieldLabel>
                              <select
                                id={`edit-status-${id(variant._id)}`}
                                name="status"
                                defaultValue={variant.status}
                                className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                              >
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                              </select>
                            </div>
                            <div>
                              <FieldLabel htmlFor={`edit-min-${id(variant._id)}`}>Minimum quantity</FieldLabel>
                              <input
                                id={`edit-min-${id(variant._id)}`}
                                name="minOrderQuantity"
                                type="number"
                                min="0.001"
                                step="0.001"
                                defaultValue={variant.minOrderQuantity}
                                className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                              />
                            </div>
                            <div>
                              <FieldLabel htmlFor={`edit-step-${id(variant._id)}`}>Order step</FieldLabel>
                              <input
                                id={`edit-step-${id(variant._id)}`}
                                name="orderQuantityStep"
                                type="number"
                                min="0.001"
                                step="0.001"
                                defaultValue={variant.orderQuantityStep}
                                className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                              />
                            </div>
                            <div>
                              <FieldLabel htmlFor={`edit-low-${id(variant._id)}`}>Low-stock threshold</FieldLabel>
                              <input
                                id={`edit-low-${id(variant._id)}`}
                                name="lowStockThreshold"
                                type="number"
                                min="0"
                                step="0.001"
                                defaultValue={stock?.lowStockThreshold ?? 5}
                                className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                              />
                            </div>
                            <div>
                              <FieldLabel htmlFor={`edit-img-${id(variant._id)}`}>Image URL</FieldLabel>
                              <input
                                id={`edit-img-${id(variant._id)}`}
                                name="imageUrl"
                                type="url"
                                defaultValue={variant.imageUrl ?? ""}
                                className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                              />
                            </div>
                            <div>
                              <FieldLabel htmlFor={`edit-imgalt-${id(variant._id)}`}>Image alt</FieldLabel>
                              <input
                                id={`edit-imgalt-${id(variant._id)}`}
                                name="imageAlt"
                                defaultValue={variant.imageAlt ?? ""}
                                className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                              />
                            </div>
                            <label className="flex items-center gap-2 pt-7 text-sm sm:col-span-2">
                              <input
                                type="checkbox"
                                name="trackInventory"
                                defaultChecked={variant.trackInventory}
                              />
                              Track inventory
                            </label>
                          </div>

                          <div>
                            <FieldLabel htmlFor={`edit-options-${id(variant._id)}`}>Options JSON</FieldLabel>
                            <textarea
                              id={`edit-options-${id(variant._id)}`}
                              name="optionsJson"
                              rows={4}
                              defaultValue={safeJson(variant.options)}
                              className="mt-1.5 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 font-mono text-xs dark:border-neutral-700 dark:bg-neutral-900"
                            />
                          </div>

                          <div>
                            <FieldLabel htmlFor={`edit-attrs-${id(variant._id)}`}>Attributes JSON</FieldLabel>
                            <textarea
                              id={`edit-attrs-${id(variant._id)}`}
                              name="attributesJson"
                              rows={5}
                              defaultValue={safeJson(variant.attributes)}
                              className="mt-1.5 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 font-mono text-xs dark:border-neutral-700 dark:bg-neutral-900"
                            />
                          </div>

                          <Button type="submit">
                            <Save className="mr-1.5 h-4 w-4" />
                            Save Variant
                          </Button>
                        </form>

                        <div className="space-y-4">
                          <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold">Inventory</p>
                                <p className="mt-1 text-xs text-neutral-500">
                                  Stock quantity is managed separately from SKU details so every change can be recorded.
                                </p>
                              </div>
                              <Badge variant="outline">Live stock</Badge>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs text-neutral-500">Available</p>
                                <p className="text-xl font-bold">{stock?.availableQuantity ?? 0}</p>
                              </div>
                              <div>
                                <p className="text-xs text-neutral-500">Reserved</p>
                                <p className="text-xl font-bold">{stock?.reservedQuantity ?? 0}</p>
                              </div>
                              <div>
                                <p className="text-xs text-neutral-500">Status</p>
                                <Badge
                                  variant={
                                    stock?.stockStatus === "IN_STOCK"
                                      ? "success"
                                      : stock?.stockStatus === "LOW_STOCK"
                                        ? "warning"
                                        : "destructive"
                                  }
                                >
                                  {stock?.stockStatus ?? "OUT_OF_STOCK"}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-xs text-neutral-500">Unit</p>
                                <p className="text-sm font-semibold">{stock?.stockUnit ?? variant.unitOfSale}</p>
                              </div>
                            </div>

                            {variant.status !== "ARCHIVED" && stock?.trackInventory !== false ? (
                              <form action={adjustInventoryAction} className="mt-5 border-t border-neutral-200 pt-4 dark:border-neutral-800">
                                <input type="hidden" name="variantId" value={id(variant._id)} />
                                <input type="hidden" name="returnPath" value={"/admin/products/" + productId} />

                                <div>
                                  <p className="text-sm font-semibold">Adjust stock</p>
                                  <p className="mt-1 text-xs leading-5 text-neutral-500">
                                    Enter a positive number to add stock or a negative number to remove stock.
                                    Every adjustment is recorded in inventory history.
                                  </p>
                                </div>

                                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1.5fr_auto] sm:items-end">
                                  <div>
                                    <FieldLabel htmlFor={"stock-adjust-" + id(variant._id)}>
                                      Quantity adjustment
                                    </FieldLabel>
                                    <input
                                      id={"stock-adjust-" + id(variant._id)}
                                      name="quantityDelta"
                                      type="number"
                                      step="0.001"
                                      required
                                      placeholder="+10 or -2"
                                      className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                                    />
                                  </div>

                                  <div>
                                    <FieldLabel htmlFor={"stock-reason-" + id(variant._id)}>
                                      Reason
                                    </FieldLabel>
                                    <input
                                      id={"stock-reason-" + id(variant._id)}
                                      name="reason"
                                      required
                                      minLength={3}
                                      maxLength={200}
                                      placeholder="New shipment, stock correction..."
                                      className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                                    />
                                  </div>

                                  <Button type="submit" className="h-10">
                                    <Save className="mr-1.5 h-4 w-4" />
                                    Save stock
                                  </Button>
                                </div>
                              </form>
                            ) : (
                              <div className="mt-5 rounded-md bg-neutral-50 p-3 text-xs text-neutral-500 dark:bg-neutral-900">
                                {variant.status === "ARCHIVED"
                                  ? "Archived SKUs cannot receive stock adjustments."
                                  : "Inventory tracking is disabled for this SKU."}
                              </div>
                            )}
                          </div>

                          {variant.status !== "ARCHIVED" && stock?.trackInventory !== false ? (
                            <div className="mb-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
                              <p className="text-sm font-semibold">Set exact stock</p>
                              <p className="mt-1 text-xs leading-5 text-neutral-500">
                                Set the current available quantity directly. The difference is recorded as a stock correction.
                              </p>

                              <form action={setInventoryStockAction} className="mt-3 space-y-3">
                                <input type="hidden" name="variantId" value={id(variant._id)} />
                                <input type="hidden" name="returnPath" value={"/admin/products/" + productId} />
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <div>
                                    <FieldLabel htmlFor={"set-stock-" + id(variant._id)}>
                                      Available stock
                                    </FieldLabel>
                                    <input
                                      id={"set-stock-" + id(variant._id)}
                                      name="availableQuantity"
                                      type="number"
                                      min="0"
                                      step="0.001"
                                      required
                                      defaultValue={stock?.availableQuantity ?? 0}
                                      className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                                    />
                                  </div>
                                  <div>
                                    <FieldLabel htmlFor={"set-stock-reason-" + id(variant._id)}>
                                      Reason
                                    </FieldLabel>
                                    <input
                                      id={"set-stock-reason-" + id(variant._id)}
                                      name="reason"
                                      required
                                      minLength={3}
                                      maxLength={200}
                                      placeholder="Physical count, opening correction..."
                                      className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                                    />
                                  </div>
                                </div>
                                <Button type="submit" variant="outline">
                                  <Save className="mr-1.5 h-4 w-4" />
                                  Set stock
                                </Button>
                              </form>
                            </div>
                          ) : null}

                          {variant.status === "ARCHIVED" ? (
                            <form action={unarchiveVariantAction}>
                              <input type="hidden" name="id" value={id(variant._id)} />
                              <input type="hidden" name="productId" value={productId} />
                              <Button type="submit" variant="outline" className="w-full">
                                <Undo2 className="mr-1.5 h-4 w-4" />
                                Unarchive SKU
                              </Button>
                            </form>
                          ) : (
                            <form action={archiveVariantAction}>
                              <input type="hidden" name="id" value={id(variant._id)} />
                              <input type="hidden" name="productId" value={productId} />
                              <Button type="submit" variant="destructive" className="w-full">
                                <Archive className="mr-1.5 h-4 w-4" />
                                Archive SKU
                              </Button>
                            </form>
                          )}
                        </div>
                      </div>
                    </details>
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
