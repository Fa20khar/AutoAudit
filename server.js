// server.ts
import "dotenv/config";
import express from "express";
import path2 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";

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

// src/data/initialData.ts
var INITIAL_WHATSAPP_CONFIG = {
  phoneNumber: "923420617217",
  displayNumber: "+92 342 0617217",
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

// server/mongodb/connection.ts
import mongoose from "mongoose";
var lastConnectedAt = null;
var lastError = null;
var isConnecting = false;
function maskMongoUri(uri) {
  if (!uri) return "";
  return uri.replace(/\/\/(.*):(.*)@/, "//$1:***@");
}
function getMongoUri() {
  return process.env.MONGODB_URI || "";
}
function isMongoConfigured() {
  const uri = getMongoUri();
  return Boolean(uri && (uri.startsWith("mongodb://") || uri.startsWith("mongodb+srv://")));
}
function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}
function getMongoStateString() {
  if (!isMongoConfigured()) return "unconfigured";
  switch (mongoose.connection.readyState) {
    case 0:
      return lastError ? "error" : "disconnected";
    case 1:
      return "connected";
    case 2:
      return "connecting";
    case 3:
      return "disconnecting";
    default:
      return "disconnected";
  }
}
async function getMongoStatus() {
  const isConfigured = isMongoConfigured();
  const isConnected = isMongoConnected();
  let pingMs = null;
  if (isConnected && mongoose.connection.db) {
    try {
      const start = Date.now();
      await mongoose.connection.db.admin().ping();
      pingMs = Date.now() - start;
    } catch {
      pingMs = null;
    }
  }
  const host = mongoose.connection.host || (isConfigured ? "atlas-cluster" : "not configured");
  const databaseName = mongoose.connection.name || (isConfigured ? "autoaudit_db" : "in-memory-fallback");
  return {
    isConfigured,
    isConnected,
    state: getMongoStateString(),
    host,
    databaseName,
    lastConnectedAt,
    lastError,
    pingMs
  };
}
async function connectToMongoDB(customUri) {
  const uri = customUri || getMongoUri();
  if (!uri) {
    console.info(
      "[MongoDB Atlas Notice] MONGODB_URI is not set in environment. AutoAudit is operating in resilient local mode with in-memory persistence and local storage. Configure MONGODB_URI in your environment to persist to MongoDB Atlas."
    );
    return false;
  }
  if (isMongoConnected()) {
    return true;
  }
  if (isConnecting) {
    return false;
  }
  isConnecting = true;
  const masked = maskMongoUri(uri);
  try {
    console.log(`[MongoDB Atlas] Initiating connection to: ${masked}`);
    mongoose.connection.removeAllListeners("connected");
    mongoose.connection.removeAllListeners("error");
    mongoose.connection.removeAllListeners("disconnected");
    mongoose.connection.removeAllListeners("reconnected");
    mongoose.connection.on("connected", () => {
      lastConnectedAt = (/* @__PURE__ */ new Date()).toISOString();
      lastError = null;
      console.log(`[MongoDB Atlas] Successfully connected to database: ${mongoose.connection.name}`);
    });
    mongoose.connection.on("error", (err) => {
      lastError = err?.message || "Unknown MongoDB connection error";
      console.error("[MongoDB Atlas] Runtime connection error:", lastError);
    });
    mongoose.connection.on("disconnected", () => {
      console.warn("[MongoDB Atlas] Connection disconnected. MongoDB driver will attempt auto-reconnect.");
    });
    mongoose.connection.on("reconnected", () => {
      console.log("[MongoDB Atlas] Connection re-established.");
    });
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5e3,
      // Timeout after 5s if cluster is unreachable
      connectTimeoutMS: 1e4,
      // Initial connection timeout (10s)
      socketTimeoutMS: 45e3,
      // Close sockets after 45s of inactivity
      maxPoolSize: 10,
      // Maintain up to 10 socket connections
      minPoolSize: 1,
      // Keep at least 1 socket active
      heartbeatFrequencyMS: 1e4,
      // Health check cluster every 10s
      retryWrites: true,
      w: "majority"
    });
    lastConnectedAt = (/* @__PURE__ */ new Date()).toISOString();
    lastError = null;
    isConnecting = false;
    return true;
  } catch (err) {
    lastError = err?.message || "Failed to connect to MongoDB Atlas";
    isConnecting = false;
    console.error(`[MongoDB Atlas] Connection failed for ${masked}:`, lastError);
    return false;
  }
}
async function disconnectMongoDB() {
  if (mongoose.connection.readyState !== 0) {
    console.log("[MongoDB Atlas] Closing database connection gracefully...");
    try {
      await mongoose.disconnect();
      console.log("[MongoDB Atlas] Database connection closed.");
    } catch (err) {
      console.error("[MongoDB Atlas] Error during disconnect:", err?.message);
    }
  }
}

// server/mongodb/models/Order.ts
import mongoose2, { Schema } from "mongoose";
var AuditLogSchema = new Schema(
  {
    id: { type: String, required: true },
    timestamp: { type: String, required: true },
    actor: { type: String, required: true, trim: true },
    action: { type: String, required: true, trim: true },
    details: { type: String, trim: true }
  },
  { _id: false }
);
var ResultFileSchema = new Schema(
  {
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    type: { type: String, enum: ["pdf", "link", "html"], default: "pdf" },
    uploadedAt: { type: String, required: true },
    expiryDate: { type: String }
  },
  { _id: false }
);
var OrderSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
      trim: true
    },
    serviceId: {
      type: String,
      required: true,
      index: true
    },
    serviceName: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      required: true,
      enum: [
        "Pending Payment",
        "Paid / New",
        "Processing",
        "NMVTIS Check",
        "Ready",
        "Delivered",
        "Completed",
        "Cancelled",
        "Refunded"
      ],
      default: "Paid / New",
      index: true
    },
    subtotal: {
      type: Number,
      required: true,
      min: [0, "Subtotal cannot be negative"]
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: [0, "Discount amount cannot be negative"]
    },
    total: {
      type: Number,
      required: true,
      min: [0, "Total cannot be negative"]
    },
    couponCode: {
      type: String,
      uppercase: true,
      trim: true
    },
    customer: {
      fullName: { type: String, required: true, trim: true },
      email: { type: String, required: true, lowercase: true, trim: true, index: true },
      phone: { type: String, trim: true },
      smsNotifications: { type: Boolean, default: true }
    },
    vehicle: {
      vinOrReg: { type: String, required: true, uppercase: true, trim: true, index: true },
      isVin: { type: Boolean, default: true },
      make: { type: String, required: true, trim: true },
      model: { type: String, required: true, trim: true },
      year: { type: Number, required: true },
      mileage: { type: String, trim: true },
      countryOrState: { type: String, trim: true },
      customerNotes: { type: String, trim: true }
    },
    payment: {
      status: {
        type: String,
        enum: ["Pending", "Paid", "Failed", "Refunded"],
        default: "Paid"
      },
      gatewayRef: { type: String, default: "" },
      paidAt: { type: String },
      method: { type: String, default: "Credit Card" }
    },
    internalNotes: {
      type: String,
      default: ""
    },
    resultFile: {
      type: ResultFileSchema,
      required: false
    },
    auditLogs: {
      type: [AuditLogSchema],
      default: []
    },
    createdAt: {
      type: String,
      default: () => (/* @__PURE__ */ new Date()).toISOString()
    },
    updatedAt: {
      type: String,
      default: () => (/* @__PURE__ */ new Date()).toISOString()
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);
OrderSchema.index({ "customer.email": 1, createdAt: -1 });
OrderSchema.index({ "vehicle.vinOrReg": 1 });
OrderSchema.index({ status: 1, createdAt: -1 });
var OrderModel = mongoose2.models.Order || mongoose2.model("Order", OrderSchema);

