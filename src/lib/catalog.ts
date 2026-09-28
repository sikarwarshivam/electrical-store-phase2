import { cache } from "react";
import mongoose, { QueryFilter } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Brand } from "@/models/Brand";
import { Category } from "@/models/Category";
import { Inventory, IInventory } from "@/models/Inventory";
import { Product, IProduct } from "@/models/Product";
import { ProductVariant, IProductVariant } from "@/models/ProductVariant";

export async function getCatalogDashboardStats() {
  await connectToDatabase();

  const [products, activeProducts, variants, lowStock, categories, brands] =
    await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ status: "ACTIVE" }),
      ProductVariant.countDocuments({ status: { $ne: "ARCHIVED" } }),
      Inventory.countDocuments({
        $expr: {
          $and: [
            { $eq: ["$trackInventory", true] },
            { $gt: ["$availableQuantity", 0] },
            { $lte: ["$availableQuantity", "$lowStockThreshold"] },
          ],
        },
      }),
      Category.countDocuments({ isActive: true }),
      Brand.countDocuments({ isActive: true }),
    ]);

  return { products, activeProducts, variants, lowStock, categories, brands };
}

export async function getAdminCategories() {
  await connectToDatabase();

  return Category.find({})
    .sort({ parent: 1, sortOrder: 1, name: 1 })
    .lean();
}

export async function getAdminBrands() {
  await connectToDatabase();

  return Brand.find({}).sort({ sortOrder: 1, name: 1 }).lean();
}

export async function getAdminProducts(limit = 50) {
  await connectToDatabase();

  return Product.find({})
    .populate("category", "name slug")
    .populate("subcategory", "name slug")
    .populate("brand", "name slug")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

export async function getAdminProductById(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  await connectToDatabase();

  const [product, variants] = await Promise.all([
    Product.findById(id)
      .populate("category", "name slug parent")
      .populate("subcategory", "name slug parent")
      .populate("brand", "name slug")
      .lean(),
    ProductVariant.find({ product: id })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  if (!product) {
    return null;
  }

  const variantIds = variants.map((variant) => variant._id);
  const inventory = await Inventory.find({ variant: { $in: variantIds } }).lean();

  return { product, variants, inventory };
}

export async function getInventoryRows(limit = 100) {
  await connectToDatabase();

  return Inventory.find({})
    .populate({
      path: "variant",
      select: "sku product title pricePaise mrpPaise unitOfSale status",
      populate: { path: "product", select: "name slug" },
    })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .lean();
}

export async function getInventoryTransactions(variantId: string, limit = 20) {
  if (!mongoose.Types.ObjectId.isValid(variantId)) return [];

  const { InventoryTransaction } = await import("@/models/InventoryTransaction");
  await connectToDatabase();

  return InventoryTransaction.find({ variant: variantId })
    .populate("performedBy", "name email")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}



export interface PublicVariant {
  id: string;
  sku: string;
  title: string;
  options: Array<{ name: string; value: string }>;
  attributes: Array<{
    key: string;
    label: string;
    value: unknown;
    unit?: string;
    group?: string;
    sortOrder: number;
  }>;
  pricePaise: number;
  mrpPaise: number;
  unitOfSale: string;
  minOrderQuantity: number;
  orderQuantityStep: number;
  status: string;
  trackInventory: boolean;
  imageUrl?: string;
  imageAlt?: string;
  stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  availableQuantity: number;
}

export interface PublicProductCard {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  images: Array<{ url: string; alt: string; isPrimary: boolean; sortOrder: number }>;
  category: { name: string; slug: string };
  brand?: { name: string; slug: string };
  isVariable: boolean;
  pricePaise: number;
  mrpPaise: number;
  stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  variantCount: number;
}

export interface PublicCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  children: Array<{ id: string; name: string; slug: string; description?: string; imageUrl?: string }>;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^$()|[\]\\{}]/g, "\\$&");
}

function stringId(value: unknown): string {
  return String(value);
}

function publicStockStatus(
  variant: { trackInventory: boolean },
  inventory?: { availableQuantity?: number; lowStockThreshold?: number }
): "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" {
  if (!variant.trackInventory) return "IN_STOCK";
  const quantity = inventory?.availableQuantity ?? 0;
  if (quantity <= 0) return "OUT_OF_STOCK";
  if (quantity <= (inventory?.lowStockThreshold ?? 5)) return "LOW_STOCK";
  return "IN_STOCK";
}

