"use client";

import * as React from "react";
import { Suspense } from "react";
import { SessionProvider } from "next-auth/react";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <Suspense fallback={null}>
        <GoogleAnalytics />
      </Suspense>
      {children}
    </SessionProvider>
  );
}