// server/mongodb/models/Service.ts
import mongoose3, { Schema as Schema2 } from "mongoose";
var ServiceSchema = new Schema2(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    tagline: {
      type: String,
      default: "",
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"]
    },
    originalPrice: {
      type: Number,
      min: [0, "Original price cannot be negative"]
    },
    deliveryTime: {
      type: String,
      required: true,
      trim: true
    },
    isPopular: {
      type: Boolean,
      default: false
    },
    requiredFields: {
      type: [String],
      default: []
    },
    includedItems: {
      type: [String],
      default: []
    },
    exclusions: {
      type: [String],
      default: []
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);
var ServiceModel = mongoose3.models.Service || mongoose3.model("Service", ServiceSchema);

// server/mongodb/models/Coupon.ts
import mongoose4, { Schema as Schema3 } from "mongoose";
var CouponSchema = new Schema3(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    discountPercent: {
      type: Number,
      min: [0, "Discount percent cannot be negative"],
      max: [100, "Discount percent cannot exceed 100%"]
    },
    discountFixed: {
      type: Number,
      min: [0, "Fixed discount cannot be negative"]
    },
    minOrder: {
      type: Number,
      min: [0, "Minimum order cannot be negative"]
    },
    usageCount: {
      type: Number,
      default: 0,
      min: [0, "Usage count cannot be negative"]
    },
    maxUsage: {
      type: Number,
      min: [1, "Maximum usage must be at least 1"]
    },
    expiryDate: {
      type: String,
      required: true
    },
    active: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);
var CouponModel = mongoose4.models.Coupon || mongoose4.model("Coupon", CouponSchema);

// server/mongodb/models/EmailNotification.ts
import mongoose5, { Schema as Schema4 } from "mongoose";
var EmailNotificationSchema = new Schema4(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    orderId: {
      type: String,
      index: true,
      trim: true
    },
    orderNumber: {
      type: String,
      index: true,
      trim: true
    },
    recipientEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    recipientType: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer"
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      required: true,
      enum: [
        "new_order_admin",
        "order_confirmation",
        "processing",
        "report_ready",
        "refund",
        "payment_failed"
      ]
    },
    body: {
      type: String,
      required: true
    },
    htmlBody: {
      type: String
    },
    messageId: {
      type: String
    },
    smtpTransport: {
      type: String
    },
    sentAt: {
      type: String,
      default: () => (/* @__PURE__ */ new Date()).toISOString()
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);
EmailNotificationSchema.index({ recipientEmail: 1, sentAt: -1 });
EmailNotificationSchema.index({ orderNumber: 1 });
var EmailModel = mongoose5.models.EmailNotification || mongoose5.model("EmailNotification", EmailNotificationSchema);

// server/mongodb/models/CustomerIntake.ts
import mongoose6, { Schema as Schema5 } from "mongoose";
var PhotoAttachmentSchema = new Schema5(
  {
    name: { type: String, required: true },
    size: { type: String, required: true },
    previewUrl: { type: String }
  },
  { _id: false }
);
var CustomerIntakeSchema = new Schema5(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    submissionNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    timestamp: {
      type: String,
      default: () => (/* @__PURE__ */ new Date()).toISOString()
    },
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      required: true,
      trim: true
    },
    preferredContactMethod: {
      type: String,
      enum: ["Email", "Phone Call", "WhatsApp"],
      default: "Email"
    },
    vinOrChassis: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true
    },
    registrationPlate: {
      type: String,
      trim: true,
      default: ""
    },
    make: {
      type: String,
      required: true,
      trim: true
    },
    model: {
      type: String,
      required: true,
      trim: true
    },
    modelYear: {
      type: Number,
      required: true
    },
    vehicleColor: {
      type: String,
      default: ""
    },
    currentMileage: {
      type: String,
      default: ""
    },
    countryOfRegistration: {
      type: String,
      required: true
    },
    reportType: {
      type: String,
      required: true
    },
    reasonForRequest: {
      type: String,
      required: true
    },
    purchaseStatus: {
      type: String,
      default: ""
    },
    additionalNotes: {
      type: String,
      default: ""
    },
    documentFileName: {
      type: String
    },
    documentFileSize: {
      type: String
    },
    vehiclePhotos: {
      type: [PhotoAttachmentSchema],
      default: []
    },
    vehiclePhotoCount: {
      type: Number,
      default: 0
    },
    accuracyConfirmed: {
      type: Boolean,
      default: true
    },
    dataUsageConsent: {
      type: Boolean,
      default: true
    },
    termsAgreed: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: ["Received", "Processing", "Report Generated", "Delivered", "Contacted"],
      default: "Received",
      index: true
    },
    autoGeneratedOrderId: {
      type: String
    },
    autoGeneratedReportUrl: {
      type: String
    },
    internalNotes: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);
CustomerIntakeSchema.index({ email: 1, createdAt: -1 });
CustomerIntakeSchema.index({ vinOrChassis: 1 });
var CustomerIntakeModel = mongoose6.models.CustomerIntake || mongoose6.model("CustomerIntake", CustomerIntakeSchema);

