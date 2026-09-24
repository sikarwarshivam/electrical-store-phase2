import { PageContainer } from "@/components/layout/page-container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "Store Settings",
};

export default function AdminSettingsPage() {
  return (
    <PageContainer
      title="Store Settings & Configuration"
      description="Manage store branding, contact information, GSTIN, and currency parameters."
      actions={
        <Badge variant="outline" className="text-xs">
          Phase 1 Shell
        </Badge>
      }
    >
      <div className="space-y-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current Store Identity</CardTitle>
            <CardDescription>
              Configured via centralized <code>src/config/site.ts</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-semibold text-neutral-500">Store Name</span>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">{siteConfig.name}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-neutral-500">Currency</span>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  {siteConfig.currency.code} ({siteConfig.currency.symbol})
                </p>
              </div>
              <div>
                <span className="text-xs font-semibold text-neutral-500">Support Email Placeholder</span>
                <p className="font-mono text-xs text-neutral-700 dark:text-neutral-300">
                  {siteConfig.contact.email}
                </p>
              </div>
              <div>
                <span className="text-xs font-semibold text-neutral-500">Support Phone Placeholder</span>
                <p className="font-mono text-xs text-neutral-700 dark:text-neutral-300">
                  {siteConfig.contact.phone}
                </p>
              </div>
              <div className="sm:col-span-2">
                <span className="text-xs font-semibold text-neutral-500">Physical Address Placeholder</span>
                <p className="font-mono text-xs text-neutral-700 dark:text-neutral-300">
                  {siteConfig.contact.address}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Indian Retail Tax Compliance (GST)</CardTitle>
            <CardDescription>
              Awaiting GSTIN onboarding in subsequent development phases.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-neutral-500">
            GST invoice number generators, HSN code lookups for electrical wiring (e.g. HSN 8544), and B2B tax invoice downloads will be configured when the complete order invoicing engine is implemented.
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
