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
- **MongoDB Atlas & Mongoose:** Selected MongoDB Atlas as the primary cloud database platform with Mongoose models for robust JSON schema enforcement, automatic indexing, and flexible vehicle data structures.
- **TypeScript 5.7:** Configured strict TypeScript typing across both frontend (`src/`) and backend (`server/`).

---

## Architecture Decisions
- **Client/Server Separation:** Server-side routes are neatly segregated in `server/routes/` (`vin.ts`, `orders.ts`, `services.ts`, `coupons.ts`, `emails.ts`, `stats.ts`, `adminMongodb.ts`).
- **Resilient MongoDB Connection Architecture:** Implemented in `server/mongodb/connection.ts`. Supports connection timeouts, automatic reconnection, graceful shutdown, masked URI logging, and seamless in-memory fallback if `MONGODB_URI` is unconfigured.
- **Dynamic Database Health & Readiness Checks:** In `GET /api/admin/mongodb/status` and `GET /api/orders/db-status`, the server performs live ping tests and reports MongoDB Atlas connection state directly to the Admin Console.
- **Safe Data Migration Pipeline:** Built `server/mongodb/migration.ts` with `--dry-run` capability, idempotency via upserts, batching, and error isolation.

---

## Database Decisions
- **Document Collections (Mongoose Models):** Designed collections in `server/mongodb/models/`:
  1. `orders`: Primary vehicle audit orders with customer, vehicle, payment, and audit logs.
  2. `services`: Tiered pricing plans (Basic, Complete, Premium).
  3. `coupons`: Active promotional discount codes (`FAKHAR20`, `AUTOAUDIT10`, `SAVE5`).
  4. `emails`: Notification dispatch log.
  5. `customer_intakes`: Detailed intake form submissions.
  6. `contact_events`: Telemetry event log for user engagement.
  7. `whatsapp_configs`: Business contact and WhatsApp widget configurations.
  8. `referrals`: Referral program accounts, reward coupons, and conversions.
- **Schema Validation & Indexes:** Configured unique indexes on `orderNumber`, `code`, `id`, `referralCode`, and query indexes on `status`, `createdAt`, `vin`, and `customerEmail`.
- **Zero-Downtime Fallback:** AutoAudit maintains an in-memory database mirror in `server/db.ts` that immediately handles traffic if the database connection is initializing or undergoing network maintenance.

---

