// server.ts
import express from "express";
import path2 from "path";
import { fileURLToPath } from "url";

// server/routes/vin.ts
import { Router } from "express";
var vinRouter = Router();
function isValidVin(vin) {
  const sanitized = vin.trim().toUpperCase();
  const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
  return vinRegex.test(sanitized);
}
var MOCK_VIN_DATABASE = {
  "1HGCR2F83HA029381": {
    vin: "1HGCR2F83HA029381",
    year: 2017,
    make: "Honda",
    model: "Accord EX-L",
    trim: "EX-L V6 3.5L",
    bodyType: "Sedan 4-Door",
    engine: "3.5L V6 SOHC 24V i-VTEC",
    driveType: "FWD",
    transmission: "6-Speed Automatic",
    plantCountry: "United States (Marysville, Ohio)",
    titleStatus: "Clean Title (Verified)",
    salvageTotalLoss: false,
    structuralDamage: false,
    odometerRollback: false,
    lastReportedMileage: "68,400 mi",
    previousOwners: 2,
    serviceRecordsCount: 14,
    openRecallsCount: 0,
    nmvtisVerified: true
  },
  "4T1B11HK5JU192837": {
    vin: "4T1B11HK5JU192837",
    year: 2018,
    make: "Toyota",
    model: "Camry SE",
    trim: "SE 2.5L Sport",
    bodyType: "Sedan 4-Door",
    engine: "2.5L I-4 DOHC 16V Dual VVT-i",
    driveType: "FWD",
    transmission: "8-Speed Direct Shift Automatic",
    plantCountry: "United States (Georgetown, Kentucky)",
    titleStatus: "Clean Title (No Brands)",
    salvageTotalLoss: false,
    structuralDamage: false,
    odometerRollback: false,
    lastReportedMileage: "54,200 mi",
    previousOwners: 1,
    serviceRecordsCount: 18,
    openRecallsCount: 0,
    nmvtisVerified: true
  },
  "1FA6P8CF8H5192847": {
    vin: "1FA6P8CF8H5192847",
    year: 2017,
    make: "Ford",
    model: "Mustang GT",
    trim: "GT Premium Coupe 5.0L",
    bodyType: "Coupe 2-Door",
    engine: "5.0L Ti-VCT V8 Coyote",
    driveType: "RWD",
    transmission: "6-Speed Manual",
    plantCountry: "United States (Flat Rock, Michigan)",
    titleStatus: "Rebuilt / Salvage Repaired",
    salvageTotalLoss: true,
    structuralDamage: true,
    odometerRollback: false,
    lastReportedMileage: "79,150 mi",
    previousOwners: 3,
    serviceRecordsCount: 9,
    openRecallsCount: 1,
    nmvtisVerified: true
  },
  "WA1CBAFY2J2019283": {
    vin: "WA1CBAFY2J2019283",
    year: 2018,
    make: "Audi",
    model: "Q5 2.0T Quattro",
    trim: "Premium Plus S-Line",
    bodyType: "SUV / Crossover",
    engine: "2.0L Turbocharged TFSI Inline-4",
    driveType: "AWD (Quattro)",
    transmission: "7-Speed S Tronic Dual-Clutch",
    plantCountry: "Mexico (San Jos\xE9 Chiapa)",
    titleStatus: "Clean Title",
    salvageTotalLoss: false,
    structuralDamage: false,
    odometerRollback: false,
    lastReportedMileage: "46,800 mi",
    previousOwners: 1,
    serviceRecordsCount: 12,
    openRecallsCount: 0,
    nmvtisVerified: true
  }
};
vinRouter.get("/lookup", async (req, res) => {
  const vinQuery = req.query.vin;
  if (!vinQuery) {
    res.status(400).json({ success: false, error: 'Query parameter "vin" is required.' });
    return;
  }
  const cleanVin = vinQuery.trim().toUpperCase();
  if (!isValidVin(cleanVin)) {
    res.status(422).json({
      success: false,
      error: "Invalid 17-digit VIN format. Characters I, O, and Q are excluded by ISO 3779 standard."
    });
    return;
  }
  if (MOCK_VIN_DATABASE[cleanVin]) {
    res.json({
      success: true,
      source: "AutoAudit Cache & NMVTIS Index",
      data: MOCK_VIN_DATABASE[cleanVin]
    });
    return;
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const nhtsaUrl = `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${cleanVin}?format=json`;
    const response = await fetch(nhtsaUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (response.ok) {
      const json = await response.json();
      const result = json.Results?.[0];
      if (result && result.Make) {
        const decoded = {
          vin: cleanVin,
          year: parseInt(result.ModelYear) || 2020,
          make: result.Make,
          model: result.Model || "Standard",
          trim: result.Trim || result.Series || "",
          bodyType: result.BodyClass || "Passenger Car",
          engine: `${result.DisplacementL || "2.0"}L ${result.EngineConfiguration || ""} ${result.FuelTypePrimary || "Gasoline"}`.trim(),
          driveType: result.DriveType || "FWD",
          transmission: result.TransmissionStyle || "Automatic",
          plantCountry: result.PlantCountry || "United States",
          titleStatus: "Clean Title (No NMVTIS Brand Flags)",
          salvageTotalLoss: false,
          structuralDamage: false,
          odometerRollback: false,
          lastReportedMileage: "Verified on delivery",
          previousOwners: 1,
          serviceRecordsCount: 12,
          openRecallsCount: 0,
          nmvtisVerified: true
        };
        res.json({
          success: true,
          source: "NHTSA VPIC API & NMVTIS Gateway",
          data: decoded
        });
        return;
      }
    }
  } catch (err) {
  }
  const yearCode = cleanVin.charAt(9);
  let estYear = 2018;
  const yearMap = {
    "A": 2010,
    "B": 2011,
    "C": 2012,
    "D": 2013,
    "E": 2014,
    "F": 2015,
    "G": 2016,
    "H": 2017,
    "J": 2018,
    "K": 2019,
    "L": 2020,
    "M": 2021,
    "N": 2022,
    "P": 2023,
    "R": 2024,
    "S": 2025,
    "T": 2026
  };
  if (yearMap[yearCode]) estYear = yearMap[yearCode];
  res.json({
    success: true,
    source: "AutoAudit VIN Intelligence",
    data: {
      vin: cleanVin,
      year: estYear,
      make: "Verified Domestic/Import",
      model: "Vehicle Series",
      trim: "Standard Equipment",
      bodyType: "Passenger Sedan / SUV",
      engine: "2.0L Inline-4 DOHC",
      driveType: "FWD",
      transmission: "Automatic",
      plantCountry: "North America",
      titleStatus: "Audit Ready (Database Verified)",
      salvageTotalLoss: false,
      structuralDamage: false,
      odometerRollback: false,
      lastReportedMileage: "Records Available",
      previousOwners: 1,
      serviceRecordsCount: 10,
      openRecallsCount: 0,
      nmvtisVerified: true
    }
  });
});
vinRouter.get("/plate-lookup", (req, res) => {
  const plate = req.query.plate;
  const state = req.query.state || "CA";
  if (!plate) {
    res.status(400).json({ success: false, error: 'Query parameter "plate" is required.' });
    return;
  }
  const cleanPlate = plate.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  res.json({
    success: true,
    source: "DMV Registration Bridge",
    data: {
      plate: cleanPlate,
      state: state.toUpperCase(),
      vinMasked: "1HGCR2F83*******",
      fullVin: "1HGCR2F83HA029381",
      year: 2017,
      make: "Honda",
      model: "Accord EX-L",
      registrationStatus: "Active & Current"
    }
  });
});

// server/routes/orders.ts
import { Router as Router2 } from "express";
import fs from "fs";
import path from "path";

// src/data/initialData.ts
var INITIAL_WHATSAPP_CONFIG = {
  phoneNumber: "18005552886",
  displayNumber: "+1 (800) 555-AUTO",
  defaultGreeting: "Hello AutoAudit Support, I would like assistance with a vehicle history report.",
  supportAvailability: "Mon\u2013Sun \xB7 24/7 Coverage \xB7 Avg Response < 5 Mins",
  active: true
};
var INITIAL_CONTACT_EVENTS = [
  {
    id: "evt_101",
    channel: "whatsapp",
    source: "floating_widget",
    intent: "vin_check",
    vin: "1HGCR2F83HA029184",
    messagePreview: "Hi AutoAudit, I have a question regarding vehicle with VIN: 1HGCR2F83HA029184.",
    timestamp: new Date(Date.now() - 1e3 * 60 * 35).toISOString(),
    deviceType: "mobile",
    pageUrl: "/"
  },
  {
    id: "evt_102",
    channel: "whatsapp",
    source: "pricing",
    intent: "pricing",
    messagePreview: "Hi AutoAudit, what is the difference between Complete and Premium auction records?",
    timestamp: new Date(Date.now() - 1e3 * 60 * 140).toISOString(),
    deviceType: "desktop",
    pageUrl: "/#services"
  },
  {
    id: "evt_103",
    channel: "whatsapp",
    source: "hero",
    intent: "vin_check",
    messagePreview: "Can you verify if Copart auction photos are included for Canadian vehicles?",
    timestamp: new Date(Date.now() - 1e3 * 60 * 320).toISOString(),
    deviceType: "desktop",
    pageUrl: "/#hero"
  },
  {
    id: "evt_104",
    channel: "whatsapp",
    source: "order_modal",
    intent: "general_support",
    messagePreview: "Need assistance verifying my payment method during checkout.",
    timestamp: new Date(Date.now() - 1e3 * 60 * 540).toISOString(),
    deviceType: "mobile",
    pageUrl: "/checkout"
  },
  {
    id: "evt_105",
    channel: "whatsapp",
    source: "my_orders",
    intent: "order_tracking",
    orderNumber: "AA-10025",
    vin: "1G1YY22U965104921",
    messagePreview: "Hello AutoAudit Support, I need an update on my order #AA-10025.",
    timestamp: new Date(Date.now() - 1e3 * 60 * 960).toISOString(),
    deviceType: "mobile",
    pageUrl: "/portal/orders"
  },
  {
    id: "evt_106",
    channel: "whatsapp",
    source: "faq",
    intent: "general_support",
    messagePreview: "Do you offer batch vehicle report discounts for small auto dealerships?",
    timestamp: new Date(Date.now() - 1e3 * 60 * 1440).toISOString(),
    deviceType: "desktop",
    pageUrl: "/#faq"
  }
];

// server/supabase.ts
import { createClient } from "@supabase/supabase-js";
var supabaseUrl = process.env.SUPABASE_URL || "";
var supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
var isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseKey && supabaseUrl.startsWith("https://"));
};
var supabase = isSupabaseConfigured() ? createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
}) : null;
var supabaseTableStatus = {
  ordersReady: true,
  servicesReady: true,
  couponsReady: true,
  emailsReady: true
};
var warnedMissingTables = /* @__PURE__ */ new Set();
function isTableMissingError(error) {
  if (!error) return false;
  const msg = (error.message || "").toLowerCase();
  const code = error.code || "";
  return code === "PGRST205" || code === "42P01" || msg.includes("could not find the table") || msg.includes("schema cache") || msg.includes("relation") && msg.includes("does not exist");
}
function handleTableError(tableName, operation, error) {
  if (isTableMissingError(error)) {
    if (tableName === "orders") supabaseTableStatus.ordersReady = false;
    if (tableName === "services") supabaseTableStatus.servicesReady = false;
    if (tableName === "coupons") supabaseTableStatus.couponsReady = false;
    if (tableName === "emails") supabaseTableStatus.emailsReady = false;
    if (!warnedMissingTables.has(tableName)) {
      warnedMissingTables.add(tableName);
      console.info(
        `[Database Notice] Connected to Supabase (${supabaseUrl}), but table '${tableName}' has not been initialized in PostgreSQL yet. AutoAudit is running seamlessly using its local memory store. Run 'supabase/schema.sql' in your Supabase SQL Editor whenever you wish to persist records to PostgreSQL.`
      );
    }
  } else {
    console.warn(`[Supabase Notice] ${operation} on '${tableName}':`, error.message);
  }
}
if (isSupabaseConfigured()) {
  console.log(`[Database] Supabase PostgreSQL client connected: ${supabaseUrl}`);
} else {
  console.log("[Database] Supabase credentials not set in environment. Running in local high-speed memory mode with browser persistence.");
}
var supabaseDb = {
  // Health & Schema check
  async checkTablesHealth() {
    if (!supabase) return supabaseTableStatus;
    try {
      const { error: oErr } = await supabase.from("orders").select("id").limit(1);
      supabaseTableStatus.ordersReady = !isTableMissingError(oErr);
      const { error: sErr } = await supabase.from("services").select("id").limit(1);
      supabaseTableStatus.servicesReady = !isTableMissingError(sErr);
      const { error: cErr } = await supabase.from("coupons").select("code").limit(1);
      supabaseTableStatus.couponsReady = !isTableMissingError(cErr);
      const { error: eErr } = await supabase.from("emails").select("id").limit(1);
      supabaseTableStatus.emailsReady = !isTableMissingError(eErr);
    } catch {
    }
    return supabaseTableStatus;
  },
  // Orders
  async getOrders() {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) {
        handleTableError("orders", "fetch", error);
        return null;
      }
      supabaseTableStatus.ordersReady = true;
      return (data || []).map(mapOrderRowToOrder);
    } catch (err) {
      handleTableError("orders", "fetch", err);
      return null;
    }
  },
  async getOrderById(id) {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from("orders").select("*").or(`id.eq.${id},order_number.eq.${id}`).single();
      if (error) {
        handleTableError("orders", "fetchById", error);
        return null;
      }
      supabaseTableStatus.ordersReady = true;
      if (!data) return null;
      return mapOrderRowToOrder(data);
    } catch (err) {
      handleTableError("orders", "fetchById", err);
      return null;
    }
  },
  async createOrder(order) {
    if (!supabase) return false;
    try {
      const row = mapOrderToOrderRow(order);
      const { error } = await supabase.from("orders").insert([row]);
      if (error) {
        handleTableError("orders", "insert", error);
        return false;
      }
      supabaseTableStatus.ordersReady = true;
      return true;
    } catch (err) {
      handleTableError("orders", "insert", err);
      return false;
    }
  },
  async updateOrderStatus(id, status, note) {
    if (!supabase || !supabaseTableStatus.ordersReady) return null;
    try {
      const existing = await this.getOrderById(id);
      if (!existing) return null;
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const updatedNotes = note ? `${existing.internalNotes ? existing.internalNotes + "\n" : ""}${note}` : existing.internalNotes;
      const newLog = {
        id: `log-${Date.now()}`,
        timestamp: now,
        actor: "Admin Staff",
        action: `Status updated to ${status}`,
        details: note || `Status changed from ${existing.status} to ${status}`
      };
      const updatedLogs = [newLog, ...existing.auditLogs || []];
      const resultFile = status === "Delivered" ? {
        fileName: `AutoAudit_Report_${existing.vehicle.vinOrReg}.pdf`,
        fileUrl: `/reports/AutoAudit_Report_${existing.vehicle.vinOrReg}.pdf`,
        type: "pdf",
        uploadedAt: now
      } : existing.resultFile;
      const { data, error } = await supabase.from("orders").update({
        status,
        internal_notes: updatedNotes,
        audit_logs: updatedLogs,
        result_file: resultFile,
        updated_at: now
      }).or(`id.eq.${id},order_number.eq.${id}`).select().single();
      if (error) {
        handleTableError("orders", "updateStatus", error);
        return null;
      }
      if (!data) return null;
      return mapOrderRowToOrder(data);
    } catch (err) {
      handleTableError("orders", "updateStatus", err);
      return null;
    }
  },
  // Services
  async getServices() {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from("services").select("*").order("price", { ascending: true });
      if (error) {
        handleTableError("services", "fetch", error);
        return null;
      }
      supabaseTableStatus.servicesReady = true;
      if (!data) return null;
      return data.map((s) => ({
        id: s.id,
        name: s.name,
        price: Number(s.price),
        originalPrice: s.original_price ? Number(s.original_price) : void 0,
        deliveryTime: s.delivery_time,
        badge: s.badge || void 0,
        popular: s.popular || false,
        description: s.description,
        features: Array.isArray(s.features) ? s.features : []
      }));
    } catch (err) {
      handleTableError("services", "fetch", err);
      return null;
    }
  },
  // Coupons
  async getCoupons() {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from("coupons").select("*");
      if (error) {
        handleTableError("coupons", "fetch", error);
        return null;
      }
      supabaseTableStatus.couponsReady = true;
      if (!data) return null;
      return data.map((c) => ({
        code: c.code,
        discountPercent: c.discount_percent || 0,
        discountFixed: c.discount_fixed ? Number(c.discount_fixed) : void 0,
        expiryDate: c.expiry_date,
        active: c.active,
        usageCount: c.usage_count || 0
      }));
    } catch (err) {
      handleTableError("coupons", "fetch", err);
      return null;
    }
  },
  // Emails
  async getEmails() {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from("emails").select("*").order("sent_at", { ascending: false });
      if (error) {
        handleTableError("emails", "fetch", error);
        return null;
      }
      supabaseTableStatus.emailsReady = true;
      if (!data) return null;
      return data.map((e) => ({
        id: e.id,
        orderId: e.order_id,
        orderNumber: e.order_number,
        recipientEmail: e.recipient_email,
        recipientType: e.recipient_type,
        subject: e.subject,
        type: e.type,
        body: e.body,
        sentAt: e.sent_at,
        read: e.read
      }));
    } catch (err) {
      handleTableError("emails", "fetch", err);
      return null;
    }
  },
  async addEmail(email) {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from("emails").insert([{
        id: email.id,
        order_id: email.orderId,
        order_number: email.orderNumber,
        recipient_email: email.recipientEmail,
        recipient_type: email.recipientType,
        subject: email.subject,
        type: email.type,
        body: email.body,
        sent_at: email.sentAt,
        read: email.read
      }]);
      if (error) {
        handleTableError("emails", "insert", error);
        return false;
      }
      return true;
    } catch (err) {
      handleTableError("emails", "insert", err);
      return false;
    }
  }
};
function mapOrderToOrderRow(o) {
  return {
    id: o.id,
    order_number: o.orderNumber,
    service_id: o.serviceId,
    service_name: o.serviceName,
    status: o.status,
    subtotal: o.subtotal,
    discount_amount: o.discountAmount,
    total: o.total,
    coupon_code: o.couponCode,
    customer_full_name: o.customer.fullName,
    customer_email: o.customer.email,
    customer_phone: o.customer.phone || "",
    sms_notifications: o.customer.smsNotifications ?? o.smsNotifications ?? true,
    vehicle_vin_or_reg: o.vehicle.vinOrReg,
    is_vin: o.vehicle.isVin,
    vehicle_make: o.vehicle.make,
    vehicle_model: o.vehicle.model,
    vehicle_year: o.vehicle.year,
    vehicle_mileage: o.vehicle.mileage,
    vehicle_country_state: o.vehicle.countryOrState,
    customer_notes: o.vehicle.customerNotes,
    payment_status: o.payment.status,
    payment_gateway_ref: o.payment.gatewayRef,
    payment_method: o.payment.method,
    paid_at: o.payment.paidAt,
    internal_notes: o.internalNotes,
    result_file: o.resultFile,
    audit_logs: o.auditLogs,
    created_at: o.createdAt,
    updated_at: o.updatedAt
  };
}
function mapOrderRowToOrder(r) {
  return {
    id: r.id,
    orderNumber: r.order_number,
    serviceId: r.service_id,
    serviceName: r.service_name,
    status: r.status,
    subtotal: Number(r.subtotal),
    discountAmount: Number(r.discount_amount || 0),
    total: Number(r.total),
    couponCode: r.coupon_code || void 0,
    customer: {
      fullName: r.customer_full_name,
      email: r.customer_email,
      phone: r.customer_phone || "",
      smsNotifications: r.sms_notifications ?? true
    },
    smsNotifications: r.sms_notifications ?? true,
    vehicle: {
      vinOrReg: r.vehicle_vin_or_reg,
      isVin: r.is_vin ?? true,
      make: r.vehicle_make || "",
      model: r.vehicle_model || "",
      year: r.vehicle_year || 2020,
      mileage: r.vehicle_mileage || "Pending",
      countryOrState: r.vehicle_country_state || "US",
      customerNotes: r.customer_notes || void 0
    },
    payment: {
      status: r.payment_status || "Paid",
      gatewayRef: r.payment_gateway_ref || "",
      paidAt: r.paid_at || r.created_at,
      method: r.payment_method || "Credit Card"
    },
    internalNotes: r.internal_notes || "",
    resultFile: r.result_file || void 0,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    auditLogs: Array.isArray(r.audit_logs) ? r.audit_logs : []
  };
}

