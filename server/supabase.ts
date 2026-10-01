import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Order, ServicePlan, Coupon, EmailNotification } from '../src/types';

// Retrieve credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseKey && supabaseUrl.startsWith('https://'));
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    })
  : null;

// Track status of tables in the connected Supabase project
export const supabaseTableStatus = {
  ordersReady: true,
  servicesReady: true,
  couponsReady: true,
  emailsReady: true
};

const warnedMissingTables = new Set<string>();

/**
 * Checks whether an error is due to a missing table in Supabase PostgREST
 */
function isTableMissingError(error: any): boolean {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  const code = error.code || '';
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    msg.includes('could not find the table') ||
    msg.includes('schema cache') ||
    (msg.includes('relation') && msg.includes('does not exist'))
  );
}

/**
 * Gracefully handles table errors without polluting console with fatal error alerts
 */
function handleTableError(tableName: string, operation: string, error: any) {
  if (isTableMissingError(error)) {
    if (tableName === 'orders') supabaseTableStatus.ordersReady = false;
    if (tableName === 'services') supabaseTableStatus.servicesReady = false;
    if (tableName === 'coupons') supabaseTableStatus.couponsReady = false;
    if (tableName === 'emails') supabaseTableStatus.emailsReady = false;

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
  console.log('[Database] Supabase credentials not set in environment. Running in local high-speed memory mode with browser persistence.');
}

/**
 * Supabase Postgres Adapter Functions
 */
export const supabaseDb = {
  // Health & Schema check
  async checkTablesHealth(): Promise<typeof supabaseTableStatus> {
    if (!supabase) return supabaseTableStatus;
    try {
      const { error: oErr } = await supabase.from('orders').select('id').limit(1);
      supabaseTableStatus.ordersReady = !isTableMissingError(oErr);

      const { error: sErr } = await supabase.from('services').select('id').limit(1);
      supabaseTableStatus.servicesReady = !isTableMissingError(sErr);

      const { error: cErr } = await supabase.from('coupons').select('code').limit(1);
      supabaseTableStatus.couponsReady = !isTableMissingError(cErr);

      const { error: eErr } = await supabase.from('emails').select('id').limit(1);
      supabaseTableStatus.emailsReady = !isTableMissingError(eErr);
    } catch {
      // ignore
    }
    return supabaseTableStatus;
  },

  // Orders
  async getOrders(): Promise<Order[] | null> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        handleTableError('orders', 'fetch', error);
        return null;
      }

      supabaseTableStatus.ordersReady = true;
      return (data || []).map(mapOrderRowToOrder);
    } catch (err: any) {
      handleTableError('orders', 'fetch', err);
      return null;
    }
  },

  async getOrderById(id: string): Promise<Order | null> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(`id.eq.${id},order_number.eq.${id}`)
        .single();

      if (error) {
        handleTableError('orders', 'fetchById', error);
        return null;
      }

      supabaseTableStatus.ordersReady = true;
      if (!data) return null;
      return mapOrderRowToOrder(data);
    } catch (err: any) {
      handleTableError('orders', 'fetchById', err);
      return null;
    }
  },

  async createOrder(order: Order): Promise<boolean> {
    if (!supabase) return false;

    try {
      const row = mapOrderToOrderRow(order);
      const { error } = await supabase.from('orders').insert([row]);
      if (error) {
        handleTableError('orders', 'insert', error);
        return false;
      }
      supabaseTableStatus.ordersReady = true;
      return true;
    } catch (err: any) {
      handleTableError('orders', 'insert', err);
      return false;
    }
  },

  async updateOrderStatus(id: string, status: string, note?: string): Promise<Order | null> {
    if (!supabase || !supabaseTableStatus.ordersReady) return null;

    try {
      const existing = await this.getOrderById(id);
      if (!existing) return null;

      const now = new Date().toISOString();
      const updatedNotes = note
        ? `${existing.internalNotes ? existing.internalNotes + '\n' : ''}${note}`
        : existing.internalNotes;

      const newLog = {
        id: `log-${Date.now()}`,
        timestamp: now,
        actor: 'Admin Staff',
        action: `Status updated to ${status}`,
        details: note || `Status changed from ${existing.status} to ${status}`
      };

      const updatedLogs = [newLog, ...(existing.auditLogs || [])];
      const resultFile = status === 'Delivered' ? {
        fileName: `AutoAudit_Report_${existing.vehicle.vinOrReg}.pdf`,
        fileUrl: `/reports/AutoAudit_Report_${existing.vehicle.vinOrReg}.pdf`,
        type: 'pdf' as const,
        uploadedAt: now
      } : existing.resultFile;

      const { data, error } = await supabase
        .from('orders')
        .update({
          status,
          internal_notes: updatedNotes,
          audit_logs: updatedLogs,
          result_file: resultFile,
          updated_at: now
        })
        .or(`id.eq.${id},order_number.eq.${id}`)
        .select()
        .single();

      if (error) {
        handleTableError('orders', 'updateStatus', error);
        return null;
      }

      if (!data) return null;
      return mapOrderRowToOrder(data);
    } catch (err: any) {
      handleTableError('orders', 'updateStatus', err);
      return null;
    }
  },

  // Services
  async getServices(): Promise<ServicePlan[] | null> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase.from('services').select('*').order('price', { ascending: true });
      if (error) {
        handleTableError('services', 'fetch', error);
        return null;
      }
      supabaseTableStatus.servicesReady = true;
      if (!data) return null;
      return data.map((s) => ({
        id: s.id,
        name: s.name,
        price: Number(s.price),
        originalPrice: s.original_price ? Number(s.original_price) : undefined,
        deliveryTime: s.delivery_time,
        badge: s.badge || undefined,
        popular: s.popular || false,
        description: s.description,
        features: Array.isArray(s.features) ? s.features : []
      }));
    } catch (err: any) {
      handleTableError('services', 'fetch', err);
      return null;
    }
  },

  // Coupons
  async getCoupons(): Promise<Coupon[] | null> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase.from('coupons').select('*');
      if (error) {
        handleTableError('coupons', 'fetch', error);
        return null;
      }
      supabaseTableStatus.couponsReady = true;
      if (!data) return null;
      return data.map((c) => ({
        code: c.code,
        discountPercent: c.discount_percent || 0,
        discountFixed: c.discount_fixed ? Number(c.discount_fixed) : undefined,
        expiryDate: c.expiry_date,
        active: c.active,
        usageCount: c.usage_count || 0
      }));
    } catch (err: any) {
      handleTableError('coupons', 'fetch', err);
      return null;
    }
  },

  // Emails
  async getEmails(): Promise<EmailNotification[] | null> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('emails')
        .select('*')
        .order('sent_at', { ascending: false });

      if (error) {
        handleTableError('emails', 'fetch', error);
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
    } catch (err: any) {
      handleTableError('emails', 'fetch', err);
      return null;
    }
  },

  async addEmail(email: EmailNotification): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { error } = await supabase.from('emails').insert([{
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
        handleTableError('emails', 'insert', error);
        return false;
      }
      return true;
    } catch (err: any) {
      handleTableError('emails', 'insert', err);
      return false;
    }
  }
};

