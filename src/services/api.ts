import { Order, ServicePlan, Coupon, EmailNotification, ContactEvent, ContactAnalyticsSummary, WhatsAppConfig, CustomerIntakeSubmission, AdminUser, AdminAuthResponse } from '../types';

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

  const adminToken = typeof window !== 'undefined' 
    ? (sessionStorage.getItem('autoaudit_admin_token') || localStorage.getItem('autoaudit_admin_token')) 
    : null;

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(adminToken ? { 
      'Authorization': `Bearer ${adminToken}`,
      'x-admin-token': adminToken 
    } : {}),
    ...(options.headers as Record<string, string> || {})
  };

  if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const apiBase = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL
    ? String(import.meta.env.VITE_API_BASE_URL)
    : '').replace(/\/$/, '');
  const url = endpoint.startsWith('http') ? endpoint : `${apiBase}${endpoint}`;

  try {
    const response = await fetch(url, {
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

  async updateOrderPaymentStatus(
    id: string,
    status: 'Paid' | 'Pending' | 'Failed' | 'Refunded',
    notes?: string,
    timeoutMs = 8000
  ): Promise<Order> {
    const res = await request<{ success: boolean; message: string; data: Order }>(
      `/api/orders/${encodeURIComponent(id)}/payment`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status, notes })
      },
      timeoutMs
    );
    return res.data;
  },

  async approveOrderPayment(id: string, notes?: string, timeoutMs = 8000): Promise<Order> {
    const res = await request<{ success: boolean; message: string; data: Order }>(
      `/api/orders/${encodeURIComponent(id)}/approve-payment`,
      {
        method: 'POST',
        body: JSON.stringify({ notes })
      },
      timeoutMs
    );
    return res.data;
  },

  async rejectOrderPayment(id: string, reason?: string, timeoutMs = 8000): Promise<Order> {
    const res = await request<{ success: boolean; message: string; data: Order }>(
      `/api/orders/${encodeURIComponent(id)}/reject-payment`,
      {
        method: 'POST',
        body: JSON.stringify({ reason })
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
    message: string;
    token?: string;
    user?: any;
    requires2FA?: boolean;
    setup2FARequired?: boolean;
    preAuthToken?: string;
    secret?: string;
    otpauthUrl?: string;
    backupCodes?: string[];
  }> {
    const res = await request<{
      success: boolean;
      message: string;
      token?: string;
      user?: any;
      requires2FA?: boolean;
      setup2FARequired?: boolean;
      preAuthToken?: string;
      secret?: string;
      otpauthUrl?: string;
      backupCodes?: string[];
    }>(
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

  /**
   * Completes initial 2FA linking by verifying the first 6-digit TOTP code
   */
  async verify2FASetup(
    payload: { preAuthToken: string; code: string },
    timeoutMs = 8000
  ): Promise<{
    success: boolean;
    message: string;
    token: string;
    user: any;
  }> {
    const res = await request<{
      success: boolean;
      message: string;
      token: string;
      user: any;
    }>(
      '/api/auth/2fa/verify-setup',
      {
        method: 'POST',
        body: JSON.stringify(payload)
      },
      timeoutMs
    );

    if (res.token && typeof window !== 'undefined') {
      sessionStorage.setItem('autoaudit_admin_token', res.token);
    }
    return res;
  },

  /**
   * Verifies standard 6-digit TOTP code (or emergency backup code) during login
   */
  async verify2FALogin(
    payload: { preAuthToken: string; code: string },
    timeoutMs = 8000
  ): Promise<{
    success: boolean;
    message: string;
    token: string;
    user: any;
  }> {
    const res = await request<{
      success: boolean;
      message: string;
      token: string;
      user: any;
    }>(
      '/api/auth/2fa/verify-login',
      {
        method: 'POST',
        body: JSON.stringify(payload)
      },
      timeoutMs
    );

    if (res.token && typeof window !== 'undefined') {
      sessionStorage.setItem('autoaudit_admin_token', res.token);
    }
    return res;
  },

  /**
   * Requests a new 2FA setup QR code for re-linking authenticator app
   */
  async request2FAReset(timeoutMs = 8000): Promise<{
    success: boolean;
    preAuthToken: string;
    secret: string;
    otpauthUrl: string;
    backupCodes: string[];
    message: string;
  }> {
    return await request<{
      success: boolean;
      preAuthToken: string;
      secret: string;
      otpauthUrl: string;
      backupCodes: string[];
      message: string;
    }>(
      '/api/auth/2fa/reset-request',
      { method: 'POST' },
      timeoutMs
    );
  },

  async verifyAdminToken(timeoutMs = 6000): Promise<{
    success: boolean;
    authenticated: boolean;
    user?: any;
  }> {
    try {
      return await request<{ success: boolean; authenticated: boolean; user?: any }>(
        '/api/auth/verify',
        { method: 'GET' },
        timeoutMs
      );
    } catch {
      return { success: false, authenticated: false };
    }
  },

  async getSetupStatus(timeoutMs = 5000): Promise<{
    success: boolean;
    isSetupComplete: boolean;
    canSetup: boolean;
  }> {
    try {
      return await request<{ success: boolean; isSetupComplete: boolean; canSetup: boolean }>(
        '/api/auth/setup-status',
        { method: 'GET' },
        timeoutMs
      );
    } catch {
      return { success: false, isSetupComplete: true, canSetup: false };
    }
  },

  async setupInitialAdmin(
    payload: { setupSecret: string; email: string; password: string; name?: string },
    timeoutMs = 8000
  ): Promise<{ success: boolean; message: string }> {
    return await request<{ success: boolean; message: string }>(
      '/api/auth/setup-admin',
      {
        method: 'POST',
        headers: {
          'x-admin-setup-secret': payload.setupSecret
        },
        body: JSON.stringify(payload)
      },
      timeoutMs
    );
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
  },

  /**
   * Veo 3 Video Generation API (veo-3.1-fast-generate-preview)
   * Supports 16:9 (Landscape) and 9:16 (Portrait)
   */
  async generateVideo(
    prompt: string,
    aspectRatio: '16:9' | '9:16' = '16:9',
    resolution: '720p' | '1080p' = '720p'
  ): Promise<{
    success: boolean;
    operationName?: string;
    prompt: string;
    aspectRatio: '16:9' | '9:16';
    model: string;
    isQuotaError?: boolean;
    error?: string;
    fallbackSamples?: any[];
  }> {
    const res = await fetch('/api/generate-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, aspectRatio, resolution }),
    });
    const data = await res.json();
    if (!res.ok && !data.fallbackSamples) {
      throw new ApiError(data.error || 'Failed to start video generation', res.status);
    }
    return data;
  },

  async pollVideoStatus(operationName: string): Promise<{
    success: boolean;
    done: boolean;
    downloadUrl?: string | null;
    aspectRatio?: '16:9' | '9:16';
    prompt?: string;
    error?: string;
  }> {
    const res = await fetch('/api/video-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operationName }),
    });
    return res.json();
  },

  async getVideoSamples(): Promise<{
    success: boolean;
    samples: Record<'16:9' | '9:16', Array<{ id: string; title: string; prompt: string; url: string; duration: string }>>;
  }> {
    const res = await fetch('/api/video/samples');
    return res.json();
  }
};