type PublicVariantSource = Pick<
  IProductVariant,
  | "_id"
  | "sku"
  | "title"
  | "options"
  | "attributes"
  | "pricePaise"
  | "mrpPaise"
  | "unitOfSale"
  | "minOrderQuantity"
  | "orderQuantityStep"
  | "status"
  | "trackInventory"
  | "imageUrl"
  | "imageAlt"
  | "isDefault"
>;

type PublicInventorySource = Pick<
  IInventory,
  "variant" | "availableQuantity" | "lowStockThreshold"
>;

type CatalogRef = {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
  parent?: mongoose.Types.ObjectId | null;
};

type PublicProductSource = Pick<
  IProduct,
  "_id" | "name" | "slug" | "shortDescription" | "images" | "productType"
> & {
  category: IProduct["category"] | CatalogRef | null;
  brand?: IProduct["brand"] | CatalogRef | null;
};

function populatedCatalogRef(value: unknown): CatalogRef | undefined {
  if (
    typeof value !== "object" ||
    value === null ||
    !("_id" in value) ||
    !("name" in value) ||
    !("slug" in value)
  ) {
    return undefined;
  }

  const ref = value as {
    _id: mongoose.Types.ObjectId;
    name: unknown;
    slug: unknown;
    description?: unknown;
    imageUrl?: unknown;
    isActive?: unknown;
    parent?: unknown;
  };

  if (typeof ref.name !== "string" || typeof ref.slug !== "string") {
    return undefined;
  }

  return {
    _id: ref._id,
    name: ref.name,
    slug: ref.slug,
    description: typeof ref.description === "string" ? ref.description : undefined,
    imageUrl: typeof ref.imageUrl === "string" ? ref.imageUrl : undefined,
    isActive: typeof ref.isActive === "boolean" ? ref.isActive : undefined,
    parent:
      ref.parent instanceof mongoose.Types.ObjectId
        ? ref.parent
        : ref.parent === null
          ? null
          : undefined,
  };
}

function publicVariant(
  variant: PublicVariantSource,
  inventory?: PublicInventorySource
): PublicVariant {
  return {
    id: stringId(variant._id),
    sku: variant.sku,
    title: variant.title || "",
    options: variant.options.map((option) => ({
      name: option.name,
      value: option.value,
    })),
    attributes: variant.attributes.map((attribute) => ({
      key: attribute.key,
      label: attribute.label,
      value: attribute.value,
      unit: attribute.unit,
      group: attribute.group,
      sortOrder: attribute.sortOrder ?? 0,
    })),
    pricePaise: variant.pricePaise,
    mrpPaise: variant.mrpPaise,
    unitOfSale: variant.unitOfSale,
    minOrderQuantity: variant.minOrderQuantity,
    orderQuantityStep: variant.orderQuantityStep,
    status: variant.status,
    trackInventory: variant.trackInventory,
    imageUrl: variant.imageUrl || undefined,
    imageAlt: variant.imageAlt || undefined,
    stockStatus: publicStockStatus(variant, inventory),
    availableQuantity: inventory?.availableQuantity ?? 0,
  };
}