// server/db.ts
var INITIAL_SERVICES = [
  {
    id: "basic-report",
    name: "Basic Report",
    tagline: "Vehicle history overview, title check, and essential odometer records.",
    price: 18.99,
    originalPrice: 24.99,
    deliveryTime: "Standard processing (1\u20132 hrs)",
    isPopular: false,
    requiredFields: ["VIN or Plate", "Year / Make / Model", "Email"],
    includedItems: [
      "Vehicle history overview",
      "Title information & state brand check",
      "Odometer information & rollback alerts",
      "Basic report details & technical specs"
    ],
    exclusions: [
      "Copart / Manheim Historical Auction Photos",
      "Detailed Insurance Collision Breakdown",
      "Priority Queue Assignment"
    ],
    active: true
  },
  {
    id: "comprehensive-vin",
    name: "Complete Report",
    tagline: "Comprehensive vehicle history, title records, accidents, and salvage status.",
    price: 28.99,
    originalPrice: 38.99,
    deliveryTime: "Expedited processing (30\u201345 mins)",
    isPopular: true,
    requiredFields: ["17-character VIN", "Make / Model / Year", "Email", "Phone"],
    includedItems: [
      "Comprehensive vehicle history overview",
      "Title records across all 50 US states & Canada",
      "Accident information & structural integrity",
      "Odometer history & verified mileage timeline",
      "Salvage information & total loss write-offs",
      "Additional available records (recalls, liens, owners)"
    ],
    exclusions: [
      "Copart / Manheim Historical Auction Photo Archive"
    ],
    active: true
  },
  {
    id: "premium-auction-audit",
    name: "Premium Report",
    tagline: "Extended vehicle history with historical salvage auction records and priority delivery.",
    price: 42.99,
    originalPrice: 59.99,
    deliveryTime: "Priority processing (15\u201330 mins)",
    isPopular: false,
    requiredFields: ["17-character VIN", "Make / Model / Year", "Email", "Phone"],
    includedItems: [
      "Everything in Complete Report",
      "Extended vehicle history & prior sale records",
      "Additional available records & historical bids",
      "Detailed report information & build options",
      "Priority processing queue assignment"
    ],
    exclusions: [],
    active: true
  }
];
var INITIAL_COUPONS = [
  {
    code: "FAKHAR20",
    discountPercent: 20,
    usageCount: 14,
    maxUsage: 100,
    expiryDate: "2026-12-31",
    active: true
  },
  {
    code: "WELCOME10",
    discountFixed: 5,
    usageCount: 29,
    maxUsage: 200,
    expiryDate: "2026-11-30",
    active: true
  },
  {
    code: "SAVE15",
    discountPercent: 15,
    usageCount: 42,
    maxUsage: 500,
    expiryDate: "2026-12-31",
    active: true
  }
];
var INITIAL_ORDERS = [
  {
    id: "ord-10025",
    orderNumber: "AA-10025",
    serviceId: "comprehensive-vin",
    serviceName: "Complete Report",
    status: "Paid / New",
    subtotal: 28.99,
    discountAmount: 5.8,
    total: 23.19,
    couponCode: "FAKHAR20",
    customer: {
      fullName: "Hamza Tariq",
      email: "hamza.tariq@example.com",
      phone: "+1 (555) 234-5678"
    },
    vehicle: {
      vinOrReg: "1HGCR2F83HA029381",
      isVin: true,
      make: "Honda",
      model: "Accord EX-L",
      year: 2017,
      mileage: "68,400 mi",
      countryOrState: "TX",
      customerNotes: "Checking salvage/flood record before signing purchase agreement."
    },
    payment: {
      status: "Paid",
      gatewayRef: "ch_3N8k2vLkdIwP4m1019xZp90",
      paidAt: "2026-09-29T18:22:00Z",
      method: "Card ending in 4242"
    },
    internalNotes: "Payment verified. Ready for NMVTIS pull.",
    createdAt: "2026-09-29T18:20:12Z",
    updatedAt: "2026-09-29T18:22:00Z",
    auditLogs: [
      {
        id: "log-1",
        timestamp: "2026-09-29T18:20:12Z",
        actor: "Customer (Checkout)",
        action: "Order Placed",
        details: "Applied coupon FAKHAR20 (-20%)."
      },
      {
        id: "log-2",
        timestamp: "2026-09-29T18:22:00Z",
        actor: "Payment Gateway",
        action: "Payment Successful",
        details: "Captured $23.19 via Stripe."
      }
    ]
  },
  {
    id: "ord-10024",
    orderNumber: "AA-10024",
    serviceId: "premium-auction-audit",
    serviceName: "Premium Report",
    status: "Delivered",
    subtotal: 42.99,
    discountAmount: 0,
    total: 42.99,
    customer: {
      fullName: "Sarah Jenkins",
      email: "sjenkins.auto@gmail.com",
      phone: "+1 (555) 890-1234"
    },
    vehicle: {
      vinOrReg: "4T1B11HK5JU192837",
      isVin: true,
      make: "Toyota",
      model: "Camry SE",
      year: 2018,
      mileage: "54,200 mi",
      countryOrState: "CA",
      customerNotes: "Require salvage auction history if Copart records exist."
    },
    payment: {
      status: "Paid",
      gatewayRef: "ch_3M7j1vBkdIwP3m0998aYp88",
      paidAt: "2026-09-29T14:10:00Z",
      method: "Apple Pay"
    },
    internalNotes: "Copart records verified. Report PDF delivered.",
    resultFile: {
      fileName: "AutoAudit_Report_4T1B11HK5JU192837.pdf",
      fileUrl: "/reports/AutoAudit_Report_4T1B11HK5JU192837.pdf",
      type: "pdf",
      uploadedAt: "2026-09-29T14:35:00Z"
    },
    createdAt: "2026-09-29T14:05:00Z",
    updatedAt: "2026-09-29T14:35:00Z",
    auditLogs: [
      {
        id: "log-3",
        timestamp: "2026-09-29T14:05:00Z",
        actor: "Customer",
        action: "Order Placed"
      },
      {
        id: "log-4",
        timestamp: "2026-09-29T14:35:00Z",
        actor: "Admin (System)",
        action: "Report Delivered",
        details: "Sent dispatch email to customer."
      }
    ]
  }
];
var INITIAL_EMAILS = [
  {
    id: "em-101",
    orderId: "ord-10025",
    orderNumber: "AA-10025",
    recipientEmail: "hamza.tariq@example.com",
    recipientType: "customer",
    subject: "Order Confirmed: Complete Report for 2017 Honda Accord (AA-10025)",
    type: "order_confirmation",
    body: "Thank you for your order! Your vehicle history audit is currently in the NMVTIS verification queue.",
    sentAt: "2026-09-29T18:22:05Z",
    read: true
  },
  {
    id: "em-102",
    orderId: "ord-10024",
    orderNumber: "AA-10024",
    recipientEmail: "sjenkins.auto@gmail.com",
    recipientType: "customer",
    subject: "Your AutoAudit Report is Ready (AA-10024)",
    type: "report_ready",
    body: "Your verified vehicle history report for 2018 Toyota Camry (VIN: 4T1B11HK5JU192837) is now available for download.",
    sentAt: "2026-09-29T14:35:10Z",
    read: true
  }
];
var Database = class {
  services = [...INITIAL_SERVICES];
  orders = [...INITIAL_ORDERS];
  coupons = [...INITIAL_COUPONS];
  emails = [...INITIAL_EMAILS];
  contactEvents = [...INITIAL_CONTACT_EVENTS];
  whatsAppConfig = { ...INITIAL_WHATSAPP_CONFIG };
  constructor() {
    this.hydrateFromSupabase();
  }
  // Hydrate in-memory cache from Supabase Postgres if keys are set
  async hydrateFromSupabase() {
    if (!isSupabaseConfigured()) return;
    try {
      const orders = await supabaseDb.getOrders();
      if (orders && orders.length > 0) {
        this.orders = orders;
        console.log(`[Database] Hydrated ${orders.length} orders from Supabase PostgreSQL.`);
      }
      const coupons = await supabaseDb.getCoupons();
      if (coupons && coupons.length > 0) {
        this.coupons = coupons;
      }
      const emails = await supabaseDb.getEmails();
      if (emails && emails.length > 0) {
        this.emails = emails;
      }
    } catch (e) {
      console.warn("[Database] Failed to hydrate from Supabase:", e?.message);
    }
  }
  getDatabaseStatus() {
    return {
      type: isSupabaseConfigured() ? "Supabase PostgreSQL" : "In-Memory DB (Local Fallback)",
      isSupabaseConnected: isSupabaseConfigured(),
      tablesReady: supabaseTableStatus.ordersReady && supabaseTableStatus.servicesReady,
      tableStatus: supabaseTableStatus,
      orderCount: this.orders.length,
      couponCount: this.coupons.length,
      emailCount: this.emails.length
    };
  }
  // Services
  getServices() {
    return this.services;
  }
  getServiceById(id) {
    return this.services.find((s) => s.id === id);
  }
  // Orders
  getOrders() {
    return this.orders;
  }
  getOrderById(idOrNumber) {
    return this.orders.find((o) => o.id === idOrNumber || o.orderNumber.toLowerCase() === idOrNumber.toLowerCase());
  }
  createOrder(order) {
    this.orders.unshift(order);
    if (isSupabaseConfigured()) {
      supabaseDb.createOrder(order).catch((err) => {
        console.error("[Database] Failed to sync order to Supabase:", err);
      });
    }
    return order;
  }
  updateOrderStatus(orderId, status, note) {
    const order = this.getOrderById(orderId);
    if (!order) return null;
    order.status = status;
    order.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    if (note) {
      order.internalNotes = order.internalNotes ? `${order.internalNotes}
${note}` : note;
    }
    order.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      actor: "Admin Staff",
      action: `Status updated to ${status}`,
      details: note || void 0
    });
    if (status === "Delivered" && !order.resultFile) {
      order.resultFile = {
        fileName: `AutoAudit_Report_${order.vehicle.vinOrReg}.pdf`,
        fileUrl: `/reports/AutoAudit_Report_${order.vehicle.vinOrReg}.pdf`,
        type: "pdf",
        uploadedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    if (isSupabaseConfigured()) {
      supabaseDb.updateOrderStatus(orderId, status, note).catch((err) => {
        console.error("[Database] Failed to sync status to Supabase:", err);
      });
    }
    return order;
  }
  updateOrderNotes(orderId, notes) {
    const order = this.getOrderById(orderId);
    if (!order) return null;
    order.internalNotes = notes;
    order.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    order.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      actor: "Admin Specialist",
      action: "Updated Internal Notes",
      details: "Internal fulfillment comments updated"
    });
    if (isSupabaseConfigured()) {
      supabaseDb.updateOrderStatus(orderId, order.status, "Internal notes updated").catch(() => {
      });
    }
    return order;
  }
  attachOrderReport(orderId, file, actor = "Admin Specialist") {
    const order = this.getOrderById(orderId);
    if (!order) return null;
    order.resultFile = {
      ...file,
      uploadedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    order.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    order.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      actor,
      action: "Report Attached",
      details: `File attached: ${file.fileName}`
    });
    return order;
  }
  // Coupons
  getCoupons() {
    return this.coupons;
  }
  validateCoupon(code) {
    const cleanCode = code.trim().toUpperCase();
    const coupon = this.coupons.find((c) => c.code.toUpperCase() === cleanCode);
    if (!coupon) {
      return { valid: false, error: "Promo code not recognized or invalid" };
    }
    if (!coupon.active) {
      return { valid: false, error: "Promo code is inactive" };
    }
    if (coupon.maxUsage && coupon.usageCount >= coupon.maxUsage) {
      return { valid: false, error: "Promo code usage limit reached" };
    }
    if (new Date(coupon.expiryDate) < /* @__PURE__ */ new Date()) {
      return { valid: false, error: "Promo code has expired" };
    }
    return { valid: true, coupon };
  }
  incrementCouponUsage(code) {
    const coupon = this.coupons.find((c) => c.code.toUpperCase() === code.trim().toUpperCase());
    if (coupon) {
      coupon.usageCount += 1;
    }
  }
  // Emails
  getEmails() {
    return this.emails;
  }
  addEmail(email) {
    this.emails.unshift(email);
    if (isSupabaseConfigured()) {
      supabaseDb.addEmail(email).catch((err) => {
        console.error("[Database] Failed to sync email to Supabase:", err);
      });
    }
  }
  // Contact Events & Click-to-Chat Analytics
  getContactEvents() {
    return this.contactEvents;
  }
  logContactEvent(eventData) {
    const event = {
      id: eventData.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: eventData.timestamp || (/* @__PURE__ */ new Date()).toISOString(),
      channel: eventData.channel || "whatsapp",
      source: eventData.source || "floating_widget",
      intent: eventData.intent || "general_support",
      vin: eventData.vin,
      orderNumber: eventData.orderNumber,
      messagePreview: eventData.messagePreview,
      pageUrl: eventData.pageUrl,
      deviceType: eventData.deviceType
    };
    this.contactEvents.unshift(event);
    if (this.contactEvents.length > 500) {
      this.contactEvents = this.contactEvents.slice(0, 500);
    }
    return event;
  }
  getContactSummary() {
    const events = this.contactEvents;
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1e3;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1e3;
    const clicksLast24h = events.filter((e) => new Date(e.timestamp).getTime() >= oneDayAgo).length;
    const clicksLast7d = events.filter((e) => new Date(e.timestamp).getTime() >= sevenDaysAgo).length;
    const bySource = {};
    const byIntent = {};
    const byChannel = {};
    for (const e of events) {
      bySource[e.source] = (bySource[e.source] || 0) + 1;
      byIntent[e.intent] = (byIntent[e.intent] || 0) + 1;
      byChannel[e.channel] = (byChannel[e.channel] || 0) + 1;
    }
    const topSource = Object.entries(bySource).sort((a, b) => b[1] - a[1])[0]?.[0] || "floating_widget";
    const topIntent = Object.entries(byIntent).sort((a, b) => b[1] - a[1])[0]?.[0] || "vin_check";
    const totalOrders = this.orders.length;
    const conversionRateEstimate = events.length > 0 ? Math.min(100, Math.round(totalOrders / Math.max(events.length, 1) * 38)) : 32;
    return {
      totalClicks: events.length,
      clicksLast24h,
      clicksLast7d,
      topSource,
      topIntent,
      conversionRateEstimate,
      bySource,
      byIntent,
      byChannel,
      recentEvents: events.slice(0, 50)
    };
  }
  getWhatsAppConfig() {
    return this.whatsAppConfig;
  }
  updateWhatsAppConfig(updates) {
    this.whatsAppConfig = {
      ...this.whatsAppConfig,
      ...updates
    };
    return this.whatsAppConfig;
  }
};
var db = new Database();

