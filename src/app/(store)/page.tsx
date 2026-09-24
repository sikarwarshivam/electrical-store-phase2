import Link from "next/link";
import { ShieldCheck, Database, Sliders, ArrowRight } from "lucide-react";
import { siteConfig } from "@/config/site";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  const categories = [
    { title: "Wires & Industrial Cables", desc: "FR, FRLS, Armoured, Submersible", icon: "⚡" },
    { title: "Switchgear & Distribution", desc: "MCBs, RCCBs, Isolators, DBs", icon: "🔌" },
    { title: "Modular Switches & Sockets", desc: "Plates, Regulators, USB chargers", icon: "💡" },
    { title: "Commercial LED Lighting", desc: "Panels, Floodlights, High bays", icon: "✨" },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="border-b border-neutral-200 bg-linear-to-b from-amber-500/10 via-amber-500/5 to-transparent py-16 dark:border-neutral-800">
        <PageContainer>
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2">
              <Badge variant="outline" className="border-amber-400 bg-amber-100/80 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
                Electrical Retail Store · Catalog Foundation
              </Badge>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-5xl">
              {siteConfig.name}
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              {siteConfig.tagline}. High-efficiency wholesale and retail supply platform for contractors, electricians, and homeowners.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-md bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 transition-colors"
              >
                Access Portal Login
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/admin"
                className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-800 shadow-sm hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 transition-colors"
              >
                Go to Admin Shell
              </Link>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* Product Categories Preview */}
      <section className="py-12">
        <PageContainer
          title="Product Segments"
          description="Browse the store structure while the customer catalog is being connected in the next phase."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((cat) => (
              <Card key={cat.title} className="hover:border-amber-400 transition-colors">
                <CardHeader>
                  <div className="text-3xl mb-2">{cat.icon}</div>
                  <CardTitle className="text-base">{cat.title}</CardTitle>
                  <CardDescription>{cat.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </PageContainer>
      </section>

      {/* Architecture Highlights */}
      <section className="border-t border-neutral-200 bg-white py-12 dark:border-neutral-800 dark:bg-neutral-900/50">
        <PageContainer
          title="Platform Foundation"
          description="Production-grade architectural capabilities configured in this phase."
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-amber-600" />
                  <CardTitle className="text-base">Role-Based Security</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-neutral-600 dark:text-neutral-400">
                Multi-role RBAC architecture (CUSTOMER, ADMIN, SUPER_ADMIN) enforced through Next.js Proxy and server-side route guards.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-amber-600" />
                  <CardTitle className="text-base">MongoDB & Mongoose</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-neutral-600 dark:text-neutral-400">
                Singleton connection caching prevents connection pool leaks during Next.js hot module reloading, paired with clean error diagnostics.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-amber-600" />
                  <CardTitle className="text-base">Zod & Server Actions</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-neutral-600 dark:text-neutral-400">
                Type-safe server-side validation pattern prevents malformed or unverified payloads from reaching backend resources.
              </CardContent>
            </Card>
          </div>
        </PageContainer>
      </section>
    </div>
  );
}