function publicCard(
  product: PublicProductSource,
  variants: PublicVariantSource[],
  inventoryMap: Map<string, PublicInventorySource>
): PublicProductCard {
  const normalizedVariants = variants.map((variant) =>
    publicVariant(variant, inventoryMap.get(stringId(variant._id)))
  );
  const defaultVariant =
    normalizedVariants.find((variant) =>
      variants.find((item) => stringId(item._id) === variant.id)?.isDefault
    ) || normalizedVariants[0];
  const lowestPrice = Math.min(
    ...normalizedVariants.map((variant) => variant.pricePaise)
  );
  const lowestPriceVariant =
    normalizedVariants.find((variant) => variant.pricePaise === lowestPrice) ||
    defaultVariant;
  const hasStock = normalizedVariants.some(
    (variant) => variant.stockStatus === "IN_STOCK"
  );
  const hasLowStock = normalizedVariants.some(
    (variant) => variant.stockStatus === "LOW_STOCK"
  );

  return {
    id: stringId(product._id),
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription || undefined,
    images: product.images.map((image) => ({
      url: image.url,
      alt: image.alt || product.name,
      isPrimary: Boolean(image.isPrimary),
      sortOrder: image.sortOrder ?? 0,
    })),
    category: {
      name: populatedCatalogRef(product.category)?.name || "Electrical",
      slug: populatedCatalogRef(product.category)?.slug || "",
    },
    brand: populatedCatalogRef(product.brand)
      ? {
          name: populatedCatalogRef(product.brand)!.name,
          slug: populatedCatalogRef(product.brand)!.slug,
        }
      : undefined,
    isVariable: product.productType === "VARIABLE",
    pricePaise: lowestPriceVariant?.pricePaise ?? lowestPrice,
    mrpPaise:
      product.productType === "SIMPLE"
        ? (defaultVariant?.mrpPaise ?? lowestPrice)
        : (lowestPriceVariant?.mrpPaise ?? lowestPrice),
    stockStatus: hasStock
      ? "IN_STOCK"
      : hasLowStock
        ? "LOW_STOCK"
        : "OUT_OF_STOCK",
    variantCount: normalizedVariants.length,
  };
}

function intersectIdSets(sets: string[][]): string[] {
  if (sets.length === 0) return [];
  const first = new Set(sets[0]);
  for (const ids of sets.slice(1)) {
    const allowed = new Set(ids);
    for (const id of Array.from(first)) {
      if (!allowed.has(id)) first.delete(id);
    }
  }
  return Array.from(first);
}

export async function getPublicCategories(): Promise<PublicCategory[]> {
  await connectToDatabase();

  const [categories, children] = await Promise.all([
    Category.find({ isActive: true, parent: null })
      .select("_id name slug description imageUrl sortOrder")
      .sort({ sortOrder: 1, name: 1 })
      .lean(),
    Category.find({ isActive: true, parent: { $ne: null } })
      .select("_id name slug description imageUrl parent sortOrder")
      .sort({ sortOrder: 1, name: 1 })
      .lean(),
  ]);

  const childMap = new Map<string, PublicCategory["children"]>();
  for (const child of children) {
    const parentId = stringId(child.parent);
    const list = childMap.get(parentId) || [];
    list.push({
      id: stringId(child._id),
      name: child.name,
      slug: child.slug,
      description: child.description || undefined,
      imageUrl: child.imageUrl || undefined,
    });
    childMap.set(parentId, list);
  }

  return categories.map((category) => ({
    id: stringId(category._id),
    name: category.name,
    slug: category.slug,
    description: category.description || undefined,
    imageUrl: category.imageUrl || undefined,
    children: childMap.get(stringId(category._id)) || [],
  }));
}

export async function getPublicBrands() {
  await connectToDatabase();

  const brands = await Brand.find({ isActive: true })
    .select("_id name slug description logoUrl")
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  return brands.map((brand) => ({
    id: stringId(brand._id),
    name: brand.name,
    slug: brand.slug,
    description: brand.description || undefined,
    logoUrl: brand.logoUrl || undefined,
  }));
}

export const getPublicCategoryBySlug = cache(async function getPublicCategoryBySlug(slug: string) {
  await connectToDatabase();

  const category = await Category.findOne({ slug, isActive: true })
    .select("_id name slug description imageUrl parent")
    .lean();

  if (!category) return null;

  const children = await Category.find({
    parent: category._id,
    isActive: true,
  })
    .select("_id name slug description imageUrl")
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  return {
    id: stringId(category._id),
    name: category.name,
    slug: category.slug,
    description: category.description || undefined,
    imageUrl: category.imageUrl || undefined,
    parent: category.parent ? stringId(category.parent) : null,
    children: children.map((child) => ({
      id: stringId(child._id),
      name: child.name,
      slug: child.slug,
      description: child.description || undefined,
      imageUrl: child.imageUrl || undefined,
    })),
  };
});


type SearchCandidate = {
  _id: mongoose.Types.ObjectId;
  name?: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  searchKeywords?: string[];
  attributes?: Array<{ label?: string; value?: unknown }>;
  product?: mongoose.Types.ObjectId;
  sku?: string;
  title?: string;
  options?: Array<{ name?: string; value?: string }>;
};