/**
 * Helpers to transform DB Rows <-> TypeScript Objects
 */
function mapOrderToOrderRow(o: Order) {
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
    customer_phone: o.customer.phone || '',
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

function mapOrderRowToOrder(r: any): Order {
  return {
    id: r.id,
    orderNumber: r.order_number,
    serviceId: r.service_id,
    serviceName: r.service_name,
    status: r.status,
    subtotal: Number(r.subtotal),
    discountAmount: Number(r.discount_amount || 0),
    total: Number(r.total),
    couponCode: r.coupon_code || undefined,
    customer: {
      fullName: r.customer_full_name,
      email: r.customer_email,
      phone: r.customer_phone || '',
      smsNotifications: r.sms_notifications ?? true
    },
    smsNotifications: r.sms_notifications ?? true,
    vehicle: {
      vinOrReg: r.vehicle_vin_or_reg,
      isVin: r.is_vin ?? true,
      make: r.vehicle_make || '',
      model: r.vehicle_model || '',
      year: r.vehicle_year || 2020,
      mileage: r.vehicle_mileage || 'Pending',
      countryOrState: r.vehicle_country_state || 'US',
      customerNotes: r.customer_notes || undefined
    },
    payment: {
      status: r.payment_status || 'Paid',
      gatewayRef: r.payment_gateway_ref || '',
      paidAt: r.paid_at || r.created_at,
      method: r.payment_method || 'Credit Card'
    },
    internalNotes: r.internal_notes || '',
    resultFile: r.result_file || undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    auditLogs: Array.isArray(r.audit_logs) ? r.audit_logs : []
  };
}