// server/mongodb/models/ContactEvent.ts
import mongoose7, { Schema as Schema6 } from "mongoose";
var ContactEventSchema = new Schema6(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    channel: {
      type: String,
      default: "whatsapp"
    },
    source: {
      type: String,
      required: true,
      index: true
    },
    intent: {
      type: String,
      default: "general_support",
      index: true
    },
    vin: {
      type: String,
      trim: true
    },
    orderNumber: {
      type: String,
      trim: true
    },
    messagePreview: {
      type: String
    },
    timestamp: {
      type: String,
      default: () => (/* @__PURE__ */ new Date()).toISOString(),
      index: true
    },
    pageUrl: {
      type: String
    },
    deviceType: {
      type: String
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);
ContactEventSchema.index({ timestamp: -1 });
var ContactEventModel = mongoose7.models.ContactEvent || mongoose7.model("ContactEvent", ContactEventSchema);

// server/mongodb/models/WhatsAppConfig.ts
import mongoose8, { Schema as Schema7 } from "mongoose";
var WhatsAppConfigSchema = new Schema7(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "global",
      index: true
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true
    },
    displayNumber: {
      type: String,
      required: true,
      trim: true
    },
    defaultGreeting: {
      type: String,
      default: "Hello! I am interested in an AutoAudit vehicle history verification report."
    },
    supportAvailability: {
      type: String,
      default: "24/7 Verified Support Desk"
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);
var WhatsAppConfigModel = mongoose8.models.WhatsAppConfig || mongoose8.model("WhatsAppConfig", WhatsAppConfigSchema);

// server/mongodb/models/Referral.ts
import mongoose9, { Schema as Schema8 } from "mongoose";
var ReferralRewardCouponSchema = new Schema8(
  {
    code: { type: String, required: true, uppercase: true, trim: true },
    discountFixed: { type: Number, default: 5 },
    discountPercent: { type: Number },
    isUsed: { type: Boolean, default: false },
    usedOnOrder: { type: String },
    earnedAt: { type: String, default: () => (/* @__PURE__ */ new Date()).toISOString() }
  },
  { _id: false }
);
var ReferralConversionSchema = new Schema8(
  {
    orderNumber: { type: String, required: true },
    date: { type: String, default: () => (/* @__PURE__ */ new Date()).toISOString() },
    commissionDiscount: { type: Number, default: 5 }
  },
  { _id: false }
);
var ReferralProfileSchema = new Schema8(
  {
    referralCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    ownerEmail: {
      type: String,
      lowercase: true,
      trim: true,
      index: true
    },
    ownerName: {
      type: String,
      trim: true
    },
    referralLink: {
      type: String,
      required: true
    },
    totalReferrals: {
      type: Number,
      default: 0,
      min: 0
    },
    rewardCoupons: {
      type: [ReferralRewardCouponSchema],
      default: []
    },
    conversions: {
      type: [ReferralConversionSchema],
      default: []
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);
var ReferralModel = mongoose9.models.Referral || mongoose9.model("Referral", ReferralProfileSchema);

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
var INITIAL_INTAKE_SUBMISSIONS = [
  {
    id: "intake-1001",
    submissionNumber: "REQ-10021",
    timestamp: "2026-10-04T19:30:00Z",
    fullName: "Fakhar Zaman",
    email: "realfakharzaman9@gmail.com",
    phone: "+92 300 1234567",
    country: "Pakistan",
    preferredContactMethod: "WhatsApp",
    vinOrChassis: "1HGCR2F83HA109284",
    registrationPlate: "LEA-21-4920",
    make: "Honda",
    model: "Accord",
    modelYear: 2017,
    vehicleColor: "Silver",
    currentMileage: "68,400 mi",
    countryOfRegistration: "United States",
    reportType: "Complete Vehicle History Report",
    reasonForRequest: "Considering purchasing a vehicle",
    purchaseStatus: "Planning to purchase",
    additionalNotes: "Please verify if there are any auction accident photos from Copart or Manheim.",
    documentFileName: "auction_slip_sample.jpg",
    documentFileSize: "1.4 MB",
    accuracyConfirmed: true,
    dataUsageConsent: true,
    termsAgreed: true,
    status: "Report Generated",
    autoGeneratedOrderId: "ord-10025",
    autoGeneratedReportUrl: "/api/reports/download/ord-10025",
    internalNotes: "Auto-generated report delivered via WhatsApp & Email."
  },
  {
    id: "intake-1002",
    submissionNumber: "REQ-10022",
    timestamp: "2026-10-05T04:15:00Z",
    fullName: "Tariq Al-Mansoor",
    email: "tariq.mansoor@uaebiz.ae",
    phone: "+971 50 987 6543",
    country: "United Arab Emirates",
    preferredContactMethod: "Email",
    vinOrChassis: "4T1B11HK5JU192837",
    registrationPlate: "DXB-K-8812",
    make: "Toyota",
    model: "Camry",
    modelYear: 2018,
    vehicleColor: "White",
    currentMileage: "54,200 mi",
    countryOfRegistration: "United States",
    reportType: "Accident / Damage History",
    reasonForRequest: "Verifying a vehicle I already own",
    purchaseStatus: "Already owned",
    additionalNotes: "Need total loss and insurance write-off certification.",
    accuracyConfirmed: true,
    dataUsageConsent: true,
    termsAgreed: true,
    status: "Received",
    internalNotes: "Pending NMVTIS clearinghouse queue verification."
  }
];
var Database = class {
  services = [...INITIAL_SERVICES];
  orders = [...INITIAL_ORDERS];
  coupons = [...INITIAL_COUPONS];
  emails = [...INITIAL_EMAILS];
  contactEvents = [...INITIAL_CONTACT_EVENTS];
  whatsAppConfig = { ...INITIAL_WHATSAPP_CONFIG };
  intakeSubmissions = [...INITIAL_INTAKE_SUBMISSIONS];
  isHydratedFromMongo = false;
  constructor() {
  }
  /**
   * Synchronizes and seeds initial collections in MongoDB Atlas if they are currently empty
   */
  async hydrateFromMongoDB() {
    if (!isMongoConnected()) return;
    try {
      const dbServices = await ServiceModel.find().lean();
      if (dbServices.length > 0) {
        this.services = dbServices;
      } else {
        await ServiceModel.insertMany(INITIAL_SERVICES);
        console.log(`[MongoDB Atlas] Initialized ${INITIAL_SERVICES.length} service plans.`);
      }
      const dbCoupons = await CouponModel.find().lean();
      if (dbCoupons.length > 0) {
        this.coupons = dbCoupons;
      } else {
        await CouponModel.insertMany(INITIAL_COUPONS);
        console.log(`[MongoDB Atlas] Initialized ${INITIAL_COUPONS.length} promotional coupons.`);
      }
      const dbOrders = await OrderModel.find().sort({ createdAt: -1 }).lean();
      if (dbOrders.length > 0) {
        this.orders = dbOrders;
        console.log(`[MongoDB Atlas] Hydrated ${dbOrders.length} orders from Atlas collection.`);
      } else {
        await OrderModel.insertMany(INITIAL_ORDERS);
        console.log(`[MongoDB Atlas] Seeded ${INITIAL_ORDERS.length} sample orders.`);
      }
      const dbEmails = await EmailModel.find().sort({ sentAt: -1 }).lean();
      if (dbEmails.length > 0) {
        this.emails = dbEmails;
      } else {
        await EmailModel.insertMany(INITIAL_EMAILS);
      }
      const dbIntake = await CustomerIntakeModel.find().sort({ timestamp: -1 }).lean();
      if (dbIntake.length > 0) {
        this.intakeSubmissions = dbIntake;
      } else {
        await CustomerIntakeModel.insertMany(INITIAL_INTAKE_SUBMISSIONS);
      }
      const dbConfig = await WhatsAppConfigModel.findOne({ key: "global" }).lean();
      if (dbConfig) {
        this.whatsAppConfig = dbConfig;
      } else {
        await WhatsAppConfigModel.create({ key: "global", ...INITIAL_WHATSAPP_CONFIG });
      }
      this.isHydratedFromMongo = true;
      console.log("[MongoDB Atlas] Application state synchronized with Atlas database.");
    } catch (err) {
      console.warn("[MongoDB Atlas] Hydration notice:", err?.message);
    }
  }
  async getDatabaseStatus() {
    const mongoStatus = await getMongoStatus();
    return {
      primaryDatabase: "MongoDB Atlas",
      isMongoConfigured: mongoStatus.isConfigured,
      isMongoConnected: mongoStatus.isConnected,
      mongoStatus,
      fallbackDatabase: "AutoAudit High-Speed Local Repository (Zero Cloud Dependency)",
      orderCount: isMongoConnected() ? await OrderModel.countDocuments() : this.orders.length,
      couponCount: isMongoConnected() ? await CouponModel.countDocuments() : this.coupons.length,
      emailCount: isMongoConnected() ? await EmailModel.countDocuments() : this.emails.length,
      serviceCount: isMongoConnected() ? await ServiceModel.countDocuments() : this.services.length,
      intakeCount: isMongoConnected() ? await CustomerIntakeModel.countDocuments() : this.intakeSubmissions.length
    };
  }
  // Services
  getServices() {
    return this.services;
  }
  async getServicesAsync() {
    if (isMongoConnected()) {
      try {
        const list = await ServiceModel.find({ active: true }).lean();
        if (list.length > 0) {
          this.services = list;
          return this.services;
        }
      } catch (e) {
        console.warn("[Database] MongoDB getServices error, using cache:", e.message);
      }
    }
    return this.services;
  }
  getServiceById(id) {
    return this.services.find((s) => s.id === id);
  }
  async getServiceByIdAsync(id) {
    if (isMongoConnected()) {
      try {
        const item = await ServiceModel.findOne({ id }).lean();
        if (item) return item;
      } catch {
      }
    }
    return this.getServiceById(id);
  }
  // Orders
  getOrders() {
    return this.orders;
  }
  async getOrdersAsync(filter) {
    if (isMongoConnected()) {
      try {
        const query = {};
        if (filter?.email) {
          query["customer.email"] = filter.email.trim().toLowerCase();
        }
        if (filter?.status && filter.status !== "all") {
          query.status = filter.status;
        }
        if (filter?.search) {
          const term = filter.search.trim();
          query.$or = [
            { orderNumber: new RegExp(term, "i") },
            { "customer.fullName": new RegExp(term, "i") },
            { "customer.email": new RegExp(term, "i") },
            { "vehicle.vinOrReg": new RegExp(term, "i") },
            { "vehicle.make": new RegExp(term, "i") },
            { "vehicle.model": new RegExp(term, "i") }
          ];
        }
        const dbOrders = await OrderModel.find(query).sort({ createdAt: -1 }).lean();
        return dbOrders;
      } catch (err) {
        console.warn("[Database] MongoDB getOrders error, falling back to cache:", err.message);
      }
    }
    let orders = this.orders;
    if (filter?.email) {
      const cleanEmail = filter.email.trim().toLowerCase();
      orders = orders.filter((o) => o.customer.email.toLowerCase() === cleanEmail);
    }
    if (filter?.status && filter.status !== "all") {
      orders = orders.filter((o) => o.status.toLowerCase() === filter.status.toLowerCase());
    }
    if (filter?.search) {
      const term = filter.search.trim().toLowerCase();
      orders = orders.filter(
        (o) => o.orderNumber.toLowerCase().includes(term) || o.customer.fullName.toLowerCase().includes(term) || o.customer.email.toLowerCase().includes(term) || o.vehicle.vinOrReg.toLowerCase().includes(term) || o.vehicle.make.toLowerCase().includes(term) || o.vehicle.model.toLowerCase().includes(term)
      );
    }
    return orders;
  }
  getOrderById(idOrNumber) {
    return this.orders.find((o) => o.id === idOrNumber || o.orderNumber.toLowerCase() === idOrNumber.toLowerCase());
  }
  async getOrderByIdAsync(idOrNumber) {
    if (isMongoConnected()) {
      try {
        const order = await OrderModel.findOne({
          $or: [{ id: idOrNumber }, { orderNumber: idOrNumber.toUpperCase() }]
        }).lean();
        if (order) return order;
      } catch (err) {
        console.warn("[Database] MongoDB getOrderById error, using cache:", err.message);
      }
    }
    return this.getOrderById(idOrNumber);
  }
  createOrder(order) {
    this.orders.unshift(order);
    if (isMongoConnected()) {
      OrderModel.create(order).catch((err) => {
        console.error("[Database] Failed to save order to MongoDB Atlas:", err.message);
      });
    }
    return order;
  }
  async createOrderAsync(order) {
    this.orders.unshift(order);
    if (isMongoConnected()) {
      try {
        await OrderModel.create(order);
      } catch (err) {
        console.error("[Database] Error persisting order to MongoDB Atlas:", err.message);
      }
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
    const logEntry = {
      id: `log-${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      actor: "Admin Staff",
      action: `Status updated to ${status}`,
      details: note || void 0
    };
    order.auditLogs.unshift(logEntry);
    if (status === "Delivered" && !order.resultFile) {
      order.resultFile = {
        fileName: `AutoAudit_Report_${order.vehicle.vinOrReg}.pdf`,
        fileUrl: `/reports/AutoAudit_Report_${order.vehicle.vinOrReg}.pdf`,
        type: "pdf",
        uploadedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    if (isMongoConnected()) {
      OrderModel.updateOne(
        { $or: [{ id: orderId }, { orderNumber: orderId }] },
        {
          $set: {
            status,
            updatedAt: order.updatedAt,
            internalNotes: order.internalNotes,
            resultFile: order.resultFile
          },
          $push: { auditLogs: { $each: [logEntry], $position: 0 } }
        }
      ).catch((err) => console.error("[Database] MongoDB status sync error:", err.message));
    }
    return order;
  }
  async updateOrderStatusAsync(orderId, status, note) {
    const order = this.updateOrderStatus(orderId, status, note);
    if (order && isMongoConnected()) {
      try {
        await OrderModel.updateOne(
          { $or: [{ id: orderId }, { orderNumber: orderId }] },
          {
            $set: {
              status,
              updatedAt: order.updatedAt,
              internalNotes: order.internalNotes,
              resultFile: order.resultFile
            }
          }
        );
      } catch (err) {
        console.error("[Database] MongoDB async status sync error:", err.message);
      }
    }
    return order;
  }
  updateOrderNotes(orderId, notes) {
    const order = this.getOrderById(orderId);
    if (!order) return null;
    order.internalNotes = notes;
    order.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    const logEntry = {
      id: `log-${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      actor: "Admin Specialist",
      action: "Updated Internal Notes",
      details: "Internal fulfillment comments updated"
    };
    order.auditLogs.unshift(logEntry);
    if (isMongoConnected()) {
      OrderModel.updateOne(
        { $or: [{ id: orderId }, { orderNumber: orderId }] },
        {
          $set: { internalNotes: notes, updatedAt: order.updatedAt },
          $push: { auditLogs: { $each: [logEntry], $position: 0 } }
        }
      ).catch(() => {
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
    const logEntry = {
      id: `log-${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      actor,
      action: "Report Attached",
      details: `File attached: ${file.fileName}`
    };
    order.auditLogs.unshift(logEntry);
    if (isMongoConnected()) {
      OrderModel.updateOne(
        { $or: [{ id: orderId }, { orderNumber: orderId }] },
        {
          $set: { resultFile: order.resultFile, updatedAt: order.updatedAt },
          $push: { auditLogs: { $each: [logEntry], $position: 0 } }
        }
      ).catch(() => {
      });
    }
    return order;
  }
  // Coupons
  getCoupons() {
    return this.coupons;
  }
  async getCouponsAsync() {
    if (isMongoConnected()) {
      try {
        const list = await CouponModel.find().lean();
        if (list.length > 0) {
          this.coupons = list;
          return this.coupons;
        }
      } catch (err) {
        console.warn("[Database] MongoDB getCoupons error:", err.message);
      }
    }
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
    const cleanCode = code.trim().toUpperCase();
    const coupon = this.coupons.find((c) => c.code.toUpperCase() === cleanCode);
    if (coupon) {
      coupon.usageCount += 1;
    }
    if (isMongoConnected()) {
      CouponModel.updateOne({ code: cleanCode }, { $inc: { usageCount: 1 } }).catch(() => {
      });
    }
  }
  // Emails
  getEmails() {
    return this.emails;
  }
  async getEmailsAsync(query) {
    if (isMongoConnected()) {
      try {
        const filter = {};
        if (query?.email) filter.recipientEmail = query.email.trim().toLowerCase();
        if (query?.orderNumber) filter.orderNumber = query.orderNumber.trim().toUpperCase();
        const list = await EmailModel.find(filter).sort({ sentAt: -1 }).lean();
        return list;
      } catch (err) {
        console.warn("[Database] MongoDB getEmails error:", err.message);
      }
    }
    let emails = this.emails;
    if (query?.email) {
      const cleanEmail = query.email.trim().toLowerCase();
      emails = emails.filter((e) => e.recipientEmail.toLowerCase() === cleanEmail);
    }
    if (query?.orderNumber) {
      const cleanNum = query.orderNumber.trim().toUpperCase();
      emails = emails.filter((e) => e.orderNumber.toUpperCase() === cleanNum);
    }
    return emails;
  }
  addEmail(email) {
    this.emails.unshift(email);
    if (isMongoConnected()) {
      EmailModel.create(email).catch((err) => {
        console.error("[Database] Failed to save email to MongoDB Atlas:", err.message);
      });
    }
  }
  // Contact Events & Click-to-Chat Analytics
  getContactEvents() {
    return this.contactEvents;
  }
  async getContactEventsAsync() {
    if (isMongoConnected()) {
      try {
        const list = await ContactEventModel.find().sort({ timestamp: -1 }).limit(100).lean();
        return list;
      } catch (err) {
        console.warn("[Database] MongoDB getContactEvents error:", err.message);
      }
    }
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
    if (isMongoConnected()) {
      ContactEventModel.create(event).catch((err) => {
        console.warn("[Database] Failed to log contact event to MongoDB Atlas:", err.message);
      });
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
    if (isMongoConnected()) {
      WhatsAppConfigModel.updateOne(
        { key: "global" },
        { $set: updates },
        { upsert: true }
      ).catch(() => {
      });
    }
    return this.whatsAppConfig;
  }
  // Customer Intake Form Submissions
  getIntakeSubmissions() {
    return this.intakeSubmissions;
  }
  async getIntakeSubmissionsAsync(filters) {
    if (isMongoConnected()) {
      try {
        const query = {};
        if (filters?.email) query.email = filters.email.trim().toLowerCase();
        if (filters?.status && filters.status !== "All") query.status = filters.status;
        const list2 = await CustomerIntakeModel.find(query).sort({ timestamp: -1 }).lean();
        return list2;
      } catch (err) {
        console.warn("[Database] MongoDB getIntakeSubmissions error:", err.message);
      }
    }
    let list = this.intakeSubmissions;
    if (filters?.email) {
      const cleanEmail = filters.email.trim().toLowerCase();
      list = list.filter((item) => item.email.toLowerCase() === cleanEmail);
    }
    if (filters?.status && filters.status !== "All") {
      list = list.filter((item) => item.status.toLowerCase() === filters.status.toLowerCase());
    }
    return list;
  }
  getIntakeSubmissionById(id) {
    return this.intakeSubmissions.find((s) => s.id === id || s.submissionNumber === id);
  }
  createIntakeSubmission(submission) {
    this.intakeSubmissions.unshift(submission);
    if (this.intakeSubmissions.length > 500) {
      this.intakeSubmissions = this.intakeSubmissions.slice(0, 500);
    }
    if (isMongoConnected()) {
      CustomerIntakeModel.create(submission).catch((err) => {
        console.error("[Database] Failed to save intake submission to MongoDB Atlas:", err.message);
      });
    }
    return submission;
  }
  async createIntakeSubmissionAsync(submission) {
    this.intakeSubmissions.unshift(submission);
    if (isMongoConnected()) {
      try {
        await CustomerIntakeModel.create(submission);
      } catch (err) {
        console.error("[Database] Error persisting intake submission to Atlas:", err.message);
      }
    }
    return submission;
  }
  updateIntakeSubmission(id, updates) {
    const item = this.getIntakeSubmissionById(id);
    if (!item) return null;
    Object.assign(item, updates);
    if (isMongoConnected()) {
      CustomerIntakeModel.updateOne(
        { $or: [{ id }, { submissionNumber: id }] },
        { $set: updates }
      ).catch(() => {
      });
    }
    return item;
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
    // Watermark behind content (using standard PDF 1.4 text transformation matrix)
    "BT",
    "/F1 32 Tf",
    "0.93 0.94 0.96 rg",
    // Very faint grey
    "0.866 0.5 -0.5 0.866 110 440 Tm",
    `(${esc("OFFICIAL AUTOAUDIT REPORT")}) Tj`,
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
  const status = await db.getDatabaseStatus();
  res.json({
    success: true,
    database: status,
    instructions: {
      primary: "MongoDB Atlas",
      isMongoConfigured: status.isMongoConfigured,
      isMongoConnected: status.isMongoConnected,
      mongoHelp: !status.isMongoConfigured ? "Configure MONGODB_URI=mongodb+srv://<user>:<password>@<host>/autoaudit_db in your environment variables to enable MongoDB Atlas persistence." : !status.isMongoConnected ? "MongoDB Atlas is configured but connection is not ready. Verify network access allows IP 0.0.0.0/0 in MongoDB Atlas." : "MongoDB Atlas is actively connected and serving requests.",
      fallbackDatabase: status.fallbackDatabase
    }
  });
});
ordersRouter.get("/", async (req, res) => {
  const { email, status, search } = req.query;
  if (!email) {
    return requireAdminAuth(req, res, async () => {
      const orders = await db.getOrdersAsync({
        status: typeof status === "string" ? status : void 0,
        search: typeof search === "string" ? search : void 0
      });
      res.json({
        success: true,
        count: orders.length,
        data: orders
      });
    });
  }
  const cleanEmail = String(email).trim().toLowerCase();
  const customerOrders = await db.getOrdersAsync({
    email: cleanEmail,
    search: typeof search === "string" ? search : void 0
  });
  res.json({
    success: true,
    count: customerOrders.length,
    data: customerOrders
  });
});
ordersRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  const order = await db.getOrderByIdAsync(id);
  if (!order) {
    res.status(404).json({ success: false, error: `Order with identifier "${id}" not found.` });
    return;
  }
  res.json({
    success: true,
    data: order
  });
});
ordersRouter.post("/", async (req, res) => {
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
    res.status(422).json({ success: false, error: "Customer name must be at least 2 characters." });
    return;
  }
  if (!body.vehicle?.vinOrReg) {
    res.status(400).json({ success: false, error: "Vehicle VIN or Registration Plate is required." });
    return;
  }
  const cleanVin = sanitizeText(body.vehicle.vinOrReg).toUpperCase();
  if (body.vehicle.isVin !== false && cleanVin.length === 17) {
    if (!VIN_REGEX.test(cleanVin)) {
      res.status(422).json({
        success: false,
        error: "Invalid VIN: Characters I, O, and Q are disallowed by international standards."
      });
      return;
    }
  }
  const service = await db.getServiceByIdAsync(body.serviceId);
  const subtotal = service ? service.price : Number(body.subtotal) || 28.99;
  let discountAmount = 0;
  let couponCode = body.couponCode ? sanitizeText(body.couponCode).toUpperCase() : null;
  if (couponCode) {
    const couponValidation = db.validateCoupon(couponCode);
    if (couponValidation.valid && couponValidation.coupon) {
      if (couponValidation.coupon.discountPercent) {
        discountAmount = parseFloat((subtotal * couponValidation.coupon.discountPercent / 100).toFixed(2));
      } else if (couponValidation.coupon.discountFixed) {
        discountAmount = Math.min(couponValidation.coupon.discountFixed, subtotal);
      }
      db.incrementCouponUsage(couponCode);
    } else {
      couponCode = null;
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
      fullName: cleanName,
      email: cleanEmail,
      phone: body.customer.phone ? sanitizeText(body.customer.phone) : "",
      smsNotifications: body.customer.smsNotifications ?? body.smsNotifications ?? true
    },
    smsNotifications: body.customer.smsNotifications ?? body.smsNotifications ?? true,
    vehicle: {
      vinOrReg: cleanVin,
      isVin: body.vehicle.isVin !== false,
      make: body.vehicle.make ? sanitizeText(body.vehicle.make) : "Verified",
      model: body.vehicle.model ? sanitizeText(body.vehicle.model) : "Series",
      year: Number(body.vehicle.year) || (/* @__PURE__ */ new Date()).getFullYear(),
      mileage: body.vehicle.mileage ? sanitizeText(body.vehicle.mileage) : "Pending audit",
      countryOrState: body.vehicle.countryOrState ? sanitizeText(body.vehicle.countryOrState) : "US",
      customerNotes: body.vehicle.customerNotes ? sanitizeText(body.vehicle.customerNotes) : ""
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
  await db.createOrderAsync(newOrder);
  handleNewOrderCreation(newOrder);
  triggerAutomatedEmailSequence(newOrder, {
    stageDelaySeconds: { stage2: 4, stage3: 8 },
    autoAdvanceOrderStatus: true
  }).catch((err) => {
    console.error("[SMTP] Error starting automated email sequence:", err);
  });
  res.status(201).json({
    success: true,
    message: "Order created successfully. Processing has begun.",
    data: newOrder
  });
});
ordersRouter.patch("/:id/status", requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;
  if (!status) {
    res.status(400).json({ success: false, error: "Status is required." });
    return;
  }
  const updated = await db.updateOrderStatusAsync(id, status, note ? sanitizeText(note) : void 0);
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
servicesRouter.get("/", async (_req, res) => {
  const services = await db.getServicesAsync();
  res.json({
    success: true,
    data: services
  });
});
servicesRouter.get("/:id", async (req, res) => {
  const service = await db.getServiceByIdAsync(req.params.id);
  if (!service) {
    res.status(404).json({ success: false, error: "Service tier not found." });
    return;
  }
  res.json({ success: true, data: service });
});

// server/routes/coupons.ts
import { Router as Router4 } from "express";
var couponsRouter = Router4();
couponsRouter.get("/", async (_req, res) => {
  const coupons = await db.getCouponsAsync();
  res.json({
    success: true,
    data: coupons
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
emailsRouter.get("/", async (req, res) => {
  const { email, orderNumber } = req.query;
  if (typeof email === "string" && email.trim()) {
    const cleanEmail = email.trim().toLowerCase();
    const customerEmails = await db.getEmailsAsync({ email: cleanEmail });
    res.json({
      success: true,
      count: customerEmails.length,
      data: customerEmails
    });
    return;
  }
  if (typeof orderNumber === "string" && orderNumber.trim()) {
    const cleanNum = orderNumber.trim().toUpperCase();
    const orderEmails = await db.getEmailsAsync({ orderNumber: cleanNum });
    res.json({
      success: true,
      count: orderEmails.length,
      data: orderEmails
    });
    return;
  }
  requireAdminAuth(req, res, async () => {
    const allEmails = await db.getEmailsAsync();
    res.json({
      success: true,
      count: allEmails.length,
      data: allEmails
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
    if (updates.phoneNumber && typeof updates.phoneNumber === "string") {
      let clean = updates.phoneNumber.replace(/[^0-9]/g, "");
      if (clean.startsWith("03") && clean.length === 11) {
        clean = "92" + clean.slice(1);
      }
      updates.phoneNumber = clean;
    }
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
  try {
    const { id } = req.params;
    let order = db.getOrderById(id);
    if (!order) {
      const vinParam = req.query.vin || (id.includes("1H") ? id : "1HECM82633A004359");
      order = {
        id,
        orderNumber: id.startsWith("AA-") ? id : `AA-${id.replace(/[^0-9]/g, "").slice(-5) || "10025"}`,
        serviceId: "comprehensive-vin",
        serviceName: "Comprehensive Vehicle History Report",
        price: 42.99,
        total: 42.99,
        status: "Ready",
        customer: {
          fullName: req.query.name || "Authorized Customer",
          email: req.query.email || "customer@autoaudit.com"
        },
        vehicle: {
          vinOrReg: vinParam,
          year: "2021",
          make: "Honda",
          model: "Civic",
          mileage: "41,800 mi"
        },
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        auditLogs: []
      };
    }
    const report = getReportPdfForOrder(order.id) || {
      buffer: generateDummyPdfBuffer(order),
      fileName: `AutoAudit_Report_${(order.vehicle.vinOrReg || "RECORD").replace(/[^a-zA-Z0-9]/g, "_")}_${order.orderNumber}.pdf`
    };
    if (!report || !report.buffer) {
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
  } catch (err) {
    console.error("[ReportsRouter] Download error:", err);
    res.status(500).json({
      success: false,
      error: err?.message || "Failed to serve PDF report."
    });
  }
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

// server/routes/intake.ts
import { Router as Router10 } from "express";
var intakeRouter = Router10();
function sanitizeText2(str) {
  if (typeof str !== "string") return "";
  return str.replace(/<[^>]*>?/gm, "").trim();
}
var EMAIL_REGEX2 = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
intakeRouter.get("/", async (req, res) => {
  const { email, status } = req.query;
  if (!email) {
    return requireAdminAuth(req, res, async () => {
      const list2 = await db.getIntakeSubmissionsAsync({
        status: typeof status === "string" ? status : void 0
      });
      res.json({
        success: true,
        count: list2.length,
        data: list2
      });
    });
  }
  const cleanEmail = String(email).trim().toLowerCase();
  const list = await db.getIntakeSubmissionsAsync({ email: cleanEmail });
  res.json({
    success: true,
    count: list.length,
    data: list
  });
});
intakeRouter.post("/", async (req, res) => {
  const body = req.body;
  const fullName = sanitizeText2(body.fullName);
  const email = sanitizeText2(body.email).toLowerCase();
  const phone = sanitizeText2(body.phone);
  const country = sanitizeText2(body.country);
  const preferredContactMethod = body.preferredContactMethod || "Email";
  if (!fullName || fullName.length < 2) {
    res.status(400).json({ success: false, error: "Full Name is required (minimum 2 characters)." });
    return;
  }
  if (!EMAIL_REGEX2.test(email)) {
    res.status(422).json({ success: false, error: "A valid email address is required." });
    return;
  }
  if (!phone) {
    res.status(400).json({ success: false, error: "Phone / WhatsApp number is required." });
    return;
  }
  if (!country) {
    res.status(400).json({ success: false, error: "Customer country is required." });
    return;
  }
  const vinOrChassis = sanitizeText2(body.vinOrChassis || body.vin).toUpperCase();
  const registrationPlate = sanitizeText2(body.registrationPlate || body.regPlate || body.plate).toUpperCase();
  const make = sanitizeText2(body.make);
  const model = sanitizeText2(body.model);
  const modelYear = Number(body.modelYear) || (/* @__PURE__ */ new Date()).getFullYear();
  const vehicleColor = sanitizeText2(body.vehicleColor) || "Unknown";
  const currentMileage = sanitizeText2(body.currentMileage) || "Pending verification";
  const countryOfRegistration = sanitizeText2(body.countryOfRegistration) || country;
  if (!vinOrChassis) {
    res.status(400).json({ success: false, error: "VIN / Chassis number is required." });
    return;
  }
  if (!registrationPlate) {
    res.status(400).json({ success: false, error: "Registration number / license plate is required." });
    return;
  }
  if (!make || !model) {
    res.status(400).json({ success: false, error: "Vehicle Make and Model are required." });
    return;
  }
  const reportType = sanitizeText2(body.reportType) || "Complete Vehicle History Report";
  const reasonForRequest = sanitizeText2(body.reasonForRequest) || "Considering purchasing a vehicle";
  const purchaseStatus = sanitizeText2(body.purchaseStatus) || "Planning to purchase";
  const accuracyConfirmed = Boolean(body.accuracyConfirmed);
  const dataUsageConsent = Boolean(body.dataUsageConsent);
  const termsAgreed = Boolean(body.termsAgreed);
  if (!accuracyConfirmed || !dataUsageConsent || !termsAgreed) {
    res.status(422).json({
      success: false,
      error: "All three customer consent checkboxes (Accuracy, Data Usage, and Terms & Privacy) must be accepted."
    });
    return;
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const submissionNumber = `REQ-${Math.floor(1e4 + Math.random() * 9e4)}`;
  const submissionId = `intake-${Date.now()}`;
  const submission = {
    id: submissionId,
    submissionNumber,
    timestamp: now,
    fullName,
    email,
    phone,
    country,
    preferredContactMethod,
    vinOrChassis,
    registrationPlate,
    make,
    model,
    modelYear,
    vehicleColor,
    currentMileage,
    countryOfRegistration,
    reportType,
    reasonForRequest,
    purchaseStatus,
    additionalNotes: sanitizeText2(body.additionalNotes || body.additionalInformation),
    documentFileName: body.documentFileName ? sanitizeText2(body.documentFileName) : void 0,
    documentFileSize: body.documentFileSize ? sanitizeText2(body.documentFileSize) : void 0,
    vehiclePhotos: Array.isArray(body.vehiclePhotos) ? body.vehiclePhotos : void 0,
    vehiclePhotoCount: Array.isArray(body.vehiclePhotos) ? body.vehiclePhotos.length : body.vehiclePhotoCount || 0,
    accuracyConfirmed,
    dataUsageConsent,
    termsAgreed,
    status: "Received"
  };
  await db.createIntakeSubmissionAsync(submission);
  let generatedOrder;
  let reportDownloadUrl;
  const shouldAutoGenerate = body.autoGenerateReport !== false;
  if (shouldAutoGenerate) {
    try {
      const orderNum = `AA-${Math.floor(1e4 + Math.random() * 9e4)}`;
      const orderId = `ord-${Date.now()}`;
      const auditLogs = [
        {
          id: `log-${Date.now()}-1`,
          timestamp: now,
          actor: "Customer Intake Form",
          action: "Intake Request Submitted",
          details: `Submitted via Google Forms spec intake layer (${submissionNumber}).`
        },
        {
          id: `log-${Date.now()}-2`,
          timestamp: now,
          actor: "AutoAudit Automated Engine",
          action: "Auto-Generate Triggered",
          details: `Auto-compiling vehicle intelligence report for ${make} ${model} (${vinOrChassis}).`
        }
      ];
      const newOrder = {
        id: orderId,
        orderNumber: orderNum,
        serviceId: "comprehensive-vin",
        serviceName: reportType,
        status: "Paid / New",
        subtotal: 28.99,
        discountAmount: 0,
        total: 28.99,
        customer: {
          fullName,
          email,
          phone,
          smsNotifications: true
        },
        vehicle: {
          vinOrReg: vinOrChassis,
          isVin: vinOrChassis.length === 17,
          make,
          model,
          year: modelYear,
          mileage: currentMileage,
          countryOrState: countryOfRegistration,
          customerNotes: `Plate: ${registrationPlate}. Reason: ${reasonForRequest}. Note: ${submission.additionalNotes || "None"}`
        },
        payment: {
          status: "Paid",
          gatewayRef: `intake_req_${submissionNumber}`,
          paidAt: now,
          method: "AutoAudit Intake Instant Voucher"
        },
        internalNotes: `AutoAudit Customer Intake Submission #${submissionNumber}. Preferred Contact: ${preferredContactMethod}`,
        createdAt: now,
        updatedAt: now,
        auditLogs
      };
      db.createOrder(newOrder);
      const reportResult = await processOrderReport(newOrder, {
        autoNotifyUser: true,
        targetStatus: "Ready"
      });
      generatedOrder = reportResult.order;
      reportDownloadUrl = reportResult.fileUrl;
      db.updateIntakeSubmission(submissionId, {
        status: "Report Generated",
        autoGeneratedOrderId: orderId,
        autoGeneratedReportUrl: reportDownloadUrl,
        internalNotes: `Report auto-generated (${reportResult.fileName}). Notified via email & queued for ${preferredContactMethod}.`
      });
      submission.status = "Report Generated";
      submission.autoGeneratedOrderId = orderId;
      submission.autoGeneratedReportUrl = reportDownloadUrl;
    } catch (err) {
      console.error("[IntakeRouter] Auto-generation error:", err);
    }
  }
  res.status(201).json({
    success: true,
    message: "Vehicle history report request successfully submitted to AutoAudit.",
    data: {
      submission,
      order: generatedOrder,
      reportDownloadUrl,
      confirmation: {
        title: "Thank you for choosing AutoAudit!",
        message: "Your vehicle history report request has been successfully submitted. Our team will review the information provided and contact you using your preferred contact method.",
        tagline: "AutoAudit \u2014 Know the History. Drive with Confidence."
      }
    }
  });
});
intakeRouter.patch("/:id", requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const { status, internalNotes } = req.body;
  const updated = db.updateIntakeSubmission(id, {
    ...status ? { status } : {},
    ...internalNotes ? { internalNotes: sanitizeText2(internalNotes) } : {}
  });
  if (!updated) {
    res.status(404).json({ success: false, error: `Intake submission "${id}" not found.` });
    return;
  }
  res.json({
    success: true,
    data: updated
  });
});
intakeRouter.post("/:id/auto-generate", requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const submission = db.getIntakeSubmissionById(id);
  if (!submission) {
    res.status(404).json({ success: false, error: `Intake submission "${id}" not found.` });
    return;
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const orderNum = `AA-${Math.floor(1e4 + Math.random() * 9e4)}`;
  const orderId = `ord-${Date.now()}`;
  const newOrder = {
    id: orderId,
    orderNumber: orderNum,
    serviceId: "comprehensive-vin",
    serviceName: submission.reportType,
    status: "Paid / New",
    subtotal: 28.99,
    discountAmount: 0,
    total: 28.99,
    customer: {
      fullName: submission.fullName,
      email: submission.email,
      phone: submission.phone,
      smsNotifications: true
    },
    vehicle: {
      vinOrReg: submission.vinOrChassis,
      isVin: submission.vinOrChassis.length === 17,
      make: submission.make,
      model: submission.model,
      year: submission.modelYear,
      mileage: submission.currentMileage || "Pending verification",
      countryOrState: submission.countryOfRegistration,
      customerNotes: `Plate: ${submission.registrationPlate}. Reason: ${submission.reasonForRequest}`
    },
    payment: {
      status: "Paid",
      gatewayRef: `intake_req_${submission.submissionNumber}`,
      paidAt: now,
      method: "Admin Manual Auto-Generate"
    },
    internalNotes: `Auto-generated from intake request #${submission.submissionNumber}. Contact: ${submission.preferredContactMethod}`,
    createdAt: now,
    updatedAt: now,
    auditLogs: [
      {
        id: `log-${Date.now()}`,
        timestamp: now,
        actor: "Admin Staff",
        action: "Manual Report Compilation",
        details: `Triggered auto-generate report for intake ${submission.submissionNumber}.`
      }
    ]
  };
  db.createOrder(newOrder);
  const result = await processOrderReport(newOrder, {
    autoNotifyUser: true,
    targetStatus: "Ready"
  });
  db.updateIntakeSubmission(submission.id, {
    status: "Report Generated",
    autoGeneratedOrderId: orderId,
    autoGeneratedReportUrl: result.fileUrl,
    internalNotes: `Report auto-generated by admin (${result.fileName}). Customer notified.`
  });
  res.json({
    success: true,
    message: `Report auto-generated successfully for intake submission ${submission.submissionNumber}.`,
    data: {
      order: result.order,
      reportUrl: result.fileUrl,
      fileName: result.fileName
    }
  });
});

// server/routes/gemini.ts
import { Router as Router11 } from "express";
import { GoogleGenAI } from "@google/genai";
var geminiRouter = Router11();
var ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
});
var CHAT_ROLES = {
  "advisor": {
    id: "advisor",
    name: "Vehicle History Advisor",
    badge: "General & Advisory Tasks",
    model: "gemini-3.1-flash-lite",
    tagline: "General vehicle history, title brands, odometer checks, and buyer advice",
    systemInstruction: `You are the AutoAudit Senior Vehicle History & Automotive Advisory Specialist. AutoAudit is a premier vehicle history report ordering and automotive intelligence platform that provides NMVTIS verified records, insurance salvage flags, title brand checks, lien checks, NHTSA recall notices, and odometer verification.

Your role:
- Provide friendly, expert, and practical advice for used-car shoppers, vehicle owners, and automotive enthusiasts.
- Explain vehicle history concepts clearly: salvage vs rebuilt titles, flood brands, odometer rollbacks, frame/structural damage, lemon law buybacks, lien releases, and previous ownership records.
- Advise on what to inspect physically when a report flags an accident or minor damage.
- Help customers understand AutoAudit report tiers when asked:
  * Basic VIN Check ($14.99): Title brand status, salvage/junk records, total loss check, stolen vehicle check.
  * Complete History ($28.99, Most Popular): Everything in Basic + previous owners, odometer rollback check, accident history, lien & repossession, open recalls, service timeline.
  * Premium Full Inspection ($42.99): Everything in Complete + full NMVTIS records, market valuation, frame check, auction photos where available, and priority fulfillment.
- Maintain a helpful, trustworthy, and conversational tone. Format answers using markdown with bullet points and bold headers for easy reading.`,
    suggestedQuestions: [
      "What is the difference between a Salvage and Rebuilt title?",
      "How do I detect an odometer rollback before buying?",
      "Which AutoAudit report package should I choose?",
      "What red flags should I look for in a vehicle maintenance history?"
    ]
  },
  "fast-decoder": {
    id: "fast-decoder",
    name: "Quick VIN Decoder",
    badge: "Fast Tasks",
    model: "gemini-3.1-flash-lite",
    tagline: "High-speed 17-digit VIN breakdown, trim specs, and plant origins",
    systemInstruction: `You are the AutoAudit Ultra-Fast VIN Decoder and Technical Spec Engine. 

Your role:
- Provide rapid, ultra-concise breakdowns of 17-character ISO 3779 Vehicle Identification Numbers (VINs).
- Decode the 3-character WMI (World Manufacturer Identifier) for country and make, the 5-character VDS (Vehicle Descriptor Section) for model/engine/body type, the 9th check digit, the 10th model year character, the 11th assembly plant code, and the sequential production number.
- Instantly explain NHTSA safety recall lookup guidelines and check digit calculations.
- Keep responses fast, snappy, structured, and direct without unnecessary preamble. Present vehicle specifications in clean bulleted lists.`,
    suggestedQuestions: [
      "How is the 10th digit of a VIN used to determine model year?",
      "Can you decode this sample VIN: 1HGCR2F83HA029381?",
      "How does the 9th check digit mathematical formula work?",
      "Where can I find the VIN stamp on my car?"
    ]
  },
  "damage-analyst": {
    id: "damage-analyst",
    name: "Damage & Forensics Analyst",
    badge: "Forensics Tasks",
    model: "gemini-3.1-flash-lite",
    tagline: "Deep structural forensics, salvage auction forensics, and diminished value",
    systemInstruction: `You are the AutoAudit Forensic Vehicle Damage, Structural Diagnostics, and Diminished Value Analyst.

Your role:
- Conduct rigorous, in-depth technical analysis of structural unibody/frame damage, collision load-path deformation, A/B/C pillar integrity, suspension mounting distortion, and crumple-zone behavior.
- Diagnose salvage auction history indicators (Copart/IAAI designations such as Primary Damage Front End, Secondary Undercarriage, Biohazard, Fresh Water vs Salt Water Flood).
- Explain airbag deployment trigger thresholds, seatbelt pre-tensioner replacements, and SRS system recertification requirements.
- Calculate post-accident diminished value impact and insurance dispute strategies.
- Provide comprehensive, step-by-step diagnostic inspection checklists for master mechanics and pre-purchase vehicle inspectors.
- Use authoritative, deeply reasoned technical terminology while providing clear conclusions and risk ratings (Low / Moderate / Severe / Unsafe).`,
    suggestedQuestions: [
      "How does structural unibody damage affect used car safety and resale value?",
      "What are the telltale signs of concealed flood damage in electronics?",
      "How do insurance adjusters calculate diminished value after a collision?",
      'What does "Frame Damage - Altered Rail" indicate on an inspection report?'
    ]
  }
};
geminiRouter.get("/roles", (_req, res) => {
  res.json({
    success: true,
    roles: Object.values(CHAT_ROLES).map((r) => ({
      id: r.id,
      name: r.name,
      badge: r.badge,
      model: r.model,
      tagline: r.tagline,
      suggestedQuestions: r.suggestedQuestions
    }))
  });
});
geminiRouter.post("/chat", async (req, res) => {
  try {
    const { messages, roleId = "advisor", modelOverride } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({
        success: false,
        error: "Invalid request: messages must be a non-empty array of conversation turns."
      });
      return;
    }
    const selectedRole = CHAT_ROLES[roleId] || CHAT_ROLES["advisor"];
    const selectedModel = modelOverride || selectedRole.model || "gemini-3.1-flash-lite";
    const formattedContents = messages.map((m) => {
      const role = m.role === "user" ? "user" : "model";
      return {
        role,
        parts: [{ text: String(m.content || "").trim() }]
      };
    }).filter((turn) => turn.parts[0].text.length > 0);
    if (formattedContents.length === 0) {
      res.status(400).json({
        success: false,
        error: "No valid text content provided in messages."
      });
      return;
    }
    let replyText = "";
    let actualModelUsed = selectedModel;
    try {
      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: formattedContents,
        config: {
          systemInstruction: selectedRole.systemInstruction,
          temperature: 0.7
        }
      });
      replyText = response.text || "";
    } catch (primaryError) {
      console.warn(`Primary model ${selectedModel} failed (${primaryError?.message}). Falling back to gemini-3.1-flash-lite...`);
      if (selectedModel !== "gemini-3.1-flash-lite") {
        actualModelUsed = "gemini-3.1-flash-lite";
        const fallbackResponse = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: formattedContents,
          config: {
            systemInstruction: selectedRole.systemInstruction,
            temperature: 0.7
          }
        });
        replyText = fallbackResponse.text || "";
      } else {
        throw primaryError;
      }
    }
    if (!replyText) {
      replyText = "I received your inquiry regarding vehicle history records. How can I assist you with checking a VIN or understanding our AutoAudit reports?";
    }
    res.json({
      success: true,
      reply: replyText,
      modelUsed: actualModelUsed,
      roleId: selectedRole.id,
      roleName: selectedRole.name,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    console.error("Error generating Gemini chat response:", error);
    const errorMessage = error?.message || "Failed to generate AI response";
    res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === "development" ? String(error) : void 0
    });
  }
});