type SearchMatch = {
  id: string;
  score: number;
  name: string;
  fuzzy: boolean;
};

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function searchTokens(value: string): string[] {
  return normalizeSearchText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);
}

function singularSearchToken(token: string): string {
  if (token.length <= 3) return token;
  if (token.endsWith("ies") && token.length > 4) {
    return token.slice(0, -3) + "y";
  }
  if (token.endsWith("sses") && token.length > 5) {
    return token.slice(0, -2);
  }
  if (token.endsWith("es") && token.length > 4) {
    return token.slice(0, -2);
  }
  if (token.endsWith("s") && token.length > 3) {
    return token.slice(0, -1);
  }
  return token;
}

function boundedLevenshtein(a: string, b: string, maxDistance: number): number {
  if (Math.abs(a.length - b.length) > maxDistance) return maxDistance + 1;

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    let rowMinimum = current[0];

    for (let j = 1; j <= b.length; j += 1) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      const value = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + substitutionCost
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

function searchTokenScore(queryToken: string, candidateToken: string): { score: number; fuzzy: boolean } {
  const query = singularSearchToken(queryToken);
  const candidate = singularSearchToken(candidateToken);

  if (query === candidate) return { score: 50, fuzzy: false };
  if (candidate.startsWith(query) || query.startsWith(candidate)) {
    return { score: 34, fuzzy: false };
  }

  const maxDistance = query.length >= 7 ? 2 : query.length >= 5 ? 1 : query.length >= 4 ? 1 : 0;
  if (maxDistance === 0) return { score: 0, fuzzy: false };

  const distance = boundedLevenshtein(query, candidate, maxDistance);
  if (distance > maxDistance) return { score: 0, fuzzy: false };

  return {
    score: distance === 1 ? 28 : 20,
    fuzzy: true,
  };
}

function scoreSearchCandidate(queryText: string, candidate: SearchCandidate): Omit<SearchMatch, "id"> {
  const queryTokens = searchTokens(queryText);
  if (queryTokens.length === 0) {
    return { score: 0, name: candidate.name || candidate.title || "", fuzzy: false };
  }

  const fields = [
    { text: candidate.name || "", weight: 4 },
    { text: candidate.title || "", weight: 3 },
    { text: candidate.sku || "", weight: 3 },
    { text: candidate.slug || "", weight: 2 },
    { text: (candidate.searchKeywords || []).join(" "), weight: 3 },
    { text: candidate.shortDescription || "", weight: 2 },
    { text: candidate.description || "", weight: 1 },
    {
      text: (candidate.options || [])
        .flatMap((option) => [option.name || "", option.value || ""])
        .join(" "),
      weight: 2,
    },
    {
      text: (candidate.attributes || [])
        .flatMap((attribute) => [
          attribute.label || "",
          attribute.value == null ? "" : String(attribute.value),
        ])
        .join(" "),
      weight: 2,
    },
  ];

  const normalizedWholeQuery = normalizeSearchText(queryText);
  const normalizedName = normalizeSearchText(candidate.name || candidate.title || "");
  const compactQuery = normalizedWholeQuery.replace(/ /g, "");
  const compactName = normalizedName.replace(/ /g, "");

  let score = 0;
  let matchedTokens = 0;
  let fuzzy = false;

  for (const queryToken of queryTokens) {
    let bestScore = 0;
    let bestFuzzy = false;

    for (const field of fields) {
      const normalizedField = normalizeSearchText(field.text);
      if (!normalizedField) continue;

      if (normalizedField.includes(queryToken)) {
        bestScore = Math.max(bestScore, 44 * field.weight);
      }

      for (const candidateToken of searchTokens(normalizedField)) {
        const result = searchTokenScore(queryToken, candidateToken);
        const weightedScore = result.score * field.weight;
        if (weightedScore > bestScore) {
          bestScore = weightedScore;
          bestFuzzy = result.fuzzy;
        }
      }
    }

    if (bestScore > 0) {
      matchedTokens += 1;
      score += bestScore;
      fuzzy = fuzzy || bestFuzzy;
    }
  }

  const requiredMatches = Math.max(1, Math.ceil(queryTokens.length * 0.6));
  if (matchedTokens < requiredMatches) {
    return {
      score: 0,
      name: candidate.name || candidate.title || "",
      fuzzy: false,
    };
  }

  if (normalizedName.includes(normalizedWholeQuery)) score += 110;
  if (compactQuery && compactName.includes(compactQuery)) score += 55;
  if (matchedTokens === queryTokens.length) score += 45;

  return {
    score,
    name: candidate.name || candidate.title || "",
    fuzzy,
  };
}

async function findPublicSearchMatches(
  queryText: string,
  allowedProductIds: mongoose.Types.ObjectId[]
): Promise<SearchMatch[]> {
  const normalized = normalizeSearchText(queryText);
  if (!normalized || allowedProductIds.length === 0) return [];

  const productCandidates = (await Product.find({
    status: "ACTIVE",
    _id: { $in: allowedProductIds },
  })
    .select("_id name slug shortDescription description searchKeywords attributes")
    .limit(5000)
    .lean()) as SearchCandidate[];

  const variantCandidates = (await ProductVariant.find({
    status: "ACTIVE",
    product: { $in: allowedProductIds },
  })
    .select("product sku title options attributes")
    .limit(5000)
    .lean()) as unknown as SearchCandidate[];

  const scores = new Map<string, SearchMatch>();

  for (const candidate of productCandidates) {
    const scored = scoreSearchCandidate(normalized, candidate);
    if (scored.score <= 0) continue;

    scores.set(stringId(candidate._id), {
      id: stringId(candidate._id),
      score: scored.score,
      name: candidate.name || "",
      fuzzy: scored.fuzzy,
    });
  }

  for (const candidate of variantCandidates) {
    if (!candidate.product) continue;

    const scored = scoreSearchCandidate(normalized, candidate);
    if (scored.score <= 0) continue;

    const id = stringId(candidate.product);
    const existing = scores.get(id);
    const mergedScore = Math.max(existing?.score || 0, scored.score + 12);

    scores.set(id, {
      id,
      score: mergedScore,
      name: existing?.name || scored.name,
      fuzzy: Boolean(existing?.fuzzy || scored.fuzzy),
    });
  }

  return Array.from(scores.values())
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, 50);
}

