import Image from "next/image";
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
              className="group overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-lg hover:shadow-neutral-900/5 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-amber-800"
            >
              <Link href={"/categories/" + category.slug} className="block">
                <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                  {category.imageUrl ? (
                    <Image
                      src={category.imageUrl}
                      alt={category.name}
                      fill
                      sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06] group-hover:translate-x-0.5 motion-reduce:transition-none"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-neutral-400">
                      <FolderTree className="h-12 w-12" />
                    </div>
                  )}

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-neutral-950/75 via-neutral-950/20 to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <div className="flex items-end justify-between gap-3">
                      <div className="min-w-0 rounded-lg bg-neutral-950/55 px-3 py-2 backdrop-blur-[2px]">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">
                          Electrical category
                        </p>
                        <h2 className="mt-0.5 truncate text-base font-bold tracking-tight text-white drop-shadow-sm sm:text-lg">
                          {category.name}
                        </h2>
                      </div>

                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-md transition-all duration-300 group-hover:translate-x-0.5 group-hover:border-amber-400 group-hover:bg-amber-600">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 dark:bg-neutral-950">
                  {category.description ? (
                    <p className="line-clamp-2 text-xs leading-5 text-neutral-500">
                      {category.description}
                    </p>
                  ) : (
                    <p className="text-xs font-medium text-neutral-500">
                      Explore products in this category
                    </p>
                  )}
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
                        <Badge
                          variant="outline"
                          className="bg-white transition-colors hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 dark:bg-neutral-950 dark:hover:border-amber-700 dark:hover:bg-amber-950/30 dark:hover:text-amber-300"
                        >
                          {child.name}
                        </Badge>
                      </Link>
                    ))}
                    {category.children.length > 6 ? (
                      <span className="px-1 py-0.5 text-[11px] text-neutral-400">
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
