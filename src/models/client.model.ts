import mongoose, { Schema, type Model } from 'mongoose';

export interface IClient {
  _id: mongoose.Types.ObjectId;
  clientId: string;
  displayName: string;
  status: 'active' | 'suspended' | 'trial';
  subscription?: {
    plan: string;
    maxReportsPerMonth?: number;
    features?: string[];
    expiresAt?: Date;
  };
  contacts?: {
    primary?: { name?: string; email?: string; phone?: string };
    technical?: { name?: string; email?: string };
  };
  apiCredentials?: {
    apiKeys?: Array<{
      key: string;
      label: string;
      createdAt?: Date;
      lastUsedAt?: Date;
      isActive: boolean;
    }>;
    jwtSecret?: string;
    allowedIPs?: string[];
  };
  lis?: {
    name?: string;
    inputFormat?: 'standard' | 'srl' | 'element_based' | 'wrapped';
    fieldMappings?: Record<string, string>;
  };
  dispatch?: {
    type: 'return' | 'webhook' | 'whatsapp' | 'email';
    webhookUrl?: string;
    webhookHeaders?: Record<string, string>;
    retryPolicy?: { maxRetries: number; backoffMs: number };
  };
  createdAt?: Date;
  updatedAt?: Date;
  version?: number;
}

const clientSchema = new Schema<IClient>(
  {
    clientId: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    status: { type: String, enum: ['active', 'suspended', 'trial'], default: 'active' },
    subscription: {
      plan: String,
      maxReportsPerMonth: Number,
      features: [String],
      expiresAt: Date,
    },
    contacts: {
      primary: { name: String, email: String, phone: String },
      technical: { name: String, email: String },
    },
    apiCredentials: {
      apiKeys: [
        {
          key: String,
          label: String,
          createdAt: Date,
          lastUsedAt: Date,
          isActive: Boolean,
        },
      ],
      jwtSecret: String,
      allowedIPs: [String],
    },
    lis: {
      name: String,
      inputFormat: String,
      fieldMappings: Schema.Types.Mixed,
    },
    dispatch: {
      type: String,
      webhookUrl: String,
      webhookHeaders: Schema.Types.Mixed,
      retryPolicy: { maxRetries: Number, backoffMs: Number },
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    version: { type: Number, default: 1 },
  },
  { versionKey: false }
);

clientSchema.index({ status: 1 });

export const Client: Model<IClient> =
  mongoose.models.Client ?? mongoose.model<IClient>('Client', clientSchema);
