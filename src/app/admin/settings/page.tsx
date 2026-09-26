import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

function pincodesText(values: string[]) {
  return values.join("\n");
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
                <span className="text-xs font-semibold text-neutral-500">
                  Store Name
                </span>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  {siteConfig.name}
                </p>
              </div>
              <div>
                <span className="text-xs font-semibold text-neutral-500">
                  Currency
                </span>
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

        <form
          id="delivery-settings-form"
          action={updateStoreDeliverySettingsAction}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Delivery Configuration</CardTitle>
              <CardDescription>
                Default setup is self-delivery plus third-party courier. Values are
                stored in MongoDB so the owner can change them later from this panel.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                    defaultValue={rupees(
                      settings.delivery.selfDelivery.freeAboveOrderValuePaise
                    )}
                    className="mt-1.5 h-10 w-full max-w-xs rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </div>

                <div>
                  <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Self-delivery distance slabs
                  </p>
                  <div className="mt-2 grid gap-3 sm:grid-cols-3">
                    {slabs.slice(0, 3).map((slab, index) => (
                      <div
                        key={index}
                        className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
                      >
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
                    Checkout will not use these values until serviceability and
                    delivery policy rules are connected in the commerce flow.
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
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Delivery Serviceability
              </CardTitle>
              <CardDescription>
                Enter Indian 6-digit pincodes, one per line or separated by commas.
                These lists are stored now and will be enforced by checkout when
                delivery routing is connected.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="self-delivery-pincodes"
                  className="text-xs font-semibold text-neutral-700 dark:text-neutral-300"
                >
                  Self-delivery pincodes
                </label>
                <textarea
                  id="self-delivery-pincodes"
                  name="selfDeliveryPincodes"
                  rows={8}
                  defaultValue={pincodesText(
                    settings.delivery.serviceability.selfDeliveryPincodes
                  )}
                  placeholder={"250001\n250002\n250003"}
                  className="mt-1.5 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
                <p className="mt-1 text-xs text-neutral-500">
                  Leave empty until the owner confirms local serviceable pincodes.
                </p>
              </div>

              <div>
                <label
                  htmlFor="courier-pincodes"
                  className="text-xs font-semibold text-neutral-700 dark:text-neutral-300"
                >
                  Courier-serviceable pincodes
                </label>
                <textarea
                  id="courier-pincodes"
                  name="courierPincodes"
                  rows={8}
                  defaultValue={pincodesText(
                    settings.delivery.serviceability.courierPincodes
                  )}
                  placeholder={"110001\n201301\n400001"}
                  className="mt-1.5 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
                <p className="mt-1 text-xs text-neutral-500">
                  Leave empty until the courier coverage list is confirmed.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cash on Delivery (COD)</CardTitle>
              <CardDescription>
                COD remains disabled by default. The owner can configure the
                business rule here before customer checkout support is enabled.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
                These settings are configuration only. Customer checkout will not
                offer COD until the COD and delivery policies are wired into the
                order flow.
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="cod-enabled"
                  name="codEnabled"
                  type="checkbox"
                  defaultChecked={settings.delivery.cod.enabled}
                  className="h-4 w-4 rounded border-neutral-300"
                />
                <label
                  htmlFor="cod-enabled"
                  className="text-sm font-medium text-neutral-800 dark:text-neutral-200"
                >
                  Enable COD
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="cod-min-order-value"
                    className="text-xs font-semibold text-neutral-700 dark:text-neutral-300"
                  >
                    Minimum order value (₹)
                  </label>
                  <input
                    id="cod-min-order-value"
                    name="codMinOrderValue"
                    type="text"
                    inputMode="decimal"
                    required
                    defaultValue={rupees(
                      settings.delivery.cod.minOrderValuePaise
                    )}
                    className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </div>

                <div>
                  <label
                    htmlFor="cod-max-order-value"
                    className="text-xs font-semibold text-neutral-700 dark:text-neutral-300"
                  >
                    Maximum order value (₹)
                  </label>
                  <input
                    id="cod-max-order-value"
                    name="codMaxOrderValue"
                    type="text"
                    inputMode="decimal"
                    required
                    defaultValue={rupees(
                      settings.delivery.cod.maxOrderValuePaise
                    )}
                    className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </div>

                <div>
                  <label
                    htmlFor="cod-convenience-fee"
                    className="text-xs font-semibold text-neutral-700 dark:text-neutral-300"
                  >
                    COD convenience fee (₹)
                  </label>
                  <input
                    id="cod-convenience-fee"
                    name="codConvenienceFee"
                    type="text"
                    inputMode="decimal"
                    required
                    defaultValue={rupees(
                      settings.delivery.cod.convenienceFeePaise
                    )}
                    className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Cancellation</CardTitle>
              <CardDescription>
                Configure free cancellation and the fee for cancellation after
                shipment has started.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
                Free cancellation is available through the selected early order
                status. From SHIPPED through OUT_FOR_DELIVERY, the configured
                cancellation fee can apply. Once the order is DELIVERED, it is
                treated as a return/refund case instead of a cancellation.
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="cancellation-enabled"
                  name="cancellationEnabled"
                  type="checkbox"
                  defaultChecked={settings.delivery.cancellation.enabled}
                  className="h-4 w-4 rounded border-neutral-300"
                />
                <label
                  htmlFor="cancellation-enabled"
                  className="text-sm font-medium text-neutral-800 dark:text-neutral-200"
                >
                  Allow customer cancellation
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="free-cancellation-through-status"
                    className="text-xs font-semibold text-neutral-700 dark:text-neutral-300"
                  >
                    Free cancellation through
                  </label>
                  <select
                    id="free-cancellation-through-status"
                    name="freeCancellationThroughStatus"
                    defaultValue={
                      settings.delivery.cancellation.freeCancellationThroughStatus
                    }
                    className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  >
                    <option value="PLACED">Placed</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PACKED">Packed</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="cancellation-fee"
                    className="text-xs font-semibold text-neutral-700 dark:text-neutral-300"
                  >
                    Post-shipment cancellation fee (₹)
                  </label>
                  <input
                    id="cancellation-fee"
                    name="cancellationFee"
                    type="text"
                    inputMode="decimal"
                    required
                    defaultValue={rupees(
                      settings.delivery.cancellation.feePaise
                    )}
                    className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </div>
              </div>

              <div className="rounded-md border border-neutral-200 p-4 text-xs text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
                <p>
                  <strong>Paid cancellation:</strong> SHIPPED → OUT_FOR_DELIVERY
                </p>
                <p className="mt-1">
                  <strong>DELIVERED:</strong> use the returns/refunds workflow.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit">Save delivery settings</Button>
          </div>
        </form>

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
