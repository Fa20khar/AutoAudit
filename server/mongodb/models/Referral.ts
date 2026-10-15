import mongoose, { Schema, Document } from 'mongoose';
import { ReferralProfile, ReferralRewardCoupon, ReferralConversion } from '../../src/types/referral';

export interface ReferralProfileDocument extends ReferralProfile, Document {}

const ReferralRewardCouponSchema = new Schema(
  {
    code: { type: String, required: true, uppercase: true, trim: true },
    discountFixed: { type: Number, default: 5 },
    discountPercent: { type: Number },
    isUsed: { type: Boolean, default: false },
    usedOnOrder: { type: String },
    earnedAt: { type: String, default: () => new Date().toISOString() }
  },
  { _id: false }
);

const ReferralConversionSchema = new Schema(
  {
    orderNumber: { type: String, required: true },
    date: { type: String, default: () => new Date().toISOString() },
    commissionDiscount: { type: Number, default: 5 }
  },
  { _id: false }
);

const ReferralProfileSchema = new Schema<ReferralProfileDocument>(
  {
    referralCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    ownerEmail: {
      type: String,
      lowercase: true,
      trim: true,
      index: true
    },
    ownerName: {
      type: String,
      trim: true
    },
    referralLink: {
      type: String,
      required: true
    },
    totalReferrals: {
      type: Number,
      default: 0,
      min: 0
    },
    rewardCoupons: {
      type: [ReferralRewardCouponSchema],
      default: []
    },
    conversions: {
      type: [ReferralConversionSchema],
      default: []
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

export const ReferralModel =
  mongoose.models.Referral ||
  mongoose.model<ReferralProfileDocument>('Referral', ReferralProfileSchema);
