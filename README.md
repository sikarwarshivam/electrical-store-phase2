# Electrical Retail Store Platform (Phase 1 Foundation)

> **Phase 1 Status**: Clean, scalable, production-oriented Next.js architecture foundation for an Indian electrical retail e-commerce platform.

---

## 1. Project Purpose

This project establishes the technical and architectural foundation of a production-ready e-commerce platform for an Indian electrical retail enterprise selling electrical products (wires, industrial cables, switchgear, MCBs, modular switches, conduit pipes, and commercial LED lighting) online.

The objective of Phase 1 is to establish a rock-solid, production-grade foundation encompassing:
- Next.js App Router architecture
- Type-safe data modeling and environment variable validation
- Enterprise-grade role-based authentication and authorization (CUSTOMER, ADMIN, SUPER_ADMIN)
- Dual-layer route protection for the `/admin` shell
- Singleton MongoDB Atlas + Mongoose connection layer
- Reusable UI primitives and layout structures
- Sanitized logging and global error handling strategies
- Architectural readiness for media management (Cloudinary) and payments (Razorpay)

---

## 2. Technology Stack

| Technology | Category | Description |
| :--- | :--- | :--- |
| **Next.js 16.3+** | Framework | React framework utilizing the App Router and Server Components |
| **TypeScript 5+** | Language | Strict static typing (`noImplicitAny`, strict null checks, `@/*` aliases) |
| **Tailwind CSS v4** | Styling | Modern utility-first styling with design token variables |
| **shadcn/ui** | UI Component Architecture | Accessible UI primitives with clean component boundaries |
| **NextAuth.js v4 (Stable)** | Authentication | Enterprise session and JWT handling with role-based extensions |
| **MongoDB Atlas & Mongoose**| Database | Document database with hot-reload connection pooling cache |
| **Zod** | Validation | Runtime type validation for env vars, forms, and server actions |
| **React Hook Form** | Form State | High-performance, accessible form state management with Zod resolvers |
| **Zustand** | Client State | Lightweight state management for shopping cart and UI shells |
| **Cloudinary Ready** | Media Pipeline | Architectural configurations ready for product imagery (Phase 2) |
| **Razorpay Ready** | Payments | Architecture parameters ready for INR transactions (Phase 2) |
| **Vercel** | Deployment Target | Edge-ready serverless hosting architecture |

---

## 3. Prerequisites

Ensure you have the following installed on your development workstation:
- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **npm**: `v10.x` or higher
- **MongoDB**: A running local MongoDB instance (e.g. `mongodb://localhost:27017`) or a free MongoDB Atlas connection string.
- **Git**: For version control

---

## 4. Installation & Setup

1. **Clone or navigate to the repository**:
   ```bash
   cd electrical-store
   ```

2. **Install project dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the example environment configuration template:
   ```bash
   cp .env.example .env.local
   ```
   On Windows PowerShell:
   ```powershell
   Copy-Item .env.example .env.local
   ```

4. **Review `.env.local` settings**:
   Ensure `MONGODB_URI` points to your active database, and generate a secure 32-character secret for `NEXTAUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```

---

## 5. Environment Variables Architecture

The application strictly verifies required environment variables via `src/schemas/env.ts` during bootstrap.

| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | Yes | Runtime environment (`development`, `production`, `test`) | `development` |
| `PORT` | No | Port for local server (defaults to 3000) | `3000` |
| `MONGODB_URI` | Yes | MongoDB Atlas connection string | `mongodb://127.0.0.1:27017/electrical_store` |
| `NEXTAUTH_SECRET` | Yes | 32+ char secret for JWT session encryption | Generated base64 string |
| `NEXTAUTH_URL` | No | Base application URL | `http://localhost:3000` |
| `CLOUDINARY_CLOUD_NAME` | Phase 2 | Cloudinary storage account name | `placeholder_cloud` |
| `CLOUDINARY_API_KEY` | Phase 2 | Cloudinary API key | `placeholder_key` |
| `CLOUDINARY_API_SECRET` | Phase 2 | Cloudinary API secret | `placeholder_secret` |
| `RAZORPAY_KEY_ID` | Phase 2 | Razorpay Key ID | `rzp_test_placeholder` |
| `RAZORPAY_KEY_SECRET` | Phase 2 | Razorpay Secret Key | `placeholder_secret` |

> **Security Note**: Never commit `.env` or `.env.local` files to source control. They are strictly ignored by `.gitignore`.

---

## 6. Project Structure

