import mongoose, { Schema, Document } from 'mongoose';
import { EmailNotification as EmailType } from '../../src/types';

export interface EmailDocument extends Omit<EmailType, 'id'>, Document {
  id: string;
}

const EmailNotificationSchema = new Schema<EmailDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    orderId: {
      type: String,
      index: true,
      trim: true
    },
    orderNumber: {
      type: String,
      index: true,
      trim: true
    },
    recipientEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    recipientType: {
      type: String,
      enum: ['customer', 'admin'],
      default: 'customer'
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      required: true,
      enum: [
        'new_order_admin',
        'order_confirmation',
        'processing',
        'report_ready',
        'refund',
        'payment_failed'
      ]
    },
    body: {
      type: String,
      required: true
    },
    htmlBody: {
      type: String
    },
    messageId: {
      type: String
    },
    smtpTransport: {
      type: String
    },
    sentAt: {
      type: String,
      default: () => new Date().toISOString()
    },
    read: {
      type: Boolean,
      default: false
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

// Indexes for query performance
EmailNotificationSchema.index({ recipientEmail: 1, sentAt: -1 });
EmailNotificationSchema.index({ orderNumber: 1 });

export const EmailModel =
  mongoose.models.EmailNotification ||
  mongoose.model<EmailDocument>('EmailNotification', EmailNotificationSchema);
