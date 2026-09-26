/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { PublicBanner } from "@/actions/banner";

interface PromoBannerCarouselProps {
  banners: PublicBanner[];
}

function BannerContent({ banner }: { banner: PublicBanner }) {
  const content = (
    <div className="group relative aspect-[16/6] min-h-44 w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
      {/* Banner images currently use approved image URLs; Cloudinary upload integration remains a separate media concern. */}
      <img
        src={banner.imageUrl}
        alt={banner.title}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        loading="lazy"
        decoding="async"
      />
      <div className="absolute inset-0 bg-linear-to-r from-black/70 via-black/20 to-transparent" />
      <div className="absolute inset-0 flex max-w-xl flex-col justify-center px-5 py-6 sm:px-8">
        <h2 className="text-xl font-extrabold tracking-tight text-white sm:text-3xl">
          {banner.title}
        </h2>
        {banner.subtitle ? (
          <p className="mt-1.5 max-w-lg text-xs leading-5 text-white/85 sm:text-sm">
            {banner.subtitle}
          </p>
        ) : null}
        <span className="mt-4 inline-flex w-fit rounded-md bg-white px-3 py-1.5 text-xs font-bold text-neutral-900">
          Shop now
        </span>
      </div>
    </div>
  );

  if (banner.linkUrl.startsWith("/")) {
    return (
      <Link href={banner.linkUrl} className="block">
        {content}
      </Link>
    );
  }

  return (
    <a
      href={banner.linkUrl}
      target="_blank"
      rel="noreferrer"
      className="block"
    >
      {content}
    </a>
  );
}

export function PromoBannerCarousel({
  banners,
}: PromoBannerCarouselProps) {
  if (banners.length === 0) return null;

  return (
    <section
      aria-label="Promotional banners"
      className="border-b border-neutral-200 bg-neutral-50 py-5 dark:border-neutral-800 dark:bg-neutral-900/30"
    >
      <div className="mx-auto max-w-7xl overflow-x-auto px-4 sm:px-6 lg:px-8">
        <div className="flex snap-x snap-mandatory gap-4 pb-1">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="w-[92%] shrink-0 snap-start sm:w-[72%] lg:w-[58%]"
            >
              <BannerContent banner={banner} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