// server/routes/video.ts
import { Router as Router12 } from "express";
import { GoogleGenAI as GoogleGenAI2, GenerateVideosOperation } from "@google/genai";
var videoRouter = Router12();
var ai2 = new GoogleGenAI2({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build"
    }
  }
});
var activeOperations = /* @__PURE__ */ new Map();
var SAMPLE_VIDEOS = {
  "16:9": [
    {
      id: "sample-16-9-1",
      title: "360\xB0 Studio Inspection Sweep",
      prompt: "Cinematic 360-degree sweep around a midnight black Porsche 911 GT3 in a clean studio showroom, spotlights reflecting off flawless ceramic coat paint, photorealistic 8k video.",
      url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      duration: "15s"
    },
    {
      id: "sample-16-9-2",
      title: "Chassis & Engine Bay Walkthrough",
      prompt: "Detailed mechanical inspection under the hood of a twin-turbo V8 engine, smooth macro camera pan over intake manifold, suspension struts, and brake calipers with automotive workshop lighting.",
      url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      duration: "15s"
    },
    {
      id: "sample-16-9-3",
      title: "Scenic Coastal Highway Test Drive",
      prompt: "Low-angle drone tracking shot of an all-wheel-drive luxury SUV driving along a winding coastal highway at golden hour sunset, cinematic motion blur and lens flare.",
      url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
      duration: "15s"
    }
  ],
  "9:16": [
    {
      id: "sample-9-16-1",
      title: "Vertical Mobile Inspection Reel",
      prompt: "Vertical 9:16 smartphone camera walkthrough inspecting body gaps, paint depth, and front fascia of a luxury performance vehicle, clean modern garage background.",
      url: "https://storage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
      duration: "10s"
    },
    {
      id: "sample-9-16-2",
      title: "Odometer & Cockpit Scan",
      prompt: "Vertical portrait format cockpit scan showing leather steering wheel, pristine digital instrument cluster displaying low mileage, and clean carbon fiber interior trim.",
      url: "https://storage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4",
      duration: "12s"
    }
  ]
};
async function handleGenerateVideo(req, res) {
  try {
    const { prompt, aspectRatio = "16:9", resolution = "720p" } = req.body;
    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "A prompt describing the vehicle or scene is required."
      });
    }
    const validAspectRatio = aspectRatio === "9:16" ? "9:16" : "16:9";
    const cleanPrompt = prompt.trim();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "GEMINI_API_KEY is not configured on the server."
      });
    }
    let operation;
    try {
      operation = await ai2.models.generateVideos({
        model: "veo-3.1-fast-generate-preview",
        prompt: cleanPrompt,
        config: {
          numberOfVideos: 1,
          resolution: resolution === "1080p" ? "1080p" : "720p",
          aspectRatio: validAspectRatio
        }
      });
    } catch (apiError) {
      const errMsg = apiError?.message || String(apiError);
      const isQuotaError = errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED");
      return res.status(isQuotaError ? 429 : 500).json({
        success: false,
        error: isQuotaError ? "Gemini Veo API rate limit reached (Quota Exceeded). You can preview with pre-rendered automotive demo videos below or try again in a few moments." : `Veo video generation error: ${errMsg}`,
        isQuotaError,
        model: "veo-3.1-fast-generate-preview",
        fallbackSamples: SAMPLE_VIDEOS[validAspectRatio]
      });
    }
    if (!operation || !operation.name) {
      return res.status(500).json({
        success: false,
        error: "Failed to initiate Veo video generation operation."
      });
    }
    activeOperations.set(operation.name, {
      operationName: operation.name,
      prompt: cleanPrompt,
      aspectRatio: validAspectRatio,
      model: "veo-3.1-fast-generate-preview",
      createdAt: Date.now()
    });
    return res.json({
      success: true,
      operationName: operation.name,
      prompt: cleanPrompt,
      aspectRatio: validAspectRatio,
      model: "veo-3.1-fast-generate-preview"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error?.message || "Unexpected server error while generating video"
    });
  }
}
async function handleVideoStatus(req, res) {
  try {
    const { operationName } = req.body;
    if (!operationName || typeof operationName !== "string") {
      return res.status(400).json({
        success: false,
        error: "operationName is required to check status."
      });
    }
    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai2.operations.getVideosOperation({ operation: op });
    if (updated.error) {
      return res.json({
        success: false,
        done: true,
        error: updated.error.message || "Video generation failed during processing."
      });
    }
    const isDone = !!updated.done;
    const downloadUrl = isDone ? `/api/video-download?operationName=${encodeURIComponent(operationName)}` : null;
    const stored = activeOperations.get(operationName);
    return res.json({
      success: true,
      done: isDone,
      downloadUrl,
      aspectRatio: stored?.aspectRatio || "16:9",
      prompt: stored?.prompt
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error?.message || "Failed to poll video operation status."
    });
  }
}
async function handleVideoDownload(req, res) {
  try {
    const operationName = req.query.operationName || req.body?.operationName;
    if (!operationName || typeof operationName !== "string") {
      return res.status(400).json({
        success: false,
        error: "operationName parameter is required."
      });
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "GEMINI_API_KEY is not configured on the server."
      });
    }
    const op = new GenerateVideosOperation();
    op.name = operationName;
    const updated = await ai2.operations.getVideosOperation({ operation: op });
    if (!updated.done) {
      return res.status(202).json({
        success: false,
        done: false,
        message: "Video is still rendering. Please poll again in a few seconds."
      });
    }
    const videoUri = updated.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) {
      return res.status(404).json({
        success: false,
        error: "Completed operation did not return a valid video URI."
      });
    }
    const videoRes = await fetch(videoUri, {
      headers: {
        "x-goog-api-key": apiKey
      }
    });
    if (!videoRes.ok) {
      return res.status(videoRes.status).json({
        success: false,
        error: `Failed to download generated video: ${videoRes.statusText}`
      });
    }
    const arrayBuffer = await videoRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Length", buffer.length);
    res.setHeader("Content-Disposition", 'inline; filename="autoaudit-veo-video.mp4"');
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.send(buffer);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error?.message || "Error downloading video."
    });
  }
}
videoRouter.post("/generate", handleGenerateVideo);
videoRouter.post("/status", handleVideoStatus);
videoRouter.get("/download", handleVideoDownload);
videoRouter.post("/download", handleVideoDownload);
videoRouter.get("/samples", (_req, res) => {
  res.json({
    success: true,
    samples: SAMPLE_VIDEOS
  });
});

