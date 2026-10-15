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
| **Primary Database** | MongoDB Atlas (`mongoose` v9.11.2) | Flexible document persistence, schema validation, indexing |
| **External Vehicle API** | NHTSA vPIC Public REST API | Real-time government VIN decoding |
| **Notification Engine** | Nodemailer v10.0.13 | Mock SMTP & external SMTP transactional email sequences |

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
 │  │  - Customer Intake Request Form                       │  │
 │  │  - Refer-a-Friend Rewards Module                      │  │
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
 │  │  - /api/intake     (Customer vehicle intake queue)    │  │
 │  │  - /api/stats      (Executive KPI metrics)            │  │
 │  │  - /api/admin/mongodb (Database status & migration)   │  │
 │  └───────────────────────────┬───────────────────────────┘  │
 │                              │                              │
 │  ┌───────────────────────────▼───────────────────────────┐  │
 │  │ MongoDB Database Layer (server/mongodb/ & db.ts)      │  │
 │  │  - Mongoose Connection Pool & Auto-Reconnect          │  │
 │  │  - In-Memory Cache (Zero-latency fallback)            │  │
 │  └───────────────────────────┬───────────────────────────┘  │
 └──────────────────────────────┼──────────────────────────────┘
                                │ TLS 1.3 / SRV Protocol
 ┌──────────────────────────────▼──────────────────────────────┐
 │                 MongoDB Atlas Cloud Platform                │
 │  ┌───────────────────────────────────────────────────────┐  │
 │  │ Collections:                                          │  │
 │  │  - orders     (Customer, vehicle, payment, audit logs)│  │
 │  │  - services   (Pricing plans & included features)     │  │
 │  │  - coupons    (Active discount promo codes)           │  │
 │  │  - emails     (Dispatch audit trail logs)             │  │
 │  │  - customerIntake (Customer form requests & photos)   │  │
 │  │  - contactEvents  (Click-to-chat analytics)           │  │
 │  │  - referrals      (Referral codes & reward vouchers)  │  │
 │  │ BSON Document Model, Compound Indexes, Validation     │  │
 │  └───────────────────────────────────────────────────────┘  │
 └─────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### 1. Structure & Patterns
- **Functional Components with Hooks:** Exclusively uses React functional components with `useState`, `useEffect`, `useCallback`, and custom context hooks (`useToast`).
- **Zero-Pill Discipline & Visual Hierarchy:** Follows modern high-contrast typography (Inter font stack) and subtle border styling with muted slate backgrounds.
- **Client Persistence Resilience:** State hydrates in order:
  1. Backend API response (`/api/orders`, `/api/services`, `/api/coupons`, `/api/intake`)
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
- Graceful shutdown handling on `SIGTERM` and `SIGINT` cleanly disconnects Mongoose.

### 2. Primary MongoDB Atlas Database Engine (`server/mongodb/` & `server/db.ts`)
The server uses **MongoDB Atlas** as its primary operational database:
1. **Mongoose Models:** Strict validation, required fields, unique indexes, and compound query indexes.
2. **Resilient Local Fallback:** If `MONGODB_URI` is not configured in local development, the application operates in in-memory mode without crashing.
3. **Write Completion Guarantees:** Database writes complete before HTTP success responses are returned.

---

## Database Architecture (MongoDB Atlas)

### Collections & Schemas:
1. `orders`: Vehicle VIN, Customer, Payment status, Fulfillment metadata, Audit logs.
2. `services`: Plan pricing, delivery time, badges, included items, exclusions.
3. `coupons`: Code, discount percent/fixed, usage count, max usage, expiry date.
4. `emails`: Sent recipient, order reference, notification type, message body, timestamps.
5. `customerIntake`: Customer requests, vehicle details, damage descriptions, photos.
6. `contactEvents`: Click-to-chat analytics with time-series indexing.
7. `referrals`: Referral codes, owner profiles, reward coupons, conversions.
