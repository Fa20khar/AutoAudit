import {
  ServicePlan,
  Order,
  Coupon,
  EmailNotification,
  ContactEvent,
  WhatsAppConfig,
  ContactAnalyticsSummary,
  CustomerIntakeSubmission
} from '../src/types';
import { INITIAL_WHATSAPP_CONFIG, INITIAL_CONTACT_EVENTS } from '../src/data/initialData';
import {
  isMongoConnected,
  isMongoConfigured,
  getMongoStatus,
  OrderModel,
  ServiceModel,
  CouponModel,
  EmailModel,
  CustomerIntakeModel,
  ContactEventModel,
  WhatsAppConfigModel,
  ReferralModel
} from './mongodb';

// Pre-seeded Initial Data
export const INITIAL_SERVICES: ServicePlan[] = [
  {
    id: 'basic-report',
    name: 'Basic Report',
    tagline: 'Vehicle history overview, title check, and essential odometer records.',
    price: 18.99,
    originalPrice: 24.99,
    deliveryTime: 'Standard processing (1–2 hrs)',
    isPopular: false,
    requiredFields: ['VIN or Plate', 'Year / Make / Model', 'Email'],
    includedItems: [
      'Vehicle history overview',
      'Title information & state brand check',
      'Odometer information & rollback alerts',
      'Basic report details & technical specs'
    ],
    exclusions: [
      'Copart / Manheim Historical Auction Photos',
      'Detailed Insurance Collision Breakdown',
      'Priority Queue Assignment'
    ],
    active: true
  },
  {
    id: 'comprehensive-vin',
    name: 'Complete Report',
    tagline: 'Comprehensive vehicle history, title records, accidents, and salvage status.',
    price: 28.99,
    originalPrice: 38.99,
    deliveryTime: 'Expedited processing (30–45 mins)',
    isPopular: true,
    requiredFields: ['17-character VIN', 'Make / Model / Year', 'Email', 'Phone'],
    includedItems: [
      'Comprehensive vehicle history overview',
      'Title records across all 50 US states & Canada',
      'Accident information & structural integrity',
      'Odometer history & verified mileage timeline',
      'Salvage information & total loss write-offs',
      'Additional available records (recalls, liens, owners)'
    ],
    exclusions: [
      'Copart / Manheim Historical Auction Photo Archive'
    ],
    active: true
  },
  {
    id: 'premium-auction-audit',
    name: 'Premium Report',
    tagline: 'Extended vehicle history with historical salvage auction records and priority delivery.',
    price: 42.99,
    originalPrice: 59.99,
    deliveryTime: 'Priority processing (15–30 mins)',
    isPopular: false,
    requiredFields: ['17-character VIN', 'Make / Model / Year', 'Email', 'Phone'],
    includedItems: [
      'Everything in Complete Report',
      'Extended vehicle history & prior sale records',
      'Additional available records & historical bids',
      'Detailed report information & build options',
      'Priority processing queue assignment'
    ],
    exclusions: [],
    active: true
  }
];

