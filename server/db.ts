import { ServicePlan, Order, Coupon, EmailNotification, ContactEvent, WhatsAppConfig, ContactAnalyticsSummary } from '../src/types';
import { INITIAL_WHATSAPP_CONFIG, INITIAL_CONTACT_EVENTS } from '../src/data/initialData';
import { isSupabaseConfigured, supabaseDb, supabaseTableStatus } from './supabase';

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

// Backend Database Store with Supabase PostgreSQL Integration
class Database {
  private services: ServicePlan[] = [...INITIAL_SERVICES];
  private orders: Order[] = [...INITIAL_ORDERS];
  private coupons: Coupon[] = [...INITIAL_COUPONS];
  private emails: EmailNotification[] = [...INITIAL_EMAILS];
  private contactEvents: ContactEvent[] = [...INITIAL_CONTACT_EVENTS];
  private whatsAppConfig: WhatsAppConfig = { ...INITIAL_WHATSAPP_CONFIG };

  constructor() {
    this.hydrateFromSupabase();
  }

  // Hydrate in-memory cache from Supabase Postgres if keys are set
  async hydrateFromSupabase(): Promise<void> {
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
    } catch (e: any) {
      console.warn('[Database] Failed to hydrate from Supabase:', e?.message);
    }
  }

  getDatabaseStatus() {
    return {
      type: isSupabaseConfigured() ? 'Supabase PostgreSQL' : 'In-Memory DB (Local Fallback)',
      isSupabaseConnected: isSupabaseConfigured(),
      tablesReady: supabaseTableStatus.ordersReady && supabaseTableStatus.servicesReady,
      tableStatus: supabaseTableStatus,
      orderCount: this.orders.length,
      couponCount: this.coupons.length,
      emailCount: this.emails.length
    };
  }

  // Services
  getServices(): ServicePlan[] {
    return this.services;
  }

  getServiceById(id: string): ServicePlan | undefined {
    return this.services.find(s => s.id === id);
  }

  // Orders
  getOrders(): Order[] {
    return this.orders;
  }

  getOrderById(idOrNumber: string): Order | undefined {
    return this.orders.find(o => o.id === idOrNumber || o.orderNumber.toLowerCase() === idOrNumber.toLowerCase());
  }

  createOrder(order: Order): Order {
    this.orders.unshift(order);
    if (isSupabaseConfigured()) {
      supabaseDb.createOrder(order).catch(err => {
        console.error('[Database] Failed to sync order to Supabase:', err);
      });
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

    order.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'Admin Staff',
      action: `Status updated to ${status}`,
      details: note || undefined
    });

    if (status === 'Delivered' && !order.resultFile) {
      order.resultFile = {
        fileName: `AutoAudit_Report_${order.vehicle.vinOrReg}.pdf`,
        fileUrl: `/reports/AutoAudit_Report_${order.vehicle.vinOrReg}.pdf`,
        type: 'pdf',
        uploadedAt: new Date().toISOString()
      };
    }

    if (isSupabaseConfigured()) {
      supabaseDb.updateOrderStatus(orderId, status, note).catch(err => {
        console.error('[Database] Failed to sync status to Supabase:', err);
      });
    }

    return order;
  }

  updateOrderNotes(orderId: string, notes: string): Order | null {
    const order = this.getOrderById(orderId);
    if (!order) return null;

    order.internalNotes = notes;
    order.updatedAt = new Date().toISOString();
    order.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'Admin Specialist',
      action: 'Updated Internal Notes',
      details: 'Internal fulfillment comments updated'
    });

    if (isSupabaseConfigured()) {
      supabaseDb.updateOrderStatus(orderId, order.status, 'Internal notes updated').catch(() => {});
    }

    return order;
  }

  attachOrderReport(orderId: string, file: { fileName: string; fileUrl: string; type: 'pdf' | 'link' | 'html' }): Order | null {
    const order = this.getOrderById(orderId);
    if (!order) return null;

    order.resultFile = {
      ...file,
      uploadedAt: new Date().toISOString()
    };
    order.updatedAt = new Date().toISOString();
    order.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: 'Admin Specialist',
      action: 'Report Attached',
      details: `File attached: ${file.fileName}`
    });

    return order;
  }

  // Coupons
  getCoupons(): Coupon[] {
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
    const coupon = this.coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase());
    if (coupon) {
      coupon.usageCount += 1;
    }
  }

  // Emails
  getEmails(): EmailNotification[] {
    return this.emails;
  }

  addEmail(email: EmailNotification): void {
    this.emails.unshift(email);
    if (isSupabaseConfigured()) {
      supabaseDb.addEmail(email).catch(err => {
        console.error('[Database] Failed to sync email to Supabase:', err);
      });
    }
  }

  // Contact Events & Click-to-Chat Analytics
  getContactEvents(): ContactEvent[] {
    return this.contactEvents;
  }

  logContactEvent(eventData: Omit<ContactEvent, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): ContactEvent {
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
      deviceType: eventData.deviceType,
    };
    this.contactEvents.unshift(event);
    if (this.contactEvents.length > 500) {
      this.contactEvents = this.contactEvents.slice(0, 500);
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
    const conversionRateEstimate = events.length > 0
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
      recentEvents: events.slice(0, 50),
    };
  }

  getWhatsAppConfig(): WhatsAppConfig {
    return this.whatsAppConfig;
  }

  updateWhatsAppConfig(updates: Partial<WhatsAppConfig>): WhatsAppConfig {
    this.whatsAppConfig = {
      ...this.whatsAppConfig,
      ...updates,
    };
    return this.whatsAppConfig;
  }
}

export const db = new Database();
