# DREGITAL — Modern Full-Stack E-Commerce Platform

**Dregital** is an independent, production-grade e-commerce retail platform built specifically for consumer technology, audio gear, computing hardware, smartphone accessories, and everyday lifestyle essentials in Bangladesh.

---

## 💎 1. Visual & Brand Identity

- **Brand**: Dregital
- **Market**: Bangladesh (Nationwide Delivery across all 64 districts)
- **Palette**: Minimalist Monochrome — Deep Jet Black (`#0A0A0A`), Pure White (`#FFFFFF`), Light Grey (`#F5F5F5`), Border Grey (`#E5E5E5`).
- **Design Philosophy**: High contrast, razor-sharp typography, clean grids, zero unnecessary clutter or artificial gradients, premium product photography.

---

## 🛠️ 2. Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons
- **State Management**: React Context (`CartContext` & `WishlistContext`) with persistent client hydration and real-time badge counters
- **Backend**: Next.js Server-Side Route Handlers & Server Actions with strict input validation and server-side price recalculation
- **Database**: Supabase PostgreSQL 15+ (Relational schema, Foreign Keys, Triggers, Indexes, Row Level Security)
- **Authentication**: Supabase Auth + Protected Admin Role Verification
- **Storage**: Supabase Storage bucket for product photography and media
- **Hosting**: Vercel-ready with edge caching and static route optimization

---

## 📂 3. Repository Architecture

```
dregital-ecommerce/
├── app/
│   ├── layout.tsx                     # Global HTML root layout & providers
│   ├── page.tsx                       # Conversion-optimized storefront homepage
│   ├── globals.css                    # Tailwind CSS base styles & custom scrollbars
│   ├── shop/                          # Catalog page with live filters, search, and sorting
│   ├── category/[slug]/               # Dynamic Category pages with subcategories strip
│   ├── category/[slug]/[subSlug]/     # Dynamic Subcategory pages
│   ├── product/[slug]/                # Product detail page (gallery, zoom, specs, purchase controls)
│   ├── cart/                          # Itemized shopping cart page
│   ├── checkout/                      # Bangladesh checkout (Districts, Thanas, COD, bKash, Nagad)
│   ├── order-confirmation/[id]/       # Order receipt with printable invoice
│   ├── track-order/                   # Live order progress tracking by ID & phone
│   ├── account/                       # Customer account dashboard & saved wishlist
│   ├── about/                         # About Dregital company information
│   ├── contact/                       # Customer support form (persists to DB)
│   ├── faq/                           # Interactive FAQ accordions
│   ├── policy/[slug]/                 # Editable legal policy pages (Terms, Privacy, Refund, Shipping)
│   ├── admin/
│   │   ├── page.tsx                   # Executive dashboard overview & revenue charts
│   │   ├── login/                     # Secure admin portal authentication
│   │   ├── products/                  # Product catalogue CRUD (specs, images, SKU, pricing, stock)
│   │   ├── categories/                # Category & subcategory hierarchy manager
│   │   ├── orders/                    # Order fulfillment, courier status updates & CSV exporter
│   │   ├── inventory/                 # Warehouse stock manager with low-stock alerts
│   │   ├── importer/                  # Product & category CSV/JSON importer with duplicate check
│   │   └── settings/                  # Homepage banners, announcement bar & Bangladesh delivery fees
│   └── api/                           # Secure REST API route handlers
├── components/                        # Reusable modular UI components
│   ├── Header.tsx                     # Desktop mega-menu, search, wishlist & cart badges
│   ├── MobileNav.tsx                  # Slide-out drawer with accordion subcategories
│   ├── AnnouncementBar.tsx            # Dynamic top banner (editable by admin)
│   ├── HeroSlider.tsx                 # Promotional hero carousel
│   ├── ProductCard.tsx                # Minimalist product card with image zoom & badges
│   ├── ProductGallery.tsx             # Interactive thumbnail selector & photo zoom
│   ├── ProductPurchaseSection.tsx     # Add to Bag, Express Buy Now, quantity & warranty info
│   ├── CartDrawer.tsx                 # Slide-in shopping bag with free shipping indicator
│   ├── TrustSection.tsx               # Store guarantees (Genuine, COD, 7-Day return)
│   ├── AdminLayout.tsx                # Admin sidebar navigation & control layout
│   └── Footer.tsx                     # Brand statement, quick links, newsletter, payment badges
├── lib/
│   ├── db.ts                          # Unified Data Access Layer (Supabase + Local engine)
│   ├── supabase.ts                    # Supabase browser and server-side service role client
│   ├── bangladeshDistricts.ts         # Complete 64 Bangladesh districts & thanas database
│   ├── CartContext.tsx                # Shopping bag provider with quantity management
│   ├── WishlistContext.tsx            # User wishlist state management
│   ├── types.ts                       # Strongly typed TypeScript interfaces
│   └── utils.ts                       # Currency formatter (৳ BDT), slugifier, order ID generator
├── supabase/
│   ├── full_setup.sql                 # Consolidated single-click SQL script for Supabase
│   ├── seed.sql                       # Authentic seed data with products, categories, settings
│   └── migrations/
│       ├── 001_initial_schema.sql     # Database schema, foreign keys, triggers
│       └── 002_rls_policies.sql       # Row Level Security (RLS) policies
├── scripts/
│   └── migrate.mjs                    # CLI automated catalogue migration tool
├── .env.example                       # Documented environment variables template
├── vercel.json                        # Vercel deployment configuration
└── package.json                       # Dependencies & build scripts
```

