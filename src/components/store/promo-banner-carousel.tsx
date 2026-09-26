/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { PublicBanner } from "@/actions/banner";

interface PromoBannerCarouselProps {
  banners: PublicBanner[];
}

function BannerContent({ banner }: { banner: PublicBanner }) {
  const content = (
    <div className="group relative h-full w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900">
      <img
        src={banner.imageUrl}
        alt={banner.title}
        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.015]"
        loading="lazy"
        decoding="async"
      />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-black/70 via-black/30 to-black/5" />
      <div className="pointer-events-none absolute inset-y-0 left-0 flex w-full max-w-2xl flex-col justify-center px-5 py-8 sm:px-8 lg:px-10">
        <div className="max-w-xl">
          <h2 className="text-xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-4xl">
            {banner.title}
          </h2>
          {banner.subtitle ? (
            <p className="mt-2 max-w-lg text-xs leading-5 text-white/85 sm:text-sm sm:leading-6 lg:text-base">
              {banner.subtitle}
            </p>
          ) : null}
          <span className="pointer-events-auto mt-4 inline-flex w-fit rounded-md bg-white px-3.5 py-2 text-xs font-bold text-neutral-900 shadow-sm transition-colors hover:bg-neutral-100 sm:mt-5 sm:px-4 sm:py-2.5 sm:text-sm">
            Shop now
          </span>
        </div>
      </div>
    </div>
  );

  if (banner.linkUrl.startsWith("/")) {
    return (
      <Link href={banner.linkUrl} className="block h-full w-full">
        {content}
      </Link>
    );
  }

  return (
    <a
      href={banner.linkUrl}
      target="_blank"
      rel="noreferrer"
      className="block h-full w-full"
    >
      {content}
    </a>
  );
}

export function PromoBannerCarousel({
  banners,
}: PromoBannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const hasMultiple = banners.length > 1;

  const goToNext = useCallback(() => {
    setCurrentIndex((index) => (index + 1) % banners.length);
  }, [banners.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((index) => (index - 1 + banners.length) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (!hasMultiple) return;

    const interval = window.setInterval(goToNext, 5000);
    return () => window.clearInterval(interval);
  }, [goToNext, hasMultiple]);

  useEffect(() => {
    if (currentIndex >= banners.length) {
      setCurrentIndex(0);
    }
  }, [banners.length, currentIndex]);

  if (banners.length === 0) return null;

  return (
    <section
      aria-label="Promotional banners"
      className="border-b border-neutral-200 bg-neutral-50 py-5 dark:border-neutral-800 dark:bg-neutral-900/30 sm:py-6"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative">
          <div className="relative aspect-[16/8] min-h-55 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:aspect-[16/7] sm:min-h-65 lg:aspect-[16/6] lg:min-h-75">
            {banners.map((banner, index) => {
              const isActive = index === currentIndex;
              const isBefore = index < currentIndex;

              return (
                <div
                  key={banner.id}
                  className={
                    "absolute inset-0 transition-[transform,opacity] duration-500 ease-out " +
                    (isActive
                      ? "translate-x-0 opacity-100"
                      : isBefore
                        ? "-translate-x-full opacity-0"
                        : "translate-x-full opacity-0")
                  }
                  aria-hidden={!isActive}
                >
                  <BannerContent banner={banner} />
                </div>
              );
            })}

            {hasMultiple ? (
              <>
                <button
                  type="button"
                  aria-label="Previous banner"
                  onClick={goToPrevious}
                  className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-black/35 p-2 text-white backdrop-blur-sm transition hover:bg-black/55 focus:outline-none focus:ring-2 focus:ring-white/80 sm:left-4 sm:p-2.5"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label="Next banner"
                  onClick={goToNext}
                  className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-black/35 p-2 text-white backdrop-blur-sm transition hover:bg-black/55 focus:outline-none focus:ring-2 focus:ring-white/80 sm:right-4 sm:p-2.5"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>

                <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/25 px-2.5 py-1.5 backdrop-blur-sm sm:bottom-4">
                  {banners.map((banner, index) => (
                    <button
                      key={banner.id}
                      type="button"
                      aria-label={"Go to banner " + (index + 1)}
                      aria-current={index === currentIndex}
                      onClick={() => setCurrentIndex(index)}
                      className={
                        "h-1.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-white/80 " +
                        (index === currentIndex
                          ? "w-6 bg-white"
                          : "w-1.5 bg-white/55 hover:bg-white/80")
                      }
                    />
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
