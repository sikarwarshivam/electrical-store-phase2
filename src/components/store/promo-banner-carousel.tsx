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

function BannerContent({ banner }: { banner: PublicBanner }) {
  const content = (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <img
        src={banner.imageUrl}
        alt={banner.title}
        className="block aspect-[16/6] h-auto w-full object-contain"
        loading="lazy"
        decoding="async"
      />
    </div>
  );

  if (banner.linkUrl.startsWith("/")) {
    return (
      <Link
        href={banner.linkUrl}
        className="block rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
        aria-label={banner.title}
      >
        {content}
      </Link>
    );
  }

  return (
    <a
      href={banner.linkUrl}
      target="_blank"
      rel="noreferrer"
      className="block rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
      aria-label={banner.title}
    >
      {content}
    </a>
  );
}

export function PromoBannerCarousel({
  banners,
}: PromoBannerCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const hasMultiple = banners.length > 1;

  useEffect(() => {
    setActiveIndex((current) =>
      Math.min(current, Math.max(0, banners.length - 1))
    );
  }, [banners.length]);

  useEffect(() => {
    if (!hasMultiple || isFocused) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % banners.length);
    }, ROTATION_MS);

    return () => window.clearInterval(timer);
  }, [banners.length, hasMultiple, isFocused]);

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
  }

  function handleTouchEnd(event: TouchEvent) {
    const startX = touchStartX.current;
    const endX = event.changedTouches[0]?.clientX ?? null;

    touchStartX.current = null;

    if (startX === null || endX === null || !hasMultiple) return;

    const deltaX = startX - endX;

    if (Math.abs(deltaX) >= SWIPE_THRESHOLD_PX) {
      if (deltaX > 0) {
        goNext();
      } else {
        goPrevious();
      }
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (!hasMultiple) return;

    if (event.key === "ArrowRight") {
      event.preventDefault();
      goNext();
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goPrevious();
    }
  }

  return (
    <section
      aria-label="Promotional banners"
      aria-roledescription="carousel"
      tabIndex={hasMultiple ? 0 : undefined}
      onKeyDown={handleKeyDown}
      onFocus={() => hasMultiple && setIsFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsFocused(false);
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="border-b border-neutral-200 bg-neutral-50 py-4 dark:border-neutral-800 dark:bg-neutral-900/30"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-xl">
          <div
            className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            aria-live={isFocused ? "polite" : "off"}
          >
            {banners.map((item, index) => (
              <div
                key={item.id}
                className="w-full shrink-0"
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${banners.length}`}
              >
                <BannerContent banner={item} />
              </div>
            ))}
          </div>

          {hasMultiple ? (
            <>
              <button
                type="button"
                aria-label="Previous banner"
                onClick={goPrevious}
                className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-black/35 text-white shadow-sm backdrop-blur-sm transition hover:bg-black/55 focus:outline-none focus:ring-2 focus:ring-white sm:left-3"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                type="button"
                aria-label="Next banner"
                onClick={goNext}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-black/35 text-white shadow-sm backdrop-blur-sm transition hover:bg-black/55 focus:outline-none focus:ring-2 focus:ring-white sm:right-3"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          ) : null}
        </div>

        {hasMultiple ? (
          <div className="mt-2 flex items-center justify-center gap-1.5">
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