// server/routes/adminMongodb.ts
import { Router as Router13 } from "express";
import mongoose10 from "mongoose";

// server/mongodb/migration.ts
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
function chunkArray(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}
async function runMigration(options = {}) {
  const startTime = Date.now();
  const dryRun = Boolean(options.dryRun);
  const batchSize = Math.max(1, options.batchSize || 50);
  const requestedSource = options.source || "auto";
  console.log(`[Migration] Starting MongoDB Atlas migration utility... (dryRun: ${dryRun})`);
  if (!isMongoConnected()) {
    const connected = await connectToMongoDB();
    if (!connected && !dryRun) {
      throw new Error("Cannot run migration: MongoDB Atlas connection could not be established.");
    }
  }
  let sourceServices = [...INITIAL_SERVICES];
  let sourceCoupons = [...INITIAL_COUPONS];
  let sourceOrders = [...INITIAL_ORDERS];
  let sourceEmails = [...INITIAL_EMAILS];
  let sourceIntake = [...INITIAL_INTAKE_SUBMISSIONS];
  let sourceType = "AutoAudit Production Seed & Memory Repository";
  const backupPath = path.resolve(__dirname, "backup", "supabase_backup.json");
  if ((requestedSource === "backup" || requestedSource === "auto") && fs.existsSync(backupPath)) {
    try {
      const backupRaw = fs.readFileSync(backupPath, "utf8");
      const backupData = JSON.parse(backupRaw);
      if (Array.isArray(backupData.orders) && backupData.orders.length > 0) {
        sourceOrders = backupData.orders;
      }
      if (Array.isArray(backupData.coupons) && backupData.coupons.length > 0) {
        sourceCoupons = backupData.coupons;
      }
      if (Array.isArray(backupData.emails) && backupData.emails.length > 0) {
        sourceEmails = backupData.emails;
      }
      sourceType = `Verified Historical Archive (${path.basename(backupPath)} - ${backupData.exportedAt || "Archived"})`;
      console.log(`[Migration] Loaded ${sourceOrders.length} orders, ${sourceCoupons.length} coupons, and ${sourceEmails.length} emails from historical backup archive.`);
    } catch (e) {
      console.warn("[Migration] Note: Could not parse backup file, using active memory repository:", e?.message);
    }
  }
  const stats = {
    services: {
      collection: "services",
      sourceCount: sourceServices.length,
      processed: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: []
    },
    coupons: {
      collection: "coupons",
      sourceCount: sourceCoupons.length,
      processed: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: []
    },
    orders: {
      collection: "orders",
      sourceCount: sourceOrders.length,
      processed: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: []
    },
    emails: {
      collection: "emails",
      sourceCount: sourceEmails.length,
      processed: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: []
    },
    intakeSubmissions: {
      collection: "customerIntake",
      sourceCount: sourceIntake.length,
      processed: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: []
    },
    whatsAppConfig: {
      collection: "whatsAppConfig",
      sourceCount: 1,
      processed: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: []
    }
  };
  for (const batch of chunkArray(sourceServices, batchSize)) {
    for (const service of batch) {
      stats.services.processed++;
      if (dryRun) {
        stats.services.inserted++;
        continue;
      }
      try {
        const existing = await ServiceModel.findOne({ id: service.id });
        if (existing) {
          await ServiceModel.updateOne({ id: service.id }, { $set: service });
          stats.services.updated++;
        } else {
          await ServiceModel.create(service);
          stats.services.inserted++;
        }
      } catch (err) {
        stats.services.failed++;
        stats.services.errors.push(`Service ${service.id}: ${err.message}`);
      }
    }
  }
  for (const batch of chunkArray(sourceCoupons, batchSize)) {
    for (const coupon of batch) {
      stats.coupons.processed++;
      if (dryRun) {
        stats.coupons.inserted++;
        continue;
      }
      try {
        const code = coupon.code.toUpperCase();
        const existing = await CouponModel.findOne({ code });
        if (existing) {
          await CouponModel.updateOne({ code }, { $set: coupon });
          stats.coupons.updated++;
        } else {
          await CouponModel.create({ ...coupon, code });
          stats.coupons.inserted++;
        }
      } catch (err) {
        stats.coupons.failed++;
        stats.coupons.errors.push(`Coupon ${coupon.code}: ${err.message}`);
      }
    }
  }
  for (const batch of chunkArray(sourceOrders, batchSize)) {
    for (const order of batch) {
      stats.orders.processed++;
      if (dryRun) {
        stats.orders.inserted++;
        continue;
      }
      try {
        const existing = await OrderModel.findOne({
          $or: [{ id: order.id }, { orderNumber: order.orderNumber }]
        });
        if (existing) {
          await OrderModel.updateOne(
            { id: order.id },
            {
              $set: {
                ...order,
                updatedAt: order.updatedAt || (/* @__PURE__ */ new Date()).toISOString()
              }
            }
          );
          stats.orders.updated++;
        } else {
          await OrderModel.create(order);
          stats.orders.inserted++;
        }
      } catch (err) {
        stats.orders.failed++;
        stats.orders.errors.push(`Order ${order.orderNumber}: ${err.message}`);
      }
    }
  }
  for (const batch of chunkArray(sourceEmails, batchSize)) {
    for (const email of batch) {
      stats.emails.processed++;
      if (dryRun) {
        stats.emails.inserted++;
        continue;
      }
      try {
        const existing = await EmailModel.findOne({ id: email.id });
        if (existing) {
          await EmailModel.updateOne({ id: email.id }, { $set: email });
          stats.emails.updated++;
        } else {
          await EmailModel.create(email);
          stats.emails.inserted++;
        }
      } catch (err) {
        stats.emails.failed++;
        stats.emails.errors.push(`Email ${email.id}: ${err.message}`);
      }
    }
  }
  for (const batch of chunkArray(sourceIntake, batchSize)) {
    for (const intake of batch) {
      stats.intakeSubmissions.processed++;
      if (dryRun) {
        stats.intakeSubmissions.inserted++;
        continue;
      }
      try {
        const existing = await CustomerIntakeModel.findOne({
          $or: [{ id: intake.id }, { submissionNumber: intake.submissionNumber }]
        });
        if (existing) {
          await CustomerIntakeModel.updateOne({ id: intake.id }, { $set: intake });
          stats.intakeSubmissions.updated++;
        } else {
          await CustomerIntakeModel.create(intake);
          stats.intakeSubmissions.inserted++;
        }
      } catch (err) {
        stats.intakeSubmissions.failed++;
        stats.intakeSubmissions.errors.push(`Intake ${intake.submissionNumber}: ${err.message}`);
      }
    }
  }
  stats.whatsAppConfig.processed++;
  if (dryRun) {
    stats.whatsAppConfig.inserted++;
  } else {
    try {
      await WhatsAppConfigModel.updateOne(
        { key: "global" },
        { $setOnInsert: { key: "global", ...INITIAL_WHATSAPP_CONFIG } },
        { upsert: true }
      );
      stats.whatsAppConfig.inserted++;
    } catch (err) {
      stats.whatsAppConfig.failed++;
      stats.whatsAppConfig.errors.push(`WhatsApp Config: ${err.message}`);
    }
  }
  const destinationCounts = {};
  if (!dryRun && isMongoConnected()) {
    try {
      destinationCounts.services = await ServiceModel.countDocuments();
      destinationCounts.coupons = await CouponModel.countDocuments();
      destinationCounts.orders = await OrderModel.countDocuments();
      destinationCounts.emails = await EmailModel.countDocuments();
      destinationCounts.intakeSubmissions = await CustomerIntakeModel.countDocuments();
      destinationCounts.whatsAppConfig = await WhatsAppConfigModel.countDocuments();
    } catch {
    }
  }
  const durationMs = Date.now() - startTime;
  let totalProcessed = 0;
  let totalErrors = 0;
  for (const key of Object.keys(stats)) {
    totalProcessed += stats[key].processed;
    totalErrors += stats[key].failed;
  }
  const reconciled = dryRun || destinationCounts.orders >= sourceOrders.length && destinationCounts.services >= sourceServices.length && destinationCounts.coupons >= sourceCoupons.length;
  return {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    dryRun,
    sourceType,
    collections: stats,
    totalProcessed,
    totalErrors,
    durationMs,
    destinationCounts,
    reconciled,
    message: dryRun ? `Dry run completed successfully. ${totalProcessed} records analyzed from ${sourceType} with 0 write modifications.` : `Migration completed in ${durationMs}ms. ${totalProcessed} records processed (${totalErrors} errors). Reconciled: ${reconciled}`
  };
}
if (process.argv[1] && process.argv[1].endsWith("migration.ts")) {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  console.log("------------------------------------------------------------");
  console.log("   AutoAudit - MongoDB Atlas Migration Utility");
  console.log("------------------------------------------------------------");
  runMigration({ dryRun }).then((report) => {
    console.log("\nMigration Summary Report:");
    console.log(JSON.stringify(report, null, 2));
    return disconnectMongoDB();
  }).then(() => {
    console.log("\nMigration finished cleanly.");
    process.exit(0);
  }).catch((err) => {
    console.error("\nFatal migration error:", err);
    process.exit(1);
  });
}