export const INITIAL_COUPONS: Coupon[] = [
  {
    code: 'FAKHAR20',
    discountPercent: 20,
    usageCount: 14,
    maxUsage: 100,
    expiryDate: '2026-12-31',
    active: true
  },
  {
    code: 'WELCOME10',
    discountFixed: 5.0,
    usageCount: 29,
    maxUsage: 200,
    expiryDate: '2026-11-30',
    active: true
  },
  {
    code: 'SAVE15',
    discountPercent: 15,
    usageCount: 42,
    maxUsage: 500,
    expiryDate: '2026-12-31',
    active: true
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-10025',
    orderNumber: 'AA-10025',
    serviceId: 'comprehensive-vin',
    serviceName: 'Complete Report',
    status: 'Paid / New',
    subtotal: 28.99,
    discountAmount: 5.80,
    total: 23.19,
    couponCode: 'FAKHAR20',
    customer: {
      fullName: 'Hamza Tariq',
      email: 'hamza.tariq@example.com',
      phone: '+1 (555) 234-5678'
    },
    vehicle: {
      vinOrReg: '1HGCR2F83HA029381',
      isVin: true,
      make: 'Honda',
      model: 'Accord EX-L',
      year: 2017,
      mileage: '68,400 mi',
      countryOrState: 'TX',
      customerNotes: 'Checking salvage/flood record before signing purchase agreement.'
    },
    payment: {
      status: 'Paid',
      gatewayRef: 'ch_3N8k2vLkdIwP4m1019xZp90',
      paidAt: '2026-09-29T18:22:00Z',
      method: 'Card ending in 4242'
    },
    internalNotes: 'Payment verified. Ready for NMVTIS pull.',
    createdAt: '2026-09-29T18:20:12Z',
    updatedAt: '2026-09-29T18:22:00Z',
    auditLogs: [
      {
        id: 'log-1',
        timestamp: '2026-09-29T18:20:12Z',
        actor: 'Customer (Checkout)',
        action: 'Order Placed',
        details: 'Applied coupon FAKHAR20 (-20%).'
      },
      {
        id: 'log-2',
        timestamp: '2026-09-29T18:22:00Z',
        actor: 'Payment Gateway',
        action: 'Payment Successful',
        details: 'Captured $23.19 via Stripe.'
      }
    ]
  },
  {
    id: 'ord-10024',
    orderNumber: 'AA-10024',
    serviceId: 'premium-auction-audit',
    serviceName: 'Premium Report',
    status: 'Delivered',
    subtotal: 42.99,
    discountAmount: 0,
    total: 42.99,
    customer: {
      fullName: 'Sarah Jenkins',
      email: 'sjenkins.auto@gmail.com',
      phone: '+1 (555) 890-1234'
    },
    vehicle: {
      vinOrReg: '4T1B11HK5JU192837',
      isVin: true,
      make: 'Toyota',
      model: 'Camry SE',
      year: 2018,
      mileage: '54,200 mi',
      countryOrState: 'CA',
      customerNotes: 'Require salvage auction history if Copart records exist.'
    },
    payment: {
      status: 'Paid',
      gatewayRef: 'ch_3M7j1vBkdIwP3m0998aYp88',
      paidAt: '2026-09-29T14:10:00Z',
      method: 'Apple Pay'
    },
    internalNotes: 'Copart records verified. Report PDF delivered.',
    resultFile: {
      fileName: 'AutoAudit_Report_4T1B11HK5JU192837.pdf',
      fileUrl: '/reports/AutoAudit_Report_4T1B11HK5JU192837.pdf',
      type: 'pdf',
      uploadedAt: '2026-09-29T14:35:00Z'
    },
    createdAt: '2026-09-29T14:05:00Z',
    updatedAt: '2026-09-29T14:35:00Z',
    auditLogs: [
      {
        id: 'log-3',
        timestamp: '2026-09-29T14:05:00Z',
        actor: 'Customer',
        action: 'Order Placed'
      },
      {
        id: 'log-4',
        timestamp: '2026-09-29T14:35:00Z',
        actor: 'Admin (System)',
        action: 'Report Delivered',
        details: 'Sent dispatch email to customer.'
      }
    ]
  }
];

export const INITIAL_EMAILS: EmailNotification[] = [
  {
    id: 'em-101',
    orderId: 'ord-10025',
    orderNumber: 'AA-10025',
    recipientEmail: 'hamza.tariq@example.com',
    recipientType: 'customer',
    subject: 'Order Confirmed: Complete Report for 2017 Honda Accord (AA-10025)',
    type: 'order_confirmation',
    body: 'Thank you for your order! Your vehicle history audit is currently in the NMVTIS verification queue.',
    sentAt: '2026-09-29T18:22:05Z',
    read: true
  },
  {
    id: 'em-102',
    orderId: 'ord-10024',
    orderNumber: 'AA-10024',
    recipientEmail: 'sjenkins.auto@gmail.com',
    recipientType: 'customer',
    subject: 'Your AutoAudit Report is Ready (AA-10024)',
    type: 'report_ready',
    body: 'Your verified vehicle history report for 2018 Toyota Camry (VIN: 4T1B11HK5JU192837) is now available for download.',
    sentAt: '2026-09-29T14:35:10Z',
    read: true
  }
];

