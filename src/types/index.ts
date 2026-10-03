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
  smsNotifications?: boolean;
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
  smsNotifications?: boolean;
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
  htmlBody?: string;
  messageId?: string;
  smtpTransport?: string;
  sentAt: string;
  read?: boolean;
}

export type ContactChannel = 'whatsapp' | 'phone' | 'email' | 'form';

export type ContactSource = 
  | 'floating_widget'
  | 'hero'
  | 'navbar'
  | 'footer'
  | 'pricing'
  | 'order_modal'
  | 'my_orders'
  | 'faq'
  | 'sample_report';

export type ContactIntent = 
  | 'vin_check'
  | 'order_tracking'
  | 'pricing'
  | 'general_support'
  | 'auction_photo'
  | 'custom';

export interface ContactEvent {
  id: string;
  channel: ContactChannel;
  source: ContactSource;
  intent: ContactIntent;
  vin?: string;
  orderNumber?: string;
  messagePreview?: string;
  timestamp: string;
  pageUrl?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
}

export interface ContactAnalyticsSummary {
  totalClicks: number;
  clicksLast24h: number;
  clicksLast7d: number;
  topSource: string;
  topIntent: string;
  conversionRateEstimate: number;
  bySource: Record<string, number>;
  byIntent: Record<string, number>;
  byChannel: Record<string, number>;
  recentEvents: ContactEvent[];
}

export interface WhatsAppConfig {
  phoneNumber: string;
  displayNumber: string;
  defaultGreeting: string;
  supportAvailability: string;
  active: boolean;
}

