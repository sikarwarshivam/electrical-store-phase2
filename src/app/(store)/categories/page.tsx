/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowRight, FolderTree, PackageSearch } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { getPublicCategories } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Categories",
  description: "Browse the electrical store by product category and subcategory.",
};

export default async function CategoriesPage() {
  const categories = await getPublicCategories();

  return (
    <PageContainer
      title="Categories"
      description="Browse electrical supplies through the store's category hierarchy."
    >
      {categories.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <article
              key={category.id}
              className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950"
            >
              <Link href={"/categories/" + category.slug} className="group block">
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
                      <FolderTree className="h-12 w-12" />
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold group-hover:text-amber-700 dark:group-hover:text-amber-400">
                        {category.name}
                      </h2>
                      {category.description ? (
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-neutral-500">
                          {category.description}
                        </p>
                      ) : null}
                    </div>
                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-600" />
                  </div>
                </div>
              </Link>

              {category.children.length > 0 ? (
                <div className="border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
                  <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                    <PackageSearch className="h-3.5 w-3.5" />
                    Subcategories
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {category.children.slice(0, 6).map((child) => (
                      <Link key={child.id} href={"/categories/" + child.slug}>
                        <Badge variant="outline" className="hover:border-amber-400 hover:text-amber-700 dark:hover:text-amber-300">
                          {child.name}
                        </Badge>
                      </Link>
                    ))}
                    {category.children.length > 6 ? (
                      <span className="text-[11px] text-neutral-400">
                        +{category.children.length - 6} more
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center dark:border-neutral-800 dark:bg-neutral-950">
          <FolderTree className="mx-auto h-10 w-10 text-neutral-400" />
          <p className="mt-4 font-semibold">No categories are published yet.</p>
          <p className="mt-2 text-sm text-neutral-500">
            Add active categories from the admin catalog before publishing products.
          </p>
        </div>
      )}
    </PageContainer>
  );
}
