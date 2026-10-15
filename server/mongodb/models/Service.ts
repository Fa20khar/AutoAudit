import mongoose, { Schema, Document } from 'mongoose';
import { ServicePlan } from '../../src/types';

export interface ServiceDocument extends Omit<ServicePlan, 'id'>, Document {
  id: string;
}

const ServiceSchema = new Schema<ServiceDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    tagline: {
      type: String,
      default: '',
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative']
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price cannot be negative']
    },
    deliveryTime: {
      type: String,
      required: true,
      trim: true
    },
    isPopular: {
      type: Boolean,
      default: false
    },
    requiredFields: {
      type: [String],
      default: []
    },
    includedItems: {
      type: [String],
      default: []
    },
    exclusions: {
      type: [String],
      default: []
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

export const ServiceModel = mongoose.models.Service || mongoose.model<ServiceDocument>('Service', ServiceSchema);
