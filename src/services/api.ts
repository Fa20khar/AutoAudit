import { Order, ServicePlan, Coupon, EmailNotification } from '../types';

/**
 * Custom Error class with HTTP status code and timeout details
 */
export class ApiError extends Error {
  public status: number;
  public isTimeout: boolean;
  public details?: any;

  constructor(message: string, status: number = 500, isTimeout: boolean = false, details?: any) {
    super(message);
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
      const errorMessage =
        jsonResponse?.error ||
        jsonResponse?.message ||
        `Request to ${endpoint} failed with status ${response.status} (${response.statusText})`;
      
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
   * Email Dispatch Notification Logs
   */
  async getEmails(timeoutMs = 6000): Promise<EmailNotification[]> {
    const res = await request<{ success: boolean; count: number; data: EmailNotification[] }>(
      '/api/emails',
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
  }
};
