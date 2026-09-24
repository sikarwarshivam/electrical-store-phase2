/**
 * Phase 2 architecture verification.
 *
 * This is intentionally database-independent. It checks that the catalog
 * foundation is present and that the major invariants are represented in the
 * source tree without inventing live business data.
 */

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    console.log(`✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${message}`);
  }
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

const requiredFiles = [
  "src/models/Category.ts",
  "src/models/Brand.ts",
  "src/models/Product.ts",
  "src/models/ProductVariant.ts",
  "src/models/Inventory.ts",
  "src/models/InventoryTransaction.ts",
  "src/schemas/catalog.ts",
  "src/actions/catalog.ts",
  "src/lib/catalog.ts",
  "src/lib/money.ts",
  "src/lib/slug.ts",
  "src/app/admin/categories/page.tsx",
  "src/app/admin/brands/page.tsx",
  "src/app/admin/products/page.tsx",
  "src/app/admin/products/[id]/page.tsx",
  "src/app/admin/inventory/page.tsx",
];

for (const file of requiredFiles) {
  assert(fs.existsSync(path.join(root, file)), `${file} exists`);
}

const productModel = read("src/models/Product.ts");
const variantModel = read("src/models/ProductVariant.ts");
const inventoryModel = read("src/models/Inventory.ts");
const catalogSchema = read("src/schemas/catalog.ts");
const cartTypes = read("src/types/index.ts");

assert(productModel.includes('status') && productModel.includes('"DRAFT"') && productModel.includes('"ACTIVE"'), "Product lifecycle states are defined");
assert(productModel.includes('slug') && productModel.includes('unique: true'), "Product slug is unique");
assert(variantModel.includes('sku') && variantModel.includes('unique: true'), "SKU is globally unique");
assert(variantModel.includes('pricePaise') && variantModel.includes('mrpPaise'), "Variant money uses paise fields");
assert(variantModel.includes('unitOfSale'), "Variant has an explicit unit of sale");
assert(inventoryModel.includes('reservedQuantity') && inventoryModel.includes('lowStockThreshold'), "Inventory stores reservation and low-stock controls");
assert(inventoryModel.includes('stockStatus'), "Inventory has a queryable stock status");
assert(catalogSchema.includes('gstRate') && catalogSchema.includes('hsnCode'), "GST/HSN are configurable schema fields");
assert(catalogSchema.includes('METER') && catalogSchema.includes('ROLL') && catalogSchema.includes('PACK'), "Measurable/pack sale units are supported");
assert(cartTypes.includes('variantId') && cartTypes.includes('unitPricePaise'), "Cart foundation identifies SKU/variant and uses paise");
assert(!read("src/app/admin/categories/page.tsx").includes("18% on electrical accessories"), "No hardcoded GST example remains in category admin UI");

console.log(`\nPhase 2 Architecture Tests: ${passed}/${total} checks passed`);

process.exit(passed === total ? 0 : 1);