## Authentication Decisions
- **Customer Self-Service:** Uses Email + Order Number combination. Avoids forcing registration before purchase to optimize checkout conversion rates.
- **Admin Access:** Staff access authenticated via `server/middleware/auth.ts` with Bearer token header or session header.
- **Credential Segregation:** `MONGODB_URI` and `ADMIN_SECRET_KEY` are strictly reserved for server-side operations and never exposed to the client bundle.

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
4. **Complete Supabase Removal:** Completely uninstalled `@supabase/supabase-js`, removed `supabase/` directory, deprecated `server/supabase.ts` and `src/lib/supabaseClient.ts`, and purged all Supabase environment variables.
5. **MongoDB Atlas Integration & Models:** Built full Mongoose schemas and models in `server/mongodb/` (`Order`, `Service`, `Coupon`, `EmailNotification`, `CustomerIntake`, `ContactEvent`, `WhatsAppConfig`, `Referral`).
6. **Robust Connection Manager:** Created `server/mongodb/connection.ts` featuring masked connection string logging, timeouts, ping health probes, and process signal handlers (`SIGINT`, `SIGTERM`).
7. **Safe Idempotent Migration Utility:** Created `server/mongodb/migration.ts` executable via `npm run migrate:mongodb` or dry-run `npm run migrate:mongodb:dry` with batching and collision resolution.
8. **Admin MongoDB Operations Console:** Added live status monitoring, ping testing, and collection item counters directly in the Admin Panel and `/api/admin/mongodb/status`.
9. **Staff Authentication & Authorization:** Implemented `server/middleware/auth.ts` and `server/routes/auth.ts` with token authorization and secure session management.
10. **Customer Data Isolation & Privacy:** Modified `GET /api/orders` to strictly require `requireAdminAuth` unless an explicit `email` parameter is supplied. Stopped indiscriminate fetching of all customer orders on public homepage mount in `App.tsx`.
11. **Strict Form Validation & XSS Sanitization:** Enforced ISO 3779 17-digit VIN format checks and email regex validation in `POST /api/orders`. Added sanitization to prevent stored XSS attacks.
12. **Express 5 API Catch-All Routing Fix:** Replaced invalid `app.all('/api/*')` wildcard syntax with Express 5-compatible `app.use('/api', ...)` returning clean JSON 404 responses.
13. **UI Polish & Dialog Compliance:** Replaced browser `alert()` invocations in `OrderModal.tsx` with non-blocking `useToast()` notifications. Added direct HTML report file download in `ReportDownloadModal.tsx`.
14. **Express 5 Production Wildcard Route Fix:** Replaced `app.get('*', ...)` with `app.use((_req, res) => res.sendFile(...))` to resolve `PathError [TypeError]: Missing parameter name at index 1: *` when running in production mode.
15. **Order Submission Loading Spinner & Duplicate Click Guard:** Enhanced `OrderModal.tsx` submit button with visible `<Loader2>` spinner, `disabled={isProcessingPayment}`, `cursor-not-allowed`, `aria-busy`, and early return guard in `handleProcessPayment` to eliminate duplicate payment attempts.
16. **Print-Friendly CSS Media Query & Print Report Button:** Added `@media print` rules in `src/index.css` with clean letter margins, background suppression for non-printable UI, and page-break control. Embedded paper-formatted vehicle history report (`#printable-vehicle-report`) and added a prominent 'Print Report (Paper Copy)' button in `ReportDownloadModal.tsx`.
17. **Nodemailer Mock SMTP Handler & Automated Lifecycle Email Sequence:** Implemented `server/services/smtp.ts` using Nodemailer JSON transporter for zero-network-latency mock delivery. Automatically dispatches the 3-stage lifecycle sequence (Stage 1: Confirmation immediately on checkout, Stage 2: In-Progress after 4s, Stage 3: Ready after 8s) with responsive branded HTML templates. Added `/api/emails/smtp-status`, `/api/emails/trigger-sequence/:orderId`, and full Mock SMTP outbox inspector in `AdminPanel.tsx` with iframe HTML previews and Nodemailer message ID tracking.
18. **Mobile Print Media Query & Font Optimization:** Added `@media print and (max-width: 768px)` and `(max-width: 480px)` rules in `src/index.css`. Tailored for iOS and Android mobile printing and PDF generation with tight margins, scaled body font size, 2x2 grid reorganization for key findings cards, table fixed layout with auto-wrapping, and compact headers.
19. **Subtle Diagonal Print Watermark:** Added `.print-watermark` in `src/index.css` and `ReportDownloadModal.tsx` displaying `'OFFICIAL AUTOAUDIT REPORT'` rotated at `-32deg` in subtle opacity, centered via `position: fixed` so it repeats across all printed pages.
20. **WhatsApp Instant Support Integration:** Created `WhatsAppWidget.tsx` and `WhatsAppButton.tsx` featuring official WhatsApp brand styling, live online support indicator, quick inquiry chips, freeform message input, and zero-latency direct deep linking to WhatsApp.
21. **WhatsApp Click-to-Chat & Contact Analytics Suite:** Added comprehensive contact telemetry system across all key user touchpoints: Hero CTA row, Hero search card footer, Pricing plan cards, Checkout modal, and Customer order tracking. Built full backend REST API (`/api/analytics/*`) with MongoDB and memory fallback.
22. **Regex-Based VIN Validation Utility & Real-Time Visual Feedback:** Built `src/utils/vinValidator.ts` implementing ISO 3779 / NHTSA 17-character VIN verification with strict prohibition of ambiguous characters (I, O, Q). Integrated real-time visual feedback in `OrderModal.tsx`.
23. **Automated Mock SMTP Order Confirmation Email Trigger:** Connected `OrderModal.tsx` checkout flow to the backend REST API triggering Nodemailer's mock SMTP transporter.
24. **Multi-Step Checkout Stepper Component:** Created `src/components/CheckoutStepper.tsx` and integrated it into `OrderModal.tsx` to provide visual progression across all 5 checkout milestones.
25. **Recharts-Based Admin Order Analytics Dashboard:** Installed `recharts` and created `src/components/AdminOrderAnalyticsDashboard.tsx` embedded directly into the Admin Panel's primary `Dashboard` tab.
26. **Real-Time Coupon Validation Helper & Discount Calculation:** Built `src/utils/couponValidator.ts` providing `validateCouponRealTime()` and `calculateDiscount()` to verify promo codes against active coupons.
27. **Bulk Status Updates in AdminPanel:** Implemented multi-select checkbox management in `src/components/AdminPanel.tsx` with a master checkbox supporting indeterminate states and individual row checkboxes.
28. **Print-to-PDF Flow in ReportDownloadModal:** Implemented `handleDownloadAsPdf()` and upgraded the primary CTA inside `src/components/ReportDownloadModal.tsx` to a prominent "Download as PDF" button.
29. **Success Celebration Confetti Animation on Completed Orders:** Installed `canvas-confetti` and built `triggerCelebration()` in `src/components/OrderModal.tsx`.
30. **Staff Console Login Fix & Customer Data Intake Auto-Generate Suite:** Implemented customer data form modal and backend `POST /api/intake`, featuring automatic PDF report compilation, instant binary streaming at `/api/reports/download/:id`, email notifications via mock SMTP transporter, and a dedicated "Intake Queue" tab in `AdminPanel.tsx`.

---

## Known Issues
- *No critical runtime errors:* All components compile with 0 TypeScript errors and the dev server is active and verified.
- *Simulated Payment Gateway:* Checkout currently simulates card processing rather than capturing real credit cards via Stripe/PayPal.
- *Static PDF Downloads:* Report downloads currently serve client-side sample PDFs rather than dynamic server-rendered PDFs.

---

## Important Warnings
- **Never expose MongoDB URI or credentials:** Ensure `MONGODB_URI` is never imported in `src/` or exposed via `import.meta.env`.
- **Do not commit `.env` files with production secrets:** Use `.env.example` as the template.
- **Do not bypass the Dual-Persistence Engine:** All modifications to database operations must preserve the in-memory fallback to avoid application crashes during cloud maintenance.

---

## Future Considerations
- Integrate live Stripe Elements card processing with webhooks for automated order status advancement.
- Implement server-side PDF generation using Puppeteer or PDFKit to render dynamic vehicle history reports with official NMVTIS and state seal graphics.
- Expand referral rewards into automated coupon issuance with one-click sharing via SMS and WhatsApp.
