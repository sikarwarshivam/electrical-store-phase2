"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface CarouselImage {
  url: string;
  alt?: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

interface ImageCarouselProps {
  images: CarouselImage[];
  fallbackAlt: string;
  sizes: string;
  className?: string;
  autoplayOnHover?: boolean;
  autoplayIntervalMs?: number;
}

export function ImageCarousel({
  images,
  fallbackAlt,
  sizes,
  className = "",
  autoplayOnHover = true,
  autoplayIntervalMs = 1800,
}: ImageCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const draggedRef = useRef(false);
  const pointerStartXRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const orderedImages = useMemo(
    () =>
      images
        .filter((image) => image.url)
        .slice()
        .sort(
          (a, b) =>
            Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary)) ||
            (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
        )
        .slice(0, 6),
    [images]
  );

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const container = containerRef.current;
      if (!container || orderedImages.length < 2) return;

      const nextIndex =
        (index + orderedImages.length) % orderedImages.length;
      container.scrollTo({
        left: nextIndex * container.clientWidth,
        behavior,
      });
      setActiveIndex(nextIndex);
    },
    [orderedImages.length]
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => setReduceMotion(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (
      !autoplayOnHover ||
      !isHovering ||
      reduceMotion ||
      orderedImages.length < 2
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      scrollToIndex(activeIndex + 1);
    }, autoplayIntervalMs);

    return () => window.clearInterval(timer);
  }, [
    activeIndex,
    autoplayIntervalMs,
    autoplayOnHover,
    isHovering,
    orderedImages.length,
    reduceMotion,
    scrollToIndex,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || orderedImages.length < 2) return;

    let frame = 0;

    const handleScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const width = container.clientWidth;
        if (!width) return;

        const nextIndex = Math.round(container.scrollLeft / width);
        setActiveIndex(
          Math.max(0, Math.min(nextIndex, orderedImages.length - 1))
        );
      });
    };

    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.cancelAnimationFrame(frame);
      container.removeEventListener("scroll", handleScroll);
    };
  }, [orderedImages.length]);

  if (orderedImages.length === 0) {
    return null;
  }

  if (orderedImages.length === 1) {
    const image = orderedImages[0];

    return (
      <div className={`relative h-full w-full overflow-hidden ${className}`}>
        <Image
          src={image.url}
          alt={image.alt || fallbackAlt}
          fill
          sizes={sizes}
          className="object-contain p-5 transition-transform duration-500 ease-out group-hover:scale-[1.045]"
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`flex h-full w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
      style={{ touchAction: "pan-x" }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onPointerDown={(event) => {
        if (event.pointerType !== "mouse") {
          pointerStartXRef.current = event.clientX;
          draggedRef.current = false;
        }
      }}
      onPointerMove={(event) => {
        if (event.pointerType !== "mouse") {
          if (
            Math.abs(event.clientX - pointerStartXRef.current) > 8
          ) {
            draggedRef.current = true;
          }
        }
      }}
      onClickCapture={(event) => {
        if (draggedRef.current) {
          event.preventDefault();
          event.stopPropagation();
          draggedRef.current = false;
        }
      }}
      role="region"
      aria-roledescription="carousel"
      aria-label={`${fallbackAlt} image gallery`}
    >
      {orderedImages.map((image, index) => (
        <div
          key={image.url + "-" + index}
          className="relative h-full w-full shrink-0 snap-center"
          aria-hidden={index !== activeIndex}
        >
          <Image
            src={image.url}
            alt={image.alt || fallbackAlt}
            fill
            sizes={sizes}
            className="object-contain p-5 transition-transform duration-500 ease-out"
          />
        </div>
      ))}

      <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center gap-1.5">
        {orderedImages.map((image, index) => (
          <span
            key={image.url + "-dot-" + index}
            className={
              index === activeIndex
                ? "h-1.5 w-4 rounded-full bg-amber-600 shadow-sm"
                : "h-1.5 w-1.5 rounded-full bg-neutral-300/90 dark:bg-neutral-600/90"
            }
          />
        ))}
      </div>
    </div>
  );
}
