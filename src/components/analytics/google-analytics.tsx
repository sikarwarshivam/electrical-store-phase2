"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!measurementId || !loaded || typeof window.gtag !== "function") {
      return;
    }

    const query = searchParams.toString();
    const pagePath = query ? pathname + "?" + query : pathname;

    window.gtag("config", measurementId, {
      page_path: pagePath,
    });
  }, [loaded, measurementId, pathname, searchParams]);

  if (!measurementId) {
    return null;
  }

  return (
    <>
      <Script
        id="google-analytics"
        src={"https://www.googletagmanager.com/gtag/js?id=" + measurementId}
        strategy="afterInteractive"
        onLoad={() => setLoaded(true)}
      />
      <Script id="google-analytics-init" strategy="afterInteractive">
        {"window.dataLayer = window.dataLayer || [];\n" +
          "window.gtag = function(){ window.dataLayer.push(arguments); };\n" +
          "window.gtag('js', new Date());\n" +
          "window.gtag('config', '" + measurementId + "', { send_page_view: false });"}
      </Script>
    </>
  );
}
