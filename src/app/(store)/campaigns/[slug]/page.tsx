import Link from "next/link";
import { ArrowLeft, CalendarDays, Megaphone } from "lucide-react";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { ProductCard } from "@/components/store/product-card";
import { getPublicCampaignBySlug } from "@/actions/campaign";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const campaign = await getPublicCampaignBySlug(slug);
  if (!campaign) return { title: "Campaign not found" };
  return { title: campaign.name, description: campaign.description || campaign.subtitle || "Browse the latest seasonal electrical product campaign." };
}
function formatDate(value: Date) {
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}
export default async function CampaignPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const campaign = await getPublicCampaignBySlug(slug);
  if (!campaign) notFound();

  return (
    <PageContainer>
      <div className="space-y-7">
        <Link href="/campaigns" className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-amber-700 dark:text-neutral-300 dark:hover:text-amber-400">
          <ArrowLeft className="h-4 w-4" />All campaigns
        </Link>
        <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <div className="relative aspect-[16/6] min-h-52 overflow-hidden">
            <img src={campaign.imageUrl} alt={campaign.name} className="h-full w-full object-cover" loading="eager" />
            <div className="absolute inset-0 bg-linear-to-r from-black/75 via-black/30 to-black/5" />
            <div className="absolute inset-y-0 left-0 flex max-w-2xl flex-col justify-center px-6 py-8 text-white sm:px-10">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] backdrop-blur-sm"><Megaphone className="h-3 w-3" />Seasonal campaign</span>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">{campaign.name}</h1>
              {campaign.subtitle ? <p className="mt-2 max-w-xl text-sm leading-6 text-white/85 sm:text-base">{campaign.subtitle}</p> : null}
            </div>
          </div>
        </section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-neutral-500"><CalendarDays className="h-4 w-4" />Campaign ends {formatDate(campaign.expiresAt)}</div>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">{campaign.products.length} curated product{campaign.products.length === 1 ? "" : "s"}</span>
        </div>
        {campaign.description ? <div className="max-w-3xl text-sm leading-7 text-neutral-600 dark:text-neutral-300">{campaign.description}</div> : null}
        {campaign.products.length > 0 ? (
          <section>
            <div className="mb-4"><h2 className="text-xl font-bold">Shop the campaign</h2><p className="mt-1 text-sm text-neutral-500">Curated products use their current catalog price, stock, and product details.</p></div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{campaign.products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
          </section>
        ) : (
          <div className="rounded-xl border border-dashed border-neutral-300 px-6 py-14 text-center dark:border-neutral-800"><p className="font-semibold">This campaign has no currently available products.</p><p className="mt-2 text-sm text-neutral-500">Published products may have been archived or removed from the active catalog.</p></div>
        )}
      </div>
    </PageContainer>
  );
}
