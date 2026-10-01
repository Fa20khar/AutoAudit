# Product Requirements Document (PRD)

## Product Name
**AutoAudit — Vehicle Intelligence & History Report Platform**

---

## Product Overview
AutoAudit is an online vehicle intelligence and history report ordering platform. It provides used car buyers, sellers, dealerships, and fleet managers with instant verification of motor vehicle histories. Users input a standard 17-character Vehicle Identification Number (VIN) or US license plate, receive instant vehicle specification decoding, select from tiered audit packages (Basic, Complete, Premium), complete a secure checkout, and receive verified vehicle history reports via an interactive portal and automated email dispatch.

---

## Problem Statement
Buying or selling a pre-owned vehicle carries significant financial and safety risks:
1. **Hidden Structural & Flood Damage:** Thousands of vehicles with undisclosed salvage titles, flood immersion, or frame deformation are resold annually across state lines.
2. **Odometer Rollback Fraud:** Odometers are frequently rolled back to inflate resale values.
3. **Active Liens & Stolen Status:** Consumers unknowingly purchase vehicles with active bank liens, impound holds, or active theft flags.
4. **Expensive & Fragmented Incumbent Tools:** Traditional report providers charge exorbitant prices for individual reports with confusing interfaces and delayed delivery.

AutoAudit solves this by unifying official federal clearinghouse records (NMVTIS guidelines, NHTSA recall databases, state DMV brand registers, and auction salvage indices) into a clean, transparent, affordable, and accessible reporting experience.

---

## Product Goals
- **Instant Confidence:** Deliver decoded vehicle identity and critical status flags within seconds of entering a VIN.
- **High-Conversion Ordering:** Provide a frictionless 3-step checkout with real-time promo code validation, transparent pricing, and multiple report tiers.
- **Accurate Historical Auditing:** Collate DMV title brands, total loss records, insurance salvage auctions, recall campaigns, and odometer milestones into an authoritative, readable report.
- **Fulfillment Automation & Transparency:** Provide continuous order lifecycle updates (Paid → Processing → NMVTIS Check → Ready → Delivered) with SMS notifications, customer tracking portals, and downloadable PDF reports.
- **Streamlined Operations:** Equip administrative staff with an operations control center to manage order queues, attach report files, log customer audit trails, and oversee revenue metrics.

---

## Target Users
1. **Private Car Buyers:** Individuals evaluating a used car from private sellers or dealerships seeking peace of mind before transferring funds.
2. **Private Car Sellers:** Owners who want to present an authoritative vehicle report to potential buyers to justify asking prices and accelerate sales.
3. **Independent Auto Dealers:** Small-to-medium dealerships requiring bulk report auditing for lot inventory intake.
4. **Auto Brokers & Mechanics:** Automotive professionals inspecting vehicles for clients.

---

## User Roles & Permissions
- **Guest / Visitor:** Can search VINs/plates, view decoded vehicle specifications, inspect the interactive sample report, review FAQs and pricing, and initiate an order.
- **Customer (Order Holder):** Can view order confirmation, track status through the customer tracking portal using their email and order number, view inspection progress bars, and download generated PDF reports.
- **Admin Staff / Operator:** Can access the internal `/admin` management interface, view and filter all customer orders, transition order statuses, append internal operational notes, attach generated PDF reports or external URLs, manage promo coupons, review email dispatch history, and inspect database connectivity.

---

## Core Features (Currently Implemented)

### 1. VIN & License Plate Lookup Engine
- **ISO 3779 VIN Validation:** Real-time client-side and server-side validation rejecting invalid character sets (I, O, Q) and verifying the mandatory 17-character structure.
- **NHTSA vPIC Public API Integration:** Automatic real-time query fallback to the National Highway Traffic Safety Administration database to resolve make, model, model year, trim, body style, powertrain, and assembly country.
- **Cached Instant Profiles:** High-speed cached profiles for instant lookup with pre-indexed vehicle specs and title status flags.
- **US State License Plate Support:** State selector + registration plate lookup workflow.

