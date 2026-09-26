import { Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/layout/page-container";
import { CatalogMessage } from "@/components/admin/catalog-message";
import {
  createCouponAction,
  deleteCouponAction,
  getAdminCoupons,
  toggleCouponAction,
} from "@/actions/coupon";
import { formatINRFromPaise } from "@/lib/money";

export const metadata = {
  title: "Coupons & Discounts",
};

function formatDate(value: Date) {
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AdminCouponsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const params = await searchParams;
  const coupons = await getAdminCoupons();

  return (
    <PageContainer
      title="Coupons & Promotional Discounts"
      description="Create basic single-code percentage or flat discounts with minimum order, validity, and usage controls."
      actions={
        <Badge variant="outline">
          <Tag className="mr-1.5 h-3.5 w-3.5" />
          {coupons.length} coupon{coupons.length === 1 ? "" : "s"}
        </Badge>
      }
    >
      <CatalogMessage success={params.success} error={params.error} />

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create coupon</CardTitle>
            <CardDescription>
              Basic single-code support. Advanced stacking, auto-apply, referral,
              and first-order rules are intentionally deferred.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createCouponAction} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Coupon code
                </label>
                <input
                  name="code"
                  required
                  maxLength={40}
                  placeholder="DIWALI10"
                  className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm uppercase dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Discount type
                  </label>
                  <select
                    name="discountType"
                    defaultValue="PERCENTAGE"
                    className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Discount value
                  </label>
                  <input
                    name="discountValue"
                    required
                    inputMode="decimal"
                    placeholder="10"
                    className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Minimum order value (₹)
                </label>
                <input
                  name="minOrderValue"
                  required
                  inputMode="decimal"
                  defaultValue="0"
                  className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Starts
                  </label>
                  <input
                    name="startsAt"
                    type="datetime-local"
                    required
                    className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Expires
                  </label>
                  <input
                    name="expiresAt"
                    type="datetime-local"
                    required
                    className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Total usage limit
                </label>
                <input
                  name="usageLimit"
                  required
                  inputMode="numeric"
                  defaultValue="0"
                  className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                />
                <p className="mt-1 text-xs text-neutral-500">
                  Use 0 for unlimited.
                </p>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input name="isActive" type="checkbox" defaultChecked />
                Active immediately
              </label>

              <Button type="submit">Create coupon</Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {coupons.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center text-sm text-neutral-500">
                No coupons created yet.
              </CardContent>
            </Card>
          ) : (
            coupons.map((coupon) => {
              const now = Date.now();
              const expired = new Date(coupon.expiresAt).getTime() <= now;
              const scheduled = new Date(coupon.startsAt).getTime() > now;
              const exhausted =
                coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit;

              return (
                <Card key={String(coupon._id)}>
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-bold tracking-wide">{coupon.code}</h2>
                          <Badge
                            variant={
                              !coupon.isActive || expired || exhausted
                                ? "destructive"
                                : scheduled
                                  ? "warning"
                                  : "success"
                            }
                          >
                            {!coupon.isActive
                              ? "Inactive"
                              : expired
                                ? "Expired"
                                : exhausted
                                  ? "Usage limit reached"
                                  : scheduled
                                    ? "Scheduled"
                                    : "Active"}
                          </Badge>
                        </div>

                        <p className="mt-2 text-sm">
                          {coupon.discountType === "PERCENTAGE"
                            ? coupon.discountValue + "% off"
                            : formatINRFromPaise(coupon.discountValue) + " off"}
                          {" · "}
                          Minimum order{" "}
                          {formatINRFromPaise(coupon.minOrderValuePaise)}
                        </p>

                        <div className="mt-2 grid gap-1 text-xs text-neutral-500 sm:grid-cols-2">
                          <span>Starts: {formatDate(coupon.startsAt)}</span>
                          <span>Expires: {formatDate(coupon.expiresAt)}</span>
                          <span>
                            Usage: {coupon.usedCount}
                            {coupon.usageLimit > 0
                              ? " / " + coupon.usageLimit
                              : " / unlimited"}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <form action={toggleCouponAction}>
                          <input type="hidden" name="couponId" value={String(coupon._id)} />
                          <Button type="submit" variant="outline">
                            {coupon.isActive ? "Deactivate" : "Activate"}
                          </Button>
                        </form>
                        {coupon.usedCount === 0 ? (
                          <form action={deleteCouponAction}>
                            <input type="hidden" name="couponId" value={String(coupon._id)} />
                            <Button type="submit" variant="destructive">
                              Delete
                            </Button>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </PageContainer>
  );
}