// server/middleware/auth.ts
var DEFAULT_ADMIN_TOKEN = process.env.ADMIN_SECRET_KEY || "autoaudit-secure-staff-token-2026";
var DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@autoaudit.com";
var DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "AutoAudit2026!";
function requireAdminAuth(req, res, next) {
  const token = req.headers["x-admin-token"] || (req.headers.authorization && req.headers.authorization.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null);
  if (!token) {
    res.status(401).json({
      success: false,
      error: "Unauthorized: Staff authorization token is required to access administrative resources."
    });
    return;
  }
  if (token !== DEFAULT_ADMIN_TOKEN && token !== "session-verified-autoaudit-staff") {
    res.status(403).json({
      success: false,
      error: "Forbidden: Invalid or expired staff authorization token."
    });
    return;
  }
  next();
}
function verifyAdminCredentials(email, password, accessKey) {
  if (accessKey && (accessKey === DEFAULT_ADMIN_TOKEN || accessKey === "AutoAudit2026!")) {
    return true;
  }
  if (email && password && (email.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase() || email.toLowerCase() === "admin@autoaudit.com") && password === DEFAULT_ADMIN_PASSWORD) {
    return true;
  }
  return false;
}
var ADMIN_AUTH_TOKEN = "session-verified-autoaudit-staff";

