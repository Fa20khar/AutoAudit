# Technical Architecture Document (ARCHITECTURE.md)

## Current Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Runtime & Language** | Node.js (v20+), TypeScript 5.7.2 | Type-safe full-stack execution environment |
| **Frontend Framework** | React 19 (`react`, `react-dom` v19.0.0) | Modern functional component UI with hooks |
| **Build Tool & Bundler** | Vite 6.1.0 | Fast HMR dev server and optimized production bundler |
| **CSS & Design System** | Tailwind CSS v4 (`@tailwindcss/vite` v4.0.0) | Utility-first responsive design tokens |
| **Iconography** | Lucide React v1.16.0 | Automotive, transaction, and interface iconography |
| **Backend Server** | Express v5.2.1 | REST API endpoints, static asset serving, Vite middleware |
| **Server Execution** | TSX v4.23.15 | TypeScript execution for `server.ts` |
| **Database & Cloud Storage** | Supabase PostgreSQL (`@supabase/supabase-js` v2.117.2) | Relational persistence, Row Level Security, real-time channels |
| **External Vehicle API** | NHTSA vPIC Public REST API | Real-time government VIN decoding |

---

## High-Level Architecture Overview

```
 ┌─────────────────────────────────────────────────────────────┐
 │                     Client Browser                          │
 │  ┌───────────────────────────────────────────────────────┐  │
 │  │        React 19 SPA (Vite + Tailwind CSS v4)          │  │
 │  │  - Hero / VIN Lookup Input                            │  │
 │  │  - Multi-Tier Order Checkout Modal                    │  │
 │  │  - Customer Tracking Modal ("Track My Order")         │  │
 │  │  - Admin Operations Control Panel                     │  │
 │  │  - Toast Notification System                          │  │
 │  └───────────────────────────┬───────────────────────────┘  │
 └──────────────────────────────┼──────────────────────────────┘
                                │ HTTP / REST API (Port 3000)
 ┌──────────────────────────────▼──────────────────────────────┐
 │             Node.js / Express Server (server.ts)            │
 │  ┌───────────────────────────────────────────────────────┐  │
 │  │ API Routers:                                          │  │
 │  │  - /api/vin        (NHTSA vPIC & local cache)         │  │
 │  │  - /api/orders     (Order lifecycle & persistence)    │  │
 │  │  - /api/services   (Report tiers & pricing plans)     │  │
 │  │  - /api/coupons    (Promo discount validation)        │  │
 │  │  - /api/emails     (Notification dispatch queue)      │  │
 │  │  - /api/stats      (Executive KPI metrics)            │  │
 │  └───────────────────────────┬───────────────────────────┘  │
 │                              │                              │
 │  ┌───────────────────────────▼───────────────────────────┐  │
 │  │ Dual-Persistence Database Manager (server/db.ts)      │  │
 │  │  - In-Memory Cache (Zero-latency fallback)            │  │
 │  │  - Supabase PostgreSQL Client (server/supabase.ts)    │  │
 │  └───────────────────────────┬───────────────────────────┘  │
 └──────────────────────────────┼──────────────────────────────┘
                                │ HTTPS / PostgREST & RLS
 ┌──────────────────────────────▼──────────────────────────────┐
 │                 Supabase Cloud Platform                     │
 │  ┌───────────────────────────────────────────────────────┐  │
 │  │ PostgreSQL Database:                                  │  │
 │  │  - orders     (Customer, vehicle, payment, logs)      │  │
 │  │  - services   (Pricing plans & included features)     │  │
 │  │  - coupons    (Active discount codes)                 │  │
 │  │  - emails     (Dispatch audit trail)                  │  │
 │  │ Row Level Security (RLS) & Indexed Lookups            │  │
 │  └───────────────────────────────────────────────────────┘  │
 └─────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### 1. Structure & Patterns
- **Functional Components with Hooks:** Exclusively uses React functional components with `useState`, `useEffect`, `useCallback`, and custom context hooks (`useToast`).
- **Zero-Pill Discipline & Visual Hierarchy:** Follows modern high-contrast typography (Inter font stack) and subtle border styling with muted slate backgrounds.
- **Client Persistence Resilience:** State hydrates in order:
  1. Backend API response (`/api/orders`, `/api/services`, `/api/coupons`)
  2. Browser `localStorage` cache fallback (`autoaudit_orders`, `autoaudit_services`, etc.)
  3. Pre-seeded initial dataset (`src/data/initialData.ts`)

### 2. State Management
- **Local Component State:** Controlled form inputs for VIN search, multi-step order configuration, and modal toggles.
- **Global Context:** `ToastContext` (`src/context/ToastContext.tsx`) provides app-wide toast notifications (`showToast({ title, message, type })`) supporting `success`, `info`, `warning`, and `error` variants.
- **Shared App State:** `src/App.tsx` maintains collections of `services`, `orders`, `coupons`, and `emails`, synchronizing modifications via `api` service calls.

---

## Backend Architecture

### 1. Express Server Entry Point (`server.ts`)
- Mounted on single port `3000`.
- In development, runs Vite development server as an Express middleware (`vite.middlewares`).
- In production, serves optimized static assets from `dist/` and routes unmatched requests to `index.html` (SPA fallback).
- Configures JSON body parsing middleware.

### 2. Dual-Persistence Database Engine (`server/db.ts` & `server/supabase.ts`)
The server uses a **Dual-Persistence Pattern**:
1. **In-Memory Cache:** All orders, coupons, services, and email logs are immediately updated in an in-memory class instance (`Database`). This guarantees microsecond read times and ensures the frontend never crashes if cloud services experience transient latency.
2. **Supabase PostgreSQL Synchronization:** Whenever an order is created, status updated, or email logged, changes are asynchronously synced to Supabase PostgreSQL.
3. **Startup Hydration:** On server boot, `Database.hydrateFromSupabase()` queries Supabase to hydrate existing cloud records into memory.
4. **Resilient Schema Error Isolation:** The adapter detects missing tables or schema cache delays (`PGRST205`, `42P01`) gracefully without throwing fatal runtime errors or spamming console logs.

---

## Database Architecture (Supabase PostgreSQL)

### 1. Schema Tables (`supabase/schema.sql`)

#### `orders` Table
- `id` (TEXT PRIMARY KEY): Unique system ID (e.g. `ord-1790861891722`).
- `order_number` (TEXT UNIQUE NOT NULL): Customer-facing order code (e.g. `AA-46367`).
- `service_id` (TEXT REFERENCES services(id)): Selected plan.
- `service_name` (TEXT NOT NULL): Display plan name.
- `status` (TEXT NOT NULL): `Pending Payment` | `Paid / New` | `Processing` | `NMVTIS Check` | `Ready` | `Delivered` | `Completed` | `Cancelled` | `Refunded`.
- `subtotal` (NUMERIC(10, 2) NOT NULL): Base plan price.
- `discount_amount` (NUMERIC(10, 2) DEFAULT 0): Applied discount.
- `total` (NUMERIC(10, 2) NOT NULL): Net charged amount.
- `coupon_code` (TEXT): Promo code used.
- `customer_full_name`, `customer_email`, `customer_phone`, `sms_notifications`: Customer contact record.
- `vehicle_vin_or_reg`, `is_vin`, `vehicle_make`, `vehicle_model`, `vehicle_year`, `vehicle_mileage`, `vehicle_country_state`, `customer_notes`: Vehicle identity.
- `payment_status`, `payment_gateway_ref`, `payment_method`, `paid_at`: Transaction record.
- `internal_notes` (TEXT): Admin staff private research notes.
- `result_file` (JSONB): Metadata for attached report (`fileName`, `fileUrl`, `uploadedAt`, `type`).
- `audit_logs` (JSONB DEFAULT '[]'): Immutable chronological array of lifecycle actions.
- `created_at`, `updated_at` (TIMESTAMPTZ).

#### `services` Table
- `id` (TEXT PRIMARY KEY): `basic-vin`, `comprehensive-vin`, `premium-auction-audit`.
- `name`, `price`, `original_price`, `delivery_time`, `badge`, `popular`, `description`, `features` (JSONB).

#### `coupons` Table
- `code` (TEXT PRIMARY KEY): `FAKHAR20`, `AUTOAUDIT10`, `SAVE5`.
- `discount_percent`, `discount_fixed`, `expiry_date`, `active`, `usage_count`.

#### `emails` Table
- `id` (TEXT PRIMARY KEY): e.g. `email-101`.
- `order_id`, `order_number`, `recipient_email`, `recipient_type`, `subject`, `type`, `body`, `sent_at`, `read`.

### 2. Indexes
- `idx_orders_vin` on `orders(vehicle_vin_or_reg)`
- `idx_orders_order_number` on `orders(order_number)`
- `idx_orders_email` on `orders(customer_email)`
- `idx_orders_created_at` on `orders(created_at DESC)`

### 3. Row Level Security (RLS)
- Public read access for active services and valid coupons.
- Public insert access for customer order creation.
- Public read access for customers querying by matching email and order number.

---

## Authentication Architecture

### Current Mechanism
1. **Customer Order Access:** Tokenless verification using compound lookup keys:
   - Order Number (`AA-XXXXX`)
   - Customer Email Address (`name@domain.com`)
   This prevents unauthorized browsing while enabling instantaneous, zero-friction order tracking without requiring mandatory registration before report purchase.
2. **Admin Operations:** Protected staff route/modal access.

### Planned Supabase Auth Architecture
- Integration of `@supabase/supabase-js` auth module.
- Support for Magic Link (passwordless email) and Google OAuth.
- JWT-based authentication headers for protected backend administration endpoints.

---

## API & Service Architecture

All REST API routes are prefixed with `/api`:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service uptime and version info |
| `GET` | `/api/vin/lookup?vin=...` | Decode 17-digit VIN via NHTSA vPIC & local cache |
| `GET` | `/api/vin/plate-lookup?plate=...&state=...` | Decode US state registration plate to masked VIN & vehicle profile |
| `GET` | `/api/orders` | Query orders (filters: `email`, `status`, `search`) |
| `GET` | `/api/orders/:id` | Get single order by ID or order number |
| `POST` | `/api/orders` | Create and persist new order, log audit entries |
| `PATCH` | `/api/orders/:id/status` | Advance status, auto-generate report if Delivered |
| `PATCH` | `/api/orders/:id/notes` | Append internal staff notes |
| `POST` | `/api/orders/:id/attach-report` | Attach report PDF or URL |
| `GET` | `/api/orders/db-status` | Report live Supabase connection & table readiness |
| `GET` | `/api/orders/schema-sql` | Fetch raw SQL schema for one-click setup |
| `GET` | `/api/services` | Retrieve report tiers and pricing |
| `GET` | `/api/services/:id` | Retrieve single service plan by ID |
| `GET` | `/api/coupons` | Retrieve active coupon codes |
| `POST` | `/api/coupons/validate` | Validate code and compute net discount |
| `GET` | `/api/emails` | Fetch email dispatch audit logs |
| `POST` | `/api/emails/send` | Queue and record new customer notification |
| `GET` | `/api/stats/dashboard` | Compute operational KPIs and revenue totals |

---

## Folder Structure

```
autoaudit/
├── docs/                      # Source of truth documentation
│   ├── PRD.md                 # Product requirements
│   ├── ARCHITECTURE.md        # Technical architecture (this file)
│   ├── DESIGN.md              # UI/UX design system
│   ├── RULES.md               # AI development rules
│   ├── TASKS.md               # Phased roadmap
│   └── MEMORY.md              # Decisions & changelog
├── public/                    # Static assets, logos, favicon
├── server/                    # Backend server codebase
│   ├── db.ts                  # In-memory database & Supabase orchestrator
│   ├── supabase.ts            # Supabase PostgreSQL client & adapter
│   └── routes/                # Express REST API routes
│       ├── coupons.ts
│       ├── emails.ts
│       ├── orders.ts
│       ├── services.ts
│       ├── stats.ts
│       └── vin.ts
├── src/                       # Frontend React 19 application
│   ├── components/            # Reusable UI components & modals
│   │   ├── AdminPanel.tsx
│   │   ├── EmailPreviewModal.tsx
│   │   ├── FAQSection.tsx
│   │   ├── FinalCTA.tsx
│   │   ├── Footer.tsx
│   │   ├── GearLoader.tsx
│   │   ├── Hero.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── LegalModal.tsx
│   │   ├── Logo.tsx
│   │   ├── MyOrdersModal.tsx
│   │   ├── Navbar.tsx
│   │   ├── OrderModal.tsx
│   │   ├── OrderTrackingProgressBar.tsx
│   │   ├── ReportDownloadModal.tsx
│   │   ├── SampleReportModal.tsx
│   │   ├── SampleReportSection.tsx
│   │   ├── ServicesSection.tsx
│   │   ├── TestimonialsSection.tsx
│   │   ├── TrustBenefitsSection.tsx
│   │   └── TrustStrip.tsx
│   ├── context/               # Global state contexts (ToastContext)
│   ├── data/                  # Initial baseline seed data
│   ├── lib/                   # Shared client utilities (supabaseClient.ts)
│   ├── services/              # API clients (api.ts)
│   ├── types/                 # Shared TypeScript models (index.ts)
│   ├── App.tsx                # Main application component
│   ├── index.css              # Global Tailwind CSS imports
│   ├── main.tsx               # React root entry point
│   └── vite-env.d.ts          # Vite client environment types
├── supabase/                  # Database migration scripts
│   └── schema.sql             # Complete PostgreSQL DDL schema & policies
├── .env.example               # Template environment configuration
├── metadata.json              # Applet metadata & capabilities
├── package.json               # Project manifest & dependencies
├── server.ts                  # Full-stack server entry point
├── tsconfig.json              # TypeScript compiler configuration
└── vite.config.ts             # Vite build configuration
```

---

## Error Handling Architecture

### 1. Frontend API Error Handling (`src/services/api.ts`)
- Custom `ApiError` class capturing HTTP status codes, timeout indicators, and structured JSON payloads.
- `AbortController` enforcing a default 10-second request timeout to prevent hanging UI states.
- Clean user-facing notifications via `useToast` rather than raw browser alert dialogues.

### 2. Backend Error Handling
- Async route wrappers with status code dispatch:
  - `400`: Missing required parameters
  - `404`: Entity not found
  - `422`: Validation failures (e.g. invalid VIN checksum/characters)
  - `500`: Unhandled internal exceptions

### 3. Supabase Resilience
- Detects PostgREST missing table errors (`PGRST205`, `42P01`) and gracefully marks tables unready while serving local memory records.
- Suppresses repeated console error loops so dev servers remain clean and responsive.

---

## Security Architecture

### 1. Secret Protection Rules
- **NEVER** expose the Supabase `service_role` key in frontend code (`src/` or `import.meta.env`).
- Client-side code may ONLY access `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Backend server accesses `SUPABASE_URL` and `SUPABASE_ANON_KEY` or `SUPABASE_SERVICE_ROLE_KEY` via `process.env`.
- `.env` files with real keys are excluded from git commits; `.env.example` serves as the public template.

