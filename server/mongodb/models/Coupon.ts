import mongoose, { Schema, Document } from 'mongoose';
import { Coupon as CouponType } from '../../src/types';

export interface CouponDocument extends CouponType, Document {}

const CouponSchema = new Schema<CouponDocument>(
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
      min: [0, 'Discount percent cannot be negative'],
      max: [100, 'Discount percent cannot exceed 100%']
    },
    discountFixed: {
      type: Number,
      min: [0, 'Fixed discount cannot be negative']
    },
    minOrder: {
      type: Number,
      min: [0, 'Minimum order cannot be negative']
    },
    usageCount: {
      type: Number,
      default: 0,
      min: [0, 'Usage count cannot be negative']
    },
    maxUsage: {
      type: Number,
      min: [1, 'Maximum usage must be at least 1']
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
      transform: (_doc, ret: any) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

export const CouponModel = mongoose.models.Coupon || mongoose.model<CouponDocument>('Coupon', CouponSchema);
