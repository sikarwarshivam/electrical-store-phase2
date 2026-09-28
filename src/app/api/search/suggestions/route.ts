import { NextResponse } from "next/server";
import { getPublicProducts } from "@/lib/catalog";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim().slice(0, 80) || "";

  if (query.length < 2) {
    return NextResponse.json(
      { products: [], didYouMean: null },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const result = await getPublicProducts({
      q: query,
      page: 1,
      pageSize: 8,
      sort: "newest",
    });

    const products = result.products.slice(0, 8).map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      image:
        product.images.find((image) => image.isPrimary)?.url ||
        product.images[0]?.url ||
        null,
      brand: product.brand?.name || null,
      category: product.category.name,
      pricePaise: product.pricePaise,
    }));

    const normalizedQuery = query
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const topName = products[0]?.name || "";
    const normalizedTopName = topName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const didYouMean =
      products.length > 0 &&
      normalizedTopName !== normalizedQuery &&
      normalizedQuery.length >= 4
        ? topName
        : null;

    return NextResponse.json(
      { products, didYouMean },
      {
        headers: {
          "Cache-Control": "private, max-age=0, must-revalidate",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { products: [], didYouMean: null },
      { status: 500 }
    );
  }
}
