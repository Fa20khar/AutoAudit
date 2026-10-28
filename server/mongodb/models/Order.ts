import mongoose, { Schema, Document } from 'mongoose';
import { Order as OrderType, OrderStatus } from '../../src/types';

export interface OrderDocument extends Omit<OrderType, 'id'>, Document {
  id: string; // Keep explicit string ID (e.g. "ord-10025")
}

const AuditLogSchema = new Schema(
  {
    id: { type: String, required: true },
    timestamp: { type: String, required: true },
    actor: { type: String, required: true, trim: true },
    action: { type: String, required: true, trim: true },
    details: { type: String, trim: true }
  },
  { _id: false }
);

const ResultFileSchema = new Schema(
  {
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    type: { type: String, enum: ['pdf', 'link', 'html'], default: 'pdf' },
    uploadedAt: { type: String, required: true },
    expiryDate: { type: String }
  },
  { _id: false }
);

const OrderSchema = new Schema<OrderDocument>(
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
        'Pending Payment',
        'Paid / New',
        'Processing',
        'NMVTIS Check',
        'Ready',
        'Delivered',
        'Completed',
        'Cancelled',
        'Refunded'
      ],
      default: 'Paid / New',
      index: true
    },
    subtotal: {
      type: Number,
      required: true,
      min: [0, 'Subtotal cannot be negative']
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: [0, 'Discount amount cannot be negative']
    },
    total: {
      type: Number,
      required: true,
      min: [0, 'Total cannot be negative']
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
      color: { type: String, trim: true },
      mileage: { type: String, trim: true },
      countryOrState: { type: String, trim: true },
      customerNotes: { type: String, trim: true },
      transmission: { type: String, trim: true },
      fuelType: { type: String, trim: true },
      titleStatus: { type: String, trim: true },
      inspectionFocusAreas: { type: [String], default: [] },
      knownDamages: { type: [String], default: [] },
      photos: { type: Array, default: [] }
    },
    payment: {
      status: {
        type: String,
        enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
        default: 'Paid'
      },
      gatewayRef: { type: String, default: '' },
      paidAt: { type: String },
      method: { type: String, default: 'Credit Card' }
    },
    internalNotes: {
      type: String,
      default: ''
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
      default: () => new Date().toISOString()
    },
    updatedAt: {
      type: String,
      default: () => new Date().toISOString()
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Compound and query indexes for high performance
OrderSchema.index({ 'customer.email': 1, createdAt: -1 });
OrderSchema.index({ 'vehicle.vinOrReg': 1 });
OrderSchema.index({ status: 1, createdAt: -1 });

export const OrderModel = mongoose.models.Order || mongoose.model<OrderDocument>('Order', OrderSchema);
