import Link from "next/link";
import { Layers, Plus, Pencil, Trash2 } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FieldLabel } from "@/components/admin/field-label";
import { CatalogMessage } from "@/components/admin/catalog-message";
import {
  archiveCategoryAction,
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "@/actions/catalog";
import { getAdminCategories } from "@/lib/catalog";

export const metadata = {
  title: "Categories Management",
};

function categoryId(value: unknown): string {
  return String(value);
}

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string; edit?: string }>;
}) {
  const params = await searchParams;
  const categories = await getAdminCategories();
  const topLevel = categories.filter((category) => !category.parent);
  const children = categories.filter((category) => category.parent);

  return (
    <PageContainer
      title="Categories"
      description="Build the category hierarchy used by the electrical product catalog."
      actions={
        <Badge variant="outline">
          <Layers className="mr-1.5 h-3.5 w-3.5" />
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
              Add Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createCategoryAction} className="space-y-4">
              <div>
                <FieldLabel htmlFor="category-name">Name</FieldLabel>
                <input
                  id="category-name"
                  name="name"
                  required
                  className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none ring-0 focus:border-amber-500 dark:border-neutral-700 dark:bg-neutral-900"
                  placeholder="e.g. Lighting"
                />
              </div>

              <div>
                <FieldLabel htmlFor="category-slug" hint="Leave blank to generate from the name.">
                  Slug
                </FieldLabel>
                <input
                  id="category-slug"
                  name="slug"
                  className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  placeholder="lighting"
                />
              </div>

              <div>
                <FieldLabel htmlFor="category-parent">Parent category</FieldLabel>
                <select
                  id="category-parent"
                  name="parentId"
                  defaultValue=""
                  className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                >
                  <option value="">Top-level category</option>
                  {topLevel.map((category) => (
                    <option
                      key={categoryId(category._id)}
                      value={categoryId(category._id)}
                      disabled={!category.isActive}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel htmlFor="category-description">Description</FieldLabel>
                <textarea
                  id="category-description"
                  name="description"
                  rows={4}
                  className="mt-1.5 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  placeholder="Short catalog description"
                />
              </div>

              <div>
                <FieldLabel htmlFor="category-image" hint="Cloudinary integration arrives later.">
                  Image URL
                </FieldLabel>
                <input
                  id="category-image"
                  name="imageUrl"
                  type="url"
                  className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel htmlFor="category-sort">Sort order</FieldLabel>
                  <input
                    id="category-sort"
                    name="sortOrder"
                    type="number"
                    min="0"
                    defaultValue="0"
                    className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </div>
                <div className="space-y-3 pt-6 text-sm">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="isFeatured" />
                    Featured
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="isActive" defaultChecked />
                    Active
                  </label>
                </div>
              </div>

              <Button type="submit" className="w-full">
                Create Category
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Category Hierarchy ({categories.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
                No categories yet. Create the first top-level category to begin the catalog.
              </div>
            ) : (
              <div className="space-y-3">
                {categories.map((category) => {
                  const parentName = category.parent
                    ? categories.find((candidate) => categoryId(candidate._id) === categoryId(category.parent))?.name
                    : undefined;

                  return (
                    <div
                      key={categoryId(category._id)}
                      className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold">{category.name}</span>
                            <Badge variant={category.isActive ? "success" : "secondary"}>
                              {category.isActive ? "Active" : "Inactive"}
                            </Badge>
                            {category.isFeatured ? <Badge variant="warning">Featured</Badge> : null}
                          </div>
                          <p className="mt-1 text-xs text-neutral-500">
                            {parentName ? `Child of ${parentName} · ` : ""}
                            /{category.slug} · order {category.sortOrder}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`?edit=${encodeURIComponent(categoryId(category._id))}#edit-${categoryId(category._id)}`}
                            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-neutral-300 bg-white px-3 text-xs font-medium text-neutral-800 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-800"
                            aria-expanded={params.edit === categoryId(category._id)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Link>
                          {category.isActive ? (
                            <form action={archiveCategoryAction}>
                              <input type="hidden" name="id" value={categoryId(category._id)} />
                              <Button size="sm" variant="destructive" type="submit">
                                Deactivate
                              </Button>
                            </form>
                          ) : (
                            <form action={deleteCategoryAction}>
                              <input type="hidden" name="id" value={categoryId(category._id)} />
                              <Button size="sm" variant="destructive" type="submit">
                                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                Delete permanently
                              </Button>
                            </form>
                          )}
                        </div>
                      </div>

                      <details id={`edit-${categoryId(category._id)}`} open={params.edit === categoryId(category._id)} className="mt-4">
                        <summary className="cursor-pointer text-xs font-medium text-amber-700 dark:text-amber-400">
                          Edit category fields
                        </summary>
                        <form action={updateCategoryAction} className="mt-4 grid gap-4 md:grid-cols-2">
                          <input type="hidden" name="id" value={categoryId(category._id)} />
                          <div>
                            <FieldLabel htmlFor={`name-${categoryId(category._id)}`}>Name</FieldLabel>
                            <input
                              id={`name-${categoryId(category._id)}`}
                              name="name"
                              defaultValue={category.name}
                              required
                              className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                            />
                          </div>
                          <div>
                            <FieldLabel htmlFor={`slug-${categoryId(category._id)}`}>Slug</FieldLabel>
                            <input
                              id={`slug-${categoryId(category._id)}`}
                              name="slug"
                              defaultValue={category.slug}
                              className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <FieldLabel htmlFor={`desc-${categoryId(category._id)}`}>Description</FieldLabel>
                            <textarea
                              id={`desc-${categoryId(category._id)}`}
                              name="description"
                              rows={3}
                              defaultValue={category.description ?? ""}
                              className="mt-1.5 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                            />
                          </div>
                          <div>
                            <FieldLabel htmlFor={`parent-${categoryId(category._id)}`}>Parent</FieldLabel>
                            <select
                              id={`parent-${categoryId(category._id)}`}
                              name="parentId"
                              defaultValue={category.parent ? categoryId(category.parent) : ""}
                              className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                            >
                              <option value="">Top-level</option>
                              {topLevel
                                .filter((candidate) => categoryId(candidate._id) !== categoryId(category._id))
                                .map((candidate) => (
                                  <option
                                    key={categoryId(candidate._id)}
                                    value={categoryId(candidate._id)}
                                    disabled={!candidate.isActive}
                                  >
                                    {candidate.name}
                                  </option>
                                ))}
                            </select>
                          </div>
                          <div>
                            <FieldLabel htmlFor={`sort-${categoryId(category._id)}`}>Sort order</FieldLabel>
                            <input
                              id={`sort-${categoryId(category._id)}`}
                              name="sortOrder"
                              type="number"
                              min="0"
                              defaultValue={category.sortOrder}
                              className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                            />
                          </div>
                          <div className="flex items-center gap-4 md:col-span-2">
                            <label className="flex items-center gap-2 text-sm">
                              <input type="checkbox" name="isFeatured" defaultChecked={category.isFeatured} />
                              Featured
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                              <input type="checkbox" name="isActive" defaultChecked={category.isActive} />
                              Active
                            </label>
                          </div>
                          <Button type="submit">Save changes</Button>
                        </form>
                      </details>

                      {!category.parent && children.some((child) => categoryId(child.parent) === categoryId(category._id)) ? (
                        <p className="mt-3 text-xs text-neutral-500">
                          Contains child categories; it cannot be deactivated while active children/products depend on it.
                        </p>
                      ) : null}
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
