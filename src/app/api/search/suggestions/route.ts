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

    function normalize(value: string) {
      return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }

    function singular(value: string) {
      if (value.length <= 3) return value;
      if (value.endsWith("ies") && value.length > 4) {
        return value.slice(0, -3) + "y";
      }
      if (value.endsWith("es") && value.length > 4) {
        return value.slice(0, -2);
      }
      if (value.endsWith("s") && value.length > 3) {
        return value.slice(0, -1);
      }
      return value;
    }

    function distance(a: string, b: string) {
      const previous = Array.from({ length: b.length + 1 }, (_, index) => index);

      for (let i = 1; i <= a.length; i += 1) {
        const current = [i];
        for (let j = 1; j <= b.length; j += 1) {
          current.push(
            Math.min(
              previous[j] + 1,
              current[j - 1] + 1,
              previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
            )
          );
        }
        for (let j = 0; j < current.length; j += 1) previous[j] = current[j];
      }

      return previous[b.length];
    }

    const queryTokens = normalize(query).split(" ").filter(Boolean);
    const topName = products[0]?.name || "";
    const nameTokens = normalize(topName).split(" ").filter(Boolean);

    const hasTypoSignal =
      queryTokens.length > 0 &&
      queryTokens.some((queryToken) => {
        const singularQuery = singular(queryToken);
        const exactMatch = nameTokens.some(
          (nameToken) => singular(nameToken) === singularQuery
        );
        if (exactMatch) return false;

        const nearMatch = nameTokens.some(
          (nameToken) =>
            singularQuery.length >= 4 &&
            distance(singularQuery, singular(nameToken)) <=
              (singularQuery.length >= 5 ? 2 : 1)
        );
        return nearMatch;
      });

    const didYouMean =
      products.length > 0 && hasTypoSignal && queryTokens.length > 0
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
