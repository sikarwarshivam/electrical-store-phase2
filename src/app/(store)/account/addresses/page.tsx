import { MapPin, Plus, Trash2 } from "lucide-react";
import { requireAuth } from "@/lib/auth-utils";
import {
  createSavedAddressAction,
  deleteSavedAddressAction,
  getSavedAddresses,
  updateSavedAddressAction,
} from "@/actions/address";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CatalogMessage } from "@/components/admin/catalog-message";

export const metadata = {
  title: "Saved Addresses",
};

function fieldClass() {
  return "mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-amber-500 dark:border-neutral-700 dark:bg-neutral-900";
}

export default async function SavedAddressesPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await requireAuth("/account/addresses");
  const params = await searchParams;
  const addresses = await getSavedAddresses(user.id);

  return (
    <PageContainer
      title="Saved Addresses"
      description="Save delivery addresses for faster checkout."
      actions={
        <Badge variant="outline">
          {addresses.length} saved address{addresses.length === 1 ? "" : "es"}
        </Badge>
      }
    >
      <CatalogMessage success={params.success} error={params.error} />

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <section className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-amber-600" />
            <div>
              <h2 className="font-bold">Add address</h2>
              <p className="text-xs text-neutral-500">Your first saved address becomes the default automatically.</p>
            </div>
          </div>

          <form action={createSavedAddressAction} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-medium">
                Label
                <select name="label" defaultValue="HOME" className={fieldClass()}>
                  <option value="HOME">Home</option>
                  <option value="WORK">Work</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
              <label className="flex items-center gap-2 pt-6 text-sm">
                <input type="checkbox" name="isDefault" />
                Set as default
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-medium">
                Full name
                <input name="fullName" required minLength={2} maxLength={120} defaultValue={user.name || ""} className={fieldClass()} />
              </label>
              <label className="text-xs font-medium">
                Phone
                <input name="phone" required inputMode="numeric" maxLength={10} pattern="[6-9][0-9]{9}" defaultValue={user.phone || ""} className={fieldClass()} />
              </label>
              <label className="text-xs font-medium">
                Pincode
                <input name="pincode" required inputMode="numeric" maxLength={6} pattern="[0-9]{6}" className={fieldClass()} />
              </label>
              <label className="text-xs font-medium">
                House / Flat
                <input name="house" required maxLength={200} className={fieldClass()} />
              </label>
              <label className="text-xs font-medium sm:col-span-2">
                Street / Locality
                <input name="street" required minLength={2} maxLength={240} className={fieldClass()} />
              </label>
              <label className="text-xs font-medium sm:col-span-2">
                Landmark (optional)
                <input name="landmark" maxLength={160} className={fieldClass()} />
              </label>
              <label className="text-xs font-medium">
                City
                <input name="city" required minLength={2} maxLength={100} className={fieldClass()} />
              </label>
              <label className="text-xs font-medium">
                State
                <input name="state" required minLength={2} maxLength={100} className={fieldClass()} />
              </label>
            </div>

            <Button type="submit" className="w-full">Save address</Button>
          </form>
        </section>

        <section className="space-y-4">
          {addresses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center dark:border-neutral-800 dark:bg-neutral-950">
              <MapPin className="mx-auto h-8 w-8 text-neutral-400" />
              <h2 className="mt-3 font-bold">No saved addresses</h2>
              <p className="mt-1 text-sm text-neutral-500">Add one above to speed up future checkouts.</p>
            </div>
          ) : (
            addresses.map((address) => (
              <details key={String(address._id)} className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold">{address.label}</span>
                        {address.isDefault ? <Badge variant="warning">Default</Badge> : null}
                      </div>
                      <p className="mt-2 text-sm font-medium">{address.fullName} · {address.phone}</p>
                      <p className="mt-1 text-sm text-neutral-500">
                        {address.house}, {address.street}
                        {address.landmark ? ", " + address.landmark : ""}
                        <br />
                        {address.city}, {address.state} - {address.pincode}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Edit</span>
                  </div>
                </summary>

                <div className="mt-5 border-t border-neutral-200 pt-5 dark:border-neutral-800">
                  <form action={updateSavedAddressAction} className="grid gap-4 md:grid-cols-2">
                    <input type="hidden" name="id" value={String(address._id)} />

                    <label className="text-xs font-medium">
                      Label
                      <select name="label" defaultValue={address.label} className={fieldClass()}>
                        <option value="HOME">Home</option>
                        <option value="WORK">Work</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </label>
                    <label className="flex items-center gap-2 pt-6 text-sm">
                      <input type="checkbox" name="isDefault" defaultChecked={address.isDefault} />
                      Default address
                    </label>

                    <label className="text-xs font-medium">
                      Full name
                      <input name="fullName" required defaultValue={address.fullName} className={fieldClass()} />
                    </label>
                    <label className="text-xs font-medium">
                      Phone
                      <input name="phone" required inputMode="numeric" maxLength={10} pattern="[6-9][0-9]{9}" defaultValue={address.phone} className={fieldClass()} />
                    </label>
                    <label className="text-xs font-medium">
                      Pincode
                      <input name="pincode" required inputMode="numeric" maxLength={6} pattern="[0-9]{6}" defaultValue={address.pincode} className={fieldClass()} />
                    </label>
                    <label className="text-xs font-medium">
                      House / Flat
                      <input name="house" required defaultValue={address.house} className={fieldClass()} />
                    </label>
                    <label className="text-xs font-medium md:col-span-2">
                      Street / Locality
                      <input name="street" required defaultValue={address.street} className={fieldClass()} />
                    </label>
                    <label className="text-xs font-medium md:col-span-2">
                      Landmark (optional)
                      <input name="landmark" defaultValue={address.landmark || ""} className={fieldClass()} />
                    </label>
                    <label className="text-xs font-medium">
                      City
                      <input name="city" required defaultValue={address.city} className={fieldClass()} />
                    </label>
                    <label className="text-xs font-medium">
                      State
                      <input name="state" required defaultValue={address.state} className={fieldClass()} />
                    </label>
                    <div className="flex flex-wrap gap-2 md:col-span-2">
                      <Button type="submit">Save changes</Button>
                    </div>
                  </form>

                  <form action={deleteSavedAddressAction} className="mt-3">
                    <input type="hidden" name="id" value={String(address._id)} />
                    <Button type="submit" variant="destructive">
                      <Trash2 className="mr-1.5 h-4 w-4" />
                      Delete address
                    </Button>
                  </form>
                </div>
              </details>
            ))
          )}
        </section>
      </div>
    </PageContainer>
  );
}
