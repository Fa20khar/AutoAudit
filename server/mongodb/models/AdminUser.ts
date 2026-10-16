import mongoose, { Document, Schema } from 'mongoose';

export interface IAdminUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: 'superadmin' | 'staff_admin' | 'fulfillment_specialist';
  isActive: boolean;
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  twoFactorPendingSecret?: string;
  backupCodes?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const AdminUserSchema = new Schema<IAdminUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    name: {
      type: String,
      default: 'AutoAudit Administrator'
    },
    role: {
      type: String,
      enum: ['superadmin', 'staff_admin', 'fulfillment_specialist'],
      default: 'staff_admin'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    twoFactorSecret: {
      type: String
    },
    twoFactorPendingSecret: {
      type: String
    },
    backupCodes: {
      type: [String],
      default: []
    },
    lastLogin: {
      type: Date
    },
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

export const AdminUserModel =
  mongoose.models.AdminUser ||
  mongoose.model<IAdminUser>('AdminUser', AdminUserSchema, 'admin_users');
