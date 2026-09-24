import { BadgeCheck, Plus, Pencil } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FieldLabel } from "@/components/admin/field-label";
import { CatalogMessage } from "@/components/admin/catalog-message";
import { archiveBrandAction, createBrandAction, updateBrandAction } from "@/actions/catalog";
import { getAdminBrands } from "@/lib/catalog";

export const metadata = {
  title: "Brands Management",
};

function id(value: unknown) {
  return String(value);
}

export default async function AdminBrandsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const params = await searchParams;
  const brands = await getAdminBrands();

  return (
    <PageContainer
      title="Brands"
      description="Maintain the manufacturers and brands shown across the product catalog."
      actions={
        <Badge variant="outline">
          <BadgeCheck className="mr-1.5 h-3.5 w-3.5" />
          Catalog
        </Badge>
      }
    >
      <CatalogMessage success={params.success} error={params.error} />

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus className="h-4 w-4" />
              Add Brand
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createBrandAction} className="space-y-4">
              <div>
                <FieldLabel htmlFor="brand-name">Name</FieldLabel>
                <input
                  id="brand-name"
                  name="name"
                  required
                  className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  placeholder="Brand name"
                />
              </div>
              <div>
                <FieldLabel htmlFor="brand-slug" hint="Leave blank to generate from the name.">
                  Slug
                </FieldLabel>
                <input
                  id="brand-slug"
                  name="slug"
                  className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  placeholder="brand-name"
                />
              </div>
              <div>
                <FieldLabel htmlFor="brand-description">Description</FieldLabel>
                <textarea
                  id="brand-description"
                  name="description"
                  rows={4}
                  className="mt-1.5 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>
              <div>
                <FieldLabel htmlFor="brand-logo">Logo URL</FieldLabel>
                <input
                  id="brand-logo"
                  name="logoUrl"
                  type="url"
                  className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>
              <div>
                <FieldLabel htmlFor="brand-website">Website</FieldLabel>
                <input
                  id="brand-website"
                  name="website"
                  type="url"
                  className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel htmlFor="brand-sort">Sort order</FieldLabel>
                  <input
                    id="brand-sort"
                    name="sortOrder"
                    type="number"
                    min="0"
                    defaultValue="0"
                    className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </div>
                <label className="flex items-center gap-2 pt-7 text-sm">
                  <input type="checkbox" name="isActive" defaultChecked />
                  Active
                </label>
              </div>
              <Button type="submit" className="w-full">
                Create Brand
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Brands ({brands.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {brands.length === 0 ? (
              <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
                No brands yet. Add the manufacturers your store actually sells.
              </div>
            ) : (
              <div className="space-y-3">
                {brands.map((brand) => (
                  <div
                    key={id(brand._id)}
                    className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{brand.name}</span>
                          <Badge variant={brand.isActive ? "success" : "secondary"}>
                            {brand.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-neutral-500">
                          /{brand.slug} · order {brand.sortOrder}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <a href={`#edit-${id(brand._id)}`}>
                          <Button size="sm" variant="outline">
                            <Pencil className="mr-1.5 h-3.5 w-3.5" />
                            Edit
                          </Button>
                        </a>
                        {brand.isActive ? (
                          <form action={archiveBrandAction}>
                            <input type="hidden" name="id" value={id(brand._id)} />
                            <Button size="sm" variant="destructive" type="submit">
                              Deactivate
                            </Button>
                          </form>
                        ) : null}
                      </div>
                    </div>

                    <details id={`edit-${id(brand._id)}`} className="mt-4">
                      <summary className="cursor-pointer text-xs font-medium text-amber-700 dark:text-amber-400">
                        Edit brand fields
                      </summary>
                      <form action={updateBrandAction} className="mt-4 grid gap-4 md:grid-cols-2">
                        <input type="hidden" name="id" value={id(brand._id)} />
                        <div>
                          <FieldLabel htmlFor={`brand-name-${id(brand._id)}`}>Name</FieldLabel>
                          <input
                            id={`brand-name-${id(brand._id)}`}
                            name="name"
                            required
                            defaultValue={brand.name}
                            className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                          />
                        </div>
                        <div>
                          <FieldLabel htmlFor={`brand-slug-${id(brand._id)}`}>Slug</FieldLabel>
                          <input
                            id={`brand-slug-${id(brand._id)}`}
                            name="slug"
                            defaultValue={brand.slug}
                            className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <FieldLabel htmlFor={`brand-desc-${id(brand._id)}`}>Description</FieldLabel>
                          <textarea
                            id={`brand-desc-${id(brand._id)}`}
                            name="description"
                            rows={3}
                            defaultValue={brand.description ?? ""}
                            className="mt-1.5 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                          />
                        </div>
                        <div>
                          <FieldLabel htmlFor={`brand-logo-${id(brand._id)}`}>Logo URL</FieldLabel>
                          <input
                            id={`brand-logo-${id(brand._id)}`}
                            name="logoUrl"
                            type="url"
                            defaultValue={brand.logoUrl ?? ""}
                            className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                          />
                        </div>
                        <div>
                          <FieldLabel htmlFor={`brand-website-${id(brand._id)}`}>Website</FieldLabel>
                          <input
                            id={`brand-website-${id(brand._id)}`}
                            name="website"
                            type="url"
                            defaultValue={brand.website ?? ""}
                            className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                          />
                        </div>
                        <div>
                          <FieldLabel htmlFor={`brand-sort-${id(brand._id)}`}>Sort order</FieldLabel>
                          <input
                            id={`brand-sort-${id(brand._id)}`}
                            name="sortOrder"
                            type="number"
                            min="0"
                            defaultValue={brand.sortOrder}
                            className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                          />
                        </div>
                        <label className="flex items-center gap-2 pt-7 text-sm">
                          <input type="checkbox" name="isActive" defaultChecked={brand.isActive} />
                          Active
                        </label>
                        <Button type="submit">Save changes</Button>
                      </form>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