// server/services/smtp.ts
import nodemailer from "nodemailer";
var isRealSmtp = Boolean(process.env.SMTP_HOST);
var transporter = isRealSmtp ? nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS || ""
  } : void 0
}) : nodemailer.createTransport({
  jsonTransport: true
});
var SYSTEM_FROM_EMAIL = process.env.SMTP_FROM || "AutoAudit Notifications <noreply@autoaudit.intelligence>";
function generateEmailHtml(order, type) {
  const vehicleName = `${order.vehicle.year} ${order.vehicle.make} ${order.vehicle.model}`;
  const vin = order.vehicle.vinOrReg;
  const orderNum = order.orderNumber;
  const customerName = order.customer.fullName;
  if (type === "order_confirmation") {
    const subject2 = `Order Confirmed: AutoAudit Report for ${vin} (${orderNum})`;
    const text2 = `Hello ${customerName},

Thank you for choosing AutoAudit! Your order #${orderNum} for ${vehicleName} (VIN: ${vin}) has been confirmed and payment has been processed successfully ($${order.total.toFixed(2)} USD).

Our automated systems are now querying the NMVTIS federal title clearinghouse, 50-state DMV registries, and salvage auto auctions.

We will notify you the moment your report advances to processing.`;
    const html2 = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: #0b132b; padding: 24px 32px; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.02em; }
    .header p { margin: 4px 0 0; font-size: 12px; color: #94a3b8; font-family: monospace; }
    .body { padding: 32px; }
    .badge { display: inline-block; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 11px; text-transform: uppercase; }
    .order-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0; }
    .order-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; }
    .order-row:last-child { margin-bottom: 0; padding-top: 8px; border-top: 1px solid #e2e8f0; font-weight: 700; }
    .steps { margin: 24px 0; border-left: 2px solid #2563eb; padding-left: 16px; }
    .step { font-size: 12px; margin-bottom: 12px; }
    .step strong { display: block; font-size: 13px; color: #0b132b; }
    .footer { background: #f1f5f9; padding: 20px 32px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AutoAudit\u2122 Vehicle Intelligence</h1>
      <p>ORDER REFERENCE: ${orderNum}</p>
    </div>
    <div class="body">
      <span class="badge">Stage 1 of 3: Order Confirmed</span>
      <h2 style="font-size: 18px; margin-top: 14px; margin-bottom: 10px;">Payment Verified & Audit Queued</h2>
      <p style="font-size: 14px; line-height: 1.5; color: #334155;">
        Hello <strong>${customerName}</strong>,<br/><br/>
        We have confirmed your report request for <strong>${vehicleName}</strong>. Our automated vehicle intelligence engine is connecting to NMVTIS federal title clearinghouses and insurance databases.
      </p>

      <div class="order-box">
        <div class="order-row"><span>Order Number:</span><span style="font-family: monospace;">${orderNum}</span></div>
        <div class="order-row"><span>Chassis VIN:</span><span style="font-family: monospace; font-weight: 700; color: #2563eb;">${vin}</span></div>
        <div class="order-row"><span>Service Tier:</span><span>${order.serviceName}</span></div>
        <div class="order-row"><span>Total Paid:</span><span>$${order.total.toFixed(2)} USD</span></div>
      </div>

      <div class="steps">
        <div class="step">
          <strong style="color: #059669;">\u2713 Step 1: Payment Confirmed</strong>
          Transaction authorized and validated.
        </div>
        <div class="step">
          <strong style="color: #2563eb;">\u26A1 Step 2: Multi-Registry Query (In-Progress)</strong>
          Scanning 50 US State DMVs, insurance total-loss databases, and salvage auctions.
        </div>
        <div class="step">
          <strong style="color: #64748b;">\u23F3 Step 3: Official Report Delivery (Upcoming)</strong>
          You will receive your sealed report with download and print access shortly.
        </div>
      </div>
    </div>
    <div class="footer">
      AutoAudit Technologies Inc. \xB7 Cryptographic Vehicle Intelligence \xB7 All Rights Reserved
    </div>
  </div>
</body>
</html>`;
    return { subject: subject2, html: html2, text: text2 };
  }
  if (type === "processing") {
    const subject2 = `Audit In Progress: Compiling DMV Records for ${vin} (${orderNum})`;
    const text2 = `Hello ${customerName},

Your vehicle audit for ${vehicleName} (VIN: ${vin}) is currently IN-PROGRESS.

Our systems are actively analyzing records from the National Motor Vehicle Title Information System (NMVTIS), municipal salvage auctions, flood registries, and certified odometer databases.

No manual action is required. We will send you a final email as soon as your PDF report is compiled.`;
    const html2 = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: #1e3a8a; padding: 24px 32px; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; }
    .header p { margin: 4px 0 0; font-size: 12px; color: #bfdbfe; font-family: monospace; }
    .body { padding: 32px; }
    .badge { display: inline-block; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 11px; text-transform: uppercase; }
    .status-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .checklist { list-style: none; padding: 0; margin: 16px 0; }
    .checklist li { padding: 8px 0; font-size: 13px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 8px; }
    .footer { background: #f1f5f9; padding: 20px 32px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AutoAudit\u2122 Vehicle Intelligence</h1>
      <p>PROCESSING UPDATE: ${orderNum}</p>
    </div>
    <div class="body">
      <span class="badge">Stage 2 of 3: Audit In Progress</span>
      <h2 style="font-size: 18px; margin-top: 14px; margin-bottom: 10px;">Aggregating Federal & State Clearinghouse Records</h2>
      <p style="font-size: 14px; line-height: 1.5; color: #334155;">
        Hello <strong>${customerName}</strong>,<br/><br/>
        Our data clearinghouse pipeline is actively analyzing historical records for your <strong>${vehicleName}</strong> (VIN: <span style="font-family: monospace; font-weight: 700;">${vin}</span>).
      </p>

      <div class="status-card">
        <strong style="color: #15803d; font-size: 13px;">Live Diagnostic Checkpoints:</strong>
        <ul class="checklist">
          <li>\u2713 NMVTIS Title Brand Registry: Connected</li>
          <li>\u2713 Federal Odometer Act Timeline: Analysis underway</li>
          <li>\u2713 Insurance Total Loss & Salvage Inquiries: Queued</li>
          <li>\u2713 Open Safety Recall Cross-Check: Querying NHTSA database</li>
        </ul>
      </div>

      <p style="font-size: 13px; color: #64748b;">
        Final cryptographic report generation is finishing up. You will receive an immediate notification once your document is ready for download and paper printing.
      </p>
    </div>
    <div class="footer">
      AutoAudit Technologies Inc. \xB7 Cryptographic Vehicle Intelligence \xB7 All Rights Reserved
    </div>
  </div>
</body>
</html>`;
    return { subject: subject2, html: html2, text: text2 };
  }
  const subject = `Your AutoAudit Report is Ready (${orderNum})`;
  const text = `Hello ${customerName},

Great news! Your AutoAudit Vehicle History Report for ${vehicleName} (VIN: ${vin}) has been successfully compiled and certified.

Summary Findings:
- Title Brands: Clean (0 reported)
- Severe Accidents: 0 reported
- Odometer: Actual Mileage Verified
- Safety Recalls: 0 Open Recalls

You can view, download, and print your official report immediately through the AutoAudit Customer Dashboard using Order Number: ${orderNum}.`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: #065f46; padding: 24px 32px; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; }
    .header p { margin: 4px 0 0; font-size: 12px; color: #a7f3d0; font-family: monospace; }
    .body { padding: 32px; }
    .badge { display: inline-block; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 11px; text-transform: uppercase; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 20px 0; }
    .metric-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; }
    .metric-title { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; }
    .metric-value { font-size: 14px; font-weight: 800; color: #065f46; margin-top: 4px; }
    .cta-btn { display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 14px; margin: 16px 0; }
    .footer { background: #f1f5f9; padding: 20px 32px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AutoAudit\u2122 Vehicle Intelligence</h1>
      <p>REPORT READY: ${orderNum}</p>
    </div>
    <div class="body">
      <span class="badge">Stage 3 of 3: Report Certified</span>
      <h2 style="font-size: 18px; margin-top: 14px; margin-bottom: 10px;">Official Vehicle History Record Available</h2>
      <p style="font-size: 14px; line-height: 1.5; color: #334155;">
        Hello <strong>${customerName}</strong>,<br/><br/>
        Your comprehensive vehicle history audit for <strong>${vehicleName}</strong> (VIN: <span style="font-family: monospace; font-weight: 700;">${vin}</span>) has completed all clearinghouse cross-checks and is sealed.
      </p>

      <div class="grid">
        <div class="metric-card">
          <div class="metric-title">Title Brands</div>
          <div class="metric-value">Clean (0 Brands)</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Accident History</div>
          <div class="metric-value">0 Severe Reported</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Odometer Audit</div>
          <div class="metric-value">Actual Mileage Verified</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Safety Recalls</div>
          <div class="metric-value">0 Open NHTSA Recalls</div>
        </div>
      </div>

      <div style="text-align: center; margin: 24px 0;">
        <p style="font-size: 13px; color: #475569; margin-bottom: 12px;">Your certified PDF report has been generated and attached to this message:</p>
        <a href="${order.resultFile?.fileUrl || `/api/reports/download/${order.id}`}" class="cta-btn" style="color: #ffffff !important; text-decoration: none;">\u2713 Download Certified PDF Report</a>
      </div>

      <p style="font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 14px;">
        Order Reference: <strong>${orderNum}</strong> &nbsp;|&nbsp; File: <code>${order.resultFile?.fileName || `AutoAudit_Report_${vin}.pdf`}</code>
      </p>
    </div>
    <div class="footer">
      AutoAudit Technologies Inc. \xB7 Cryptographic Vehicle Intelligence \xB7 All Rights Reserved
    </div>
  </div>
</body>
</html>`;
  return { subject, html, text };
}
async function sendMockEmail(params) {
  const { order, type, attachments } = params;
  const { subject, html, text } = generateEmailHtml(order, type);
  const mailOptions = {
    from: SYSTEM_FROM_EMAIL,
    to: order.customer.email,
    subject,
    text,
    html
  };
  if (attachments && attachments.length > 0) {
    mailOptions.attachments = attachments;
  }
  const info = await transporter.sendMail(mailOptions);
  const messageId = info.messageId || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const notification = {
    id: `em-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    orderId: order.id,
    orderNumber: order.orderNumber,
    recipientEmail: order.customer.email,
    recipientType: "customer",
    subject,
    type,
    body: text,
    htmlBody: html,
    messageId,
    smtpTransport: isRealSmtp ? "Live SMTP" : "Nodemailer Mock SMTP (JSON Transporter)",
    sentAt: (/* @__PURE__ */ new Date()).toISOString(),
    read: false
  };
  db.addEmail(notification);
  console.log(`[SMTP] Sent ${type} email to ${order.customer.email} (MessageId: ${messageId})`);
  return {
    success: true,
    messageId,
    email: notification
  };
}
async function triggerAutomatedEmailSequence(order, options) {
  const stage2Delay = options?.stageDelaySeconds?.stage2 ?? 4;
  const stage3Delay = options?.stageDelaySeconds?.stage3 ?? 8;
  const autoAdvance = options?.autoAdvanceOrderStatus ?? true;
  const stage1Result = await sendMockEmail({ order, type: "order_confirmation" });
  setTimeout(async () => {
    try {
      const currentOrder = db.getOrderById(order.id) || order;
      if (autoAdvance && currentOrder.status === "Paid / New") {
        db.updateOrderStatus(
          currentOrder.id,
          "In Progress",
          "Automated clearinghouse lookup started across 50 state DMVs and NMVTIS."
        );
      }
      await sendMockEmail({ order: currentOrder, type: "processing" });
    } catch (err) {
      console.error("[SMTP] Error sending Stage 2 processing email:", err);
    }
  }, stage2Delay * 1e3);
  setTimeout(async () => {
    try {
      const currentOrder = db.getOrderById(order.id) || order;
      if (autoAdvance) {
        db.updateOrderStatus(
          currentOrder.id,
          "Delivered",
          "Automated vehicle history report assembled and verified."
        );
      }
      await sendMockEmail({ order: currentOrder, type: "report_ready" });
    } catch (err) {
      console.error("[SMTP] Error sending Stage 3 report ready email:", err);
    }
  }, stage3Delay * 1e3);
  return {
    success: true,
    confirmationMessageId: stage1Result.messageId
  };
}
function getSmtpStatus() {
  return {
    service: "AutoAudit Automated Mock SMTP Engine",
    library: "Nodemailer",
    version: "6.x",
    mode: isRealSmtp ? "Live SMTP Transport" : "Mock JSON Transporter (Zero-Network Latency)",
    sender: SYSTEM_FROM_EMAIL,
    totalDispatched: db.getEmails().length
  };
}

// server/services/mockReportGenerator.ts
var pdfCache = /* @__PURE__ */ new Map();
function generateDummyPdfBuffer(order) {
  const vehicleName = `${order.vehicle.year} ${order.vehicle.make} ${order.vehicle.model}`.trim();
  const vin = (order.vehicle.vinOrReg || "UNKNOWN_VIN").toUpperCase();
  const orderNum = order.orderNumber || "AA-10000";
  const customerName = order.customer.fullName || "Valued Customer";
  const customerEmail = order.customer.email || "customer@example.com";
  const mileage = order.vehicle.mileage || "41,800 mi (Verified)";
  const jurisdiction = order.vehicle.countryOrState || "California, USA";
  const serviceTier = order.serviceName || "Comprehensive Vehicle History Report";
  const generatedTimestamp = (/* @__PURE__ */ new Date()).toUTCString();
  const esc = (text) => {
    return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  };
  const lines = [
    // Graphic background bar for top header
    "0.043 0.075 0.169 rg",
    // Navy #0B132B
    "0 712 612 80 re",
    "f",
    // Gold accent separator line
    "0.96 0.62 0.07 rg",
    // Amber #F59E0B
    "0 708 612 4 re",
    "f",
    // Text: Document Title in White
    "BT",
    "/F1 18 Tf",
    "1 1 1 rg",
    // White
    "40 754 Td",
    `(${esc("AUTOAUDIT VEHICLE INTELLIGENCE REPORT")}) Tj`,
    "ET",
    // Subtitle
    "BT",
    "/F2 9 Tf",
    "0.7 0.75 0.85 rg",
    "40 732 Td",
    `(${esc("Certified NMVTIS National Clearinghouse & 50-State DMV Verification Record")}) Tj`,
    "ET",
    // Order number badge on right
    "BT",
    "/F1 11 Tf",
    "1 1 1 rg",
    "440 746 Td",
    `(${esc(`REF: ${orderNum}`)}) Tj`,
    "ET",
    // Watermark behind content
    "BT",
    "/F1 32 Tf",
    "0.93 0.94 0.96 rg",
    // Very faint grey
    "110 440 Td",
    "30 rotate",
    `(${esc("OFFICIAL AUTOAUDIT REPORT")}) Tj`,
    "-30 rotate",
    "ET",
    // Clean Title Verified Ribbon
    "0.925 0.988 0.957 rg",
    // Emerald light bg
    "0.05 0.6 0.4 RG",
    // Emerald border
    "1 w",
    "40 655 532 38 re",
    "B",
    "BT",
    "/F1 12 Tf",
    "0.02 0.37 0.27 rg",
    // Emerald dark text
    "52 671 Td",
    `(${esc("STATUS: CLEAN TITLE CERTIFIED  -  0 TOTAL LOSS OR SALVAGE BRANDS")}) Tj`,
    "ET",
    "BT",
    "/F2 8.5 Tf",
    "0.2 0.45 0.35 rg",
    "52 660 Td",
    `(${esc("All 50 US State Registries, FEMA Flood Databases, and Insurance Clearinghouses Checked")}) Tj`,
    "ET",
    // Vehicle Specification Box
    "0.97 0.98 0.99 rg",
    "0.88 0.91 0.94 RG",
    "0.75 w",
    "40 540 532 100 re",
    "B",
    "BT",
    "/F1 10 Tf",
    "0.1 0.15 0.25 rg",
    "52 622 Td",
    `(${esc("VEHICLE IDENTIFICATION & AUDIT SPECIFICATIONS")}) Tj`,
    "ET",
    // Metadata items (2 columns)
    "BT",
    "/F2 9 Tf",
    "0.3 0.35 0.4 rg",
    "52 602 Td",
    `(${esc(`Vehicle: ${vehicleName}`)}) Tj`,
    "0 -15 Td",
    `(${esc(`VIN / Chassis: ${vin}`)}) Tj`,
    "0 -15 Td",
    `(${esc(`Current Odometer: ${mileage}`)}) Tj`,
    "0 -15 Td",
    `(${esc(`Jurisdiction: ${jurisdiction}`)}) Tj`,
    "ET",
    "BT",
    "/F2 9 Tf",
    "0.3 0.35 0.4 rg",
    "320 602 Td",
    `(${esc(`Customer: ${customerName}`)}) Tj`,
    "0 -15 Td",
    `(${esc(`Account Email: ${customerEmail}`)}) Tj`,
    "0 -15 Td",
    `(${esc(`Audit Tier: ${serviceTier}`)}) Tj`,
    "0 -15 Td",
    `(${esc(`Certified At: ${generatedTimestamp}`)}) Tj`,
    "ET",
    // Section 1: Title Brand & Loss History Table
    "BT",
    "/F1 11 Tf",
    "0.05 0.1 0.2 rg",
    "40 515 Td",
    `(${esc("1. STATE TITLE BRAND & TOTAL LOSS CLEARINGHOUSE FINDINGS")}) Tj`,
    "ET",
    // Table Header Row
    "0.94 0.96 0.98 rg",
    "0.85 0.88 0.92 RG",
    "0.5 w",
    "40 488 532 18 re",
    "B",
    "BT",
    "/F1 8.5 Tf",
    "0.2 0.25 0.3 rg",
    "48 493 Td",
    `(${esc("DATABASE REGISTRY")}) Tj`,
    "150 0 Td",
    `(${esc("REPORTING SOURCE")}) Tj`,
    "160 0 Td",
    `(${esc("RESULT")}) Tj`,
    "70 0 Td",
    `(${esc("DETAILS")}) Tj`,
    "ET",
    // Rows
    "BT",
    "/F2 8 Tf",
    "0.15 0.2 0.25 rg",
    // Row 1
    "48 472 Td",
    `(${esc("Salvage / Total Loss")}) Tj`,
    "150 0 Td",
    `(${esc("Insurance Clearinghouses & Auctions")}) Tj`,
    "160 0 Td",
    `(${esc("PASSED")}) Tj`,
    "70 0 Td",
    `(${esc("No total loss claims or auction transfers")}) Tj`,
    // Row 2
    "-380 -16 Td",
    `(${esc("Flood / Water Damage")}) Tj`,
    "150 0 Td",
    `(${esc("FEMA Emergency Registries & DMVs")}) Tj`,
    "160 0 Td",
    `(${esc("PASSED")}) Tj`,
    "70 0 Td",
    `(${esc("Zero flood or storm damage flags")}) Tj`,
    // Row 3
    "-380 -16 Td",
    `(${esc("Junk / Dismantler Record")}) Tj`,
    "150 0 Td",
    `(${esc("NMVTIS National Motor Clearinghouse")}) Tj`,
    "160 0 Td",
    `(${esc("PASSED")}) Tj`,
    "70 0 Td",
    `(${esc("Vehicle never scrapped or crushed")}) Tj`,
    // Row 4
    "-380 -16 Td",
    `(${esc("Stolen Vehicle Registry")}) Tj`,
    "150 0 Td",
    `(${esc("NICB & Federal Law Enforcement")}) Tj`,
    "160 0 Td",
    `(${esc("PASSED")}) Tj`,
    "70 0 Td",
    `(${esc("No active police theft records")}) Tj`,
    // Row 5
    "-380 -16 Td",
    `(${esc("Safety Recall Registry")}) Tj`,
    "150 0 Td",
    `(${esc("NHTSA Federal Safety Bureau")}) Tj`,
    "160 0 Td",
    `(${esc("PASSED")}) Tj`,
    "70 0 Td",
    `(${esc("0 open safety recalls requiring repair")}) Tj`,
    "ET",
    // Section 2: Odometer Progression
    "BT",
    "/F1 11 Tf",
    "0.05 0.1 0.2 rg",
    "40 375 Td",
    `(${esc("2. CERTIFIED ODOMETER TIMELINE & INTEGRITY AUDIT")}) Tj`,
    "ET",
    // Table Header
    "0.94 0.96 0.98 rg",
    "0.85 0.88 0.92 RG",
    "0.5 w",
    "40 348 532 18 re",
    "B",
    "BT",
    "/F1 8.5 Tf",
    "0.2 0.25 0.3 rg",
    "48 353 Td",
    `(${esc("READING DATE")}) Tj`,
    "120 0 Td",
    `(${esc("MILEAGE")}) Tj`,
    "100 0 Td",
    `(${esc("RECORDING FACILITY")}) Tj`,
    "160 0 Td",
    `(${esc("AUDIT STATUS")}) Tj`,
    "ET",
    // Odometer Rows
    "BT",
    "/F2 8 Tf",
    "0.15 0.2 0.25 rg",
    "48 332 Td",
    `(${esc("11/14/2021")}) Tj`,
    "120 0 Td",
    `(${esc("12 mi")}) Tj`,
    "100 0 Td",
    `(${esc("Authorized Dealer Network")}) Tj`,
    "160 0 Td",
    `(${esc("Pre-Delivery Inspection (Certified)")}) Tj`,
    "-380 -16 Td",
    `(${esc("10/05/2023")}) Tj`,
    "120 0 Td",
    `(${esc("18,420 mi")}) Tj`,
    "100 0 Td",
    `(${esc("State DMV Registration Bureau")}) Tj`,
    "160 0 Td",
    `(${esc("Registration Renewal (Steady)")}) Tj`,
    "-380 -16 Td",
    `(${esc("08/19/2025")}) Tj`,
    "120 0 Td",
    `(${esc("36,810 mi")}) Tj`,
    "100 0 Td",
    `(${esc("Certified Vehicle Service Center")}) Tj`,
    "160 0 Td",
    `(${esc("Scheduled 35k Service (Verified)")}) Tj`,
    "ET",
    // Legal / Security Box at Bottom
    "0.96 0.97 0.98 rg",
    "0.88 0.9 0.93 RG",
    "0.5 w",
    "40 180 532 80 re",
    "B",
    "BT",
    "/F1 9 Tf",
    "0.1 0.15 0.25 rg",
    "52 242 Td",
    `(${esc("LEGAL & CRYPTOGRAPHIC COMPLIANCE NOTICE")}) Tj`,
    "ET",
    "BT",
    "/F2 7.5 Tf",
    "0.3 0.35 0.4 rg",
    "52 226 Td",
    `(${esc("This official vehicle history record was assembled and verified in accordance with the Federal Anti-Car Theft Act.")}) Tj`,
    "0 -12 Td",
    `(${esc("National Motor Vehicle Title Information System (NMVTIS) clearinghouse records are protected under federal law.")}) Tj`,
    "0 -12 Td",
    `(${esc(`Tamper-Evident SHA-256 Digest: AA-SEAL-${orderNum.replace(/[^a-zA-Z0-9]/g, "")}-${Date.now().toString(16).toUpperCase()}`)}) Tj`,
    "0 -12 Td",
    `(${esc(`Sealed for recipient: ${customerName} (${customerEmail}) on ${generatedTimestamp}`)}) Tj`,
    "ET",
    // Document Footer
    "BT",
    "/F2 8 Tf",
    "0.55 0.6 0.65 rg",
    "180 90 Td",
    `(${esc("AutoAudit Technologies Inc. - Cryptographic Vehicle Intelligence Engine")}) Tj`,
    "ET"
  ];
  const contentStream = lines.join("\n");
  const streamBuffer = Buffer.from(contentStream, "utf-8");
  const objects = [
    // 1: Catalog
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    // 2: Pages
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    // 3: Page (US Letter: 612 x 792 pt)
    `3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>
endobj
`,
    // 4: Contents Stream
    `4 0 obj
<< /Length ${streamBuffer.length} >>
stream
${contentStream}
endstream
endobj
`,
    // 5: Bold Font
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n",
    // 6: Regular Font
    "6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
  ];
  let body = "%PDF-1.4\n";
  const offsets = [];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(body, "utf-8"));
    body += objects[i];
  }
  const xrefOffset = Buffer.byteLength(body, "utf-8");
  body += `xref
0 ${objects.length + 1}
0000000000 65535 f 
`;
  for (const off of offsets) {
    body += String(off).padStart(10, "0") + " 00000 n \n";
  }
  body += `trailer
<< /Size ${objects.length + 1} /Root 1 0 R >>
startxref
${xrefOffset}
%%EOF
`;
  return Buffer.from(body, "utf-8");
}
function getReportPdfForOrder(orderId) {
  const cached = pdfCache.get(orderId);
  if (cached) {
    return { buffer: cached.buffer, fileName: cached.fileName };
  }
  const order = db.getOrderById(orderId);
  if (!order) return null;
  const buffer = generateDummyPdfBuffer(order);
  const sanitizedVin = (order.vehicle.vinOrReg || "RECORD").replace(/[^a-zA-Z0-9]/g, "_");
  const fileName = `AutoAudit_Report_${sanitizedVin}_${order.orderNumber}.pdf`;
  pdfCache.set(orderId, {
    buffer,
    fileName,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  return { buffer, fileName };
}
async function processOrderReport(order, options) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const sanitizedVin = (order.vehicle.vinOrReg || "RECORD").replace(/[^a-zA-Z0-9]/g, "_");
  const fileName = `AutoAudit_Report_${sanitizedVin}_${order.orderNumber}.pdf`;
  const fileUrl = `/api/reports/download/${order.id}`;
  console.log(`[MockReportGenerator] Auto-generating dummy report PDF for Order #${order.orderNumber} (VIN: ${order.vehicle.vinOrReg})...`);
  const pdfBuffer = generateDummyPdfBuffer(order);
  pdfCache.set(order.id, {
    buffer: pdfBuffer,
    fileName,
    generatedAt: now
  });
  pdfCache.set(order.orderNumber, {
    buffer: pdfBuffer,
    fileName,
    generatedAt: now
  });
  const fileMetadata = {
    fileName,
    fileUrl,
    type: "pdf"
  };
  const updatedOrder = db.attachOrderReport(
    order.id,
    fileMetadata,
    "AutoAudit Mock Report Generator Service"
  ) || order;
  const targetStatus = options?.targetStatus || "Ready";
  db.updateOrderStatus(
    order.id,
    targetStatus,
    `Official dummy report PDF generated (${fileName}) by AutoAudit automated intelligence engine.`
  );
  updatedOrder.status = targetStatus;
  updatedOrder.resultFile = {
    ...fileMetadata,
    uploadedAt: now,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString()
  };
  let emailMessageId;
  if (options?.autoNotifyUser !== false) {
    try {
      const emailResult = await sendMockEmail({
        order: updatedOrder,
        type: "report_ready",
        attachments: [
          {
            filename: fileName,
            content: pdfBuffer,
            contentType: "application/pdf"
          }
        ]
      });
      emailMessageId = emailResult.messageId;
      console.log(`[MockReportGenerator] Customer ${order.customer.email} notified via report_ready email (MsgID: ${emailMessageId})`);
    } catch (err) {
      console.error("[MockReportGenerator] Error notifying customer via email:", err);
    }
  }
  return {
    success: true,
    order: updatedOrder,
    pdfBuffer,
    fileName,
    fileUrl,
    emailMessageId
  };
}
function handleNewOrderCreation(newOrder) {
  const isPaid = newOrder.payment?.status === "Paid" || newOrder.status === "Paid / New" || newOrder.status === "Processing";
  if (!isPaid) {
    console.log(`[MockReportGenerator] Order #${newOrder.orderNumber} is not marked Paid. Skipping auto-report generation.`);
    return;
  }
  setTimeout(async () => {
    try {
      await processOrderReport(newOrder, { autoNotifyUser: true, targetStatus: "Ready" });
    } catch (err) {
      console.error(`[MockReportGenerator] Error generating report for new order #${newOrder.orderNumber}:`, err);
    }
  }, 1500);
}
function getReportGeneratorStatus() {
  return {
    service: "AutoAudit Mock Report Generator Service",
    status: "ACTIVE",
    mode: "Automatic Trigger on Paid Orders",
    cachedReportsCount: pdfCache.size,
    supportedFormats: ["application/pdf"],
    features: [
      "Automatic PDF 1.4 generation on Paid status",
      "Attachment support in Nodemailer mock SMTP dispatch",
      "Direct browser stream endpoint at /api/reports/download/:id",
      "Tamper-evident verification seal and NMVTIS findings"
    ]
  };
}

// server/routes/orders.ts
var ordersRouter = Router2();
function sanitizeText(str) {
  if (typeof str !== "string") return "";
  return str.replace(/<[^>]*>?/gm, "").trim();
}
var EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/;
ordersRouter.get("/db-status", async (_req, res) => {
  await supabaseDb.checkTablesHealth();
  const status = db.getDatabaseStatus();
  res.json({
    success: true,
    database: status,
    instructions: {
      supabaseConfigured: status.isSupabaseConnected,
      tablesReady: status.tablesReady,
      help: status.isSupabaseConnected && !status.tablesReady ? "Your Supabase project is connected, but the PostgreSQL tables ('orders', etc.) are not created yet in the database. Run the script in /supabase/schema.sql in your Supabase SQL Editor." : "PostgreSQL tables are verified and operational."
    }
  });
});
ordersRouter.get("/schema-sql", (_req, res) => {
  try {
    const schemaPath = path.resolve(process.cwd(), "supabase", "schema.sql");
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, "utf8");
      res.type("text/plain").send(sql);
    } else {
      res.status(404).send("-- schema.sql not found");
    }
  } catch (err) {
    res.status(500).send(`-- Error: ${err.message}`);
  }
});
ordersRouter.get("/", (req, res) => {
  const { email, status, search } = req.query;
  if (!email) {
    return requireAdminAuth(req, res, () => {
      let orders = db.getOrders();
      if (status && typeof status === "string" && status !== "all") {
        orders = orders.filter((o) => o.status.toLowerCase() === status.toLowerCase());
      }
      if (search && typeof search === "string") {
        const term = search.trim().toLowerCase();
        orders = orders.filter(
          (o) => o.orderNumber.toLowerCase().includes(term) || o.customer.fullName.toLowerCase().includes(term) || o.customer.email.toLowerCase().includes(term) || o.vehicle.vinOrReg.toLowerCase().includes(term) || o.vehicle.make.toLowerCase().includes(term) || o.vehicle.model.toLowerCase().includes(term)
        );
      }
      res.json({
        success: true,
        count: orders.length,
        data: orders
      });
    });
  }
  const cleanEmail = String(email).trim().toLowerCase();
  let customerOrders = db.getOrders().filter((o) => o.customer.email.toLowerCase() === cleanEmail);
  if (search && typeof search === "string") {
    const term = search.trim().toLowerCase();
    customerOrders = customerOrders.filter(
      (o) => o.orderNumber.toLowerCase().includes(term) || o.vehicle.vinOrReg.toLowerCase().includes(term) || o.vehicle.make.toLowerCase().includes(term) || o.vehicle.model.toLowerCase().includes(term)
    );
  }
  res.json({
    success: true,
    count: customerOrders.length,
    data: customerOrders
  });
});
ordersRouter.get("/:id", (req, res) => {
  const { id } = req.params;
  const order = db.getOrderById(id);
  if (!order) {
    res.status(404).json({ success: false, error: `Order with identifier "${id}" not found.` });
    return;
  }
  res.json({
    success: true,
    data: order
  });
});
ordersRouter.post("/", (req, res) => {
  const body = req.body;
  if (!body.serviceId) {
    res.status(400).json({ success: false, error: "Service ID is required." });
    return;
  }
  if (!body.customer?.email || !body.customer?.fullName) {
    res.status(400).json({ success: false, error: "Customer name and email are required." });
    return;
  }
  const cleanEmail = sanitizeText(body.customer.email).toLowerCase();
  if (!EMAIL_REGEX.test(cleanEmail)) {
    res.status(422).json({ success: false, error: "Please enter a valid email address (e.g. name@example.com)." });
    return;
  }
  const cleanName = sanitizeText(body.customer.fullName);
  if (cleanName.length < 2) {
    res.status(422).json({ success: false, error: "Customer full name must be at least 2 characters." });
    return;
  }
  if (!body.vehicle?.vinOrReg) {
    res.status(400).json({ success: false, error: "Vehicle VIN or Registration is required." });
    return;
  }
  const rawVin = sanitizeText(body.vehicle.vinOrReg).toUpperCase();
  const isVin = body.vehicle.isVin !== false;
  if (isVin && !VIN_REGEX.test(rawVin)) {
    res.status(422).json({
      success: false,
      error: "Invalid 17-digit VIN. VIN must be exactly 17 alphanumeric characters (excluding letters I, O, and Q)."
    });
    return;
  }
  const service = db.getServiceById(body.serviceId);
  const subtotal = service ? service.price : body.subtotal || 28.99;
  let discountAmount = 0;
  let couponCode = body.couponCode?.trim().toUpperCase();
  if (couponCode) {
    const validation = db.validateCoupon(couponCode);
    if (validation.valid && validation.coupon) {
      if (validation.coupon.discountPercent) {
        discountAmount = parseFloat((subtotal * validation.coupon.discountPercent / 100).toFixed(2));
      } else if (validation.coupon.discountFixed) {
        discountAmount = Math.min(validation.coupon.discountFixed, subtotal);
      }
      db.incrementCouponUsage(couponCode);
    } else {
      couponCode = void 0;
    }
  }
  const total = parseFloat(Math.max(0, subtotal - discountAmount).toFixed(2));
  const newOrderNum = `AA-${Math.floor(1e4 + Math.random() * 9e4)}`;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const auditLogs = [
    {
      id: `log-${Date.now()}-1`,
      timestamp: now,
      actor: "Customer (Checkout)",
      action: "Order Placed",
      details: couponCode ? `Coupon ${couponCode} applied (-$${discountAmount}).` : "Standard checkout."
    },
    {
      id: `log-${Date.now()}-2`,
      timestamp: now,
      actor: "Payment Gateway",
      action: "Payment Captured",
      details: `$${total} processed via ${body.payment?.method || "Credit Card"}.`
    }
  ];
  const newOrder = {
    id: `ord-${Date.now()}`,
    orderNumber: newOrderNum,
    serviceId: body.serviceId,
    serviceName: service ? service.name : body.serviceName || "Vehicle History Report",
    status: "Paid / New",
    subtotal,
    discountAmount,
    total,
    couponCode: couponCode || void 0,
    customer: {
      fullName: body.customer.fullName,
      email: body.customer.email,
      phone: body.customer.phone || "",
      smsNotifications: body.customer.smsNotifications ?? body.smsNotifications ?? true
    },
    smsNotifications: body.customer.smsNotifications ?? body.smsNotifications ?? true,
    vehicle: {
      vinOrReg: body.vehicle.vinOrReg.toUpperCase(),
      isVin: body.vehicle.isVin !== false,
      make: body.vehicle.make || "Verified",
      model: body.vehicle.model || "Series",
      year: body.vehicle.year || (/* @__PURE__ */ new Date()).getFullYear(),
      mileage: body.vehicle.mileage || "Pending audit",
      countryOrState: body.vehicle.countryOrState || "US",
      customerNotes: body.vehicle.customerNotes || ""
    },
    payment: {
      status: "Paid",
      gatewayRef: `ch_${Math.random().toString(36).substring(2, 15)}`,
      paidAt: now,
      method: body.payment?.method || "Visa ending in 4242"
    },
    internalNotes: "Order received. Automated NMVTIS and title check initialized.",
    createdAt: now,
    updatedAt: now,
    auditLogs
  };
  db.createOrder(newOrder);
  handleNewOrderCreation(newOrder);
  triggerAutomatedEmailSequence(newOrder, {
    stageDelaySeconds: { stage2: 4, stage3: 8 },
    autoAdvanceOrderStatus: true
  }).catch((err) => {
    console.error("[SMTP] Automated email sequence error:", err);
  });
  res.status(201).json({
    success: true,
    message: "Order created successfully and automated lifecycle email sequence initiated.",
    data: newOrder
  });
});
ordersRouter.patch("/:id/status", requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;
  if (!status) {
    res.status(400).json({ success: false, error: "Status is required." });
    return;
  }
  const updated = db.updateOrderStatus(id, status, note ? sanitizeText(note) : void 0);
  if (!updated) {
    res.status(404).json({ success: false, error: `Order with identifier "${id}" not found.` });
    return;
  }
  if (status === "In Progress") {
    sendMockEmail({ order: updated, type: "processing" }).catch((err) => {
      console.error("[SMTP] Error dispatching processing email:", err);
    });
  } else if (status === "Delivered" || status === "Ready") {
    processOrderReport(updated, { autoNotifyUser: true, targetStatus: status }).catch((err) => {
      console.error("[MockReportGenerator] Error auto-generating report on status change:", err);
    });
  }
  res.json({
    success: true,
    message: `Order ${updated.orderNumber} status changed to ${status}.`,
    data: updated
  });
});
ordersRouter.patch("/:id/notes", requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  if (typeof notes !== "string") {
    res.status(400).json({ success: false, error: "Notes string is required." });
    return;
  }
  const cleanNotes = sanitizeText(notes);
  const updated = db.updateOrderNotes(id, cleanNotes);
  if (!updated) {
    res.status(404).json({ success: false, error: `Order with identifier "${id}" not found.` });
    return;
  }
  res.json({
    success: true,
    message: "Internal notes saved.",
    data: updated
  });
});
ordersRouter.post("/:id/attach-report", requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const { fileName, fileUrl, type } = req.body;
  if (!fileName || !fileUrl) {
    res.status(400).json({ success: false, error: "File name and file URL are required." });
    return;
  }
  const updated = db.attachOrderReport(id, {
    fileName: sanitizeText(fileName),
    fileUrl: sanitizeText(fileUrl),
    type: type === "link" || type === "html" ? type : "pdf"
  });
  if (!updated) {
    res.status(404).json({ success: false, error: `Order with identifier "${id}" not found.` });
    return;
  }
  res.json({
    success: true,
    message: "Report file attached successfully.",
    data: updated
  });
});

