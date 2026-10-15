import mongoose, { Schema, Document } from 'mongoose';
import { ContactEvent } from '../../src/types';

export interface ContactEventDocument extends ContactEvent, Document {}

const ContactEventSchema = new Schema<ContactEventDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    channel: {
      type: String,
      default: 'whatsapp'
    },
    source: {
      type: String,
      required: true,
      index: true
    },
    intent: {
      type: String,
      default: 'general_support',
      index: true
    },
    vin: {
      type: String,
      trim: true
    },
    orderNumber: {
      type: String,
      trim: true
    },
    messagePreview: {
      type: String
    },
    timestamp: {
      type: String,
      default: () => new Date().toISOString(),
      index: true
    },
    pageUrl: {
      type: String
    },
    deviceType: {
      type: String
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

// Indexes for 24-hour and 7-day analytics aggregation
ContactEventSchema.index({ timestamp: -1 });

export const ContactEventModel =
  mongoose.models.ContactEvent ||
  mongoose.model<ContactEventDocument>('ContactEvent', ContactEventSchema);
