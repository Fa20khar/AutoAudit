# Development Roadmap & Tasks (TASKS.md)

This roadmap tracks the development lifecycle of the AutoAudit platform. All tasks are categorized by phase, with strictly verified implementation statuses (`[x]` for completed, `[ ]` for pending).

---

## Phase 1 — Project Foundation
- [x] Initialize React 19 + TypeScript + Vite project configuration
- [x] Configure Tailwind CSS v4 pipeline with `@tailwindcss/vite`
- [x] Establish full-stack Node.js + Express backend running via `tsx server.ts`
- [x] Implement API health check endpoint (`GET /api/health`)
- [x] Setup Supabase PostgreSQL integration (`@supabase/supabase-js`)
- [x] Write SQL schema migration file (`supabase/schema.sql`) for `orders`, `services`, `coupons`, and `emails`
- [x] Implement dual-persistence architecture (in-memory fast cache + Supabase sync)
- [x] Add graceful missing-table and schema cache error recovery (`PGRST205` handling)
- [x] Create client-side Supabase client (`src/lib/supabaseClient.ts`)
- [x] Create project documentation source of truth (`docs/` system)

---

## Phase 2 — UI & Design System
- [x] Build AutoAudit brand identity, logo, and automotive radar icon (`Logo.tsx`)
- [x] Design high-impact Hero with dual VIN/Plate search tabs (`Hero.tsx`)
- [x] Build Trust Strip with NMVTIS, BBB, and SSL trust seals (`TrustStrip.tsx`)
- [x] Create tiered pricing plan comparison cards (`ServicesSection.tsx`)
- [x] Build 3-step "How It Works" workflow guide (`HowItWorks.tsx`)
- [x] Implement interactive vehicle sample report visualizer (`SampleReportSection.tsx`)
- [x] Create trust benefits and risk prevention grid (`TrustBenefitsSection.tsx`)
- [x] Create customer testimonials and verified buyer reviews (`TestimonialsSection.tsx`)
- [x] Build comprehensive FAQ accordion section (`FAQSection.tsx`)
- [x] Implement legal compliance modal with Terms, Privacy, Refund, and NMVTIS tabs (`LegalModal.tsx`)
- [x] Build high-conversion final CTA section and footer (`FinalCTA.tsx`, `Footer.tsx`)
- [x] Implement global dark-glassmorphism Toast notification system (`ToastContext.tsx`)

---

## Phase 3 — Authentication & User Accounts
- [x] Implement lightweight tokenless customer verification (email + order number)
- [x] Build administrative session authorization portal and staff login gate
- [x] Implement staff credential authentication (`POST /api/auth/admin-login` and `GET /api/auth/verify`)
- [x] Protect administrative endpoints (`requireAdminAuth` on `/api/orders`, `/api/stats`, `/api/emails`, `/api/orders/:id/*`)
- [ ] Implement Supabase Auth integration with Magic Link email authentication
- [ ] Add Google OAuth 2.0 social login via Supabase Auth
- [ ] Create persistent customer profile page showing historical vehicle purchases

---

## Phase 4 — User Dashboard & Self-Service
- [x] Implement "Track My Order" customer modal (`MyOrdersModal.tsx`)
- [x] Build animated 5-stage order progress bar (`OrderTrackingProgressBar.tsx`)
- [x] Build vehicle specification preview card in order tracker
- [x] Build payment receipt summary in order tracker
- [x] Create report download modal (`ReportDownloadModal.tsx`) with PDF trigger
- [x] Implement live customer report lookup by email and order number
- [x] Add direct downloadable HTML report generation with print stylesheet
- [x] Add print-friendly CSS media query and 'Print Report' paper copy button in ReportDownloadModal
- [x] Optimize print-friendly media query for mobile smartphones (margins: 4mm 6mm, scaled 8.5pt font, 2x2 findings grid, and table auto-wrap)
- [x] Add subtle diagonal 'OFFICIAL AUTOAUDIT REPORT' watermark in printable CSS and standalone HTML report
- [ ] Add browser local storage history sync for recently audited VINs
- [ ] Add one-click email resend trigger for customer report links

---

## Phase 5 — Vehicle / VIN Search & NHTSA Integration
- [x] Implement ISO 3779 client-side 17-digit VIN format validation
- [x] Implement server-side VIN validation rejecting illegal characters `I`, `O`, `Q`
- [x] Build real-time integration with US Department of Transportation NHTSA vPIC API
- [x] Implement high-speed local mock dataset for sample test vehicles
- [x] Add US state license plate selector and conversion workflow
- [ ] Add vehicle barcode / barcode scanner camera integration for mobile inspection
- [ ] Integrate Canadian and European VIN decoding standard variations

