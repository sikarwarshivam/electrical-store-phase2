import Link from "next/link";
import {
  BadgeCheck,
  Boxes,
  Layers,
  Package,
  ShoppingCart,
  Tags,
  TrendingDown,
} from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/layout/empty-state";
import { siteConfig } from "@/config/site";
import { getCatalogDashboardStats } from "@/lib/catalog";
import { getAdminSalesStats } from "@/lib/order-commerce";
import { formatINRFromPaise } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [stats, sales] = await Promise.all([
    getCatalogDashboardStats(),
    getAdminSalesStats(),
  ]);

  const cards = [
    {
      title: "Products",
      value: stats.products,
      description: "All non-deleted catalog records.",
      href: "/admin/products",
      icon: Package,
    },
    {
      title: "Active Products",
      value: stats.activeProducts,
      description: "Products currently marked active.",
      href: "/admin/products",
      icon: ShoppingCart,
    },
    {
      title: "Active SKUs",
      value: stats.variants,
      description: "Non-archived purchasable variant records.",
      href: "/admin/inventory",
      icon: Boxes,
    },
    {
      title: "Low Stock",
      value: stats.lowStock,
      description: "Tracked SKUs at or below their configured threshold.",
      href: "/admin/inventory",
      icon: TrendingDown,
    },
  ];

  return (
    <PageContainer
      title="Admin Overview"
      description={`Catalog management console for ${siteConfig.name}`}
      actions={
        <Badge variant="outline">
          <Package className="mr-1.5 h-3.5 w-3.5" />
          Phase 2 · Catalog
        </Badge>
      }
    >
      <div className="space-y-6">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-200">
          <p className="font-semibold">Catalog foundation is active</p>
          <p className="mt-1 text-xs leading-5">
            Product, category, brand, SKU/variant, and inventory records are now backed by MongoDB.
            Checkout, payment verification, customer order history, inventory reservation, and basic sales metrics are now active.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.title} href={card.href}>
                <Card className="h-full transition-transform hover:-translate-y-0.5 hover:shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                      {card.title}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-amber-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{card.value}</div>
                    <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 font-semibold">
                <Tags className="h-4 w-4 text-amber-600" />
                Paid Orders
              </div>
              <p className="mt-2 text-2xl font-bold">{sales.paidOrders}</p>
              <p className="mt-1 text-xs text-neutral-500">
                Captured orders in active sales lifecycle states
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 font-semibold">
                <Tags className="h-4 w-4 text-amber-600" />
                Sales Revenue
              </div>
              <p className="mt-2 text-2xl font-bold">
                {formatINRFromPaise(sales.revenuePaise)}
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                Verified paid order totals
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 font-semibold">
                <Tags className="h-4 w-4 text-amber-600" />
                Units Sold
              </div>
              <p className="mt-2 text-2xl font-bold">{sales.units}</p>
              <p className="mt-1 text-xs text-neutral-500">
                Units across verified paid orders
              </p>
            </CardContent>
          </Card>
          <Link href="/admin/categories">
            <Card className="h-full">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 font-semibold">
                  <Layers className="h-4 w-4 text-amber-600" />
                  Categories
                </div>
                <p className="mt-2 text-2xl font-bold">{stats.categories}</p>
                <p className="mt-1 text-xs text-neutral-500">Active categories</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/brands">
            <Card className="h-full">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 font-semibold">
                  <BadgeCheck className="h-4 w-4 text-amber-600" />
                  Brands
                </div>
                <p className="mt-2 text-2xl font-bold">{stats.brands}</p>
                <p className="mt-1 text-xs text-neutral-500">Active brands</p>
              </CardContent>
            </Card>
          </Link>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 font-semibold">
                <Tags className="h-4 w-4 text-amber-600" />
                Last 30 Days
              </div>
              <p className="mt-2 text-lg font-bold">
                {formatINRFromPaise(sales.last30DaysRevenuePaise)}
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                {sales.last30DaysOrders} paid order{sales.last30DaysOrders === 1 ? "" : "s"} · {sales.pendingOrders} pending/in-progress
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Next Store Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              title="Continue with client-confirmed business policies"
              description="Tax, invoicing, delivery, COD, cancellation/refund, and notification behavior remain dependent on the client's business decisions and supplied details."
            />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
