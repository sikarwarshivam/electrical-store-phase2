/**
 * SEO / analytics / performance architecture verification.
 *
 * This remains database-independent and checks that the production-facing
 * foundations are present without requiring client business data.
 */

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    console.log("✅ [PASS] " + message);
    passed++;
  } else {
    console.error("❌ [FAIL] " + message);
  }
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const requiredFiles = [
  "src/app/robots.ts",
  "src/app/sitemap.ts",
  "src/components/analytics/google-analytics.tsx",
];

for (const file of requiredFiles) {
  assert(fs.existsSync(path.join(root, file)), file + " exists");
}

const layout = read("src/app/layout.tsx");
const siteConfig = read("src/config/site.ts");
const sitemap = read("src/app/sitemap.ts");
const robots = read("src/app/robots.ts");
const analytics = read("src/components/analytics/google-analytics.tsx");
const nextConfig = read("next.config.ts");
const productPage = read("src/app/(store)/products/[slug]/page.tsx");

assert(siteConfig.includes("NEXT_PUBLIC_SITE_URL"), "Site URL is environment-configurable");
assert(layout.includes("metadataBase") && layout.includes("openGraph"), "Root metadata includes canonical base and Open Graph defaults");
assert(robots.includes("/admin/") && robots.includes("/api/") && robots.includes("sitemap.xml"), "Robots rules protect internal routes and publish sitemap location");
assert(sitemap.includes("getPublicSitemapData") && sitemap.includes("/products/") && sitemap.includes("/categories/"), "Sitemap contains dynamic product and category routes");
assert(analytics.includes("NEXT_PUBLIC_GA_MEASUREMENT_ID") && analytics.includes("send_page_view"), "Google Analytics is opt-in and SPA page views are controlled");
assert(nextConfig.includes("res.cloudinary.com") && nextConfig.includes("remotePatterns"), "Cloudinary is configured for Next.js image optimization");
assert(productPage.includes("application/ld+json") && productPage.includes("AggregateOffer"), "Product pages emit Product structured data with offers");

console.log("\nSEO Architecture Tests: " + passed + "/" + total + " checks passed");
process.exit(passed === total ? 0 : 1);
