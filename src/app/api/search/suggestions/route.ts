import { NextResponse } from "next/server";
import { getPublicCategories, getPublicProducts } from "@/lib/catalog";

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function singular(value: string) {
  if (value.length <= 3) return value;
  if (value.endsWith("ies") && value.length > 4) {
    return value.slice(0, -3) + "y";
  }
  if (value.endsWith("sses") && value.length > 5) {
    return value.slice(0, -2);
  }
  if (value.endsWith("es") && value.length > 4) {
    return value.slice(0, -2);
  }
  if (value.endsWith("s") && value.length > 3) {
    return value.slice(0, -1);
  }
  return value;
}

function distance(a: string, b: string, maxDistance = 2) {
  if (Math.abs(a.length - b.length) > maxDistance) return maxDistance + 1;

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    let rowMinimum = current[0];

    for (let j = 1; j <= b.length; j += 1) {
      const value = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );

      current.push(value);
      rowMinimum = Math.min(rowMinimum, value);
    }

    if (rowMinimum > maxDistance) return maxDistance + 1;

    for (let j = 0; j < current.length; j += 1) {
      previous[j] = current[j];
    }
  }

  return previous[b.length];
}

function tokenMatchScore(queryToken: string, candidateToken: string) {
  const query = singular(queryToken);
  const candidate = singular(candidateToken);

  if (query === candidate) return 3;
  if (candidate.startsWith(query) || query.startsWith(candidate)) return 2;

  const maxDistance = query.length >= 5 ? 2 : query.length >= 4 ? 1 : 0;
  if (maxDistance === 0) return 0;

  return distance(query, candidate, maxDistance) <= maxDistance ? 1 : 0;
}

function categoryScore(query: string, name: string) {
  const queryTokens = normalize(query).split(" ").filter(Boolean);
  const candidateTokens = normalize(name).split(" ").filter(Boolean);

  if (!queryTokens.length || !candidateTokens.length) return 0;

  let matched = 0;
  for (const queryToken of queryTokens) {
    const best = candidateTokens.reduce(
      (score, candidateToken) =>
        Math.max(score, tokenMatchScore(queryToken, candidateToken)),
      0
    );
    matched += best;
  }

  const phraseBonus = normalize(name).includes(normalize(query)) ? 2 : 0;
  return matched + phraseBonus;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim().slice(0, 80) || "";

  if (query.length < 2) {
    return NextResponse.json(
      { products: [], categories: [], didYouMean: null },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const [result, publicCategories] = await Promise.all([
      getPublicProducts({
        q: query,
        page: 1,
        pageSize: 8,
        sort: "newest",
      }),
      getPublicCategories(),
    ]);

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

    const allCategories = publicCategories.flatMap((category) => [
      {
        id: category.id,
        name: category.name,
        slug: category.slug,
      },
      ...category.children.map((child) => ({
        id: child.id,
        name: child.name,
        slug: child.slug,
      })),
    ]);

    const normalizedQuery = normalize(query);
    const categories = allCategories
      .map((category) => ({
        ...category,
        score: categoryScore(normalizedQuery, category.name),
      }))
      .filter((category) => category.score > 0)
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
      .slice(0, 4)
      .map(({ score, ...category }) => category);

    const candidateNames = [
      ...products.map((product) => product.name),
      ...categories.map((category) => category.name),
    ];

    const queryTokens = normalizedQuery.split(" ").filter(Boolean);
    let didYouMean: string | null = null;
    let bestCorrectionScore = 0;

    for (const name of candidateNames) {
      const candidate = normalize(name);
      if (!candidate || candidate === normalizedQuery) continue;

      const candidateTokens = candidate.split(" ").filter(Boolean);
      const matched = queryTokens.reduce((total, token) => {
        return (
          total +
          candidateTokens.reduce(
            (best, candidateToken) =>
              Math.max(best, tokenMatchScore(token, candidateToken)),
            0
          )
        );
      }, 0);

      if (matched > bestCorrectionScore && matched >= Math.max(1, queryTokens.length)) {
        bestCorrectionScore = matched;
        didYouMean = name;
      }
    }

    return NextResponse.json(
      { products, categories, didYouMean },
      {
        headers: {
          "Cache-Control": "private, max-age=0, must-revalidate",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { products: [], categories: [], didYouMean: null },
      { status: 500 }
    );
  }
}
