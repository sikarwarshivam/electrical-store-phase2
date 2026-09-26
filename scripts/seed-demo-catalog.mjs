import fs from "node:fs";
import mongoose from "mongoose";

function loadLocalEnv() {
  const file = process.cwd() + "/.env.local";
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const value = line.trim();
    if (!value || value.startsWith("#")) continue;
    const i = value.indexOf("=");
    if (i < 1) continue;
    const key = value.slice(0, i).trim();
    let val = value.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadLocalEnv();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error("MONGODB_URI is missing. Configure it in .env.local.");

const CategorySchema = new mongoose.Schema({
  name: String, slug: { type: String, unique: true }, description: String,
  parent: { type: mongoose.Schema.Types.ObjectId, default: null }, imageUrl: String,
  isActive: Boolean, isFeatured: Boolean, sortOrder: Number
}, { timestamps: true });

const BrandSchema = new mongoose.Schema({
  name: String, slug: { type: String, unique: true }, description: String,
  logoUrl: String, isActive: Boolean, sortOrder: Number
}, { timestamps: true });

const ProductImageSchema = new mongoose.Schema({
  url: String, publicId: String, alt: String, sortOrder: Number, isPrimary: Boolean
}, { _id: false });

const ProductSchema = new mongoose.Schema({
  name: String, slug: { type: String, unique: true }, shortDescription: String,
  description: String, category: mongoose.Schema.Types.ObjectId,
  subcategory: mongoose.Schema.Types.ObjectId, brand: mongoose.Schema.Types.ObjectId,
  productType: { type: String, enum: ["SIMPLE", "VARIABLE"] }, status: String,
  images: { type: [ProductImageSchema], default: [] },
  attributes: { type: Array, default: [] }, searchKeywords: { type: [String], default: [] },
  tax: { hsnCode: String, gstRate: Number, isGstInclusive: Boolean }
}, { timestamps: true });

const VariantSchema = new mongoose.Schema({
  product: mongoose.Schema.Types.ObjectId, sku: { type: String, unique: true },
  title: String, options: { type: Array, default: [] }, attributes: { type: Array, default: [] },
  pricePaise: Number, mrpPaise: Number, unitOfSale: String,
  minOrderQuantity: Number, orderQuantityStep: Number, status: String,
  archivedByProduct: Boolean, isDefault: Boolean, trackInventory: Boolean,
  imageUrl: String, imageAlt: String
}, { timestamps: true });

const InventorySchema = new mongoose.Schema({
  variant: { type: mongoose.Schema.Types.ObjectId, unique: true }, stockUnit: String,
  availableQuantity: Number, reservedQuantity: Number, lowStockThreshold: Number,
  stockStatus: String, trackInventory: Boolean, allowBackorder: Boolean
}, { timestamps: true });

const Category = mongoose.models.DemoSeedCategory || mongoose.model("DemoSeedCategory", CategorySchema, "categories");
const Brand = mongoose.models.DemoSeedBrand || mongoose.model("DemoSeedBrand", BrandSchema, "brands");
const Product = mongoose.models.DemoSeedProduct || mongoose.model("DemoSeedProduct", ProductSchema, "products");
const Variant = mongoose.models.DemoSeedVariant || mongoose.model("DemoSeedVariant", VariantSchema, "productvariants");
const Inventory = mongoose.models.DemoSeedInventory || mongoose.model("DemoSeedInventory", InventorySchema, "inventories");

function esc(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function demoImage(kind, title, variant) {
  const colors = {
    lighting: "#f59e0b", switch: "#64748b", wire: "#2563eb", fan: "#0f766e",
    protection: "#dc2626", accessory: "#7c3aed", conduit: "#475569",
    tool: "#ea580c", power: "#16a34a", industrial: "#334155"
  };
  const color = colors[kind] || "#334155";
  const safe = esc(title);
  let graphic = "";
  if (kind === "lighting") {
    graphic = '<circle cx="400" cy="210" r="84" fill="#fff" stroke="' + color + '" stroke-width="18"/><path d="M350 280h100M365 304h70" stroke="' + color + '" stroke-width="14" stroke-linecap="round"/><path d="M400 90v-32M482 115l24-24M318 115l-24-24" stroke="' + color + '" stroke-width="11" stroke-linecap="round"/>';
  } else if (kind === "switch") {
    graphic = '<rect x="305" y="85" width="190" height="260" rx="24" fill="#fff" stroke="' + color + '" stroke-width="12"/><rect x="358" y="125" width="84" height="122" rx="14" fill="#e7e5e4" stroke="' + color + '" stroke-width="8"/><circle cx="400" cy="302" r="20" fill="' + color + '"/>';
  } else if (kind === "wire") {
    graphic = '<path d="M120 275 C220 75 320 475 420 275 S620 75 720 275" fill="none" stroke="' + color + '" stroke-width="46" stroke-linecap="round"/><circle cx="120" cy="275" r="30" fill="#fff" stroke="' + color + '" stroke-width="10"/>';
  } else if (kind === "fan") {
    graphic = '<circle cx="400" cy="240" r="42" fill="#fff" stroke="' + color + '" stroke-width="12"/><path d="M400 198 C280 110 212 140 298 228 C210 305 270 370 392 282 C512 372 580 328 502 236 C580 152 520 108 400 198Z" fill="' + color + '" opacity=".9"/>';
  } else if (kind === "protection") {
    graphic = '<rect x="285" y="82" width="230" height="285" rx="18" fill="#fff" stroke="' + color + '" stroke-width="12"/><rect x="344" y="138" width="112" height="142" rx="10" fill="#fef2f2" stroke="' + color + '" stroke-width="8"/><path d="M400 165v92" stroke="' + color + '" stroke-width="18" stroke-linecap="round"/><circle cx="400" cy="320" r="16" fill="' + color + '"/>';
  } else if (kind === "accessory") {
    graphic = '<rect x="315" y="108" width="170" height="220" rx="22" fill="#fff" stroke="' + color + '" stroke-width="12"/><circle cx="360" cy="190" r="17" fill="' + color + '"/><circle cx="440" cy="190" r="17" fill="' + color + '"/><rect x="355" y="235" width="90" height="34" rx="8" fill="' + color + '" opacity=".22"/>';
  } else if (kind === "conduit") {
    graphic = '<path d="M165 292h470" stroke="' + color + '" stroke-width="78" stroke-linecap="round"/><circle cx="165" cy="292" r="31" fill="#fff" stroke="' + color + '" stroke-width="10"/><circle cx="635" cy="292" r="31" fill="#fff" stroke="' + color + '" stroke-width="10"/>';
  } else if (kind === "tool") {
    graphic = '<rect x="340" y="92" width="120" height="250" rx="26" fill="#fff" stroke="' + color + '" stroke-width="12"/><rect x="375" y="140" width="50" height="96" rx="8" fill="' + color + '" opacity=".2"/><circle cx="400" cy="282" r="20" fill="' + color + '"/>';
  } else if (kind === "power") {
    graphic = '<rect x="282" y="116" width="236" height="220" rx="22" fill="#fff" stroke="' + color + '" stroke-width="12"/><rect x="352" y="88" width="96" height="28" rx="8" fill="' + color + '"/><rect x="345" y="180" width="110" height="18" rx="8" fill="' + color + '"/><rect x="345" y="223" width="110" height="18" rx="8" fill="' + color + '"/>';
  } else {
    graphic = '<rect x="290" y="96" width="220" height="250" rx="18" fill="#fff" stroke="' + color + '" stroke-width="12"/><rect x="342" y="148" width="116" height="86" rx="10" fill="' + color + '" opacity=".2"/><circle cx="400" cy="292" r="18" fill="' + color + '"/>';
  }

  const bg = variant === 0 ? "#f5f5f4" : "#fafaf9";
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">' +
    '<rect width="800" height="500" rx="36" fill="' + bg + '"/>' +
    '<rect x="44" y="44" width="712" height="412" rx="30" fill="#fff" opacity=".76"/>' +
    graphic +
    '<text x="400" y="420" text-anchor="middle" font-family="Arial,sans-serif" font-size="27" font-weight="700" fill="#1c1917">' + safe + '</text>' +
    '</svg>';
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

const roots = [
  ["Lighting", "lighting", "LED bulbs, panels, downlights and decorative lighting.", "lighting"],
  ["Switches & Sockets", "switches-sockets", "Modular switches, sockets and plates.", "switch"],
  ["Wires & Cables", "wires-cables", "House wires, flexible cables and power cabling.", "wire"],
  ["Fans & Ventilation", "fans-ventilation", "Ceiling fans, exhaust fans and ventilation.", "fan"],
  ["Protection & Switchgear", "protection-switchgear", "MCBs, RCCBs, distribution boards and protection.", "protection"],
  ["Electrical Accessories", "electrical-accessories", "Plugs, holders, extension boards and accessories.", "accessory"],
  ["Conduit & Fittings", "conduit-fittings", "PVC conduits, junction boxes and cable glands.", "conduit"],
  ["Tools & Testing", "tools-testing", "Testers, multimeters and installation tools.", "tool"],
  ["Batteries & Power", "batteries-power", "Batteries, power strips and related accessories.", "power"],
  ["Industrial Electrical", "industrial-electrical", "Contactors, relays and terminal accessories.", "industrial"]
];

const childDefs = [
  ["LED Bulbs","led-bulbs","lighting"],["LED Panels","led-panels","lighting"],["Decorative Lighting","decorative-lighting","lighting"],
  ["Modular Switches","modular-switches","switches-sockets"],["Sockets & Plates","sockets-plates","switches-sockets"],
  ["House Wires","house-wires","wires-cables"],["Flexible Cables","flexible-cables","wires-cables"],
  ["Ceiling Fans","ceiling-fans","fans-ventilation"],["Exhaust Fans","exhaust-fans","fans-ventilation"],
  ["MCBs & RCCBs","mcbs-rccbs","protection-switchgear"],["Distribution Boards","distribution-boards","protection-switchgear"],
  ["Plugs & Holders","plugs-holders","electrical-accessories"],["Extension Boards","extension-boards","electrical-accessories"],
  ["PVC Conduit","pvc-conduit","conduit-fittings"],["Junction Boxes","junction-boxes","conduit-fittings"],
  ["Testers & Multimeters","testers-multimeters","tools-testing"],["Hand Tools","hand-tools","tools-testing"],
  ["Batteries","batteries","batteries-power"],["Power Strips","power-strips","batteries-power"],
  ["Contactors & Relays","contactors-relays","industrial-electrical"],["Terminal Blocks","terminal-blocks","industrial-electrical"]
];

const brands = [
  ["VoltEdge","voltedge","Demo brand for switches, protection and accessories."],
  ["Lumora","lumora","Demo lighting brand."],
  ["WireCraft","wirecraft","Demo wiring and cable brand."],
  ["AirFlow","airflow","Demo fans and ventilation brand."],
  ["SafeCore","safecore","Demo protection and switchgear brand."],
  ["ProLine","proline","Demo tools and industrial electrical brand."]
];

const productRows = [
  ["Disco LED Bulb","disco-bulb","lighting","led-bulbs","lumora","lighting",299,499,"Demo decorative LED bulb.",[["wattage","Wattage",7,"W"],["base","Base","B22",""]]],
  ["LED Bulb 9W Cool Daylight","led-bulb-9w","lighting","led-bulbs","lumora","lighting",79,120,"Demo everyday LED bulb.",[["wattage","Wattage",9,"W"],["base","Base","B22",""]]],
  ["LED Bulb 12W Cool White","led-bulb-12w","lighting","led-bulbs","lumora","lighting",99,149,"Demo everyday LED bulb.",[["wattage","Wattage",12,"W"],["base","Base","B22",""]]],
  ["LED Bulb 15W Warm White","led-bulb-15w","lighting","led-bulbs","lumora","lighting",129,179,"Demo warm white LED bulb.",[["wattage","Wattage",15,"W"],["base","Base","B22",""]]],
  ["LED Panel 18W Round","led-panel-18w","lighting","led-panels","lumora","lighting",249,349,"Demo recessed LED panel.",[["wattage","Wattage",18,"W"]]],
  ["LED Panel 24W Square","led-panel-24w","lighting","led-panels","lumora","lighting",329,449,"Demo square LED panel.",[["wattage","Wattage",24,"W"]]],
  ["Decorative String Lights 5m","string-lights-5m","lighting","decorative-lighting","lumora","lighting",299,499,"Demo decorative string lights.",[["length","Length",5,"m"]]],
  ["Modular Switch 6A 1-Way","switch-6a-1way","switches-sockets","modular-switches","voltedge","switch",49,75,"Demo modular switch.",[["current","Rated current",6,"A"]]],
  ["Modular Switch 16A 1-Way","switch-16a-1way","switches-sockets","modular-switches","voltedge","switch",69,99,"Demo higher-current switch.",[["current","Rated current",16,"A"]]],
  ["6A Universal Socket","socket-6a-universal","switches-sockets","sockets-plates","voltedge","switch",89,129,"Demo universal socket.",[["current","Rated current",6,"A"]]],
  ["16A Power Socket","socket-16a","switches-sockets","sockets-plates","voltedge","switch",119,169,"Demo heavy-duty socket.",[["current","Rated current",16,"A"]]],
  ["1.5 sq mm House Wire 90m","house-wire-1-5sqmm","wires-cables","house-wires","wirecraft","wire",2199,2599,"Demo house wire coil.",[["area","Conductor area",1.5,"sq mm"],["length","Length",90,"m"]]],
  ["2.5 sq mm House Wire 90m","house-wire-2-5sqmm","wires-cables","house-wires","wirecraft","wire",3399,3999,"Demo house wire coil.",[["area","Conductor area",2.5,"sq mm"],["length","Length",90,"m"]]],
  ["4 sq mm House Wire 90m","house-wire-4sqmm","wires-cables","house-wires","wirecraft","wire",5199,5999,"Demo house wire coil.",[["area","Conductor area",4,"sq mm"],["length","Length",90,"m"]]],
  ["2 Core Flexible Cable 1 sq mm","flexible-cable-2core","wires-cables","flexible-cables","wirecraft","wire",64,89,"Demo flexible cable.",[["cores","Cores",2,""],["area","Conductor area",1,"sq mm"]]],
  ["Ceiling Fan 1200mm 3-Blade","ceiling-fan-1200mm","fans-ventilation","ceiling-fans","airflow","fan",1899,2499,"Demo residential ceiling fan.",[["sweep","Sweep",1200,"mm"]],true],
  ["Ceiling Fan 1400mm","ceiling-fan-1400mm","fans-ventilation","ceiling-fans","airflow","fan",2299,2999,"Demo large-room ceiling fan.",[["sweep","Sweep",1400,"mm"]],true],
  ["Exhaust Fan 200mm","exhaust-fan-200mm","fans-ventilation","exhaust-fans","airflow","fan",1199,1599,"Demo exhaust fan.",[["sweep","Sweep",200,"mm"]]],
  ["MCB 1P 6A C-Curve","mcb-1p-6a","protection-switchgear","mcbs-rccbs","safecore","protection",129,179,"Demo single-pole MCB.",[["poles","Poles",1,""],["current","Rated current",6,"A"]]],
  ["MCB 2P 32A C-Curve","mcb-2p-32a","protection-switchgear","mcbs-rccbs","safecore","protection",299,399,"Demo double-pole MCB.",[["poles","Poles",2,""],["current","Rated current",32,"A"]]],
  ["RCCB 2P 40A 30mA","rccb-2p-40a-30ma","protection-switchgear","mcbs-rccbs","safecore","protection",1599,1999,"Demo RCCB.",[["poles","Poles",2,""],["current","Rated current",40,"A"],["sensitivity","Sensitivity",30,"mA"]]],
  ["Distribution Board 8-Way SPN","db-8way-spn","protection-switchgear","distribution-boards","safecore","protection",699,899,"Demo distribution board.",[["ways","Ways",8,""]]],
  ["B22 Lamp Holder","b22-lamp-holder","electrical-accessories","plugs-holders","voltedge","accessory",29,49,"Demo lamp holder.",[["base","Base","B22",""]]],
  ["16A Heavy-Duty Plug Top","16a-plug-top","electrical-accessories","plugs-holders","voltedge","accessory",89,129,"Demo 16A plug top.",[["current","Rated current",16,"A"]]],
  ["6 Socket Extension Board 2m","6-socket-extension-board","electrical-accessories","extension-boards","voltedge","accessory",499,699,"Demo multi-socket extension board.",[["sockets","Sockets",6,""],["length","Cord length",2,"m"]]],
  ["PVC Conduit 20mm 3m","pvc-conduit-20mm","conduit-fittings","pvc-conduit","wirecraft","conduit",39,55,"Demo PVC conduit.",[["diameter","Diameter",20,"mm"],["length","Length",3,"m"]]],
  ["4x4 Junction Box","junction-box-4x4","conduit-fittings","junction-boxes","wirecraft","conduit",59,85,"Demo junction box.",[["size","Size","4 x 4 inch",""]]],
  ["Digital Multimeter 600V","digital-multimeter-600v","tools-testing","testers-multimeters","proline","tool",649,899,"Demo digital multimeter.",[["maxVoltage","Max voltage",600,"V"]]],
  ["Non-Contact Voltage Tester","voltage-tester","tools-testing","testers-multimeters","proline","tool",249,349,"Demo non-contact tester.",[["range","Detection range","90-1000 V",""]]],
  ["Combination Plier 8-Inch","combination-plier-8inch","tools-testing","hand-tools","proline","tool",299,399,"Demo combination plier.",[["length","Length",8,"in"]]],
  ["9V Alkaline Battery","9v-alkaline-battery","batteries-power","batteries","proline","power",69,99,"Demo 9V battery.",[["voltage","Voltage",9,"V"]]],
  ["4 Socket Surge Protection Power Strip","4-socket-power-strip","batteries-power","power-strips","voltedge","power",799,999,"Demo surge protection power strip.",[["sockets","Sockets",4,""]]],
  ["Contactor 25A 4-Pole","contactor-25a","industrial-electrical","contactors-relays","proline","industrial",899,1199,"Demo industrial contactor.",[["current","Rated current",25,"A"],["poles","Poles",4,""]],true],
  ["Control Relay 8-Pin 230V","control-relay-8pin","industrial-electrical","contactors-relays","proline","industrial",249,349,"Demo control relay.",[["coil","Coil voltage",230,"V"]]],
  ["12-Way Terminal Block","terminal-block-12way","industrial-electrical","terminal-blocks","proline","industrial",199,299,"Demo terminal block.",[["ways","Ways",12,""]]]
];

function attributes(rows) {
  return rows.map(function(item, index) {
    return { key: item[0], label: item[1], value: item[2], unit: item[3] || undefined, sortOrder: index };
  });
}

async function upsert(Model, query, values) {
  let doc = await Model.findOne(query);
  if (!doc) doc = new Model(values);
  else Object.assign(doc, values);
  await doc.save();
  return doc;
}

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const rootMap = new Map();
  for (let i = 0; i < roots.length; i++) {
    const row = roots[i];
    const doc = await upsert(Category, { slug: row[1] }, {
      name: row[0], slug: row[1], description: row[2], parent: null,
      imageUrl: demoImage(row[3], row[0], 0), isActive: true, isFeatured: true, sortOrder: i
    });
    rootMap.set(row[1], doc);
  }

  const childMap = new Map();
  for (let i = 0; i < childDefs.length; i++) {
    const row = childDefs[i];
    const parent = rootMap.get(row[2]);
    const kind = roots.find(function(item) { return item[1] === row[2]; })[3];
    const doc = await upsert(Category, { slug: row[1] }, {
      name: row[0], slug: row[1], description: "Demo " + row[0].toLowerCase() + " catalog.",
      parent: parent._id, imageUrl: demoImage(kind, row[0], 1), isActive: true,
      isFeatured: false, sortOrder: i
    });
    childMap.set(row[1], doc);
  }

  const brandMap = new Map();
  for (let i = 0; i < brands.length; i++) {
    const row = brands[i];
    const doc = await upsert(Brand, { slug: row[1] }, {
      name: row[0], slug: row[1], description: row[2],
      logoUrl: demoImage("accessory", row[0], 1), isActive: true, sortOrder: i
    });
    brandMap.set(row[1], doc);
  }

  for (let i = 0; i < productRows.length; i++) {
    const row = productRows[i];
    const variable = row[10] === true;
    const category = rootMap.get(row[2]);
    const subcategory = childMap.get(row[3]);
    const brand = brandMap.get(row[4]);
    const imageOne = demoImage(row[5], row[0], 0);
    const imageTwo = demoImage(row[5], row[0] + " Detail", 1);

    const product = await upsert(Product, { slug: row[1] }, {
      name: row[0],
      slug: row[1],
      shortDescription: row[8],
      description: "Temporary client-demo listing for " + row[0] + ". Replace this sample content, price, tax and imagery with approved commercial data before production.",
      category: category._id,
      subcategory: subcategory._id,
      brand: brand._id,
      productType: variable ? "VARIABLE" : "SIMPLE",
      status: "ACTIVE",
      images: [
        { url: imageOne, alt: row[0], sortOrder: 0, isPrimary: true },
        { url: imageTwo, alt: row[0] + " detail", sortOrder: 1, isPrimary: false }
      ],
      attributes: attributes(row[9]),
      searchKeywords: row[0].toLowerCase().split(/[^a-z0-9]+/).filter(Boolean),
      tax: { isGstInclusive: true }
    });

    const oldVariants = await Variant.find({ product: product._id });
    if (oldVariants.length) {
      const ids = oldVariants.map(function(variant) { return variant._id; });
      await Inventory.deleteMany({ variant: { $in: ids } });
      await mongoose.connection.collection("inventorytransactions").deleteMany({ variant: { $in: ids } });
      await Variant.deleteMany({ product: product._id });
    }

    const count = variable ? 2 : 1;
    for (let v = 0; v < count; v++) {
      const skuBase = "DEMO-" + row[1].toUpperCase().replace(/[^A-Z0-9]+/g, "-");
      const sku = skuBase.slice(0, 82) + "-" + (v + 1);
      const price = row[6] + (variable ? v * 150 : 0);
      const mrp = row[7] + (variable ? v * 200 : 0);
      const variant = await upsert(Variant, { sku: sku }, {
        product: product._id,
        sku: sku,
        title: variable ? (v === 0 ? "Standard" : "Premium") : undefined,
        options: variable ? [{ name: "variant", value: v === 0 ? "Standard" : "Premium" }] : [],
        attributes: attributes(row[9]),
        pricePaise: price * 100,
        mrpPaise: mrp * 100,
        unitOfSale: "PIECE",
        minOrderQuantity: 1,
        orderQuantityStep: 1,
        status: "ACTIVE",
        archivedByProduct: false,
        isDefault: v === 0,
        trackInventory: true,
        imageUrl: v === 0 ? imageOne : imageTwo,
        imageAlt: row[0]
      });

      const quantity = row[2] === "wires-cables" ? 80 : row[2] === "lighting" ? 45 : 25;
      await upsert(Inventory, { variant: variant._id }, {
        variant: variant._id,
        stockUnit: "PIECE",
        availableQuantity: quantity,
        reservedQuantity: 0,
        lowStockThreshold: 5,
        stockStatus: "IN_STOCK",
        trackInventory: true,
        allowBackorder: false
      });
    }

    console.log("  " + String(i + 1).padStart(2, "0") + ". " + row[0]);
  }

  console.log("");
  console.log("Demo catalog created/updated successfully.");
  console.log("Top-level categories: " + roots.length);
  console.log("Subcategories: " + childDefs.length);
  console.log("Brands: " + brands.length);
  console.log("Products: " + productRows.length);
  console.log("Each seeded product has 2 demo images and active stock.");
  console.log("Demo images are local SVG data URLs so the demo does not depend on external image hosts.");
  await mongoose.disconnect();
}

seed().catch(async function(error) {
  console.error(error);
  await mongoose.disconnect().catch(function() {});
  process.exit(1);
});
