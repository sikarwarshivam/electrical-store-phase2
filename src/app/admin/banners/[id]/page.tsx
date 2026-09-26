import Link from "next/link";
import { ArrowLeft, Image } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageContainer } from "@/components/layout/page-container";
import { CatalogMessage } from "@/components/admin/catalog-message";
import { Button } from "@/components/ui/button";
import { BannerImageUpload } from "@/components/admin/banner-image-upload";
import { getAdminBanner, updateBannerAction } from "@/actions/banner";
import { notFound } from "next/navigation";

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

export default async function EditBannerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const banner = await getAdminBanner(id);

  if (!banner) {
    notFound();
  }

  return (
    <PageContainer
      title="Edit Promotional Banner"
      description="Update the banner content, destination, schedule, or display order."
      actions={
        <Link href="/admin/banners">
          <Button type="button" variant="outline">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to banners
          </Button>
        </Link>
      }
    >
      <CatalogMessage error={query.error} />

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Image className="h-4 w-4 text-amber-600" />
            Banner details
          </CardTitle>
          <CardDescription>
            Changes are reflected on the homepage after saving.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateBannerAction} className="space-y-4">
            <input type="hidden" name="bannerId" value={String(banner._id)} />

            <div>
              <label className="text-xs font-semibold">Title</label>
              <input
                name="title"
                required
                maxLength={100}
                defaultValue={banner.title}
                className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>

            <div>
              <label className="text-xs font-semibold">Subtitle</label>
              <textarea
                name="subtitle"
                rows={3}
                maxLength={180}
                defaultValue={banner.subtitle || ""}
                className="mt-1.5 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>

            <div>
              <label className="text-xs font-semibold">Banner image</label>
              <div className="mt-1.5">
                <BannerImageUpload initialUrl={banner.imageUrl} />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold">Click destination</label>
              <input
                name="linkUrl"
                required
                defaultValue={banner.linkUrl}
                placeholder="/products"
                className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
              <p className="mt-1 text-xs text-neutral-500">
                Example: /products or /categories/lighting
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold">Starts</label>
                <input
                  name="startsAt"
                  type="datetime-local"
                  required
                  defaultValue={formatDateTimeLocal(banner.startsAt)}
                  className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Expires</label>
                <input
                  name="expiresAt"
                  type="datetime-local"
                  required
                  defaultValue={formatDateTimeLocal(banner.expiresAt)}
                  className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold">Display order</label>
              <input
                name="sortOrder"
                inputMode="numeric"
                defaultValue={String(banner.sortOrder)}
                className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
              <p className="mt-1 text-xs text-neutral-500">
                Lower numbers appear first.
              </p>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                name="isActive"
                type="checkbox"
                defaultChecked={banner.isActive}
              />
              Active
            </label>

            <div className="flex gap-2">
              <Button type="submit">Save changes</Button>
              <Link href="/admin/banners">
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