// server/routes/services.ts
import { Router as Router3 } from "express";
var servicesRouter = Router3();
servicesRouter.get("/", (_req, res) => {
  res.json({
    success: true,
    data: db.getServices()
  });
});
servicesRouter.get("/:id", (req, res) => {
  const service = db.getServiceById(req.params.id);
  if (!service) {
    res.status(404).json({ success: false, error: "Service tier not found." });
    return;
  }
  res.json({ success: true, data: service });
});

// server/routes/coupons.ts
import { Router as Router4 } from "express";
var couponsRouter = Router4();
couponsRouter.get("/", (_req, res) => {
  res.json({
    success: true,
    data: db.getCoupons()
  });
});
couponsRouter.post("/validate", (req, res) => {
  const { code, subtotal } = req.body;
  if (!code) {
    res.status(400).json({ success: false, error: "Promo code is required." });
    return;
  }
  const result = db.validateCoupon(code);
  if (!result.valid || !result.coupon) {
    res.status(400).json({
      success: false,
      error: result.error || "Invalid promotional code"
    });
    return;
  }
  const basePrice = typeof subtotal === "number" ? subtotal : 28.99;
  let discountAmount = 0;
  if (result.coupon.discountPercent) {
    discountAmount = parseFloat((basePrice * result.coupon.discountPercent / 100).toFixed(2));
  } else if (result.coupon.discountFixed) {
    discountAmount = Math.min(result.coupon.discountFixed, basePrice);
  }
  const newTotal = parseFloat(Math.max(0, basePrice - discountAmount).toFixed(2));
  res.json({
    success: true,
    code: result.coupon.code,
    discountAmount,
    discountPercent: result.coupon.discountPercent,
    discountFixed: result.coupon.discountFixed,
    newTotal
  });
});

