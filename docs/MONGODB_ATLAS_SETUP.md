# AutoAudit — MongoDB Atlas Complete Setup, Migration, and Security Guide

> **Target Launch Date:** October 17, 2026  
> **Primary Database:** MongoDB Atlas (Free Shared M0 Cluster Tier)  
> **Backend Integration:** Node.js, Express 5, TypeScript, Mongoose  

This comprehensive guide walks the AutoAudit owner through provisioning, configuring, securing, and connecting a zero-cost **MongoDB Atlas M0 Free Tier** database cluster to AutoAudit.

---

## Table of Contents

1. [Why MongoDB Atlas for AutoAudit?](#1-why-mongodb-atlas-for-autoaudit)
2. [Step 1: Create a Free MongoDB Atlas Account](#step-1-create-a-free-mongodb-atlas-account)
3. [Step 2: Create the AutoAudit Organization & Project](#step-2-create-the-autoaudit-organization--project)
4. [Step 3: Deploy an Available Free M0 Shared Cluster](#step-3-deploy-an-available-free-m0-shared-cluster)
5. [Step 4: Create a Dedicated Database User](#step-4-create-a-dedicated-database-user)
6. [Step 5: Configure Network Access (IP Access List)](#step-5-configure-network-access-ip-access-list)
7. [Step 6: Retrieve Your Production SRV Connection String](#step-6-retrieve-your-production-srv-connection-string)
8. [Step 7: Configure `MONGODB_URI` in Google AI Studio & Local Dev](#step-7-configure-mongodb_uri-in-google-ai-studio--local-dev)
9. [Step 8: Configure Production Secrets in Deployment Host (Railway, etc.)](#step-8-configure-production-secrets-in-deployment-host-railway-etc)
10. [Step 9: Testing Database Connectivity & Verifying Readiness](#step-9-testing-database-connectivity--verifying-readiness)
11. [Step 10: Running the Data Migration Utility](#step-10-running-the-data-migration-utility)
12. [Troubleshooting Guide (Authentication, DNS, IP Whitelist, SSL)](#troubleshooting-guide)

---

## 1. Why MongoDB Atlas for AutoAudit?

- **Flexible Vehicle Schema:** Vehicle records, NMVTIS audit trails, Copart salvage photos, and custom build specs benefit from MongoDB's native JSON document model.
- **Zero Cost (M0 Tier):** MongoDB Atlas provides 512 MB of free storage on AWS, GCP, or Azure with automated patch management, zero maintenance fees, and end-to-end TLS encryption.
- **Automatic Fallback:** AutoAudit is architected to operate seamlessly in local in-memory fallback mode until `MONGODB_URI` is supplied. When configured, it automatically persists all data to Atlas.

---

## Step 1: Create a Free MongoDB Atlas Account

1. Navigate to the official MongoDB Atlas registration portal: **[https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)**.
2. Sign up with your business email (`admin@autoaudit.com`) or use Google Workspace Single Sign-On.
3. Complete the email verification step.

---

## Step 2: Create the AutoAudit Organization & Project

1. In the top navigation bar, click the **Context Dropdown** (top-left) and select **New Project**.
2. Name your project: `AutoAudit-Production` (or `AutoAudit`).
3. Click **Next** and then **Create Project**.

---

## Step 3: Deploy an Available Free M0 Shared Cluster

1. On the Database Deployments screen, click **Build a Database** (or **Create**).
2. Under deployment options, select the **M0 Free** tier (Shared RAM, 512 MB Storage, zero cost forever).
3. **Cloud Provider & Region:**
   - Provider: **AWS** or **Google Cloud (GCP)**.
   - Region: Select the region closest to your target audience or hosting server (e.g., `us-east-1` N. Virginia, `us-central1` Iowa, or `eu-central-1` Frankfurt).
4. **Cluster Name:** Change from `Cluster0` to `autoaudit-cluster` (or keep `Cluster0`).
5. Click **Create Deployment**. Atlas will provision your cluster in approximately 1–3 minutes.

---

## Step 4: Create a Dedicated Database User

Security Principle: **Least Privilege & Strong Credentials**.

1. In the Atlas sidebar under **Security**, navigate to **Database Access**.
2. Click the green **Add New Database User** button.
3. Choose **Password** as the Authentication Method:
   - **Username:** `autoaudit_app` (or your chosen service username).
   - **Password:** Click **Autogenerate Secure Password** and copy it to your password manager.
     > *Note:* If you write your own password, avoid special characters like `@`, `:`, or `/` in the password, or URL-encode them (`%40`, `%3A`, `%2F`).
4. **Database User Privileges:**
   - Select **Built-in Role** -> **Read and write to any database** (or restrict to `autoaudit_db`).
5. Click **Add User**.

---

## Step 5: Configure Network Access (IP Access List)

MongoDB Atlas enforces an IP whitelist firewall. Without network access rules, connections will be rejected with `MongoServerSelectionError: connection timed out`.

1. In the Atlas sidebar under **Security**, navigate to **Network Access**.
2. Click **Add IP Address**.
3. For cloud deployments (e.g., Railway, Render, Fly.io, Vercel, Google AI Studio preview environments) where IP addresses are dynamically assigned:
   - Click **Allow Access from Anywhere** (adds `0.0.0.0/0`).
   - Description: `Production Cloud Servers & Dev Runtime`.
   - Click **Confirm**.
4. *(Optional Best Practice for Dedicated Fixed Office/VPN):* You can also add your specific current public IP address for restricted access if your servers have static egress IPs.

---

## Step 6: Retrieve Your Production SRV Connection String

1. In the Atlas sidebar under **Deployment**, navigate to **Database**.
2. Locate your cluster and click the **Connect** button.
3. In the modal that opens, select **Drivers** (Node.js).
4. Ensure Driver is set to **Node.js** and version is **6.0 or later**.
5. Copy the connection string. It will look like:
   ```
   mongodb+srv://autoaudit_app:<password>@autoaudit-cluster.xxxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. **Customize for AutoAudit:**
   - Replace `<password>` with your actual database user password from Step 4.
   - Specify the database name by inserting `autoaudit_db` before the query string:
   ```
   mongodb+srv://autoaudit_app:YourSecretPassword123@autoaudit-cluster.xxxxxx.mongodb.net/autoaudit_db?retryWrites=true&w=majority
   ```

---

## Step 7: Configure `MONGODB_URI` in Google AI Studio & Local Dev

1. Create a local `.env` file in the project root (AutoAudit already has `.gitignore` preventing it from being committed):
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and set `MONGODB_URI`:
   ```bash
   MONGODB_URI=mongodb+srv://autoaudit_app:YourSecretPassword123@autoaudit-cluster.xxxxxx.mongodb.net/autoaudit_db?retryWrites=true&w=majority
   ```
3. Restart or start the server:
   ```bash
   npm run dev
   ```
4. Watch the console logs. When successfully connected, you will see:
   ```
   [MongoDB Atlas] Initiating connection to: mongodb+srv://autoaudit_app:***@autoaudit-cluster...
   [MongoDB Atlas] Successfully connected to database: autoaudit_db
   [MongoDB Atlas] Application state synchronized with Atlas database.
   ```

---

## Step 8: Configure Production Secrets in Deployment Host (Railway, etc.)

For **Railway / Cloud Hosting**:
1. Open your project on the **Railway Dashboard** ([railway.app](https://railway.app)).
2. Select your **AutoAudit** service.
3. Navigate to the **Variables** tab.
4. Add a new variable:
   - **Key:** `MONGODB_URI`
   - **Value:** `mongodb+srv://autoaudit_app:YourSecretPassword123@autoaudit-cluster.xxxxxx.mongodb.net/autoaudit_db?retryWrites=true&w=majority`
5. Click **Add** / **Save**. Railway will automatically trigger a zero-downtime redeployment with the new database connection active.

---

## Step 9: Testing Database Connectivity & Verifying Readiness

AutoAudit includes built-in diagnostic and health endpoints:

### 1. General System Health
Call `GET /api/health` or `/health`:
```json
{
  "status": "ok",
  "service": "AutoAudit Vehicle Intelligence Engine",
  "version": "1.3.0",
  "uptime": 124.5,
  "database": {
    "primary": "MongoDB Atlas",
    "status": "connected",
    "connected": true,
    "pingMs": 18,
    "host": "autoaudit-cluster-shard-00-00.xxxx.mongodb.net",
    "dbName": "autoaudit_db"
  }
}
```

### 2. Orders & Database Status Probe
Call `GET /api/orders/db-status`:
```json
{
  "success": true,
  "database": {
    "primaryDatabase": "MongoDB Atlas",
    "isMongoConfigured": true,
    "isMongoConnected": true,
    "orderCount": 2,
    "serviceCount": 3,
    "couponCount": 3,
    "emailCount": 2
  }
}
```

### 3. Dedicated MongoDB Admin Diagnostic (Staff Token Required)
Call `GET /api/admin/mongodb/status` with header `x-admin-token: session-verified-autoaudit-staff`:
```json
{
  "success": true,
  "data": {
    "isConfigured": true,
    "isConnected": true,
    "state": "connected",
    "host": "autoaudit-cluster...",
    "databaseName": "autoaudit_db",
    "pingMs": 14,
    "collections": {
      "orders": 2,
      "services": 3,
      "coupons": 3,
      "emails": 2,
      "customerIntake": 2,
      "contactEvents": 14,
      "referrals": 0
    }
  }
}
```

---

## Step 10: Running the Data Migration Utility

AutoAudit features a standalone, idempotent data migration engine with batching, reconciliation, and dry-run safety.

### Dry-Run Verification (Simulates migration without writing changes):
```bash
npm run migrate:mongodb:dry
```

### Full Production Migration:
```bash
npm run migrate:mongodb
```

### Remote API Execution (from Admin Console / Postman):
`POST /api/admin/mongodb/migrate`
Headers:
- `Content-Type: application/json`
- `x-admin-token: session-verified-autoaudit-staff` (or custom `ADMIN_SECRET_KEY`)
Body:
```json
{
  "dryRun": false,
  "batchSize": 50,
  "source": "auto"
}
```

**Key Safety Guarantees:**
- **Zero Data Loss:** Source records from historical backups or existing repositories are strictly read-only and never deleted.
- **Idempotent Upserts:** If run multiple times, existing orders and coupons will be matched by unique keys (`orderNumber`, `code`, `id`) and updated safely.
- **Reconciliation Counts:** Reports pre- and post-migration totals for verification.

---

## Troubleshooting Guide

### 1. `MongoServerSelectionError: connection timed out`
- **Cause:** Network Access IP whitelist is blocking the connection.
- **Fix:** In MongoDB Atlas -> **Network Access**, ensure `0.0.0.0/0` (Allow Anywhere) is added.

### 2. `MongoServerError: bad auth : authentication failed`
- **Cause:** Wrong database user username, password, or unescaped special characters.
- **Fix:** Verify user credentials in **Database Access**. Reset the password in Atlas and update `MONGODB_URI`. If password contains characters like `#` or `@`, use standard alphanumeric characters.

### 3. `QuerySrv ENOTFOUND _mongodb._tcp...`
- **Cause:** DNS resolution error on older or restrictive networks.
- **Fix:** Ensure you are using the full `mongodb+srv://` hostname copied directly from MongoDB Atlas. If your environment does not support SRV records, Atlas provides standard non-SRV connection strings under "Connection String with older drivers".

### 4. Database writes hanging or timing out
- **Fix:** AutoAudit is configured with `serverSelectionTimeoutMS: 5000` to prevent server stalls. If Atlas is unreachable, the server automatically logs the issue and falls back to local operation without crashing.