export const INITIAL_INTAKE_SUBMISSIONS: CustomerIntakeSubmission[] = [
  {
    id: 'intake-1001',
    submissionNumber: 'REQ-10021',
    timestamp: '2026-10-04T19:30:00Z',
    fullName: 'Fakhar Zaman',
    email: 'realfakharzaman9@gmail.com',
    phone: '+92 300 1234567',
    country: 'Pakistan',
    preferredContactMethod: 'WhatsApp',
    vinOrChassis: '1HGCR2F83HA109284',
    registrationPlate: 'LEA-21-4920',
    make: 'Honda',
    model: 'Accord',
    modelYear: 2017,
    vehicleColor: 'Silver',
    currentMileage: '68,400 mi',
    countryOfRegistration: 'United States',
    reportType: 'Complete Vehicle History Report',
    reasonForRequest: 'Considering purchasing a vehicle',
    purchaseStatus: 'Planning to purchase',
    additionalNotes: 'Please verify if there are any auction accident photos from Copart or Manheim.',
    documentFileName: 'auction_slip_sample.jpg',
    documentFileSize: '1.4 MB',
    accuracyConfirmed: true,
    dataUsageConsent: true,
    termsAgreed: true,
    status: 'Report Generated',
    autoGeneratedOrderId: 'ord-10025',
    autoGeneratedReportUrl: '/api/reports/download/ord-10025',
    internalNotes: 'Auto-generated report delivered via WhatsApp & Email.'
  },
  {
    id: 'intake-1002',
    submissionNumber: 'REQ-10022',
    timestamp: '2026-10-05T04:15:00Z',
    fullName: 'Tariq Al-Mansoor',
    email: 'tariq.mansoor@uaebiz.ae',
    phone: '+971 50 987 6543',
    country: 'United Arab Emirates',
    preferredContactMethod: 'Email',
    vinOrChassis: '4T1B11HK5JU192837',
    registrationPlate: 'DXB-K-8812',
    make: 'Toyota',
    model: 'Camry',
    modelYear: 2018,
    vehicleColor: 'White',
    currentMileage: '54,200 mi',
    countryOfRegistration: 'United States',
    reportType: 'Accident / Damage History',
    reasonForRequest: 'Verifying a vehicle I already own',
    purchaseStatus: 'Already owned',
    additionalNotes: 'Need total loss and insurance write-off certification.',
    accuracyConfirmed: true,
    dataUsageConsent: true,
    termsAgreed: true,
    status: 'Received',
    internalNotes: 'Pending NMVTIS clearinghouse queue verification.'
  }
];

// Backend Database Access Layer with MongoDB Atlas primary support
class Database {
  private services: ServicePlan[] = [...INITIAL_SERVICES];
  private orders: Order[] = [...INITIAL_ORDERS];
  private coupons: Coupon[] = [...INITIAL_COUPONS];
  private emails: EmailNotification[] = [...INITIAL_EMAILS];
  private contactEvents: ContactEvent[] = [...INITIAL_CONTACT_EVENTS];
  private whatsAppConfig: WhatsAppConfig = { ...INITIAL_WHATSAPP_CONFIG };
  private intakeSubmissions: CustomerIntakeSubmission[] = [...INITIAL_INTAKE_SUBMISSIONS];
  private isHydratedFromMongo = false;

  constructor() {}