```
electrical-store/
├── .env.example                 # Documented environment variable template
├── .gitignore                   # Excludes env, keys, build artifacts, node_modules
├── package.json                 # Project dependencies and operational scripts
├── tsconfig.json                # Strict TypeScript configuration with @/* alias
├── src/
│   ├── app/
│   │   ├── (store)/             # Customer storefront route group
│   │   │   ├── layout.tsx       # Store layout with Header & Footer
│   │   │   └── page.tsx         # Storefront landing page
│   │   ├── (auth)/              # Authentication route group
│   │   │   ├── layout.tsx       # Minimalist auth layout
│   │   │   ├── login/page.tsx   # Login page with React Hook Form + Zod
│   │   │   └── unauthorized/page.tsx # 403 Access Denied page
│   │   ├── admin/               # Protected Admin shell (/admin)
│   │   │   ├── layout.tsx       # Dual-layer Server Guard + Sidebar layout
│   │   │   ├── page.tsx         # Dashboard with explicit empty state metrics
│   │   │   ├── products/page.tsx# Products catalog shell
│   │   │   ├── categories/page.tsx # Categories shell
│   │   │   ├── orders/page.tsx  # Orders shell
│   │   │   ├── inventory/page.tsx # Inventory stock shell
│   │   │   ├── customers/page.tsx # Customers directory shell
│   │   │   ├── coupons/page.tsx # Coupons shell
│   │   │   ├── settings/page.tsx# Store settings shell
│   │   │   ├── error.tsx        # Admin module error boundary
│   │   │   └── loading.tsx      # Admin module loading skeleton
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts # NextAuth v4 API handler
│   │   │   └── health/route.ts  # Database connectivity health check
│   │   ├── error.tsx            # Storefront error boundary
│   │   ├── global-error.tsx     # Critical root error boundary
│   │   ├── not-found.tsx        # 404 page
│   │   ├── loading.tsx          # Global loading fallback
│   │   └── layout.tsx           # Root HTML layout with SessionProvider
│   ├── components/
│   │   ├── ui/                  # Button, Input, Card, Badge primitives
│   │   ├── layout/              # Header, Sidebar, PageContainer, AdminNav, States
│   │   ├── admin/               # Admin top navbar and widgets
│   │   ├── auth/                # LoginForm component
│   │   ├── products/            # (Phase 2 placeholder)
│   │   └── cart/                # (Phase 2 placeholder)
│   ├── lib/
│   │   ├── db.ts                # Singleton MongoDB/Mongoose connection pool
│   │   ├── auth.ts              # NextAuth configuration and credentials provider
│   │   ├── auth-utils.ts        # Server-side authorization helpers (requireAdmin, etc.)
│   │   ├── logger.ts            # Production-safe logger with secret redaction
│   │   ├── api-response.ts      # Standardized JSON response formatting
│   │   ├── safe-action.ts       # Type-safe Server Action validator
│   │   └── utils.ts             # Tailwind class merging utility (cn)
│   ├── models/
│   │   └── User.ts              # Mongoose User model with RBAC fields
│   ├── schemas/
│   │   ├── env.ts               # Environment variable validation schema
│   │   └── auth.ts              # Login and registration validation schemas
│   ├── actions/
│   │   └── auth.ts              # Server action credentials validation
│   ├── hooks/
│   │   └── use-cart.ts          # Hydration-safe Zustand cart consumer
│   ├── stores/
│   │   ├── cart-store.ts        # Zustand cart store with localStorage persist
│   │   └── ui-store.ts          # Zustand UI state (sidebar, drawer)
│   ├── types/
│   │   ├── index.ts             # Domain models (UserRole, UserProfile, etc.)
│   │   └── next-auth.d.ts       # NextAuth module augmentations
│   ├── config/
│   │   ├── site.ts              # Centralized siteConfig with neutral placeholders
│   │   ├── cloudinary.ts        # Cloudinary media configuration architecture
│   │   └── razorpay.ts          # Razorpay payment configuration architecture
│   └── middleware.ts            # Edge Middleware guarding /admin routes
└── scripts/
    └── test-phase1.mjs          # Architectural verification test suite
```

---

## 7. How to Run the Project

### Running in Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running TypeScript Check
```bash
npm run typecheck
```

### Running Linter
```bash
npm run lint
```

### Building for Production
```bash
npm run build
```

### Running Production Server
```bash
npm start
```

### Running Phase 1 Architectural Tests
```bash
node scripts/test-phase1.mjs
```

---

## 8. Role-Based Access Control (RBAC) & Local Testing

The authentication foundation supports three roles:
- `CUSTOMER`: Retail buyers, contractors, and electricians
- `ADMIN`: Store managers and inventory controllers
- `SUPER_ADMIN`: Business owners with global platform rights