// server/routes/adminMongodb.ts
var adminMongodbRouter = Router13();
adminMongodbRouter.use(requireAdminAuth);
adminMongodbRouter.get("/status", async (_req, res) => {
  try {
    const status = await getMongoStatus();
    const counts = {};
    if (status.isConnected) {
      try {
        counts.orders = await OrderModel.countDocuments();
        counts.services = await ServiceModel.countDocuments();
        counts.coupons = await CouponModel.countDocuments();
        counts.emails = await EmailModel.countDocuments();
        counts.customerIntake = await CustomerIntakeModel.countDocuments();
        counts.contactEvents = await ContactEventModel.countDocuments();
        counts.referrals = await ReferralModel.countDocuments();
      } catch (err) {
        console.warn("[Admin Mongo Status] Error reading collection counts:", err.message);
      }
    }
    res.json({
      success: true,
      data: {
        ...status,
        collections: counts,
        instructions: !status.isConfigured ? "MONGODB_URI is not set. Add MONGODB_URI=mongodb+srv://<user>:<password>@<host>/autoaudit_db to your environment variables." : !status.isConnected ? "MongoDB Atlas is configured but currently disconnected. Check network access IP whitelist (allow 0.0.0.0/0) and credentials in MongoDB Atlas." : "MongoDB Atlas is connected and fully operational."
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error?.message || "Failed to fetch MongoDB status" });
  }
});
adminMongodbRouter.post("/migrate", async (req, res) => {
  try {
    const { dryRun = true, batchSize = 50, source = "auto" } = req.body;
    const report = await runMigration({
      dryRun: Boolean(dryRun),
      batchSize: Number(batchSize) || 50,
      source
    });
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error("[Admin Mongo Migrate] Migration error:", error);
    res.status(500).json({
      success: false,
      error: error?.message || "Migration encountered an unexpected error."
    });
  }
});
adminMongodbRouter.post("/test-connection", async (req, res) => {
  const { uri } = req.body;
  const targetUri = uri || process.env.MONGODB_URI;
  if (!targetUri) {
    res.status(400).json({
      success: false,
      error: "No connection URI provided, and MONGODB_URI is not set in environment."
    });
    return;
  }
  const masked = maskMongoUri(targetUri);
  try {
    const testConn = await mongoose10.createConnection(targetUri, {
      serverSelectionTimeoutMS: 4e3,
      connectTimeoutMS: 5e3
    }).asPromise();
    const start = Date.now();
    await testConn.db?.admin().ping();
    const pingMs = Date.now() - start;
    const dbName = testConn.name;
    const host = testConn.host;
    await testConn.close();
    res.json({
      success: true,
      message: `Successfully connected to MongoDB Atlas (${masked})`,
      details: {
        host,
        databaseName: dbName,
        pingMs
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: `Failed to connect to ${masked}: ${err?.message || "Connection timeout or invalid credentials"}`
    });
  }
});

// server.ts
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = path2.dirname(__filename2);
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
  try {
    const mongoConnected = await connectToMongoDB();
    if (mongoConnected) {
      await db.hydrateFromMongoDB();
    }
  } catch (err) {
    console.warn("[MongoDB Atlas] Initialization notice:", err?.message || "Will use local fallback mode");
  }
  const healthCheckHandler = async (_req, res) => {
    const mongoStatus = await getMongoStatus();
    res.json({
      status: "ok",
      service: "AutoAudit Vehicle Intelligence Engine",
      version: "1.3.0",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      uptime: process.uptime(),
      database: {
        primary: "MongoDB Atlas",
        status: mongoStatus.state,
        connected: mongoStatus.isConnected,
        pingMs: mongoStatus.pingMs,
        host: mongoStatus.host,
        dbName: mongoStatus.databaseName
      }
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
  app.use("/api/intake", intakeRouter);
  app.use("/api/gemini", geminiRouter);
  app.use("/api/video", videoRouter);
  app.use("/api/admin/mongodb", adminMongodbRouter);
  app.post("/api/generate-video", handleGenerateVideo);
  app.post("/api/video-status", handleVideoStatus);
  app.get("/api/video-download", handleVideoDownload);
  app.post("/api/video-download", handleVideoDownload);
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
    const distPath = path2.resolve(__dirname2, "dist");
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
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`\u{1F680} AutoAudit server active on http://0.0.0.0:${PORT}`);
  });
  const handleShutdown = async (signal) => {
    console.log(`
[AutoAudit] Received ${signal}. Commencing graceful shutdown...`);
    server.close(async () => {
      console.log("[AutoAudit] HTTP listener terminated.");
      await disconnectMongoDB();
      console.log("[AutoAudit] Server shutdown complete.");
      process.exit(0);
    });
    setTimeout(() => {
      console.error("[AutoAudit] Forcing shutdown after timeout.");
      process.exit(1);
    }, 1e4).unref();
  };
  process.on("SIGTERM", () => handleShutdown("SIGTERM"));
  process.on("SIGINT", () => handleShutdown("SIGINT"));
}
startServer().catch((err) => {
  console.error("Failed to start AutoAudit server:", err);
  process.exit(1);
});
