-- ==============================================================================
-- AutoAudit - Supabase (PostgreSQL) Database Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ==============================================================================

-- 1. Services / Report Pricing Tiers
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  original_price NUMERIC(10, 2),
  delivery_time TEXT NOT NULL,
  badge TEXT,
  popular BOOLEAN DEFAULT false,
  description TEXT NOT NULL,
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Coupons / Promotional Discounts
CREATE TABLE IF NOT EXISTS coupons (
  code TEXT PRIMARY KEY,
  discount_percent INT DEFAULT 0,
  discount_fixed NUMERIC(10, 2) DEFAULT 0,
  expiry_date TEXT,
  active BOOLEAN DEFAULT true,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  service_id TEXT REFERENCES services(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Paid / New',
  subtotal NUMERIC(10, 2) NOT NULL,
  discount_amount NUMERIC(10, 2) DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL,
  coupon_code TEXT,
  
  -- Customer Details
  customer_full_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  sms_notifications BOOLEAN DEFAULT true,

  -- Vehicle Details
  vehicle_vin_or_reg TEXT NOT NULL,
  is_vin BOOLEAN DEFAULT true,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_year INT,
  vehicle_mileage TEXT,
  vehicle_country_state TEXT,
  customer_notes TEXT,

  -- Payment & Gateway
  payment_status TEXT DEFAULT 'Paid',
  payment_gateway_ref TEXT,
  payment_method TEXT DEFAULT 'Credit Card',
  paid_at TIMESTAMPTZ,

  -- Fulfillment & Audit Logs
  internal_notes TEXT,
  result_file JSONB,
  audit_logs JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Email Notification Dispatch Logs
CREATE TABLE IF NOT EXISTS emails (
  id TEXT PRIMARY KEY,
  order_id TEXT,
  order_number TEXT,
  recipient_email TEXT NOT NULL,
  recipient_type TEXT DEFAULT 'customer',
  subject TEXT NOT NULL,
  type TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  read BOOLEAN DEFAULT false
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_vin ON orders(vehicle_vin_or_reg);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active services and coupons
CREATE POLICY "Public read services" ON services FOR SELECT USING (true);
CREATE POLICY "Public read coupons" ON coupons FOR SELECT USING (active = true);

-- Allow backend service role / public insert to orders
CREATE POLICY "Public insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read own orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Public update orders" ON orders FOR UPDATE USING (true);
CREATE POLICY "Public read emails" ON emails FOR SELECT USING (true);
CREATE POLICY "Public insert emails" ON emails FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- Seed Initial Services & Coupons
-- ==============================================================================

INSERT INTO services (id, name, price, original_price, delivery_time, badge, popular, description, features)
VALUES 
(
  'basic-vin',
  'Basic Report',
  14.99,
  24.99,
  'Instant (< 2 mins)',
  'Budget Check',
  false,
  'Essential verification of vehicle title status, junk/salvage records, and open recalls.',
  '["Title Brand Verification", "Salvage & Total Loss Records", "Odometer Rollback Warning", "Basic Safety Recall Status", "Official NMVTIS Identification"]'::jsonb
),
(
  'comprehensive-vin',
  'Complete Report',
  28.99,
  44.99,
  'Under 5 mins',
  'Most Popular',
  true,
  'Our most comprehensive audit. Includes detailed accident history, liens, title history, and damage records.',
  '["Everything in Basic Report", "Detailed Accident History", "Title & Registration History", "Active Liens & Impound Records", "Structural & Frame Damage Audit", "Airbag Deployment Checks", "Exportable High-Res PDF"]'::jsonb
),
(
  'commercial-vin',
  'Dealer / Fleet Audit',
  59.99,
  89.99,
  'Priority Instant',
  'Full History',
  false,
  'Enterprise-grade multi-registry check designed for dealerships, commercial buyers, and luxury imports.',
  '["Everything in Complete Report", "Multi-State DMV Title History", "Commercial Fleet & Rental Usage", "Auction Sale Records & Historical Photos", "Stolen Vehicle Police Cross-Check", "Priority Delivery & Dedicated Support"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO coupons (code, discount_percent, discount_fixed, expiry_date, active, usage_count)
VALUES 
('FAKHAR20', 20, 0, '2026-12-31', true, 18),
('AUTOAUDIT10', 10, 0, '2026-12-31', true, 42),
('SAVE5', 0, 5.00, '2026-12-31', true, 12)
ON CONFLICT (code) DO NOTHING;
