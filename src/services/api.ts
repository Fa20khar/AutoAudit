import { Order, ServicePlan, Coupon, EmailNotification, ContactEvent, ContactAnalyticsSummary, WhatsAppConfig, CustomerIntakeSubmission } from '../types';

/**
 * Custom Error class with HTTP status code and timeout details
 */
export class ApiError extends Error {
  public status: number;
  public isTimeout: boolean;
  public details?: any;

  constructor(message: any, status: number = 500, isTimeout: boolean = false, details?: any) {
    let cleanMsg = 'An unexpected API error occurred.';
    if (typeof message === 'string' && message !== '[object Object]') {
      cleanMsg = message;
    } else if (message && typeof message === 'object') {
      cleanMsg = message.message || message.error || message.details || JSON.stringify(message);
    }
    super(cleanMsg);
    this.name = 'ApiError';
    this.status = status;
    this.isTimeout = isTimeout;
    this.details = details;
  }
}

const DEFAULT_TIMEOUT_MS = 10000; // 10 seconds

/**
 * Helper to perform HTTP fetch requests with timeout and structured error handling
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const adminToken = typeof window !== 'undefined' ? sessionStorage.getItem('autoaudit_admin_token') : null;

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(adminToken ? { 'x-admin-token': adminToken } : {}),
    ...(options.headers as Record<string, string> || {})
  };

  if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers,
      signal: controller.signal
    });

    // Parse JSON response body if present
    let jsonResponse: any = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        jsonResponse = await response.json();
      } catch (e) {
        jsonResponse = null;
      }
    }

    if (!response.ok) {
      let errorMessage = `Request to ${endpoint} failed with status ${response.status} (${response.statusText})`;

      if (typeof jsonResponse?.error === 'string') {
        errorMessage = jsonResponse.error;
      } else if (typeof jsonResponse?.error?.message === 'string') {
        errorMessage = jsonResponse.error.message;
      } else if (typeof jsonResponse?.message === 'string') {
        errorMessage = jsonResponse.message;
      } else if (typeof jsonResponse?.details === 'string') {
        errorMessage = jsonResponse.details;
      } else if (jsonResponse?.error && typeof jsonResponse.error === 'object') {
        try {
          errorMessage = jsonResponse.error.message || JSON.stringify(jsonResponse.error);
        } catch {
          // fallback
        }
      }
      
      throw new ApiError(errorMessage, response.status, false, jsonResponse);
    }

    return jsonResponse as T;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Check for AbortController timeout
    if (error?.name === 'AbortError' || controller.signal.aborted) {
      throw new ApiError(
        `Request timed out after ${timeoutMs / 1000}s while contacting the AutoAudit backend server.`,
        408,
        true
      );
    }

    // Network connection / DNS / Offline errors
    throw new ApiError(
      error?.message || 'Network error encountered while communicating with the server.',
      0,
      false,
      error
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * AutoAudit REST API Client
 */
