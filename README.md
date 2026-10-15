# 🚗 AutoAudit — Vehicle History Report Ordering Platform

> A production-ready, CARFAX-inspired vehicle intelligence and history report ordering platform. Enables buyers and dealerships to audit 17-digit VINs or license plates, select tailored report tiers, complete encrypted checkouts with session data protection, and receive comprehensive NMVTIS records.

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.1-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20M0-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/cloud/atlas)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## ✨ Key Features

- **🔍 Standard ISO 3779 VIN & Plate Lookup**: Rigorous 17-character validation (excluding ambiguous letters I, O, Q) with NHTSA vPIC DOT integration and quick-fill presets.
- **🛡️ 3-Tier Report Pricing**: Basic Report ($18.99), Complete Report ($28.99), and Premium Auction Audit ($42.99).
- **🗄️ MongoDB Atlas Primary Database**: Native document persistence with Mongoose models, validation, connection pooling, and automatic reconnection.
- **⏱️ Active Session Security Timer**: 10-minute active checkout countdown with 2-minute impending expiry alert and automated memory purge to safeguard financial and personal information.
- **📑 Interactive Sample Report Modal**: Full inspection breakdown covering NMVTIS title brands, salvage/flood markers, lien records, odometer consistency, and ownership timeline.
- **📬 Customer Portal & Email Dispatch**: Live order lookup by email or reference ID with simulated delivery notifications.
- **⚙️ Admin Management Console**: Track incoming orders, transition processing states (Pending → Delivered), toggle coupon promotions, run database migrations, and audit dispatch logs.
- **👥 Refer-a-Friend Rewards**: Generate unique referral codes, share link, and earn discount vouchers on vehicle history verification reports.
- **🎨 Acme.ai-Inspired Design System**: Minimalist high-contrast aesthetic, 8px/14px border radii, `-1.2px` display tracking, and verified emerald/navy trust palette.
- **🌐 Production SEO & Schema**: Built-in OpenGraph cards, Twitter cards, and Schema.org `Organization` JSON-LD structured metadata.

---

## 🗄️ Database Setup (MongoDB Atlas — 100% Free M0 Tier)

AutoAudit uses **MongoDB Atlas** as its primary cloud database platform with an automated local fallback mode for development without external credentials.

### 2-Minute Quick Setup:
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a project (`AutoAudit`).
2. Deploy a free **M0 Shared Cluster** (zero cost forever).
3. Under **Database Access**, create a database user (e.g., `autoaudit_app`).
4. Under **Network Access**, add `0.0.0.0/0` (Allow Access from Anywhere) to permit cloud server connections.
5. In **Database** → **Connect** → **Drivers**, copy the connection URI and add `autoaudit_db`:
   ```bash
   MONGODB_URI=mongodb+srv://<user>:<password>@<host>/autoaudit_db?retryWrites=true&w=majority
   ```
6. Add `MONGODB_URI` to your environment variables (or `.env` file).
7. Start the server (`npm run dev`). AutoAudit will automatically connect to Atlas and synchronize orders, services, coupons, emails, and intake submissions!

For detailed step-by-step documentation with screenshots and troubleshooting, see [`docs/MONGODB_ATLAS_SETUP.md`](./docs/MONGODB_ATLAS_SETUP.md).
