import Link from "next/link";
import { Megaphone, Pencil, Plus } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CatalogMessage } from "@/components/admin/catalog-message";
import { CloudinaryImageUpload } from "@/components/admin/cloudinary-image-upload";
import {
  createCampaignAction,
  deleteCampaignAction,
  getAdminCampaigns,
  toggleCampaignAction,
} from "@/actions/campaign";
import { getAdminProducts } from "@/lib/catalog";

export const metadata = { title: "Festival Campaigns" };
export const dynamic = "force-dynamic";

function id(value: unknown) {
  return String(value);
}

function formatDate(value: Date) {
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusFor(
  campaign: { isActive: boolean; startsAt: Date; expiresAt: Date },
  now: number
) {
  if (!campaign.isActive) return { label: "Inactive", variant: "secondary" as const };
  if (new Date(campaign.expiresAt).getTime() <= now) {
    return { label: "Expired", variant: "destructive" as const };
  }
  if (new Date(campaign.startsAt).getTime() > now) {
    return { label: "Scheduled", variant: "warning" as const };
  }
  return { label: "Active", variant: "success" as const };
}

export default async function AdminCampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const params = await searchParams;
  const [{ campaigns, now }, products] = await Promise.all([
    getAdminCampaigns(),
    getAdminProducts(200),
  ]);

  const activeProducts = products.filter((product) => product.status === "ACTIVE");

  return (
    <PageContainer
      title="Festival Campaigns"
      description="Create reusable seasonal landing pages with a campaign banner and a curated product grid."
      actions={
        <Badge variant="outline">
          <Megaphone className="mr-1.5 h-3.5 w-3.5" />
          {campaigns.length} campaign{campaigns.length === 1 ? "" : "s"}
        </Badge>
      }
    >
      <CatalogMessage success={params.success} error={params.error} />

      <div className="grid gap-6 xl:grid-cols-[430px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus className="h-4 w-4" />
              Create campaign
            </CardTitle>
            <CardDescription>
              Use approved campaign artwork and select 1–24 active catalog products.
              Campaign pages reuse the products&apos; current price and stock.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createCampaignAction} className="space-y-4">
              <div>
                <label className="text-xs font-semibold">Campaign name</label>
                <input
                  name="name"
                  required
                  maxLength={140}
                  placeholder="Diwali Lighting"
                  className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold">Slug</label>
                <input
                  name="slug"
                  maxLength={160}
                  placeholder="diwali-lighting"
                  className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
                <p className="mt-1 text-xs text-neutral-500">
                  Leave blank to generate from the campaign name.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold">Subtitle</label>
                <input
                  name="subtitle"
                  maxLength={220}
                  placeholder="Brighten every corner this festive season."
                  className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold">Description</label>
                <textarea
                  name="description"
                  rows={4}
                  maxLength={2000}
                  placeholder="Campaign introduction shown above the curated product grid."
                  className="mt-1.5 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold">Campaign banner</label>
                <div className="mt-1.5">
                  <CloudinaryImageUpload folder="banners" hiddenName="imageUrl" />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold">Starts</label>
                  <input
                    name="startsAt"
                    type="datetime-local"
                    required
                    className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold">Expires</label>
                  <input
                    name="expiresAt"
                    type="datetime-local"
                    required
                    className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold">Display order</label>
                <input
                  name="sortOrder"
                  type="number"
                  min="0"
                  max="10000"
                  defaultValue="0"
                  className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-semibold">Curated products</label>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      Choose up to 24 active products. Order follows this list.
                    </p>
                  </div>
                  <span className="text-[11px] text-neutral-500">
                    {activeProducts.length} available
                  </span>
                </div>

                <div className="max-h-80 space-y-1.5 overflow-y-auto rounded-lg border border-neutral-200 p-2 dark:border-neutral-800">
                  {activeProducts.map((product) => (
                    <label
                      key={id(product._id)}
                      className="flex cursor-pointer items-start gap-2 rounded-md px-2.5 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-900"
                    >
                      <input
                        type="checkbox"
                        name="productIds"
                        value={id(product._id)}
                        className="mt-0.5"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold">
                          {product.name}
                        </span>
                        <span className="block truncate text-[11px] text-neutral-500">
                          {product.brand && typeof product.brand === "object"
                            ? String((product.brand as { name?: string }).name || "") + " · "
                            : ""}
                          {product.category && typeof product.category === "object"
                            ? String(
                                (product.category as { name?: string }).name ||
                                  "Electrical"
                              )
                            : "Electrical"}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input name="isActive" type="checkbox" defaultChecked />
                Active
              </label>

              <Button type="submit" className="w-full">
                Create campaign
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {campaigns.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center text-sm text-neutral-500">
                No festival campaigns created yet.
              </CardContent>
            </Card>
          ) : (
            campaigns.map((campaign) => {
              const status = statusFor(campaign, now);
              return (
                <Card key={id(campaign._id)}>
                  <CardContent className="p-5">
                    <div className="grid gap-4 lg:grid-cols-[190px_1fr_auto] lg:items-start">
                      <div className="aspect-[16/9] overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
                        <img
                          src={campaign.imageUrl}
                          alt={campaign.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-bold">{campaign.name}</h2>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        {campaign.subtitle ? (
                          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                            {campaign.subtitle}
                          </p>
                        ) : null}
                        <div className="mt-2 grid gap-1 text-xs text-neutral-500 sm:grid-cols-2">
                          <span>Starts: {formatDate(campaign.startsAt)}</span>
                          <span>Expires: {formatDate(campaign.expiresAt)}</span>
                          <span>Products: {campaign.productIds.length}</span>
                          <span>Order: {campaign.sortOrder}</span>
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-2 lg:flex-col">
                        <Link href={"/admin/campaigns/" + id(campaign._id)}>
                          <Button type="button" variant="outline">
                            <Pencil className="mr-1.5 h-3.5 w-3.5" />
                            Edit
                          </Button>
                        </Link>
                        <form action={toggleCampaignAction}>
                          <input
                            type="hidden"
                            name="campaignId"
                            value={id(campaign._id)}
                          />
                          <Button type="submit" variant="outline">
                            {campaign.isActive ? "Deactivate" : "Activate"}
                          </Button>
                        </form>
                        <form action={deleteCampaignAction}>
                          <input
                            type="hidden"
                            name="campaignId"
                            value={id(campaign._id)}
                          />
                          <Button type="submit" variant="destructive">
                            Delete
                          </Button>
                        </form>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </PageContainer>
  );
}