### 2. Multi-Tier Service Plans
- **Basic Report ($18.99):** Title brand verification, junk/salvage/total-loss records, odometer rollback warnings, open safety recalls, and official NMVTIS identification. Delivery time: 1–2 hours.
- **Complete Report ($28.99 - Most Popular):** Everything in Basic plus detailed accident records, title and registration chronology, active liens/impound records, structural/frame damage audit, airbag deployment checks, and exportable PDF. Delivery time: 30–45 minutes.
- **Premium Report ($42.99):** Everything in Complete plus multi-state DMV history, commercial fleet/rental usage, salvage auction sale history with historical bid photos, stolen vehicle police cross-check, priority delivery (15–30 mins), and dedicated priority support.

### 3. Frictionless Checkout & Order Processing
- **Vehicle Pre-population:** VIN, make, model, and year automatically carry over from the search hero into the checkout modal.
- **Interactive Plan Selector:** Visual comparison and radio selection with live total recalculation.
- **Customer Contact Information:** Full name, verified email address, phone number, and optional SMS updates checkbox.
- **Promotional Coupon Engine:** Dynamic promo code validation with instant percentage discounts (e.g. `FAKHAR20` for 20% off, `AUTOAUDIT10` for 10% off) or fixed discounts (e.g. `SAVE5` for $5 off).
- **Payment Processing Simulation:** Mock card gateway with instant validation, transaction reference generator (`ch_...`), and automated audit log entry.

### 4. Customer Self-Service & Order Tracking
- **"Track My Order" Portal:** Customer lookup by email address and order number (`AA-XXXXX`).
- **Real-Time Lifecycle Visualizer:** Visual 5-step progress indicator showing the exact stage of report generation:
  1. *Paid / New*
  2. *Processing*
  3. *NMVTIS Check*
  4. *Ready*
  5. *Delivered*
- **Report Download Modal:** On-screen preview, direct PDF download trigger, and print-ready report document.

### 5. Administrative Operations Panel
The Admin Operations Panel provides 7 dedicated operational workspaces:
1. **Executive Dashboard (`dashboard`):** Real-time KPI metric cards (Total Orders, Active Processing, Ready for Delivery, Paid Revenue, and Average Fulfillment Time).
2. **Order Fulfillment Queue (`orders`):** Filterable order table by status (All, Paid/New, Processing, Ready, Delivered, Cancelled) with universal search across names, VINs, emails, and order IDs.
3. **Customer Database (`customers`):** Directory of vehicle buyers/sellers with contact records, purchase histories, and phone numbers.
4. **Service Plan Catalog (`services`):** Management interface for pricing tiers (Basic, Complete, Premium), badges, and feature lists.
5. **Report Delivery Center (`reports`):** Upload, attach, and audit vehicle history report PDF documents and secure links.
6. **Payment & Receipts Ledger (`payments`):** Audit gateway transaction references (`ch_...`), card methods, and billing records.
7. **Platform Settings & Database Diagnostics (`settings`):** Live indicator showing Supabase PostgreSQL connection status, table health check, order counts, and one-click SQL schema copying.

- **Order Detail Workspace:** Full customer profile, vehicle spec breakdown, payment gateway reference, and chronological audit logs.
- **Staff Action Center:** Status transition buttons with automatic timestamped audit logs.
- **Report Attachment System:** File name and secure URL input to link generated report PDFs to customer orders.
- **Internal Staff Notes:** Persistent staff notepad for logging internal research findings per order.
- **Coupon Manager:** View coupon codes, discount rates, expiry dates, active states, and usage counts.
- **Email Dispatch Log:** Historical audit trail of all automated customer and staff notification emails.

---

## Authentication Requirements

### Current Implementation
- **Customer Access:** Lightweight, secure tokenless order tracking authenticated via the tuple of customer email address + unique order number (`AA-XXXXX`).
- **Admin Access:** Protected modal view accessible via staff navigation action with role confirmation and session persistence.

### Planned Supabase Auth Integration
- **Customer Authentication:** Supabase Auth with Magic Link / OTP email login and Google OAuth to link past vehicle purchases to a persistent user profile.
- **Admin Authentication:** Email/password or OAuth restricted to authorized staff email domains with Supabase Row Level Security (RLS) enforcement.

---

## Main User Journeys

