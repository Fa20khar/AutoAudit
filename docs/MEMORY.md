# Project Memory (MEMORY.md)

This file records important decisions, architectural choices, implementation notes, and known status flags across the AutoAudit project. All future development must reference and update this document.

---

## Important Decisions
- **Documentation-First Development:** Established a permanent `docs/` source of truth containing `PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `RULES.md`, `TASKS.md`, and `MEMORY.md` before making further major code modifications.
- **Dual-Persistence Architecture:** Implemented an in-memory cache synchronized with Supabase PostgreSQL. This guarantees zero-downtime operation, ultra-fast UI responses, and transparent fallback if cloud connectivity is pending.
- **Tokenless Customer Tracking:** Decided to allow customers to track their orders using their Email Address + Order Number (`AA-XXXXX`), eliminating friction while keeping orders private.
- **NHTSA vPIC Real-Time Fallback:** Integrated the official US Department of Transportation vehicle decoder API with an automatic 2.5-second timeout and fallback to cached vehicle specs.

---

## Technology Decisions
- **Full-Stack Single Process:** Chose Node.js + Express 5 with TSX running `server.ts` to host both the REST API and the Vite React 19 SPA on port 3000.
- **Tailwind CSS v4:** Selected Tailwind CSS v4 using the modern `@tailwindcss/vite` plugin for zero-configuration, high-performance styling without standalone PostCSS configuration.
- **Supabase PostgreSQL:** Selected Supabase (`@supabase/supabase-js`) as the primary cloud database platform for relational data persistence and Row Level Security.
- **TypeScript 5.7:** Configured strict TypeScript typing across both frontend (`src/`) and backend (`server/`).

---

## Architecture Decisions
- **Client/Server Separation:** Server-side routes are neatly segregated in `server/routes/` (`vin.ts`, `orders.ts`, `services.ts`, `coupons.ts`, `emails.ts`, `stats.ts`).
- **Resilient PostgREST Schema Error Isolation:** Implemented `isTableMissingError()` in `server/supabase.ts`. When a Supabase project is connected but tables haven't been created yet, the server gracefully marks tables unready and continues operating on local memory without throwing application-breaking exceptions.
- **Dynamic Table Health Check:** In `GET /api/orders/db-status`, the server performs a live check of table health and reports readiness directly to the Admin Console.
- **One-Click SQL Delivery:** Added `GET /api/orders/schema-sql` so administrators can copy the exact PostgreSQL schema directly to their clipboard with one click.

---

## Database Decisions
- **Relational Tables:** Designed 4 primary tables in `supabase/schema.sql`:
  1. `orders`: Primary vehicle audit orders with customer, vehicle, payment, and audit logs.
  2. `services`: Tiered pricing plans (Basic, Complete, Premium).
  3. `coupons`: Active promotional discount codes (`FAKHAR20`, `AUTOAUDIT10`, `SAVE5`).
  4. `emails`: Notification dispatch log.
- **JSONB for Unstructured Metadata:** Used `JSONB` for vehicle audit logs, included features, and attached report file metadata to maintain query flexibility without over-normalizing audit trails.
- **Row Level Security (RLS):** Enabled RLS on all tables with explicit public policies for reading services, reading active coupons, inserting orders, and viewing order records.

---

## Authentication Decisions
- **Customer Self-Service:** Uses Email + Order Number combination. Avoids forcing registration before purchase to optimize checkout conversion rates.
- **Admin Access:** Accessible via navigation action with session persistence. Full Supabase Auth with Magic Link / OAuth is designated for Phase 3.
- **Credential Segregation:** `SUPABASE_SERVICE_ROLE_KEY` is strictly reserved for server-side operations and never exposed to the client.

---

## Design Decisions
- **Color Palette:**
  - Deep Navy foundations: `#0B132B`, `#0F172A`
  - Action Blue accents: `#1D4ED8`, `#2563EB`
  - Verification Emerald accents: `#059669`, `#10B981`
  - Clean Slate backgrounds: `#FFFFFF`, `#F8FAFC`, `#E2E8F0`
- **Zero-Pill Discipline:** Applied `rounded-xl` and `rounded-2xl` to all cards, modals, and container wrappers. Pill styling is strictly reserved for status tags.
- **High-Density Data Display:** Used monospace font (`font-mono`) and letter spacing (`tracking-wider`) for VINs, transaction IDs, and order numbers to maximize legibility.

---

