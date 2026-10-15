import mongoose, { Schema, Document } from 'mongoose';
import { WhatsAppConfig } from '../../src/types';

export interface WhatsAppConfigDocument extends WhatsAppConfig, Document {
  key: string;
}

const WhatsAppConfigSchema = new Schema<WhatsAppConfigDocument>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'global',
      index: true
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true
    },
    displayNumber: {
      type: String,
      required: true,
      trim: true
    },
    defaultGreeting: {
      type: String,
      default: 'Hello! I am interested in an AutoAudit vehicle history verification report.'
    },
    supportAvailability: {
      type: String,
      default: '24/7 Verified Support Desk'
    },
    active: {
      type: Boolean,
      default: true
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

export const WhatsAppConfigModel =
  mongoose.models.WhatsAppConfig ||
  mongoose.model<WhatsAppConfigDocument>('WhatsAppConfig', WhatsAppConfigSchema);
