import Link from "next/link";
import { ArrowLeft, Megaphone } from "lucide-react";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CatalogMessage } from "@/components/admin/catalog-message";
import { CloudinaryImageUpload } from "@/components/admin/cloudinary-image-upload";
import { getAdminCampaign, updateCampaignAction } from "@/actions/campaign";
import { getAdminProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

function id(value: unknown) {
  return String(value);
}

function formatDateTimeLocal(value: Date) {
  const date = new Date(value);
  const pad = (number: number) => String(number).padStart(2, "0");
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    "T" +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes())
  );
}

export default async function EditCampaignPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id: campaignId } = await params;
  const query = await searchParams;
  const [campaign, products] = await Promise.all([
    getAdminCampaign(campaignId),
    getAdminProducts(200),
  ]);

  if (!campaign) notFound();

  const selected = new Set(campaign.productIds.map((value) => String(value)));
  const activeProducts = products.filter((product) => product.status === "ACTIVE");

  return (
    <PageContainer
      title="Edit Festival Campaign"
      description="Update campaign artwork, schedule, curated products, or publishing status."
      actions={
        <Link href="/admin/campaigns">
          <Button type="button" variant="outline">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to campaigns
          </Button>
        </Link>
      }
    >
      <CatalogMessage error={query.error} />

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Megaphone className="h-4 w-4 text-amber-600" />
            Campaign details
          </CardTitle>
          <CardDescription>
            Current catalog prices and stock continue to come from the product records.
            Campaign-specific pricing and bundle SKUs are intentionally not added here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateCampaignAction} className="space-y-4">
            <input type="hidden" name="campaignId" value={campaignId} />

            <div>
              <label className="text-xs font-semibold">Campaign name</label>
              <input
                name="name"
                required
                maxLength={140}
                defaultValue={campaign.name}
                className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold">Slug</label>
                <input
                  name="slug"
                  maxLength={160}
                  required
                  defaultValue={campaign.slug}
                  className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Display order</label>
                <input
                  name="sortOrder"
                  type="number"
                  min="0"
                  max="10000"
                  defaultValue={String(campaign.sortOrder)}
                  className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold">Subtitle</label>
              <input
                name="subtitle"
                maxLength={220}
                defaultValue={campaign.subtitle || ""}
                className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>

            <div>
              <label className="text-xs font-semibold">Description</label>
              <textarea
                name="description"
                rows={4}
                maxLength={2000}
                defaultValue={campaign.description || ""}
                className="mt-1.5 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>

            <div>
              <label className="text-xs font-semibold">Campaign banner</label>
              <div className="mt-1.5">
                <CloudinaryImageUpload
                  folder="banners"
                  hiddenName="imageUrl"
                  initialUrl={campaign.imageUrl}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold">Starts</label>
                <input
                  name="startsAt"
                  type="datetime-local"
                  required
                  defaultValue={formatDateTimeLocal(campaign.startsAt)}
                  className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Expires</label>
                <input
                  name="expiresAt"
                  type="datetime-local"
                  required
                  defaultValue={formatDateTimeLocal(campaign.expiresAt)}
                  className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>
            </div>

            <div>
              <div className="mb-2">
                <label className="text-xs font-semibold">Curated products</label>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Select 1–24 active products. Existing inactive products must be replaced before saving.
                </p>
              </div>

              <div className="max-h-96 space-y-1.5 overflow-y-auto rounded-lg border border-neutral-200 p-2 dark:border-neutral-800">
                {activeProducts.map((product) => (
                  <label
                    key={id(product._id)}
                    className="flex cursor-pointer items-start gap-2 rounded-md px-2.5 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900"
                  >
                    <input
                      type="checkbox"
                      name="productIds"
                      value={id(product._id)}
                      defaultChecked={selected.has(id(product._id))}
                      className="mt-0.5"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold">
                        {product.name}
                      </span>
                      <span className="block truncate text-[11px] text-neutral-500">
                        {product.category && typeof product.category === "object"
                          ? String(
                              (product.category as { name?: string }).name ||
                                "Electrical"
                            )
                          : "Electrical"}
                        {product.brand && typeof product.brand === "object"
                          ? " · " +
                            String(
                              (product.brand as { name?: string }).name || ""
                            )
                          : ""}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                name="isActive"
                type="checkbox"
                defaultChecked={campaign.isActive}
              />
              Active
            </label>

            <div className="flex gap-2">
              <Button type="submit">Save changes</Button>
              <Link href="/admin/campaigns">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </PageContainer>
  );
}