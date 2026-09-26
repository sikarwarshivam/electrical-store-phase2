import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/layout/page-container";
import { CatalogMessage } from "@/components/admin/catalog-message";
import { siteConfig } from "@/config/site";
import {
  getStoreSettings,
  updateStoreDeliverySettingsAction,
} from "@/actions/store-settings";

export const metadata = {
  title: "Store Settings",
};

function rupees(paise: number) {
  return (paise / 100).toFixed(2);
}

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const params = await searchParams;
  const settings = await getStoreSettings();
  const slabs = settings.delivery.selfDelivery.distanceSlabs;

  return (
    <PageContainer
      title="Store Settings & Configuration"
      description="Manage store configuration that can change without redeploying the application."
      actions={
        <Badge variant="outline" className="text-xs">
          Admin configuration
        </Badge>
      }
    >
      <CatalogMessage success={params.success} error={params.error} />

      <div className="max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current Store Identity</CardTitle>
            <CardDescription>
              Branding and contact placeholders remain centralized in{" "}
              <code>src/config/site.ts</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <span className="text-xs font-semibold text-neutral-500">Store Name</span>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  {siteConfig.name}
                </p>
              </div>
              <div>
                <span className="text-xs font-semibold text-neutral-500">Currency</span>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  {siteConfig.currency.code} ({siteConfig.currency.symbol})
                </p>
              </div>
              <div>
                <span className="text-xs font-semibold text-neutral-500">
                  Support Email Placeholder
                </span>
                <p className="font-mono text-xs text-neutral-700 dark:text-neutral-300">
                  {siteConfig.contact.email}
                </p>
              </div>
              <div>
                <span className="text-xs font-semibold text-neutral-500">
                  Support Phone Placeholder
                </span>
                <p className="font-mono text-xs text-neutral-700 dark:text-neutral-300">
                  {siteConfig.contact.phone}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Delivery Configuration</CardTitle>
            <CardDescription>
              Default setup is self-delivery plus third-party courier. These values
              are stored in MongoDB so the owner can change them later from the
              admin panel without changing code.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateStoreDeliverySettingsAction} className="space-y-6">
              <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/50">
                <p className="text-sm font-semibold">Delivery model</p>
                <p className="mt-1 text-xs text-neutral-500">
                  Self-delivery for local orders and courier delivery for other
                  serviceable areas.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="free-above-order-value"
                    className="text-xs font-semibold text-neutral-700 dark:text-neutral-300"
                  >
                    Free self-delivery above order value (₹)
                  </label>
                  <input
                    id="free-above-order-value"
                    name="freeAboveOrderValue"
                    type="text"
                    inputMode="decimal"
                    required
                    defaultValue={rupees(settings.delivery.selfDelivery.freeAboveOrderValuePaise)}
                    className="mt-1.5 h-10 w-full max-w-xs rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </div>

                <div>
                  <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Self-delivery distance slabs
                  </p>
                  <div className="mt-2 grid gap-3 sm:grid-cols-3">
                    {slabs.slice(0, 3).map((slab, index) => (
                      <div key={index} className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
                        <label
                          htmlFor={`slab-${index + 1}-to`}
                          className="text-xs text-neutral-500"
                        >
                          Up to km
                        </label>
                        <input
                          id={`slab-${index + 1}-to`}
                          name={`slab${index + 1}ToKm`}
                          type="text"
                          inputMode="decimal"
                          required
                          defaultValue={slab.toKm}
                          className="mt-1 h-9 w-full rounded-md border border-neutral-300 bg-white px-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                        />
                        <label
                          htmlFor={`slab-${index + 1}-fee`}
                          className="mt-3 block text-xs text-neutral-500"
                        >
                          Charge (₹)
                        </label>
                        <input
                          id={`slab-${index + 1}-fee`}
                          name={`slab${index + 1}Fee`}
                          type="text"
                          inputMode="decimal"
                          required
                          defaultValue={rupees(slab.feePaise)}
                          className="mt-1 h-9 w-full rounded-md border border-neutral-300 bg-white px-2.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-neutral-500">
                    Orders above the highest configured distance are not assigned
                    a self-delivery charge by this setting; serviceable-area rules
                    will be finalized with the owner.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="courier-flat-fee"
                    className="text-xs font-semibold text-neutral-700 dark:text-neutral-300"
                  >
                    Courier default charge (₹)
                  </label>
                  <input
                    id="courier-flat-fee"
                    name="courierFlatFee"
                    type="text"
                    inputMode="decimal"
                    required
                    defaultValue={rupees(settings.delivery.courier.flatFeePaise)}
                    className="mt-1.5 h-10 w-full max-w-xs rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  />
                  <p className="mt-1 text-xs text-neutral-500">
                    This is a stored default only. Courier calculation/serviceability
                    will be wired into checkout after the delivery policy is finalized.
                  </p>
                </div>
              </div>

              <Button type="submit">Save delivery settings</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">GST / Invoicing</CardTitle>
            <CardDescription>
              Business GST details have not been entered yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-neutral-500">
            GSTIN, registered business details, HSN codes, and GST rates will be
            configured when the owner/accountant supplies the actual tax data.
            No placeholder tax values are used for production invoicing.
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
