import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getPublicSitemapData } from "@/lib/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { categories, products } = await getPublicSitemapData();
  const baseRoutes: MetadataRoute.Sitemap = [
    {
      url: new URL("/", siteConfig.url).toString(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: new URL("/products", siteConfig.url).toString(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: new URL("/categories", siteConfig.url).toString(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: new URL("/campaigns", siteConfig.url).toString(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  return [
    ...baseRoutes,
    ...categories.map((category) => ({
      url: new URL("/categories/" + category.slug, siteConfig.url).toString(),
      lastModified: category.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((product) => ({
      url: new URL("/products/" + product.slug, siteConfig.url).toString(),
      lastModified: product.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
