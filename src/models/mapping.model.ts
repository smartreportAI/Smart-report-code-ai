import mongoose, { Schema, type Model } from 'mongoose';

export interface IMapping {
  _id: mongoose.Types.ObjectId;
  clientId: string;
  type: 'parameter' | 'profile';
  idMapping: Record<string, string>;
  nameMapping: Record<string, string>;
  profileMapping: Record<string, string>;
  parameterOrder: string[];
  profileOrder: string[];
  updatedAt?: Date;
  updatedBy?: string;
  version?: number;
}

const mappingSchema = new Schema<IMapping>(
  {
    clientId: { type: String, required: true },
    type: { type: String, enum: ['parameter', 'profile'], default: 'parameter' },
    idMapping: { type: Schema.Types.Mixed, default: {} },
    nameMapping: { type: Schema.Types.Mixed, default: {} },
    profileMapping: { type: Schema.Types.Mixed, default: {} },
    parameterOrder: { type: [String], default: [] },
    profileOrder: { type: [String], default: [] },
    updatedAt: { type: Date, default: Date.now },
    updatedBy: String,
    version: { type: Number, default: 1 },
  },
  { versionKey: false }
);

mappingSchema.index({ clientId: 1 }, { unique: true });

export const Mapping: Model<IMapping> =
  mongoose.models.Mapping ?? mongoose.model<IMapping>('Mapping', mappingSchema);