### Security Features
1. **Next.js Proxy (`src/proxy.ts`)**:
   Intercepts all `/admin/:path*` requests at the network edge. Unauthenticated visitors are redirected to `/login?callbackUrl=/admin`, and non-admin authenticated users (`CUSTOMER`) are redirected to `/unauthorized`.
2. **Server-Side Layout Guard (`src/app/admin/layout.tsx`)**:
   Calls `await requireAdmin("/admin")` directly inside the server component layout, guaranteeing that unauthorized users cannot execute admin server code or render UI even if middleware were bypassed.
3. **Environment-Gated Test Credentials**:
   In local development (`NODE_ENV === "development"`), the login form provides quick-fill buttons for smoke testing:
   - **Admin Role**: `admin@dev.local` / `DevAdmin@123`
   - **Customer Role**: `customer@dev.local` / `DevCustomer@123`
   *In production builds, all mock authentication and bypasses are completely disabled and impossible to use.*

---

## 9. Git Workflow & Best Practices

1. **Branching**:
   - `master` / `main`: Production-ready code only.
   - `feature/<feature-name>`: Isolate new feature branches.
2. **Commit Conventions**:
   Follow conventional commits:
   - `feat:` new capabilities
   - `fix:` bug fixes
   - `refactor:` architectural refinements without behavior change
   - `docs:` documentation updates
3. **Never Commit Secrets**:
   Before staging changes, always check `git status` to verify that `.env` and `.env.local` files remain untracked.

---

## 10. Phase 2 — Catalog & Inventory Foundation

Phase 2 introduces the database-backed catalog foundation without starting checkout, payments, orders, or customer-facing purchase flows.

Implemented domain models:
- `Category` with hierarchical parent relationships and archive/deactivation controls
- `Brand`
- `Product`
- `ProductVariant` / SKU
- `Inventory`
- `InventoryTransaction` audit ledger

Catalog rules:
- Product slugs are unique and generated when not supplied.
- SKU values are globally unique and normalized to uppercase.
- Products can be `SIMPLE` (one active SKU) or `VARIABLE` (multiple active SKUs).
- Active products must have at least one active SKU.
- Product price and MRP are stored as integer paise.
- A variant has its own price, MRP, unit of sale, quantity rules, options, and electrical attributes.
- Unit-of-sale supports piece, meter, roll, pack, set, box, pair, kilogram, gram, litre, millilitre, and other.
- Electrical specifications are represented as structured attributes so categories can support fields such as wattage, voltage, current, lumens, colour temperature, IP rating, material, cross-section, and warranty without forcing every category into one rigid table.
- GST rate and HSN/SAC are configurable product data and are not hardcoded by the application.
- Images are stored as metadata/URLs for now; Cloudinary upload is intentionally deferred.
- Inventory records are created per SKU and maintain available stock, reserved stock, threshold, stock status, and tracking mode.
- Manual inventory adjustments create an `InventoryTransaction` audit record.

Admin modules now available:
- `/admin`
- `/admin/products`
- `/admin/products/[id]`
- `/admin/categories`
- `/admin/brands`
- `/admin/inventory`

Phase 2 deliberately does not implement:
- Cart checkout server calculations
- Orders
- Razorpay payments/webhooks
- Customer reviews
- Coupons
- Delivery/courier integration
- Cloudinary upload flows
- GST invoice generation

## 11. Remaining Roadmap

### Phase 3 — Customer Storefront
- Database-backed product listing
- Search
- Faceted filters
- Sorting
- Product detail pages
- Variant selection
- Product imagery
- Related products
- Customer-facing category pages

### Phase 4 — Cart & Wishlist
- SKU-based cart
- Guest cart persistence
- Account cart
- Cart merge
- Wishlist
- Server-side price/stock reconciliation

### Phase 5 — Customer Accounts
- Registration
- Login
- Profile
- Addresses
- Order history
- Account settings

### Phase 6 — Checkout & Payments
- Address validation
- Delivery calculation
- Server-side checkout totals
- Razorpay order creation
- Signature/webhook verification
- COD when the client enables it

### Phase 7 — Orders & Inventory Lifecycle
- Order state machine
- Reservations
- Stock deduction/release
- Cancellation
- Refunds
- Returns foundation

### Phase 8 — Business Operations
- GST-aware invoices
- Coupons
- Banners
- Festival campaigns
- Reviews
- Warranty/return workflows
- Notifications

### Phase 9 — Production Hardening
- SEO
- Structured data
- Analytics
- Rate limiting
- Security review
- Backup/restore verification
- Performance testing
- Production deployment