export async function getPublicProducts(options: {
  q?: string;
  spec?: string;
  categorySlug?: string;
  brandSlug?: string;
  sort?: "newest" | "price-asc" | "price-desc" | "name";
  page?: number;
  pageSize?: number;
  excludeProductId?: string;
} = {}) {
  await connectToDatabase();

  const pageSize = Math.min(Math.max(options.pageSize ?? 24, 1), 48);
  const page = Math.max(options.page ?? 1, 1);

  const [activeCategoryDocs, activeBrandDocs, activeVariantProductIds] = await Promise.all([
    Category.find({ isActive: true }).select("_id").lean(),
    Brand.find({ isActive: true }).select("_id").lean(),
    ProductVariant.distinct("product", { status: "ACTIVE" }),
  ]);

  const andConditions: QueryFilter<IProduct>[] = [
    {
      $or: [
        { brand: null },
        { brand: { $in: activeBrandDocs.map((item) => item._id) } },
      ],
    },
  ];

  const baseQuery: QueryFilter<IProduct> = {
    status: "ACTIVE",
    _id: { $in: activeVariantProductIds },
    category: { $in: activeCategoryDocs.map((item) => item._id) },
    $or: [
      { subcategory: null },
      { subcategory: { $in: activeCategoryDocs.map((item) => item._id) } },
    ],
    $and: andConditions,
  };

  if (options.excludeProductId && mongoose.Types.ObjectId.isValid(options.excludeProductId)) {
    andConditions.push({
      _id: { $ne: new mongoose.Types.ObjectId(options.excludeProductId) },
    });
  }

  if (options.categorySlug) {
    const selected = await Category.findOne({
      slug: options.categorySlug,
      isActive: true,
    })
      .select("_id parent")
      .lean();

    if (!selected) {
      return { products: [], total: 0, page: 1, pageSize, totalPages: 0 };
    }

    if (selected.parent) {
      baseQuery.subcategory = selected._id;
    } else {
      const children = await Category.find({
        parent: selected._id,
        isActive: true,
      })
        .select("_id")
        .lean();

      const scopedIds = [selected._id, ...children.map((child) => child._id)];
      baseQuery.category = { $in: scopedIds };
    }
  }

  if (options.brandSlug) {
    const selectedBrand = await Brand.findOne({
      slug: options.brandSlug,
      isActive: true,
    })
      .select("_id")
      .lean();

    if (!selectedBrand) {
      return { products: [], total: 0, page: 1, pageSize, totalPages: 0 };
    }

    andConditions.push({ brand: selectedBrand._id });
  }

  const idSets: string[][] = [];
  let searchMatchOrder: string[] = [];
  let searchMatches: SearchMatch[] = [];

  const queryText = options.q?.trim().slice(0, 80);
  if (queryText) {
    searchMatches = await findPublicSearchMatches(queryText, activeVariantProductIds);
    searchMatchOrder = searchMatches.map((match) => match.id);

    idSets.push(searchMatches.map((match) => match.id));
  }

  const specText = options.spec?.trim().slice(0, 100);
  if (specText) {
    const separatorIndex = specText.indexOf(":");
    const specKey = separatorIndex > 0 ? specText.slice(0, separatorIndex).trim() : "";
    const specValue = separatorIndex > 0 ? specText.slice(separatorIndex + 1).trim() : "";

    if (specKey && specValue) {
      const keyRegex = new RegExp("^" + escapeRegex(specKey) + "$", "i");
      const valueRegex = new RegExp(escapeRegex(specValue), "i");
      const numericValue = Number(specValue);
      const isNumeric = specValue !== "" && Number.isFinite(numericValue);
      const valueCondition = isNumeric ? { $in: [numericValue, valueRegex] } : valueRegex;

      const [productMatches, variantMatches] = await Promise.all([
        Product.find({
          status: "ACTIVE",
          attributes: { $elemMatch: { key: keyRegex, value: valueCondition } },
        }).distinct("_id"),
        ProductVariant.find({
          status: "ACTIVE",
          $or: [
            { attributes: { $elemMatch: { key: keyRegex, value: valueCondition } } },
            { options: { $elemMatch: { name: keyRegex, value: valueRegex } } },
          ],
        }).distinct("product"),
      ]);

      idSets.push([
        ...productMatches.map(stringId),
        ...variantMatches.map(stringId),
      ]);
    }
  }

  if (idSets.length > 0) {
    const matchedIds = intersectIdSets(idSets);
    if (matchedIds.length === 0) {
      return { products: [], total: 0, page: 1, pageSize, totalPages: 0 };
    }
    andConditions.push({
      _id: { $in: matchedIds.map((id) => new mongoose.Types.ObjectId(id)) },
    });
  }

  const total = await Product.countDocuments(baseQuery);
  const sort = options.sort ?? "newest";
  const needsPriceSort = sort === "price-asc" || sort === "price-desc";

  let products;
  if (needsPriceSort) {
    products = await Product.find(baseQuery)
      .populate("category", "name slug")
      .populate("brand", "name slug")
      .sort({ createdAt: -1 })
      .limit(5000)
      .lean();
  } else {
    const sortQuery: Record<string, 1 | -1> =
      sort === "name"
        ? { name: 1 }
        : { createdAt: -1 };

    products = await Product.find(baseQuery)
      .populate("category", "name slug")
      .populate("brand", "name slug")
      .sort(sortQuery)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();
  }

  const productIds = products.map((product) => product._id);
  const variants = productIds.length
    ? await ProductVariant.find({
        product: { $in: productIds },
        status: "ACTIVE",
      })
        .sort({ isDefault: -1, pricePaise: 1 })
        .lean()
    : [];

  const variantIds = variants.map((variant) => variant._id);
  const inventories = variantIds.length
    ? await Inventory.find({ variant: { $in: variantIds} }).lean()
    : [];

  const inventoryMap = new Map(inventories.map((inventory) => [stringId(inventory.variant), inventory]));
  const variantsByProduct = new Map<string, PublicVariantSource[]>();

  for (const variant of variants) {
    const productId = stringId(variant.product);
    const list = variantsByProduct.get(productId) || [];
    list.push(variant);
    variantsByProduct.set(productId, list);
  }

  const publicProducts = products.map((product) =>
    publicCard(product, variantsByProduct.get(stringId(product._id)) || [], inventoryMap)
  );

  if (queryText && searchMatchOrder.length > 0 && !needsPriceSort && sort !== "name") {
    const relevance = new Map(searchMatchOrder.map((id, index) => [id, index]));
    publicProducts.sort(
      (a, b) =>
        (relevance.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
        (relevance.get(b.id) ?? Number.MAX_SAFE_INTEGER)
    );
  }

  if (needsPriceSort) {
    publicProducts.sort((a, b) =>
      sort === "price-asc"
        ? a.pricePaise - b.pricePaise
        : b.pricePaise - a.pricePaise
    );
    const start = (page - 1) * pageSize;
    return {
      products: publicProducts.slice(start, start + pageSize),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  return {
    products: publicProducts,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getPublicSitemapData() {
  await connectToDatabase();

  const [categories, activeVariantProductIds] = await Promise.all([
    Category.find({ isActive: true })
      .select("_id slug updatedAt")
      .sort({ slug: 1 })
      .lean(),
    ProductVariant.distinct("product", { status: "ACTIVE" }),
  ]);

  const categoryIds = categories.map((category) => category._id);

  const products = categoryIds.length
    ? await Product.find({
        status: "ACTIVE",
        category: { $in: categoryIds },
        _id: { $in: activeVariantProductIds },
      })
        .select("_id slug updatedAt")
        .sort({ slug: 1 })
        .lean()
    : [];

  return {
    categories: categories.map((category) => ({
      slug: category.slug,
      updatedAt: category.updatedAt,
    })),
    products: products.map((product) => ({
      slug: product.slug,
      updatedAt: product.updatedAt,
    })),
  };
}

export const getPublicProductBySlug = cache(async function getPublicProductBySlug(slug: string) {
  await connectToDatabase();

  const product = await Product.findOne({
    slug,
    status: "ACTIVE",
  })
    .populate("category", "name slug description isActive")
    .populate("subcategory", "name slug description isActive")
    .populate("brand", "name slug isActive")
    .lean();

  if (!product || !product.category) return null;

  const category = product.category as unknown as CatalogRef;
  const subcategory = product.subcategory as unknown as CatalogRef | null;
  const brand = product.brand as unknown as CatalogRef | null;

  if (!category.isActive || (subcategory && !subcategory.isActive) || (brand && !brand.isActive)) {
    return null;
  }

  const [variants, relatedData] = await Promise.all([
    ProductVariant.find({
      product: product._id,
      status: "ACTIVE",
    })
      .sort({ isDefault: -1, pricePaise: 1 })
      .lean(),
    getPublicProducts({
      categorySlug: category.slug,
      page: 1,
      pageSize: 8,
      sort: "newest",
      excludeProductId: stringId(product._id),
    }),
  ]);

  if (variants.length === 0) return null;

  const inventories = await Inventory.find({
    variant: { $in: variants.map((variant) => variant._id) },
  }).lean();

  const inventoryMap = new Map(inventories.map((inventory) => [stringId(inventory.variant), inventory]));

  const publicVariants = variants.map((variant) =>
    publicVariant(variant, inventoryMap.get(stringId(variant._id)))
  );

  return {
    id: stringId(product._id),
    name: product.name,
    slug: product.slug,
    shortDescription: product.shortDescription || "",
    description: product.description || "",
    images: (product.images || []).map((image) => ({
      url: image.url,
      alt: image.alt || product.name,
      isPrimary: Boolean(image.isPrimary),
      sortOrder: image.sortOrder ?? 0,
    })),
    attributes: (product.attributes || []).map((attribute) => ({
      key: attribute.key,
      label: attribute.label,
      value: attribute.value,
      unit: attribute.unit,
      group: attribute.group,
      sortOrder: attribute.sortOrder ?? 0,
    })),
    tax: {
      hsnCode: product.tax?.hsnCode || undefined,
      gstRate: product.tax?.gstRate,
      isGstInclusive: product.tax?.isGstInclusive ?? true,
    },
    category: {
      id: stringId(category._id),
      name: category.name,
      slug: category.slug,
      description: category.description || undefined,
    },
    subcategory: subcategory
      ? {
          id: stringId(subcategory._id),
          name: subcategory.name,
          slug: subcategory.slug,
          description: subcategory.description || undefined,
        }
      : null,
    brand: brand
      ? { id: stringId(brand._id), name: brand.name, slug: brand.slug }
      : null,
    productType: product.productType,
    variants: publicVariants,
    relatedProducts: relatedData.products,
  };
});