### Journey 1: Customer Purchases a Vehicle History Report
1. Customer lands on the homepage and enters a 17-digit VIN or US license plate.
2. The system validates the format and queries NHTSA/Cache to decode the vehicle (e.g. 2017 Honda Accord EX-L).
3. The customer clicks **"Run Full Audit"**; the Order Modal opens pre-populated with vehicle details.
4. The customer selects the **Complete Report ($28.99)**.
5. The customer applies promo code `FAKHAR20` (discounting the total by 20% to $23.19).
6. The customer enters contact details (name, email, phone) and simulated payment card information.
7. The order is submitted; the backend persists the order to Supabase PostgreSQL, schedules automated clearinghouse checks, and dispatches an order confirmation email.
8. The customer receives an instant success screen displaying their order number (`AA-XXXXX`) and delivery estimate.

### Journey 2: Customer Checks Status & Downloads Report
1. The customer clicks **"Track My Order"** in the top navigation.
2. The customer enters their email address and order number.
3. The modal displays the vehicle details, payment receipt, and active progress bar (*Ready / Delivered*).
4. The customer clicks **"Download Official Report (PDF)"** to review or save the generated report.

### Journey 3: Administrator Fulfills an Order
1. Staff member opens the **Admin Panel**.
2. Selects an order with status *Paid / New*.
3. Transitions status to *Processing*, then *NMVTIS Check*.
4. Uploads or links the completed audit report PDF.
5. Marks the order as *Delivered*; the system logs the audit event and records a delivery notification in the email dispatch queue.

---

## Functional Requirements
- **FR-01:** The system must validate 17-character VIN strings against ISO 3779 (no letters I, O, Q).
- **FR-02:** The system must resolve vehicle specifications via NHTSA vPIC or fallback cache within 2.5 seconds.
- **FR-03:** The system must calculate order subtotals, discount deductions, and final totals accurately with 2 decimal places.
- **FR-04:** The system must generate unique, human-readable order numbers in the format `AA-XXXXX`.
- **FR-05:** The system must log every order status transition in an immutable audit log array containing timestamp, actor, action, and details.
- **FR-06:** The system must persist order records, coupons, and emails directly to Supabase PostgreSQL when configured, and fall back to local memory without throwing application-breaking exceptions.
- **FR-07:** The system must allow customer order retrieval by matching both email and order number.

---

## Non-Functional Requirements
- **NFR-01 (Reliability):** Dual-storage architecture ensuring 100% application uptime; if Supabase credentials or tables are temporarily offline, the in-memory engine transparently serves existing data.
- **NFR-02 (Performance):** Page initial load within 1.2 seconds; client-side VIN validation in under 100ms; backend API endpoints responding in under 300ms.
- **NFR-03 (Maintainability):** Fully typed TypeScript codebase with zero compilation errors, modular components, and no duplicate state logic.
- **NFR-04 (Usability):** Zero-jargon customer copy, clear progress indicators, informative toast notifications for every user action, and zero intrusive popups.

---

## Security Requirements
- **SEC-01:** Never expose Supabase service-role keys, database passwords, or private API keys in client-side bundles.
- **SEC-02:** Client-side Supabase client must use `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` restricted by PostgreSQL Row Level Security (RLS).
- **SEC-03:** Sanitize and validate all user inputs (VINs, emails, phone numbers, coupon codes) before database insertion.
- **SEC-04:** All external API communications must use HTTPS with strict timeout boundaries (AbortController).

---

## Responsive & Mobile Requirements
- **Mobile First:** Full responsive compatibility across 320px (iPhone SE), 375px, 768px (iPad portrait), 1024px (iPad landscape), and 1440px+ (desktop).
- **Touch-Friendly Hit Targets:** All interactive buttons, tabs, inputs, and accordion triggers maintain a minimum tap target of 44x44px.
- **Sticky / Accessible Navigation:** Fixed header with streamlined mobile menu and mobile-optimized modal drawers.

---

## Future Roadmap Features
- [ ] Integration with live Stripe / PayPal payment gateways.
- [ ] Native PDF generation engine (server-side PDFKit or Puppeteer rendering).
- [ ] Direct state DMV title check automation via commercial NMVTIS data partner API.
- [ ] Supabase Authentication with user account dashboard for repeat vehicle dealership buyers.
- [ ] Automated SMS delivery via Twilio API.