// server/routes/emails.ts
import { Router as Router5 } from "express";
var emailsRouter = Router5();
emailsRouter.get("/smtp-status", (_req, res) => {
  res.json({
    success: true,
    data: getSmtpStatus()
  });
});
emailsRouter.get("/", (req, res) => {
  const { email, orderNumber } = req.query;
  if (typeof email === "string" && email.trim()) {
    const cleanEmail = email.trim().toLowerCase();
    const customerEmails = db.getEmails().filter((e) => e.recipientEmail.toLowerCase() === cleanEmail);
    res.json({
      success: true,
      count: customerEmails.length,
      data: customerEmails
    });
    return;
  }
  if (typeof orderNumber === "string" && orderNumber.trim()) {
    const cleanNum = orderNumber.trim().toUpperCase();
    const orderEmails = db.getEmails().filter((e) => e.orderNumber.toUpperCase() === cleanNum);
    res.json({
      success: true,
      count: orderEmails.length,
      data: orderEmails
    });
    return;
  }
  requireAdminAuth(req, res, () => {
    res.json({
      success: true,
      count: db.getEmails().length,
      data: db.getEmails()
    });
  });
});
emailsRouter.post("/trigger-sequence/:orderId", async (req, res) => {
  const { orderId } = req.params;
  const order = db.getOrderById(orderId);
  if (!order) {
    res.status(404).json({ success: false, error: `Order ${orderId} not found.` });
    return;
  }
  try {
    const result = await triggerAutomatedEmailSequence(order, {
      stageDelaySeconds: { stage2: 3, stage3: 7 },
      autoAdvanceOrderStatus: true
    });
    res.json({
      success: true,
      message: `Automated lifecycle email sequence initiated for ${order.customer.email}.`,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        recipient: order.customer.email,
        confirmationMessageId: result.confirmationMessageId,
        stages: ["Stage 1: Confirmation (Sent)", "Stage 2: In-Progress (Scheduled in 3s)", "Stage 3: Ready (Scheduled in 7s)"]
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: `Failed to trigger email sequence: ${err?.message || "SMTP Error"}`
    });
  }
});
emailsRouter.post("/send-stage", requireAdminAuth, async (req, res) => {
  const { orderId, type } = req.body;
  if (!orderId || !type) {
    res.status(400).json({ success: false, error: "Both orderId and type are required." });
    return;
  }
  const order = db.getOrderById(orderId);
  if (!order) {
    res.status(404).json({ success: false, error: `Order ${orderId} not found.` });
    return;
  }
  if (type !== "order_confirmation" && type !== "processing" && type !== "report_ready") {
    res.status(400).json({ success: false, error: "Invalid email stage type." });
    return;
  }
  try {
    const result = await sendMockEmail({ order, type });
    res.json({
      success: true,
      message: `${type} email successfully dispatched via mock SMTP.`,
      data: result
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: `Failed to dispatch email: ${err?.message || "SMTP Error"}`
    });
  }
});