## Completed Major Changes
1. **Initial Full-Stack Application:** Built complete CARFAX-style vehicle report ordering platform with hero search, multi-tier plans, sample report preview, FAQ, and footer.
2. **REST API Implementation:** Created Express routers for VIN lookup, orders, services, coupons, email notifications, and dashboard stats.
3. **Admin Operations Panel:** Built complete administrative operations dashboard with order management, status updates, staff notes, and report attachment.
4. **Supabase Integration:** Added `@supabase/supabase-js`, created `supabase/schema.sql`, built `server/supabase.ts` and `src/lib/supabaseClient.ts`.
5. **Missing Table Resilience Fix:** Resolved PostgREST schema cache error (`PGRST205`) by adding table readiness detection and dynamic recovery.
6. **Live Database Verification:** Verified that the user executed `supabase/schema.sql` in their Supabase SQL editor; verified that `GET /api/orders/db-status` confirmed `tablesReady: true` across all tables.
7. **Documentation-First System:** Created full 6-file documentation suite in `docs/` (`PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `RULES.md`, `TASKS.md`, `MEMORY.md`).
8. **Admin Authentication & Token Authorization:** Implemented `server/middleware/auth.ts` and `server/routes/auth.ts` with `POST /api/auth/admin-login` and `GET /api/auth/verify`. Added staff login screen and sign-out controls in `AdminPanel.tsx`.
9. **Customer Data Isolation & Privacy:** Modified `GET /api/orders` to strictly require `requireAdminAuth` unless an explicit `email` parameter is supplied. Stopped indiscriminate fetching of all customer orders on public homepage mount in `App.tsx`.
10. **Strict Form Validation & XSS Sanitization:** Enforced ISO 3779 17-digit VIN format checks and email regex validation in `POST /api/orders`. Added sanitization to prevent stored XSS attacks.
11. **Express 5 API Catch-All Routing Fix:** Replaced invalid `app.all('/api/*')` wildcard syntax with Express 5-compatible `app.use('/api', ...)` returning clean JSON 404 responses.
12. **UI Polish & Dialog Compliance:** Replaced browser `alert()` invocations in `OrderModal.tsx` with non-blocking `useToast()` notifications. Added direct HTML report file download in `ReportDownloadModal.tsx`.
13. **Express 5 Production Wildcard Route Fix:** Replaced `app.get('*', ...)` with `app.use((_req, res) => res.sendFile(...))` to resolve `PathError [TypeError]: Missing parameter name at index 1: *` when running in production mode.
14. **Order Submission Loading Spinner & Duplicate Click Guard:** Enhanced `OrderModal.tsx` submit button with visible `<Loader2>` spinner, `disabled={isProcessingPayment}`, `cursor-not-allowed`, `aria-busy`, and early return guard in `handleProcessPayment` to eliminate duplicate payment attempts.
15. **Print-Friendly CSS Media Query & Print Report Button:** Added `@media print` rules in `src/index.css` with clean letter margins, background suppression for non-printable UI, and page-break control. Embedded paper-formatted vehicle history report (`#printable-vehicle-report`) and added a prominent 'Print Report (Paper Copy)' button in `ReportDownloadModal.tsx`.
16. **Nodemailer Mock SMTP Handler & Automated Lifecycle Email Sequence:** Implemented `server/services/smtp.ts` using Nodemailer JSON transporter for zero-network-latency mock delivery. Automatically dispatches the 3-stage lifecycle sequence (Stage 1: Confirmation immediately on checkout, Stage 2: In-Progress after 4s, Stage 3: Ready after 8s) with responsive branded HTML templates. Added `/api/emails/smtp-status`, `/api/emails/trigger-sequence/:orderId`, and full Mock SMTP outbox inspector in `AdminPanel.tsx` with iframe HTML previews and Nodemailer message ID tracking.
17. **Mobile Print Media Query & Font Optimization:** Added `@media print and (max-width: 768px)` and `(max-width: 480px)` rules in `src/index.css`. Tailored for iOS and Android mobile printing and PDF generation with tight margins (`4mm 6mm` down to `3mm 4mm`), scaled body font size (`8.5pt`), 2x2 grid reorganization for key findings cards, table fixed layout with auto-wrapping (`word-break: break-word`) to eliminate horizontal clipping, and compact headers.
18. **Subtle Diagonal Print Watermark:** Added `.print-watermark` in `src/index.css` and `ReportDownloadModal.tsx` displaying `'OFFICIAL AUTOAUDIT REPORT'` rotated at `-32deg` in subtle opacity (`rgba(15, 23, 42, 0.045)`), centered via `position: fixed` so it repeats across all printed pages. Enforced `display: none !important` on screen so it is strictly invisible during browsing and only appears during physical paper printing or PDF export. Added responsive watermark scaling for mobile viewports.
19. **Express 5 Routing & Wildcard Path Audit:** Audited `server.ts` and all sub-routers to eliminate unsupported `'*'` wildcard patterns (which trigger `PathError [TypeError]: Missing parameter name at index 1: *` under `path-to-regexp` v8 in Express 5). Maintained literal prefix `/api` middleware for 404 responses, path-less `app.use((_req, res) => ...)` for SPA fallback, and added a global Express error handler to prevent unhandled exceptions.
20. **Railway Deployment Readiness & Dockerless Configuration:** Configured `railway.json` for direct Nixpacks compilation and deployment. Moved `tsx` from `devDependencies` to `dependencies` in `package.json` to ensure containerless runtime stability under `npm prune --production`. Added root `/health` probe endpoint matching Railway healthcheck requirements alongside `/api/health`. Added standard CORS headers middleware in Express. Overhauled `.env.example` to strictly segregate client-safe `VITE_*` keys from server-only secrets with placeholder documentation.
21. **WhatsApp Instant Support Integration:** Created `WhatsAppWidget.tsx` and `WhatsAppButton.tsx` featuring official WhatsApp brand styling (`#25D366`), live online support indicator, quick inquiry chips (VIN check, order tracking, turnaround questions), freeform message input, and zero-latency direct deep linking to WhatsApp (`https://wa.me/18005552886?text=...`). Maintained clean, uncluttered navigation by keeping the floating bottom-right drawer widget as the primary screen chat touchpoint (removed redundant WhatsApp button from header navbar), while providing contextual 1-click support in footer, pricing cards, FAQ assistance banner, and `MyOrdersModal.tsx`. Configured `print:hidden` to ensure paper and PDF exports remain pristine.
22. **WhatsApp Click-to-Chat & Contact Analytics Suite:** Added comprehensive contact telemetry system across all key user touchpoints: Hero CTA row, Hero search card footer, Pricing plan cards, Checkout modal, and Customer order tracking. Built full backend REST API (`/api/analytics/contact-events`, `/api/analytics/contact-summary`, `/api/analytics/whatsapp-config`) with dual in-memory and PostgreSQL fallback. Created a dedicated **Contact Analytics** dashboard tab in `AdminPanel.tsx` with real-time KPI metrics, trigger source breakdown bars, customer intent distribution, filterable live event telemetry table, and live editable WhatsApp business configuration (phone number, greeting template, support SLA notice).
23. **Regex-Based VIN Validation Utility & Real-Time Visual Feedback:** Built `src/utils/vinValidator.ts` implementing ISO 3779 / NHTSA 17-character VIN verification (`/^[A-HJ-NPR-Z0-9]{17}$/`) with strict prohibition of ambiguous characters (I, O, Q). Integrated real-time visual feedback in `OrderModal.tsx` featuring dynamic border/ring states (emerald on valid, rose on prohibited characters/symbols, blue in-progress), character counter pill (`[X/17]`), 17-segment live visual progress bar, trailing icons (`CheckCircle2`, `AlertCircle`, pulse dot), and diagnostic feedback explaining ISO 3779 sections (WMI, VDS, Year).
24. **Automated Mock SMTP Order Confirmation Email Trigger:** Connected `OrderModal.tsx` checkout flow to the backend REST API (`POST /api/orders`) triggering Nodemailer's mock SMTP JSON transporter (`sendMockEmail` and `triggerAutomatedEmailSequence`). When a customer places an order, an official branded confirmation email is automatically dispatched directly to their provided email address with zero network latency, logged to `/api/emails`, and rendered in Step 5 with an interactive expandable preview card displaying delivery headers, subject, and message content.
25. **Multi-Step Checkout Stepper Component:** Created `src/components/CheckoutStepper.tsx` and integrated it into `OrderModal.tsx` to provide visual progression across all 5 checkout milestones: *Select Plan*, *VIN Entry*, *Customer Info*, *Payment Details*, and *Confirmation*. Features an animated progress track connecting each milestone, circular step badges with milestone icons (`Layers`, `Car`, `User`, `CreditCard`, `ShieldCheck`), active glowing ring indicator for the current step, green checkmark indicators for completed stages, and interactive click navigation allowing users to jump back to previously completed steps (such as returning to *VIN Entry* from *Payment Details*). Includes responsive mobile optimization with compact step indicator, progress percentage pill, and quick-jump breadcrumbs.
26. **Recharts-Based Admin Order Analytics Dashboard:** Installed `recharts` and created `src/components/AdminOrderAnalyticsDashboard.tsx` embedded directly into the Admin Panel's primary `Dashboard` tab. Visualizes new orders over time through an interactive line chart with cubic monotone curves, active hover points, and customizable views: *Volume Only* (smooth blue `#2563EB` curve), *Volume & Revenue* (dual Y-axes comparing order volume against gross USD revenue), and *Cumulative Growth* (gradient area chart). Features flexible time window filtering (7 Days, 14 Days, 30 Days, All Time), 4 live summary metric cards (*Orders in Range*, *Daily Average*, *Peak Traffic Day*, *Range Revenue*), custom branded hover tooltips displaying vehicle orders for each day, and a day-of-the-week traffic pattern distribution bar chart.
27. **Real-Time Coupon Validation Helper & Discount Calculation:** Built `src/utils/couponValidator.ts` providing `validateCouponRealTime()` and `calculateDiscount()` to verify promo codes against `INITIAL_COUPONS` (`FAKHAR20` for 20% off, `WELCOME10` for $5.00 off) and custom active coupons. Integrated real-time input listeners in `OrderModal.tsx` that instantly validate codes as the user types, adjusting the subtotal, calculating the exact discount, and updating the final payable order amount before payment. Features dynamic border/ring states (emerald on valid with `CheckCircle2`, rose on invalid with `AlertCircle`), an applied discount savings badge (`SAVED`), a quick "Remove" link, and interactive 1-click promotion chips allowing customers to tap and apply active codes immediately.
28. **Bulk Status Updates in AdminPanel:** Implemented multi-select checkbox management in `src/components/AdminPanel.tsx` with a master checkbox supporting indeterminate states and individual row checkboxes. Added a floating/sticky bulk operations action bar that appears whenever orders are selected, allowing administrators to mark multiple orders simultaneously as either **'Delivered'** (emerald badge & immediate status update) or **'Cancelled'** (with a safety confirmation modal listing all affected order numbers and totals). Automatically records timestamped audit logs for each affected order, syncs updates via `onBatchUpdateOrders` and `api.updateOrderStatus()`, updates the status filter pills with `'Cancelled'`, and displays toast confirmation alerts.
29. **Print-to-PDF Flow in ReportDownloadModal:** Implemented `handleDownloadAsPdf()` and upgraded the primary CTA inside `src/components/ReportDownloadModal.tsx` to a prominent **"Download as PDF"** button. Specifically targets the existing `@media print` CSS rules in `src/index.css` by hiding screen chrome (`.print-modal-card`, navbar, hero, buttons) while cleanly flowing `#printable-vehicle-report` with certified title brand findings, odometer timeline, and verification seals. Programmatically assigns a clean sanitized document title (`AutoAudit_Report_${vin}_${orderNumber}`) so modern browsers automatically name the saved PDF file accurately when *"Save as PDF"* is selected in the print dialog, automatically restoring the title afterwards, and displaying helpful guidance toasts and instructions.

---

## Known Issues
- *No critical runtime errors:* All components compile with 0 TypeScript errors and the dev server is active and verified.
- *Simulated Payment Gateway:* Checkout currently simulates card processing rather than capturing real credit cards via Stripe/PayPal.
- *Static PDF Downloads:* Report downloads currently serve client-side sample PDFs rather than dynamic server-rendered PDFs.

---

## Important Warnings
- **Never expose Supabase service-role keys:** Ensure `SUPABASE_SERVICE_ROLE_KEY` is never imported in `src/` or exposed via `import.meta.env`.
- **Do not commit `.env` files with production secrets:** Use `.env.example` as the template.
- **Do not bypass the Dual-Persistence Engine:** All modifications to database operations must preserve the in-memory fallback to avoid application crashes during cloud maintenance.

---

## Future Considerations
- Integrate live Stripe Elements card processing with webhooks for automated order status advancement.
- Implement server-side PDF generation using Puppeteer or PDFKit to render dynamic vehicle history reports with official NMVTIS and state seal graphics.
- Add Supabase Auth for customer accounts to enable fleet managers and dealerships to track multi-vehicle audits in a single unified dashboard.
