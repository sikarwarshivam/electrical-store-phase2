import Link from "next/link";
import { Image, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageContainer } from "@/components/layout/page-container";
import { CatalogMessage } from "@/components/admin/catalog-message";
import { BannerImageUpload } from "@/components/admin/banner-image-upload";
import {
  createBannerAction,
  deleteBannerAction,
  getAdminBanners,
  toggleBannerAction,
} from "@/actions/banner";

export const metadata = {
  title: "Promotional Banners",
};

function formatDate(value: Date) {
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AdminBannersPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { banners, now } = await getAdminBanners();

  return (
    <PageContainer
      title="Promotional Banners"
      description="Manage homepage banners with links, display order, and scheduled active dates."
      actions={
        <Badge variant="outline">
          <Image className="mr-1.5 h-3.5 w-3.5" />
          {banners.length} banner{banners.length === 1 ? "" : "s"}
        </Badge>
      }
    >
      <CatalogMessage success={params.success} error={params.error} />

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create banner</CardTitle>
            <CardDescription>
              Upload your PNG, JPG, WEBP, or SVG directly from your computer.
              The app stores it securely and saves the image URL automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createBannerAction} className="space-y-4">
              <div>
                <label className="text-xs font-semibold">Title</label>
                <input
                  name="title"
                  required
                  maxLength={100}
                  placeholder="Diwali Lighting Sale"
                  className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold">Subtitle</label>
                <textarea
                  name="subtitle"
                  rows={3}
                  maxLength={180}
                  placeholder="Brighten your space with seasonal offers."
                  className="mt-1.5 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>

              <div>
                <label className="text-xs font-semibold">Banner image</label>
                <div className="mt-1.5">
                  <BannerImageUpload />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold">Click destination</label>
                <input
                  name="linkUrl"
                  required
                  placeholder="/products"
                  className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
                <p className="mt-1 text-xs text-neutral-500">
                  Example: /products or /categories/lighting
                </p>
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
                  inputMode="numeric"
                  defaultValue="0"
                  className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
                <p className="mt-1 text-xs text-neutral-500">
                  Lower numbers appear first.
                </p>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input name="isActive" type="checkbox" defaultChecked />
                Active
              </label>

              <Button type="submit">Create banner</Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {banners.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center text-sm text-neutral-500">
                No promotional banners created yet.
              </CardContent>
            </Card>
          ) : (
            banners.map((banner) => {
              const expired = new Date(banner.expiresAt).getTime() <= now;
              const scheduled = new Date(banner.startsAt).getTime() > now;

              return (
                <Card key={String(banner._id)}>
                  <CardContent className="p-5">
                    <div className="grid gap-4 lg:grid-cols-[180px_1fr_auto] lg:items-start">
                      <div className="aspect-[16/9] overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
                        <img
                          src={banner.imageUrl}
                          alt={banner.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-bold">{banner.title}</h2>
                          <Badge
                            variant={
                              !banner.isActive || expired
                                ? "destructive"
                                : scheduled
                                  ? "warning"
                                  : "success"
                            }
                          >
                            {!banner.isActive
                              ? "Inactive"
                              : expired
                                ? "Expired"
                                : scheduled
                                  ? "Scheduled"
                                  : "Active"}
                          </Badge>
                        </div>

                        {banner.subtitle ? (
                          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                            {banner.subtitle}
                          </p>
                        ) : null}

                        <div className="mt-2 grid gap-1 text-xs text-neutral-500 sm:grid-cols-2">
                          <span>Starts: {formatDate(banner.startsAt)}</span>
                          <span>Expires: {formatDate(banner.expiresAt)}</span>
                          <span>Order: {banner.sortOrder}</span>
                          <span className="truncate">Link: {banner.linkUrl}</span>
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-2 lg:flex-col">
                        <Link href={"/admin/banners/" + String(banner._id)}>
                          <Button type="button" variant="outline">
                            <Pencil className="mr-1.5 h-3.5 w-3.5" />
                            Edit
                          </Button>
                        </Link>
                        <form action={toggleBannerAction}>
                          <input
                            type="hidden"
                            name="bannerId"
                            value={String(banner._id)}
                          />
                          <Button type="submit" variant="outline">
                            {banner.isActive ? "Deactivate" : "Activate"}
                          </Button>
                        </form>
                        <form action={deleteBannerAction}>
                          <input
                            type="hidden"
                            name="bannerId"
                            value={String(banner._id)}
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