export const api = {
  /**
   * Health Check & Engine Status
   */
  async getHealth(timeoutMs = 5000): Promise<{ status: string; service?: string; version?: string; uptime?: number }> {
    try {
      return await request<{ status: string; service?: string; version?: string; uptime?: number }>(
        '/api/health',
        { method: 'GET' },
        timeoutMs
      );
    } catch (err: any) {
      console.warn('API health check error:', err.message);
      return { status: 'offline' };
    }
  },

  /**
   * Service Plans & Pricing Tiers
   */
  async getServices(timeoutMs = 8000): Promise<ServicePlan[]> {
    const res = await request<{ success: boolean; data: ServicePlan[] }>(
      '/api/services',
      { method: 'GET' },
      timeoutMs
    );
    return res.data;
  },

  async getServiceById(id: string, timeoutMs = 6000): Promise<ServicePlan> {
    const res = await request<{ success: boolean; data: ServicePlan }>(
      `/api/services/${encodeURIComponent(id)}`,
      { method: 'GET' },
      timeoutMs
    );
    return res.data;
  },

  /**
   * VIN Lookup & NHTSA / NMVTIS Database Decode
   */
  async lookupVin(vin: string, timeoutMs = 12000): Promise<any> {
    const cleanVin = vin.trim().toUpperCase();
    return await request<any>(
      `/api/vin/lookup?vin=${encodeURIComponent(cleanVin)}`,
      { method: 'GET' },
      timeoutMs
    );
  },

  /**
   * License Plate & State DMV Registration Lookup
   */
  async lookupPlate(plate: string, state = 'CA', timeoutMs = 8000): Promise<any> {
    const cleanPlate = plate.trim().toUpperCase();
    return await request<any>(
      `/api/vin/plate-lookup?plate=${encodeURIComponent(cleanPlate)}&state=${encodeURIComponent(state)}`,
      { method: 'GET' },
      timeoutMs
    );
  },

  /**
   * Promo / Coupon Code Verification
   */
  async validateCoupon(code: string, subtotal: number, timeoutMs = 6000): Promise<{
    success: boolean;
    code: string;
    discountAmount: number;
    discountPercent?: number;
    discountFixed?: number;
    newTotal: number;
  }> {
    return await request<{
      success: boolean;
      code: string;
      discountAmount: number;
      discountPercent?: number;
      discountFixed?: number;
      newTotal: number;
    }>(
      '/api/coupons/validate',
      {
        method: 'POST',
        body: JSON.stringify({ code: code.trim().toUpperCase(), subtotal })
      },
      timeoutMs
    );
  },

  async getCoupons(timeoutMs = 6000): Promise<Coupon[]> {
    const res = await request<{ success: boolean; data: Coupon[] }>(
      '/api/coupons',
      { method: 'GET' },
      timeoutMs
    );
    return res.data;
  },

  /**
   * Orders Management
   */
  async getOrders(
    params?: { email?: string; status?: string; search?: string },
    timeoutMs = 10000
  ): Promise<Order[]> {
    const searchParams = new URLSearchParams();
    if (params?.email) searchParams.set('email', params.email);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);

    const queryString = searchParams.toString();
    const endpoint = `/api/orders${queryString ? `?${queryString}` : ''}`;

    const res = await request<{ success: boolean; count: number; data: Order[] }>(
      endpoint,
      { method: 'GET' },
      timeoutMs
    );
    return res.data;
  },

  async getOrderById(id: string, timeoutMs = 8000): Promise<Order> {
    const res = await request<{ success: boolean; data: Order }>(
      `/api/orders/${encodeURIComponent(id)}`,
      { method: 'GET' },
      timeoutMs
    );
    return res.data;
  },

  async createOrder(orderPayload: Partial<Order>, timeoutMs = 12000): Promise<Order> {
    const res = await request<{ success: boolean; message: string; data: Order }>(
      '/api/orders',
      {
        method: 'POST',
        body: JSON.stringify(orderPayload)
      },
      timeoutMs
    );
    return res.data;
  },

  async updateOrderStatus(id: string, status: string, note?: string, timeoutMs = 8000): Promise<Order> {
    const res = await request<{ success: boolean; message: string; data: Order }>(
      `/api/orders/${encodeURIComponent(id)}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status, note })
      },
      timeoutMs
    );
    return res.data;
  },

  /**
   * Mock Report Generator API Methods
   */
  async getReportGeneratorStatus(timeoutMs = 6000): Promise<any> {
    const res = await request<{ success: boolean; data: any }>(
      '/api/reports/status',
      { method: 'GET' },
      timeoutMs
    );
    return res.data;
  },

  getReportDownloadUrl(orderIdOrNumber: string): string {
    return `/api/reports/download/${encodeURIComponent(orderIdOrNumber)}`;
  },

  async triggerGenerateReport(orderId: string, notifyUser = true, timeoutMs = 12000): Promise<{
    fileName: string;
    fileUrl: string;
    orderStatus: string;
    emailMessageId?: string;
  }> {
    const res = await request<{
      success: boolean;
      message: string;
      data: {
        fileName: string;
        fileUrl: string;
        orderStatus: string;
        emailMessageId?: string;
      };
    }>(
      `/api/reports/generate/${encodeURIComponent(orderId)}`,
      {
        method: 'POST',
        body: JSON.stringify({ notifyUser })
      },
      timeoutMs
    );
    return res.data;
  },

  /**
   * Email Dispatch Notification Logs & Mock SMTP Management
   */
  async getEmails(query?: { email?: string; orderNumber?: string }, timeoutMs = 6000): Promise<EmailNotification[]> {
    const params = new URLSearchParams();
    if (query?.email) params.set('email', query.email);
    if (query?.orderNumber) params.set('orderNumber', query.orderNumber);
    const queryString = params.toString() ? `?${params.toString()}` : '';

    const res = await request<{ success: boolean; count: number; data: EmailNotification[] }>(
      `/api/emails${queryString}`,
      { method: 'GET' },
      timeoutMs
    );
    return res.data;
  },

  async triggerEmailSequence(orderId: string, timeoutMs = 8000): Promise<{
    success: boolean;
    message: string;
    data: any;
  }> {
    return await request<any>(
      `/api/emails/trigger-sequence/${encodeURIComponent(orderId)}`,
      { method: 'POST' },
      timeoutMs
    );
  },

  async getSmtpStatus(timeoutMs = 5000): Promise<{
    service: string;
    library: string;
    version: string;
    mode: string;
    sender: string;
    totalDispatched: number;
  }> {
    const res = await request<{ success: boolean; data: any }>(
      '/api/emails/smtp-status',
      { method: 'GET' },
      timeoutMs
    );
    return res.data;
  },

  /**
   * Analytics & Admin Metrics
   */
  async getStats(timeoutMs = 6000): Promise<{
    totalOrders: number;
    totalRevenue: number;
    deliveredCount: number;
    pendingCount: number;
    fulfillmentRate: number;
    activeCoupons: number;
    emailsDispatched: number;
  }> {
    const res = await request<{
      success: boolean;
      data: {
        totalOrders: number;
        totalRevenue: number;
        deliveredCount: number;
        pendingCount: number;
        fulfillmentRate: number;
        activeCoupons: number;
        emailsDispatched: number;
      };
    }>(
      '/api/stats',
      { method: 'GET' },
      timeoutMs
    );
    return res.data;
  },

  async updateOrderNotes(id: string, notes: string, timeoutMs = 8000): Promise<Order> {
    const res = await request<{ success: boolean; message: string; data: Order }>(
      `/api/orders/${encodeURIComponent(id)}/notes`,
      {
        method: 'PATCH',
        body: JSON.stringify({ notes })
      },
      timeoutMs
    );
    return res.data;
  },

  async attachOrderReport(
    id: string, 
    file: { fileName: string; fileUrl: string; type: 'pdf' | 'link' | 'html' },
    timeoutMs = 8000
  ): Promise<Order> {
    const res = await request<{ success: boolean; message: string; data: Order }>(
      `/api/orders/${encodeURIComponent(id)}/attach-report`,
      {
        method: 'POST',
        body: JSON.stringify(file)
      },
      timeoutMs
    );
    return res.data;
  },

  /**
   * Admin Authentication Helpers
   */
  async adminLogin(credentials: { email?: string; password?: string; accessKey?: string }, timeoutMs = 8000): Promise<{
    success: boolean;
    token: string;
    user: any;
  }> {
    const res = await request<{ success: boolean; message: string; token: string; user: any }>(
      '/api/auth/admin-login',
      {
        method: 'POST',
        body: JSON.stringify(credentials)
      },
      timeoutMs
    );

    if (res.token && typeof window !== 'undefined') {
      sessionStorage.setItem('autoaudit_admin_token', res.token);
    }
    return res;
  },

  adminLogout(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('autoaudit_admin_token');
    }
  },

  getAdminToken(): string | null {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('autoaudit_admin_token');
    }
    return null;
  },

  /**
   * Contact Analytics & Click-to-Chat Tracking
   */
  async logContactEvent(event: Omit<ContactEvent, 'id' | 'timestamp'>, timeoutMs = 5000): Promise<ContactEvent | null> {
    try {
      const res = await request<{ success: boolean; data: ContactEvent }>(
        '/api/analytics/contact-events',
        {
          method: 'POST',
          body: JSON.stringify(event),
        },
        timeoutMs
      );
      return res.data;
    } catch {
      try {
        const localLogs = JSON.parse(localStorage.getItem('autoaudit_contact_events') || '[]');
        const fallbackEvent: ContactEvent = {
          id: `evt_local_${Date.now()}`,
          timestamp: new Date().toISOString(),
          ...event,
        };
        localLogs.unshift(fallbackEvent);
        localStorage.setItem('autoaudit_contact_events', JSON.stringify(localLogs.slice(0, 100)));
        return fallbackEvent;
      } catch {
        return null;
      }
    }
  },

  async getContactEvents(timeoutMs = 8000): Promise<ContactEvent[]> {
    const res = await request<{ success: boolean; data: ContactEvent[] }>(
      '/api/analytics/contact-events',
      { method: 'GET' },
      timeoutMs
    );
    return res.data;
  },

  async getContactSummary(timeoutMs = 8000): Promise<ContactAnalyticsSummary> {
    const res = await request<{ success: boolean; data: ContactAnalyticsSummary }>(
      '/api/analytics/contact-summary',
      { method: 'GET' },
      timeoutMs
    );
    return res.data;
  },

  async getWhatsAppConfig(timeoutMs = 5000): Promise<WhatsAppConfig> {
    const res = await request<{ success: boolean; data: WhatsAppConfig }>(
      '/api/analytics/whatsapp-config',
      { method: 'GET' },
      timeoutMs
    );
    return res.data;
  },

  async updateWhatsAppConfig(updates: Partial<WhatsAppConfig>, timeoutMs = 8000): Promise<WhatsAppConfig> {
    const res = await request<{ success: boolean; data: WhatsAppConfig }>(
      '/api/analytics/whatsapp-config',
      {
        method: 'PUT',
        body: JSON.stringify(updates),
      },
      timeoutMs
    );
    return res.data;
  },

  /**
   * Customer Intake Form & Auto-Generated Reports
   */
  async submitIntakeForm(
    formData: Partial<CustomerIntakeSubmission> & { autoGenerateReport?: boolean },
    timeoutMs = 12000
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      submission: CustomerIntakeSubmission;
      order?: Order;
      reportDownloadUrl?: string;
      confirmation: {
        title: string;
        message: string;
        tagline: string;
      };
    };
  }> {
    return await request(
      '/api/intake',
      {
        method: 'POST',
        body: JSON.stringify(formData)
      },
      timeoutMs
    );
  },

  async getIntakeSubmissions(
    filters?: { email?: string; status?: string },
    timeoutMs = 8000
  ): Promise<CustomerIntakeSubmission[]> {
    const params = new URLSearchParams();
    if (filters?.email) params.append('email', filters.email);
    if (filters?.status) params.append('status', filters.status);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await request<{ success: boolean; data: CustomerIntakeSubmission[] }>(
      `/api/intake${query}`,
      { method: 'GET' },
      timeoutMs
    );
    return res.data;
  },

  async updateIntakeStatus(
    id: string,
    status: string,
    internalNotes?: string,
    timeoutMs = 8000
  ): Promise<CustomerIntakeSubmission> {
    const res = await request<{ success: boolean; data: CustomerIntakeSubmission }>(
      `/api/intake/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status, internalNotes })
      },
      timeoutMs
    );
    return res.data;
  },

  async triggerAutoGenerateForIntake(
    id: string,
    timeoutMs = 15000
  ): Promise<{ order: Order; reportUrl: string; fileName: string }> {
    const res = await request<{
      success: boolean;
      data: { order: Order; reportUrl: string; fileName: string };
    }>(
      `/api/intake/${encodeURIComponent(id)}/auto-generate`,
      { method: 'POST' },
      timeoutMs
    );
    return res.data;
  },

  async generateReport(
    orderId: string,
    notifyUser = true,
    timeoutMs = 15000
  ): Promise<{ fileName: string; fileUrl: string; orderStatus: string; emailMessageId?: string }> {
    const res = await request<{
      success: boolean;
      data: { fileName: string; fileUrl: string; orderStatus: string; emailMessageId?: string };
    }>(
      `/api/reports/generate/${encodeURIComponent(orderId)}`,
      {
        method: 'POST',
        body: JSON.stringify({ notifyUser })
      },
      timeoutMs
    );
    return res.data;
  }
};