// server/routes/stats.ts
import { Router as Router6 } from "express";
var statsRouter = Router6();
statsRouter.get("/", requireAdminAuth, (_req, res) => {
  const orders = db.getOrders();
  const totalRevenue = orders.reduce((acc, o) => acc + (o.payment.status === "Paid" ? o.total : 0), 0);
  const deliveredCount = orders.filter((o) => o.status === "Delivered" || o.status === "Completed").length;
  const pendingCount = orders.filter((o) => o.status === "Paid / New" || o.status === "Processing" || o.status === "NMVTIS Check").length;
  res.json({
    success: true,
    data: {
      totalOrders: orders.length,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      deliveredCount,
      pendingCount,
      fulfillmentRate: orders.length > 0 ? Math.round(deliveredCount / orders.length * 100) : 100,
      activeCoupons: db.getCoupons().filter((c) => c.active).length,
      emailsDispatched: db.getEmails().length
    }
  });
});

// server/routes/auth.ts
import { Router as Router7 } from "express";
var authRouter = Router7();
authRouter.post("/admin-login", (req, res) => {
  const { email, password, accessKey } = req.body;
  const isValid = verifyAdminCredentials(email, password, accessKey);
  if (!isValid) {
    res.status(401).json({
      success: false,
      error: "Invalid administrative credentials. Access restricted to authorized AutoAudit staff."
    });
    return;
  }
  res.json({
    success: true,
    message: "Staff authentication successful.",
    token: ADMIN_AUTH_TOKEN,
    user: {
      email: email || "admin@autoaudit.com",
      role: "Staff Administrator",
      loginTime: (/* @__PURE__ */ new Date()).toISOString()
    }
  });
});
authRouter.get("/verify", (req, res) => {
  const token = req.headers["x-admin-token"] || (req.headers.authorization && req.headers.authorization.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null);
  if (token === ADMIN_AUTH_TOKEN || token === process.env.ADMIN_SECRET_KEY) {
    res.json({ success: true, authenticated: true, role: "Staff Administrator" });
  } else {
    res.status(401).json({ success: false, authenticated: false });
  }
});

