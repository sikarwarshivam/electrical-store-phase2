import { Boxes, PackageSearch, TrendingDown } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CatalogMessage } from "@/components/admin/catalog-message";
import { FieldLabel } from "@/components/admin/field-label";
import { adjustInventoryAction } from "@/actions/catalog";
import { getInventoryRows } from "@/lib/catalog";
import { formatINRFromPaise } from "@/lib/money";

export const metadata = {
  title: "Inventory Management",
};

function id(value: unknown) {
  return String(value);
}

type InventoryRow = {
  _id: unknown;
  variant:
    | {
        _id: unknown;
        sku: string;
        title?: string;
        pricePaise: number;
        unitOfSale: string;
        status: string;
        product?: { _id: unknown; name: string; slug: string } | null;
      }
    | null;
  stockUnit: string;
  availableQuantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  stockStatus: string;
  trackInventory: boolean;
  updatedAt: Date;
};

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const params = await searchParams;
  const rows = (await getInventoryRows()) as unknown as InventoryRow[];
  const trackedRows = rows.filter((row) => row.trackInventory);
  const lowStockCount = trackedRows.filter(
    (row) =>
      row.availableQuantity > 0 &&
      row.availableQuantity <= row.lowStockThreshold
  ).length;
  const outOfStockCount = trackedRows.filter(
    (row) => row.availableQuantity <= 0
  ).length;

  return (
    <PageContainer
      title="Inventory"
      description="Monitor stock per SKU and record manual stock adjustments with an audit entry."
      actions={
        <Badge variant="outline">
          <Boxes className="mr-1.5 h-3.5 w-3.5" />
          {rows.length} SKU records
        </Badge>
      }
    >
      <CatalogMessage success={params.success} error={params.error} />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-neutral-500">Tracked SKUs</p>
            <p className="mt-1 text-2xl font-bold">{trackedRows.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-neutral-500">Low Stock</p>
            <p className="mt-1 flex items-center gap-2 text-2xl font-bold">
              <TrendingDown className="h-5 w-5 text-amber-600" />
              {lowStockCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-neutral-500">Out of Stock</p>
            <p className="mt-1 text-2xl font-bold">{outOfStockCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stock Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-neutral-300 p-10 text-center dark:border-neutral-700">
              <PackageSearch className="mx-auto h-8 w-8 text-neutral-400" />
              <p className="mt-3 font-medium">No inventory records yet</p>
              <p className="mt-1 text-sm text-neutral-500">
                Create a product SKU to create its inventory record.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {rows.map((row) => {
                const variant = row.variant;
                const product = variant?.product;
                return (
                  <div
                    key={id(row._id)}
                    className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{variant?.sku ?? "Unknown SKU"}</span>
                          <Badge
                            variant={
                              row.stockStatus === "IN_STOCK"
                                ? "success"
                                : row.stockStatus === "LOW_STOCK"
                                  ? "warning"
                                  : "destructive"
                            }
                          >
                            {row.stockStatus}
                          </Badge>
                          {!row.trackInventory ? (
                            <Badge variant="secondary">Tracking off</Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
                          {product?.name ?? "Product unavailable"}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
                          <span>{variant?.title || "Default SKU"}</span>
                          <span>{formatINRFromPaise(variant?.pricePaise ?? 0)}</span>
                          <span>Unit: {row.stockUnit}</span>
                          <span>Reserved: {row.reservedQuantity}</span>
                          <span>Updated: {new Date(row.updatedAt).toLocaleDateString("en-IN")}</span>
                        </div>
                      </div>

                      <form action={adjustInventoryAction} className="w-full max-w-xl rounded-lg bg-neutral-50 p-3 dark:bg-neutral-900/60">
                        <input type="hidden" name="variantId" value={id(variant?._id)} />
                        <div className="grid gap-3 sm:grid-cols-[140px_1fr_auto] sm:items-end">
                          <div>
                            <FieldLabel
                              htmlFor={`adjustment-${id(row._id)}`}
                              hint="Use negative values to reduce stock."
                            >
                              Quantity change
                            </FieldLabel>
                            <input
                              id={`adjustment-${id(row._id)}`}
                              name="quantityDelta"
                              type="number"
                              step="0.001"
                              required
                              className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                              placeholder="+10"
                              disabled={!row.trackInventory}
                            />
                          </div>
                          <div>
                            <FieldLabel htmlFor={`reason-${id(row._id)}`}>Reason</FieldLabel>
                            <input
                              id={`reason-${id(row._id)}`}
                              name="reason"
                              required
                              maxLength={200}
                              className="mt-1.5 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                              placeholder="Purchase received, damaged item, count correction..."
                              disabled={!row.trackInventory}
                            />
                          </div>
                          <Button type="submit" disabled={!row.trackInventory}>
                            Adjust
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
