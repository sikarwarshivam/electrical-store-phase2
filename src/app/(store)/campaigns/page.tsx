import Link from "next/link";
import { ArrowRight, CalendarDays, Megaphone } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { getActiveCampaigns } from "@/actions/campaign";

export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function CampaignsPage() {
  const campaigns = await getActiveCampaigns();

  return (
    <PageContainer title="Festival Campaigns" description="Explore current seasonal collections and curated electrical product offers.">
      {campaigns.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2">
          {campaigns.map((campaign) => (
            <Link key={String(campaign._id)} href={"/campaigns/" + campaign.slug} className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-950">
              <div className="relative aspect-[16/7] overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                <img src={campaign.imageUrl} alt={campaign.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/25 to-transparent" />
                <div className="absolute inset-y-0 left-0 flex max-w-xl flex-col justify-center px-6 text-white">
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] backdrop-blur-sm">
                    <Megaphone className="h-3 w-3" /> Festival campaign
                  </span>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{campaign.name}</h2>
                  {campaign.subtitle ? <p className="mt-1 max-w-lg text-sm text-white/85">{campaign.subtitle}</p> : null}
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-2 text-xs text-neutral-500"><CalendarDays className="h-4 w-4" />Ends {formatDate(campaign.expiresAt)}</div>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 dark:text-amber-400">Shop campaign <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center dark:border-neutral-800 dark:bg-neutral-950">
          <Megaphone className="mx-auto h-9 w-9 text-neutral-400" />
          <p className="mt-3 font-semibold">No active festival campaigns</p>
          <p className="mx-auto mt-2 max-w-lg text-sm text-neutral-500">Seasonal campaign pages will appear here when the store publishes one.</p>
        </div>
      )}
    </PageContainer>
  );
}