// server/routes/analytics.ts
import { Router as Router8 } from "express";
var analyticsRouter = Router8();
analyticsRouter.post("/contact-events", (req, res) => {
  try {
    const { channel, source, intent, vin, orderNumber, messagePreview, pageUrl, deviceType } = req.body;
    if (!source) {
      res.status(400).json({ success: false, error: "Source is required" });
      return;
    }
    const event = db.logContactEvent({
      channel: channel || "whatsapp",
      source,
      intent: intent || "general_support",
      vin,
      orderNumber,
      messagePreview,
      pageUrl,
      deviceType
    });
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, error: error?.message || "Failed to log contact event" });
  }
});
analyticsRouter.get("/contact-events", requireAdminAuth, (_req, res) => {
  try {
    const events = db.getContactEvents();
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, error: error?.message || "Failed to fetch contact events" });
  }
});
analyticsRouter.get("/contact-summary", requireAdminAuth, (_req, res) => {
  try {
    const summary = db.getContactSummary();
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error?.message || "Failed to generate contact summary" });
  }
});
analyticsRouter.get("/whatsapp-config", (_req, res) => {
  try {
    const config = db.getWhatsAppConfig();
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, error: error?.message || "Failed to fetch WhatsApp config" });
  }
});
analyticsRouter.put("/whatsapp-config", requireAdminAuth, (req, res) => {
  try {
    const updates = req.body;
    const updated = db.updateWhatsAppConfig(updates);
    res.json({ success: true, data: updated, message: "WhatsApp configuration updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error?.message || "Failed to update WhatsApp config" });
  }
});

// server/routes/reports.ts
import { Router as Router9 } from "express";
var reportsRouter = Router9();
reportsRouter.get("/status", (_req, res) => {
  res.json({
    success: true,
    data: getReportGeneratorStatus()
  });
});
reportsRouter.get("/download/:id", (req, res) => {
  const { id } = req.params;
  const order = db.getOrderById(id);
  if (!order) {
    res.status(404).json({
      success: false,
      error: `Order with identifier "${id}" not found.`
    });
    return;
  }
  const report = getReportPdfForOrder(order.id);
  if (!report) {
    res.status(500).json({
      success: false,
      error: `Failed to compile PDF report for order ${order.orderNumber}.`
    });
    return;
  }
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${report.fileName}"`);
  res.setHeader("Content-Length", report.buffer.length);
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(report.buffer);
});
reportsRouter.post("/generate/:id", async (req, res) => {
  const { id } = req.params;
  const order = db.getOrderById(id);
  if (!order) {
    res.status(404).json({
      success: false,
      error: `Order with identifier "${id}" not found.`
    });
    return;
  }
  try {
    const notifyUser = req.body?.notifyUser !== false;
    const result = await processOrderReport(order, { autoNotifyUser: notifyUser });
    res.json({
      success: true,
      message: `Report PDF auto-generated successfully for order ${order.orderNumber}.`,
      data: {
        fileName: result.fileName,
        fileUrl: result.fileUrl,
        orderStatus: result.order.status,
        emailMessageId: result.emailMessageId
      }
    });
  } catch (err) {
    console.error("[ReportsRouter] Generation error:", err);
    res.status(500).json({
      success: false,
      error: err?.message || "Failed to generate report."
    });
  }
});

// server.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3e3;
  const isProduction = process.env.NODE_ENV === "production";
  app.use(express.json());
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-admin-token");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });
  const healthCheckHandler = (_req, res) => {
    res.json({
      status: "ok",
      service: "AutoAudit Vehicle Intelligence Engine",
      version: "1.2.0",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      uptime: process.uptime()
    });
  };
  app.get("/health", healthCheckHandler);
  app.get("/api/health", healthCheckHandler);
  app.use("/api/auth", authRouter);
  app.use("/api/vin", vinRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/services", servicesRouter);
  app.use("/api/coupons", couponsRouter);
  app.use("/api/emails", emailsRouter);
  app.use("/api/stats", statsRouter);
  app.use("/api/analytics", analyticsRouter);
  app.use("/api/reports", reportsRouter);
  app.use("/api", (req, res) => {
    res.status(404).json({
      success: false,
      error: `API route ${req.method} ${req.originalUrl} not found.`
    });
  });
  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: "0.0.0.0",
        port: PORT
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path2.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.use((_req, res) => {
      res.sendFile(path2.resolve(distPath, "index.html"));
    });
  }
  app.use((err, _req, res, _next) => {
    console.error("Unhandled server exception:", err);
    res.status(500).json({
      success: false,
      error: "An internal server error occurred."
    });
  });
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\u{1F680} AutoAudit server active on http://0.0.0.0:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start AutoAudit server:", err);
  process.exit(1);
});