---

## Phase 6 — Vehicle History Reports & PDF Engine
- [x] Design comprehensive sample report viewer modal (`SampleReportModal.tsx`)
- [x] Build multi-section audit display (Title brands, salvage, odometer, recalls)
- [x] Implement mock PDF report download workflow (`/reports/AutoAudit_Report_*.pdf`)
- [ ] Implement automated server-side PDF generator (PDFKit / Puppeteer)
- [ ] Integrate dynamic QR code verification on downloaded report PDFs
- [ ] Add vehicle market valuation and local price estimate widget to reports

---

## Phase 7 — Payment Gateway Integration
- [x] Build multi-step checkout modal (`OrderModal.tsx`)
- [x] Implement dynamic promo code validation engine (`FAKHAR20`, `AUTOAUDIT10`, `SAVE5`)
- [x] Implement simulated credit card processing gateway returning transaction refs (`ch_...`)
- [x] Add SMS notification opt-in checkbox and customer phone capture
- [ ] Integrate live Stripe Elements card processing (`/api/checkout/stripe`)
- [ ] Add Apple Pay & Google Pay express checkout via Stripe
- [ ] Add PayPal Smart Payment buttons integration

---

## Phase 8 — Admin Dashboard & Operations Console
- [x] Build executive KPI overview cards (Total Orders, Processing, Revenue, Delivery Time)
- [x] Build real-time order queue with status filter pills and live search
- [x] Build order detail inspection drawer with vehicle and customer breakdown
- [x] Implement order status transition workflow (Paid → Processing → NMVTIS → Delivered)
- [x] Implement immutable audit logging tracking staff actors and timestamps
- [x] Build report attachment modal linking external URLs or PDF filenames
- [x] Build persistent internal staff notes textarea per order
- [x] Build coupon management tab in Admin Console
- [x] Build email dispatch notification history tab in Admin Console
- [x] Implement Mock SMTP Service Handler and Automated Email Sequence (Confirmation → In-Progress → Ready) with Nodemailer
- [x] Add Mock SMTP tab, inspector modal with HTML and plain text previews, and manual sequence triggers in Admin Console
- [x] Add database diagnostics card with live table health and 1-click SQL copy button

---

## Phase 9 — Security & Data Protection
- [x] Protect Supabase service-role keys from client bundle exposure
- [x] Configure PostgreSQL Row Level Security (RLS) policies on all tables
- [x] Add request timeout protection (`AbortController`) on all external fetch calls
- [x] Implement input sanitization on VIN queries and checkout form payloads
- [x] Express 5 routing configuration audit: eliminate invalid '*' wildcard path patterns to prevent startup PathError
- [ ] Add Express rate-limiting middleware (`express-rate-limit`) on `/api/vin/lookup`
- [ ] Add CSRF token protection on sensitive administrative write endpoints

---

## Phase 10 — Automated Testing & Quality Assurance
- [x] Full TypeScript compiler verification (`tsc --noEmit` returning 0 errors)
- [x] Build system compilation verification (`npm run build`)
- [ ] Add Vitest unit test suite for VIN validation and discount computation
- [ ] Add Playwright end-to-end (E2E) test for full checkout and order tracking flow
- [ ] Add API integration tests for Express routes

---

## Phase 11 — Performance & Caching
- [x] Implement in-memory cache for instant backend response times
- [x] Implement NHTSA query timeout boundaries to prevent server stalls
- [ ] Add Redis or LRU caching layer for external government API lookups
- [ ] Optimize static asset delivery and report PDF caching headers

---

## Phase 12 — Production Deployment & DevOps
- [x] Configure production Express static file serving from `dist/`
- [x] Create comprehensive `.env.example` deployment template with frontend vs backend separation
- [x] Define npm scripts (`"build"`, `"dev"`, `"start"`, `"lint"`)
- [x] Move `tsx` to production dependencies to prevent command-not-found failures on pruned deploys
- [x] Configure Railway Nixpacks deployment specification (`railway.json`) with `/health` probe
- [x] Implement standard CORS middleware on Express backend
- [ ] Configure GitHub Actions CI/CD pipeline for automated testing and deploy
- [ ] Setup Dockerfile and containerized build definition (Phase 2 deployment)

---

## Phase 13 — Final Production Review
- [ ] Comprehensive cross-browser testing (Chrome, Safari, Firefox, Edge)
- [ ] Full mobile device audit (iOS Safari, Android Chrome)
- [ ] WCAG 2.1 AA accessibility compliance audit
- [ ] SEO, OpenGraph, and structured JSON-LD schema verification