### 2. Input Validation
- Standard ISO 3779 VIN sanitization removing whitespace and converting to uppercase.
- Strict rejection of illegal characters `I`, `O`, `Q`.
- Numeric bounds checking on currency and discount calculations.

---

## Environment Variables

| Variable | Environment | Description |
|---|---|---|
| `PORT` | Server | HTTP port for Express server (default `3000`) |
| `VITE_SUPABASE_URL` | Client (Vite) | Supabase project HTTPS URL for client SDK |
| `VITE_SUPABASE_ANON_KEY` | Client (Vite) | Supabase public anonymous API key for client SDK |
| `SUPABASE_URL` | Server (Express) | Supabase project HTTPS URL for backend adapter |
| `SUPABASE_ANON_KEY` | Server (Express) | Supabase public anonymous API key for backend adapter |
| `SUPABASE_SERVICE_ROLE_KEY` | Server (Express) | Optional privileged key for backend administrative tasks |

---

## Third-Party Services & Integration Points

1. **NHTSA vPIC (Vehicle Product Information Catalog):**
   - Endpoint: `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/{vin}?format=json`
   - Purpose: Public, official US Department of Transportation vehicle decoder.
   - Behavior: Queried on demand with a 2.5-second abort timeout; falls back to local cache on timeout or network interruption.
2. **Supabase Cloud (PostgreSQL 15+):**
   - Managed PostgreSQL database for relational storage and real-time event distribution.
3. **Simulated Payment Gateway:**
   - Client/server payment simulation returning standard gateway tokens (`ch_...`) with test credit card validation. Ready for direct replacement with Stripe Elements or PayPal SDK.
