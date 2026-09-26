"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, TouchEvent } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PublicBanner } from "@/actions/banner";

interface PromoBannerCarouselProps {
  banners: PublicBanner[];
}

const ROTATION_MS = 5000;
const SWIPE_THRESHOLD_PX = 48;

function BannerContent({
  banner,
  priority,
}: {
  banner: PublicBanner;
  priority: boolean;
}) {
  const content = (
    <div className="group relative aspect-[16/6] min-h-44 w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <img
        src={banner.imageUrl}
        alt={banner.title}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.01]"
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
      <div className="absolute inset-0 bg-linear-to-r from-black/65 via-black/10 to-transparent" />
      <div className="absolute inset-y-0 left-0 flex w-full max-w-2xl flex-col justify-center px-5 py-6 sm:px-8">
        <h2 className="max-w-xl text-xl font-extrabold tracking-tight text-white drop-shadow-sm sm:text-3xl">
          {banner.title}
        </h2>
        {banner.subtitle ? (
          <p className="mt-1.5 max-w-lg text-xs leading-5 text-white/90 drop-shadow-sm sm:text-sm">
            {banner.subtitle}
          </p>
        ) : null}
        <span className="mt-4 inline-flex w-fit rounded-md bg-white px-3 py-1.5 text-xs font-bold text-neutral-900 shadow-sm">
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
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const hasMultiple = banners.length > 1;

  useEffect(() => {
    setActiveIndex((current) =>
      Math.min(current, Math.max(0, banners.length - 1))
    );
  }, [banners.length]);

  useEffect(() => {
    if (!hasMultiple || isPaused) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % banners.length);
    }, ROTATION_MS);

    return () => window.clearInterval(timer);
  }, [banners.length, hasMultiple, isPaused]);

  if (banners.length === 0) return null;

  function goTo(index: number) {
    setActiveIndex((index + banners.length) % banners.length);
  }

  function goNext() {
    goTo(activeIndex + 1);
  }

  function goPrevious() {
    goTo(activeIndex - 1);
  }

  function handleTouchStart(event: TouchEvent) {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
    setIsPaused(true);
  }

  function handleTouchEnd(event: TouchEvent) {
    const startX = touchStartX.current;
    const endX = event.changedTouches[0]?.clientX ?? null;

    touchStartX.current = null;

    if (startX === null || endX === null || !hasMultiple) {
      setIsPaused(false);
      return;
    }

    const deltaX = startX - endX;

    if (Math.abs(deltaX) >= SWIPE_THRESHOLD_PX) {
      if (deltaX > 0) {
        goNext();
      } else {
        goPrevious();
      }
    }

    setIsPaused(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (!hasMultiple) return;

    if (event.key === "ArrowRight") {
      event.preventDefault();
      goNext();
      setIsPaused(true);
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goPrevious();
      setIsPaused(true);
    }
  }

  const banner = banners[activeIndex];

  return (
    <section
      aria-label="Promotional banners"
      aria-roledescription="carousel"
      tabIndex={hasMultiple ? 0 : undefined}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => hasMultiple && setIsPaused(true)}
      onMouseLeave={() => hasMultiple && setIsPaused(false)}
      onFocus={() => hasMultiple && setIsPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsPaused(false);
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="border-b border-neutral-200 bg-neutral-50 py-5 dark:border-neutral-800 dark:bg-neutral-900/30"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative">
          <div className="overflow-hidden rounded-xl">
            <div
              className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
              aria-live={isPaused ? "polite" : "off"}
            >
              {banners.map((item, index) => (
                <div
                  key={item.id}
                  className="w-full shrink-0"
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} of ${banners.length}`}
                >
                  <BannerContent banner={item} priority={index === 0} />
                </div>
              ))}
            </div>
          </div>

          {hasMultiple ? (
            <>
              <button
                type="button"
                aria-label="Previous banner"
                onClick={goPrevious}
                className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-black/45 text-white shadow-sm backdrop-blur-sm transition hover:bg-black/65 focus:outline-none focus:ring-2 focus:ring-white sm:left-4"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                type="button"
                aria-label="Next banner"
                onClick={goNext}
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 bg-black/45 text-white shadow-sm backdrop-blur-sm transition hover:bg-black/65 focus:outline-none focus:ring-2 focus:ring-white sm:right-4"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          ) : null}
        </div>

        {hasMultiple ? (
          <div className="mt-3 flex items-center justify-center gap-1.5">
            {banners.map((item, index) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Show banner ${index + 1}`}
                aria-current={index === activeIndex}
                onClick={() => goTo(index)}
                className={
                  index === activeIndex
                    ? "h-1.5 w-6 rounded-full bg-neutral-900 transition-all dark:bg-white"
                    : "h-1.5 w-1.5 rounded-full bg-neutral-300 transition-all hover:bg-neutral-500 dark:bg-neutral-700 dark:hover:bg-neutral-500"
                }
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