  /**
   * Synchronizes and seeds initial collections in MongoDB Atlas if they are currently empty
   */
  async hydrateFromMongoDB(): Promise<void> {
    if (!isMongoConnected()) return;
    try {
      // 1. Services
      const dbServices = await ServiceModel.find().lean();
      if (dbServices.length > 0) {
        this.services = dbServices as any;
      } else {
        await ServiceModel.insertMany(INITIAL_SERVICES);
        console.log(`[MongoDB Atlas] Initialized ${INITIAL_SERVICES.length} service plans.`);
      }

      // 2. Coupons
      const dbCoupons = await CouponModel.find().lean();
      if (dbCoupons.length > 0) {
        this.coupons = dbCoupons as any;
      } else {
        await CouponModel.insertMany(INITIAL_COUPONS);
        console.log(`[MongoDB Atlas] Initialized ${INITIAL_COUPONS.length} promotional coupons.`);
      }

      // 3. Orders
      const dbOrders = await OrderModel.find().sort({ createdAt: -1 }).lean();
      if (dbOrders.length > 0) {
        this.orders = dbOrders as any;
        console.log(`[MongoDB Atlas] Hydrated ${dbOrders.length} orders from Atlas collection.`);
      } else {
        await OrderModel.insertMany(INITIAL_ORDERS);
        console.log(`[MongoDB Atlas] Seeded ${INITIAL_ORDERS.length} sample orders.`);
      }

      // 4. Emails
      const dbEmails = await EmailModel.find().sort({ sentAt: -1 }).lean();
      if (dbEmails.length > 0) {
        this.emails = dbEmails as any;
      } else {
        await EmailModel.insertMany(INITIAL_EMAILS);
      }

      // 5. Intake submissions
      const dbIntake = await CustomerIntakeModel.find().sort({ timestamp: -1 }).lean();
      if (dbIntake.length > 0) {
        this.intakeSubmissions = dbIntake as any;
      } else {
        await CustomerIntakeModel.insertMany(INITIAL_INTAKE_SUBMISSIONS);
      }

      // 6. WhatsApp configuration
      const dbConfig = await WhatsAppConfigModel.findOne({ key: 'global' }).lean();
      if (dbConfig) {
        this.whatsAppConfig = dbConfig as any;
      } else {
        await WhatsAppConfigModel.create({ key: 'global', ...INITIAL_WHATSAPP_CONFIG });
      }

      this.isHydratedFromMongo = true;
      console.log('[MongoDB Atlas] Application state synchronized with Atlas database.');
    } catch (err: any) {
      console.warn('[MongoDB Atlas] Hydration notice:', err?.message);
    }
  }

  async getDatabaseStatus() {
    const mongoStatus = await getMongoStatus();
    return {
      primaryDatabase: 'MongoDB Atlas',
      isMongoConfigured: mongoStatus.isConfigured,
      isMongoConnected: mongoStatus.isConnected,
      mongoStatus,
      fallbackDatabase: 'AutoAudit High-Speed Local Repository (Zero Cloud Dependency)',
      orderCount: isMongoConnected() ? await OrderModel.countDocuments() : this.orders.length,
      couponCount: isMongoConnected() ? await CouponModel.countDocuments() : this.coupons.length,
      emailCount: isMongoConnected() ? await EmailModel.countDocuments() : this.emails.length,
      serviceCount: isMongoConnected() ? await ServiceModel.countDocuments() : this.services.length,
      intakeCount: isMongoConnected() ? await CustomerIntakeModel.countDocuments() : this.intakeSubmissions.length
    };
  }

  // Services
  getServices(): ServicePlan[] {
    return this.services;
  }

  async getServicesAsync(): Promise<ServicePlan[]> {
    if (isMongoConnected()) {
      try {
        const list = await ServiceModel.find({ active: true }).lean();
        if (list.length > 0) {
          this.services = list as any;
          return this.services;
        }
      } catch (e: any) {
        console.warn('[Database] MongoDB getServices error, using cache:', e.message);
      }
    }
    return this.services;
  }

  getServiceById(id: string): ServicePlan | undefined {
    return this.services.find(s => s.id === id);
  }

  async getServiceByIdAsync(id: string): Promise<ServicePlan | undefined> {
    if (isMongoConnected()) {
      try {
        const item = await ServiceModel.findOne({ id }).lean();
        if (item) return item as any;
      } catch {
        // fallback
      }
    }
    return this.getServiceById(id);
  }

  // Orders
  getOrders(): Order[] {
    return this.orders;
  }

