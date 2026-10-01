# 🚗 AutoAudit — Vehicle History Report Ordering Platform

> A production-ready, CARFAX-inspired vehicle intelligence and history report ordering platform. Enables buyers and dealerships to audit 17-digit VINs or license plates, select tailored report tiers, complete encrypted checkouts with session data protection, and receive comprehensive NMVTIS records.

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.1-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## ✨ Key Features

- **🔍 Standard ISO 3779 VIN & Plate Lookup**: Rigorous 17-character validation (excluding ambiguous letters I, O, Q) with quick-fill sample presets.
- **🛡️ 3-Tier Report Pricing**: Basic Report ($24.99), Premium Auction Audit ($44.99), and Comprehensive Buyer Guard ($69.99).
- **⏱️ Active Session Security Timer**: 10-minute active checkout countdown with 2-minute impending expiry alert and automated memory purge to safeguard financial and personal information.
- **📑 Interactive Sample Report Modal**: Full inspection breakdown covering NMVTIS title brands, salvage/flood markers, lien records, odometer consistency, and ownership timeline.
- **📬 Customer Portal & Email Dispatch**: Live order lookup by email or reference ID with simulated delivery notifications.
- **⚙️ Admin Management Console**: Track incoming orders, transition processing states (Pending → Delivered), toggle coupon promotions, and audit dispatch logs.
- **🎨 Acme.ai-Inspired Design System**: Minimalist high-contrast aesthetic, 8px/14px border radii, `-1.2px` display tracking, and verified emerald/navy trust palette.
- **🌐 Production SEO & Schema**: Built-in OpenGraph cards, Twitter cards, and Schema.org `Organization` JSON-LD structured metadata.

---

## 🗄️ Database Setup (Supabase PostgreSQL — 100% Free)

AutoAudit includes native support for **Supabase (Free Tier PostgreSQL)** with automatic local fallback if no cloud credentials are provided.

### 2-Minute Quick Setup:
1. Create a free account at [Supabase](https://supabase.com) and create a **New Project**.
2. Open the **SQL Editor** tab in your Supabase project dashboard.
3. Paste and run the pre-built schema from [`supabase/schema.sql`](./supabase/schema.sql). This will create all required tables (`orders`, `services`, `coupons`, `emails`) with indexes and initial seed data.
4. Go to **Project Settings** → **API**, copy your **Project URL** and **anon / public key**.
5. Add them to your environment (or `.env` file):
   ```bash
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-public-key
   ```
6. Start the server (`npm run dev`). AutoAudit will automatically detect Supabase and persist all vehicle orders, status updates, and audit trails directly to PostgreSQL!
