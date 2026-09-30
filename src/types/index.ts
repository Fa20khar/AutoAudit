export type OrderStatus =
  | 'Pending Payment'
  | 'Paid / New'
  | 'Processing'
  | 'NMVTIS Check'
  | 'Ready'
  | 'Delivered'
  | 'Completed'
  | 'Cancelled'
  | 'Refunded';

export interface ServicePlan {
  id: string;
  name: string;
  tagline: string;
  price: number;
  originalPrice?: number;
  deliveryTime: string;
  isPopular?: boolean;
  requiredFields: string[];
  includedItems: string[];
  exclusions: string[];
  active: boolean;
}

export interface VehicleDetails {
  vinOrReg: string;
  isVin: boolean;
  make: string;
  model: string;
  year: number;
  mileage?: string;
  countryOrState?: string;
  customerNotes?: string;
}

export interface CustomerDetails {
  fullName: string;
  email: string;
  phone: string;
}

export interface OrderFile {
  fileUrl: string;
  fileName: string;
  uploadedAt: string;
  type: 'pdf' | 'link' | 'html';
  expiryDate?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "AA-10025"
  serviceId: string;
  serviceName: string;
  status: OrderStatus;
  subtotal: number;
  discountAmount: number;
  total: number;
  couponCode?: string;
  customer: CustomerDetails;
  vehicle: VehicleDetails;
  payment: {
    status: 'Pending' | 'Paid' | 'Failed' | 'Refunded';
    gatewayRef: string;
    paidAt?: string;
    method: string;
  };
  internalNotes: string;
  resultFile?: OrderFile;
  createdAt: string;
  updatedAt: string;
  auditLogs: AuditLog[];
}

export interface Coupon {
  code: string;
  discountPercent?: number;
  discountFixed?: number;
  minOrder?: number;
  usageCount: number;
  maxUsage?: number;
  expiryDate: string;
  active: boolean;
}

export interface EmailNotification {
  id: string;
  orderId: string;
  orderNumber: string;
  recipientEmail: string;
  recipientType: 'customer' | 'admin';
  subject: string;
  type: 'new_order_admin' | 'order_confirmation' | 'processing' | 'report_ready' | 'refund' | 'payment_failed';
  body: string;
  sentAt: string;
  read?: boolean;
}