  async getOrdersAsync(filter?: { email?: string; status?: string; search?: string }): Promise<Order[]> {
    if (isMongoConnected()) {
      try {
        const query: any = {};
        if (filter?.email) {
          query['customer.email'] = filter.email.trim().toLowerCase();
        }
        if (filter?.status && filter.status !== 'all') {
          query.status = filter.status;
        }
        if (filter?.search) {
          const term = filter.search.trim();
          query.$or = [
            { orderNumber: new RegExp(term, 'i') },
            { 'customer.fullName': new RegExp(term, 'i') },
            { 'customer.email': new RegExp(term, 'i') },
            { 'vehicle.vinOrReg': new RegExp(term, 'i') },
            { 'vehicle.make': new RegExp(term, 'i') },
            { 'vehicle.model': new RegExp(term, 'i') }
          ];
        }
        const dbOrders = await OrderModel.find(query).sort({ createdAt: -1 }).lean();
        return dbOrders as any;
      } catch (err: any) {
        console.warn('[Database] MongoDB getOrders error, falling back to cache:', err.message);
      }
    }

    let orders = this.orders;
    if (filter?.email) {
      const cleanEmail = filter.email.trim().toLowerCase();
      orders = orders.filter(o => o.customer.email.toLowerCase() === cleanEmail);
    }
    if (filter?.status && filter.status !== 'all') {
      orders = orders.filter(o => o.status.toLowerCase() === filter.status!.toLowerCase());
    }
    if (filter?.search) {
      const term = filter.search.trim().toLowerCase();
      orders = orders.filter(o =>
        o.orderNumber.toLowerCase().includes(term) ||
        o.customer.fullName.toLowerCase().includes(term) ||
        o.customer.email.toLowerCase().includes(term) ||
        o.vehicle.vinOrReg.toLowerCase().includes(term) ||
        o.vehicle.make.toLowerCase().includes(term) ||
        o.vehicle.model.toLowerCase().includes(term)
      );
    }
    return orders;
  }

  getOrderById(idOrNumber: string): Order | undefined {
    return this.orders.find(o => o.id === idOrNumber || o.orderNumber.toLowerCase() === idOrNumber.toLowerCase());
  }

  async getOrderByIdAsync(idOrNumber: string): Promise<Order | undefined> {
    if (isMongoConnected()) {
      try {
        const order = await OrderModel.findOne({
          $or: [{ id: idOrNumber }, { orderNumber: idOrNumber.toUpperCase() }]
        }).lean();
        if (order) return order as any;
      } catch (err: any) {
        console.warn('[Database] MongoDB getOrderById error, using cache:', err.message);
      }
    }
    return this.getOrderById(idOrNumber);
  }

  createOrder(order: Order): Order {
    this.orders.unshift(order);
    if (isMongoConnected()) {
      OrderModel.create(order).catch(err => {
        console.error('[Database] Failed to save order to MongoDB Atlas:', err.message);
      });
    }
    return order;
  }

  async createOrderAsync(order: Order): Promise<Order> {
    this.orders.unshift(order);
    if (isMongoConnected()) {
      try {
        await OrderModel.create(order);
      } catch (err: any) {
        console.error('[Database] Error persisting order to MongoDB Atlas:', err.message);
      }
    }
    return order;
  }

  updateOrderStatus(orderId: string, status: Order['status'], note?: string): Order | null {
    const order = this.getOrderById(orderId);
    if (!order) return null;

    order.status = status;
    order.updatedAt = new Date().toISOString();

    if (note) {
      order.internalNotes = order.internalNotes ? `${order.internalNotes}\n${note}` : note;
    }

    const logEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'Admin Staff',
      action: `Status updated to ${status}`,
      details: note || undefined
    };
    order.auditLogs.unshift(logEntry);

    if (status === 'Delivered' && !order.resultFile) {
      order.resultFile = {
        fileName: `AutoAudit_Report_${order.vehicle.vinOrReg}.pdf`,
        fileUrl: `/reports/AutoAudit_Report_${order.vehicle.vinOrReg}.pdf`,
        type: 'pdf',
        uploadedAt: new Date().toISOString()
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
      ).catch(err => console.error('[Database] MongoDB status sync error:', err.message));
    }