---

## 🚀 4. Quick Start & Local Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

### Step 3: Run the Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🗄️ 5. Database Setup (Supabase PostgreSQL)

The platform supports **both** live Supabase PostgreSQL and an intelligent local persistence fallback engine.

To connect your own Supabase project:

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to your **Project Settings ➔ API**.
3. Copy `Project URL`, `anon public key`, and `service_role secret key`.
4. Paste them into `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
5. Navigate to the **SQL Editor** in your Supabase Dashboard.
6. Open `supabase/full_setup.sql`, copy all contents, paste into the editor, and click **Run**.
7. Your entire database schema, tables, foreign keys, RLS security policies, categories, products, delivery zones, and store settings will be initialized automatically!

---

## 🔒 6. Administrator Control Console

- **Route**: `/admin`
- **Default Password**: `admin123` (Configurable in `.env.local` via `ADMIN_PASSWORD`)

### Admin Capabilities:
1. **Executive Overview**: Real-time sales revenue in BDT, pending orders, total catalog items, and low-stock alerts.
2. **Product Catalogue**: Create, edit, and delete products; upload images; configure BDT prices and original prices for automatic discount calculation; manage SKUs, model numbers, warranty terms, and stock.
3. **Category Hierarchy**: Create unlimited categories and nested subcategories; upload banners and icons; safely delete or reassign products.
4. **Order Fulfillment**: Filter orders by status (Pending, Confirmed, Processing, Shipped, Delivered, Cancelled); assign courier tracking IDs (e.g. Steadfast, REDX, Pathao); export orders to CSV; print courier packing receipts.
5. **Inventory Manager**: Live stock level tracking with instant unit adjustments (+1, +10, -1, -5) and low-stock warnings (≤ 5 units).
6. **Store Settings**: Edit the top announcement bar; configure delivery charges for Inside Dhaka and Outside Dhaka; set free shipping thresholds; edit hotline numbers and office locations.
7. **Catalog Importer**: Upload CSV or JSON files with automatic duplicate detection and migration reporting.

---

## 📦 7. Product & Category Migration Tool

To migrate catalog data using the command-line interface:
```bash
npm run migrate
```
Or use the **Catalog Importer** UI at `/admin/importer` to upload CSV files with immediate validation feedback.

---

## 🚢 8. Production Deployment on Vercel

1. Push this repository to GitHub or GitLab.
2. Log in to [Vercel](https://vercel.com) and click **Add New ➔ Project**.
3. Select your repository.
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PASSWORD`
   - `NEXT_PUBLIC_APP_URL`
5. Click **Deploy**. Vercel will build and launch the site on their global edge network.
6. Under **Settings ➔ Domains**, add your custom domain: `dregital.com` or `dregital.com.bd`. Follow the DNS instructions to set the A and CNAME records.
