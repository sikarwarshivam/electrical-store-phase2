"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, Search, X } from "lucide-react";
import { formatINRFromPaise } from "@/lib/money";

interface SearchSuggestion {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  brand: string | null;
  category: string;
  pricePaise: number;
}

interface SearchResponse {
  products: SearchSuggestion[];
  didYouMean: string | null;
}

interface PredictiveSearchProps {
  mobile?: boolean;
}

export function PredictiveSearch({ mobile = false }: PredictiveSearchProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [didYouMean, setDidYouMean] = useState<string | null>(null);
  const [isOpen, setOpen] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setSuggestions([]);
      setDidYouMean(null);
      setLoading(false);
      setOpen(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          "/api/search/suggestions?q=" + encodeURIComponent(trimmed),
          {
            signal: controller.signal,
            headers: { Accept: "application/json" },
          }
        );

        if (!response.ok) throw new Error("Search suggestions unavailable");

        const data = (await response.json()) as SearchResponse;
        setSuggestions(data.products || []);
        setDidYouMean(data.didYouMean || null);
        setOpen(true);
        setActiveIndex(-1);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSuggestions([]);
        setDidYouMean(null);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = query.trim();
    if (!trimmed) return;

    setOpen(false);
    router.push("/products?q=" + encodeURIComponent(trimmed));
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || (suggestions.length === 0 && !didYouMean)) {
      return;
    }

    const itemsCount = suggestions.length + (didYouMean ? 1 : 0);

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % itemsCount);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + itemsCount) % itemsCount);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();

      if (activeIndex < suggestions.length) {
        router.push("/products/" + suggestions[activeIndex].slug);
      } else if (didYouMean) {
        setQuery(didYouMean);
        router.push("/products?q=" + encodeURIComponent(didYouMean));
      }
    }
  }

  function acceptCorrection() {
    if (!didYouMean) return;
    setQuery(didYouMean);
    setOpen(false);
    router.push("/products?q=" + encodeURIComponent(didYouMean));
  }

  return (
    <form
      ref={formRef}
      action="/products"
      method="get"
      onSubmit={submitSearch}
      className={mobile ? "relative w-full" : "relative min-w-0 flex-1"}
      role="search"
      onFocus={() => {
        if (query.trim().length >= 2) setOpen(true);
      }}
    >
      <label className="sr-only" htmlFor={mobile ? "mobile-product-search" : "desktop-product-search"}>
        Search products
      </label>

      <div
        className={
          "relative " +
          (isOpen
            ? "rounded-xl ring-2 ring-amber-500/15"
            : "")
        }
      >
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

        <input
          ref={inputRef}
          id={mobile ? "mobile-product-search" : "desktop-product-search"}
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          placeholder="Search products, brands or SKU..."
          className={
            "h-10 w-full rounded-lg border bg-neutral-50 pl-10 pr-16 text-sm text-neutral-900 outline-none transition-all placeholder:text-neutral-400 focus:border-amber-500 focus:bg-white " +
            (isOpen
              ? "border-amber-400"
              : "border-neutral-200") +
            " dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:bg-neutral-950 dark:border-neutral-800"
          }
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls="predictive-search-results"
        />

        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {isLoading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-amber-600" aria-label="Loading search suggestions" />
          ) : null}

          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setOpen(false);
                inputRef.current?.focus();
              }}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {isOpen ? (
        <div
          id="predictive-search-results"
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl shadow-neutral-900/10 dark:border-neutral-800 dark:bg-neutral-950"
        >
          {suggestions.length > 0 ? (
            <div className="p-1.5">
              <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                Products
              </p>

              {suggestions.map((product, index) => (
                <Link
                  key={product.id}
                  href={"/products/" + product.slug}
                  onClick={() => setOpen(false)}
                  className={
                    "flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors " +
                    (activeIndex === index
                      ? "bg-amber-50 dark:bg-amber-950/30"
                      : "hover:bg-neutral-50 dark:hover:bg-neutral-900")
                  }
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-contain p-1"
                      />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {product.name}
                    </p>
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-neutral-500">
                      {[product.brand, product.category].filter(Boolean).join(" · ")}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                      {formatINRFromPaise(product.pricePaise)}
                    </p>
                    <ArrowRight className="ml-auto mt-1 h-3.5 w-3.5 text-neutral-300" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-4 py-5 text-sm text-neutral-500">
              No exact product match yet. Try another word or SKU.
            </div>
          )}

          {didYouMean ? (
            <div className="border-t border-neutral-100 px-3 py-2.5 dark:border-neutral-900">
              <button
                type="button"
                onClick={acceptCorrection}
                className="w-full text-left text-xs text-neutral-600 hover:text-amber-700 dark:text-neutral-300 dark:hover:text-amber-400"
              >
                Did you mean <span className="font-semibold">{didYouMean}</span>?
              </button>
            </div>
          ) : null}

          <div className="border-t border-neutral-100 px-3 py-2 dark:border-neutral-900">
            <button
              type="submit"
              className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30"
            >
              <span>
                Search all products{query.trim() ? " for “" + query.trim() + "”" : ""}
              </span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : null}
    </form>
  );
}