    return order;
  }

  async updateOrderStatusAsync(orderId: string, status: Order['status'], note?: string): Promise<Order | null> {
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
      } catch (err: any) {
        console.error('[Database] MongoDB async status sync error:', err.message);
      }
    }
    return order;
  }

  updateOrderPaymentStatus(
    orderId: string,
    paymentStatus: 'Paid' | 'Pending' | 'Failed' | 'Refunded',
    adminActor = 'Staff Administrator',
    notes?: string
  ): Order | null {
    const order = this.getOrderById(orderId);
    if (!order) return null;

    const now = new Date().toISOString();
    order.payment = {
      ...order.payment,
      status: paymentStatus,
      paidAt: paymentStatus === 'Paid' ? now : undefined
    };
    if (paymentStatus === 'Paid' && order.status === 'Pending') {
      order.status = 'Paid / New';
    }
    order.updatedAt = now;
    if (notes) {
      order.internalNotes = order.internalNotes ? `${order.internalNotes}\n${notes}` : notes;
    }

    const logEntry = {
      id: `log-${Date.now()}-payment`,
      timestamp: now,
      actor: adminActor,
      action: paymentStatus === 'Paid' ? 'Payment Verified & Approved' : `Payment Status Changed to ${paymentStatus}`,
      details: notes || `Admin ${adminActor} updated payment status to ${paymentStatus} for $${order.total.toFixed(2)}.`
    };
    order.auditLogs.unshift(logEntry);

    if (isMongoConnected()) {
      OrderModel.updateOne(
        { $or: [{ id: orderId }, { orderNumber: orderId }] },
        {
          $set: {
            'payment.status': paymentStatus,
            'payment.paidAt': order.payment.paidAt,
            status: order.status,
            updatedAt: order.updatedAt,
            internalNotes: order.internalNotes
          },
          $push: { auditLogs: { $each: [logEntry], $position: 0 } }
        }
      ).catch(err => console.error('[Database] MongoDB payment status sync error:', err.message));
    }

    return order;
  }

  async updateOrderPaymentStatusAsync(
    orderId: string,
    paymentStatus: 'Paid' | 'Pending' | 'Failed' | 'Refunded',
    adminActor = 'Staff Administrator',
    notes?: string
  ): Promise<Order | null> {
    const order = this.updateOrderPaymentStatus(orderId, paymentStatus, adminActor, notes);
    if (order && isMongoConnected()) {
      try {
        await OrderModel.updateOne(
          { $or: [{ id: orderId }, { orderNumber: orderId }] },
          {
            $set: {
              'payment.status': paymentStatus,
              'payment.paidAt': order.payment.paidAt,
              status: order.status,
              updatedAt: order.updatedAt,
              internalNotes: order.internalNotes
            }
          }
        );
      } catch (err: any) {
        console.error('[Database] MongoDB async payment sync error:', err.message);
      }
    }
    return order;
  }

  updateOrderNotes(orderId: string, notes: string): Order | null {
    const order = this.getOrderById(orderId);
    if (!order) return null;

    order.internalNotes = notes;
    order.updatedAt = new Date().toISOString();
    const logEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'Admin Specialist',
      action: 'Updated Internal Notes',
      details: 'Internal fulfillment comments updated'
    };
    order.auditLogs.unshift(logEntry);

    if (isMongoConnected()) {
      OrderModel.updateOne(
        { $or: [{ id: orderId }, { orderNumber: orderId }] },
        {
          $set: { internalNotes: notes, updatedAt: order.updatedAt },
          $push: { auditLogs: { $each: [logEntry], $position: 0 } }
        }
      ).catch(() => {});
    }

    return order;
  }

  attachOrderReport(
    orderId: string,
    file: { fileName: string; fileUrl: string; type: 'pdf' | 'link' | 'html' },
    actor: string = 'Admin Specialist'
  ): Order | null {
    const order = this.getOrderById(orderId);
    if (!order) return null;

    order.resultFile = {
      ...file,
      uploadedAt: new Date().toISOString()
    };
    order.updatedAt = new Date().toISOString();
    const logEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor,
      action: 'Report Attached',
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
      ).catch(() => {});
    }

    return order;
  }

  // Coupons
  getCoupons(): Coupon[] {
    return this.coupons;
  }

  async getCouponsAsync(): Promise<Coupon[]> {
    if (isMongoConnected()) {
      try {
        const list = await CouponModel.find().lean();
        if (list.length > 0) {
          this.coupons = list as any;
          return this.coupons;
        }
      } catch (err: any) {
        console.warn('[Database] MongoDB getCoupons error:', err.message);
      }
    }
    return this.coupons;
  }

  validateCoupon(code: string): { valid: boolean; coupon?: Coupon; error?: string } {
    const cleanCode = code.trim().toUpperCase();
    const coupon = this.coupons.find(c => c.code.toUpperCase() === cleanCode);

    if (!coupon) {
      return { valid: false, error: 'Promo code not recognized or invalid' };
    }
    if (!coupon.active) {
      return { valid: false, error: 'Promo code is inactive' };
    }
    if (coupon.maxUsage && coupon.usageCount >= coupon.maxUsage) {
      return { valid: false, error: 'Promo code usage limit reached' };
    }
    if (new Date(coupon.expiryDate) < new Date()) {
      return { valid: false, error: 'Promo code has expired' };
    }

    return { valid: true, coupon };
  }

  incrementCouponUsage(code: string): void {
    const cleanCode = code.trim().toUpperCase();
    const coupon = this.coupons.find(c => c.code.toUpperCase() === cleanCode);
    if (coupon) {
      coupon.usageCount += 1;
    }
    if (isMongoConnected()) {
      CouponModel.updateOne({ code: cleanCode }, { $inc: { usageCount: 1 } }).catch(() => {});
    }
  }

  // Emails
  getEmails(): EmailNotification[] {
    return this.emails;
  }

  async getEmailsAsync(query?: { email?: string; orderNumber?: string }): Promise<EmailNotification[]> {
    if (isMongoConnected()) {
      try {
        const filter: any = {};
        if (query?.email) filter.recipientEmail = query.email.trim().toLowerCase();
        if (query?.orderNumber) filter.orderNumber = query.orderNumber.trim().toUpperCase();

        const list = await EmailModel.find(filter).sort({ sentAt: -1 }).lean();
        return list as any;
      } catch (err: any) {
        console.warn('[Database] MongoDB getEmails error:', err.message);
      }
    }

    let emails = this.emails;
    if (query?.email) {
      const cleanEmail = query.email.trim().toLowerCase();
      emails = emails.filter(e => e.recipientEmail.toLowerCase() === cleanEmail);
    }
    if (query?.orderNumber) {
      const cleanNum = query.orderNumber.trim().toUpperCase();
      emails = emails.filter(e => e.orderNumber.toUpperCase() === cleanNum);
    }
    return emails;
  }

  addEmail(email: EmailNotification): void {
    this.emails.unshift(email);
    if (isMongoConnected()) {
      EmailModel.create(email).catch(err => {
        console.error('[Database] Failed to save email to MongoDB Atlas:', err.message);
      });
    }
  }

  // Contact Events & Click-to-Chat Analytics
  getContactEvents(): ContactEvent[] {
    return this.contactEvents;
  }

  async getContactEventsAsync(): Promise<ContactEvent[]> {
    if (isMongoConnected()) {
      try {
        const list = await ContactEventModel.find().sort({ timestamp: -1 }).limit(100).lean();
        return list as any;
      } catch (err: any) {
        console.warn('[Database] MongoDB getContactEvents error:', err.message);
      }
    }
    return this.contactEvents;
  }

  logContactEvent(
    eventData: Omit<ContactEvent, 'id' | 'timestamp'> & { id?: string; timestamp?: string }
  ): ContactEvent {
    const event: ContactEvent = {
      id: eventData.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: eventData.timestamp || new Date().toISOString(),
      channel: eventData.channel || 'whatsapp',
      source: eventData.source || 'floating_widget',
      intent: eventData.intent || 'general_support',
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
      ContactEventModel.create(event).catch(err => {
        console.warn('[Database] Failed to log contact event to MongoDB Atlas:', err.message);
      });
    }

    return event;
  }

  getContactSummary(): ContactAnalyticsSummary {
    const events = this.contactEvents;
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const clicksLast24h = events.filter(e => new Date(e.timestamp).getTime() >= oneDayAgo).length;
    const clicksLast7d = events.filter(e => new Date(e.timestamp).getTime() >= sevenDaysAgo).length;

    const bySource: Record<string, number> = {};
    const byIntent: Record<string, number> = {};
    const byChannel: Record<string, number> = {};

    for (const e of events) {
      bySource[e.source] = (bySource[e.source] || 0) + 1;
      byIntent[e.intent] = (byIntent[e.intent] || 0) + 1;
      byChannel[e.channel] = (byChannel[e.channel] || 0) + 1;
    }

    const topSource = Object.entries(bySource).sort((a, b) => b[1] - a[1])[0]?.[0] || 'floating_widget';
    const topIntent = Object.entries(byIntent).sort((a, b) => b[1] - a[1])[0]?.[0] || 'vin_check';

    const totalOrders = this.orders.length;
    const conversionRateEstimate =
      events.length > 0
        ? Math.min(100, Math.round((totalOrders / Math.max(events.length, 1)) * 38))
        : 32;

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

  getWhatsAppConfig(): WhatsAppConfig {
    return this.whatsAppConfig;
  }

  updateWhatsAppConfig(updates: Partial<WhatsAppConfig>): WhatsAppConfig {
    this.whatsAppConfig = {
      ...this.whatsAppConfig,
      ...updates
    };

    if (isMongoConnected()) {
      WhatsAppConfigModel.updateOne(
        { key: 'global' },
        { $set: updates },
        { upsert: true }
      ).catch(() => {});
    }

    return this.whatsAppConfig;
  }

  // Customer Intake Form Submissions
  getIntakeSubmissions(): CustomerIntakeSubmission[] {
    return this.intakeSubmissions;
  }

  async getIntakeSubmissionsAsync(filters?: { email?: string; status?: string }): Promise<CustomerIntakeSubmission[]> {
    if (isMongoConnected()) {
      try {
        const query: any = {};
        if (filters?.email) query.email = filters.email.trim().toLowerCase();
        if (filters?.status && filters.status !== 'All') query.status = filters.status;
        const list = await CustomerIntakeModel.find(query).sort({ timestamp: -1 }).lean();
        return list as any;
      } catch (err: any) {
        console.warn('[Database] MongoDB getIntakeSubmissions error:', err.message);
      }
    }

    let list = this.intakeSubmissions;
    if (filters?.email) {
      const cleanEmail = filters.email.trim().toLowerCase();
      list = list.filter(item => item.email.toLowerCase() === cleanEmail);
    }
    if (filters?.status && filters.status !== 'All') {
      list = list.filter(item => item.status.toLowerCase() === filters.status!.toLowerCase());
    }
    return list;
  }

  getIntakeSubmissionById(id: string): CustomerIntakeSubmission | undefined {
    return this.intakeSubmissions.find(s => s.id === id || s.submissionNumber === id);
  }

  createIntakeSubmission(submission: CustomerIntakeSubmission): CustomerIntakeSubmission {
    this.intakeSubmissions.unshift(submission);
    if (this.intakeSubmissions.length > 500) {
      this.intakeSubmissions = this.intakeSubmissions.slice(0, 500);
    }

    if (isMongoConnected()) {
      CustomerIntakeModel.create(submission).catch(err => {
        console.error('[Database] Failed to save intake submission to MongoDB Atlas:', err.message);
      });
    }

    return submission;
  }

  async createIntakeSubmissionAsync(submission: CustomerIntakeSubmission): Promise<CustomerIntakeSubmission> {
    this.intakeSubmissions.unshift(submission);
    if (isMongoConnected()) {
      try {
        await CustomerIntakeModel.create(submission);
      } catch (err: any) {
        console.error('[Database] Error persisting intake submission to Atlas:', err.message);
      }
    }
    return submission;
  }

  updateIntakeSubmission(id: string, updates: Partial<CustomerIntakeSubmission>): CustomerIntakeSubmission | null {
    const item = this.getIntakeSubmissionById(id);
    if (!item) return null;

    Object.assign(item, updates);

    if (isMongoConnected()) {
      CustomerIntakeModel.updateOne(
        { $or: [{ id }, { submissionNumber: id }] },
        { $set: updates }
      ).catch(() => {});
    }

    return item;
  }
}

export const db = new Database();
