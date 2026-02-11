import mongoose, { Schema, type Model } from 'mongoose';

export interface IReferenceRange {
  gender: 'male' | 'female' | 'any';
  ageRange: { min: number; max: number };
  normal: { min: number; max: number };
  borderline?: {
    low?: { min: number; max: number };
    high?: { min: number; max: number };
  };
  critical?: { low?: number; high?: number };
  methodology?: string;
}

export interface IBiomarkerContent {
  displayName?: string;
  about?: string;
  tips?: { normal?: string; low?: string; high?: string };
  whatIsIt?: string;
  whyTest?: string;
}

export interface IBiomarker {
  _id: mongoose.Types.ObjectId;
  biomarkerId: string;
  standardName: string;
  category?: string;
  aliases: string[];
  profiles: string[];
  unit: {
    primary: string;
    alternatives?: string[];
    conversionFactors?: Record<string, number>;
  };
  referenceRanges: IReferenceRange[];
  content: Record<string, IBiomarkerContent>;
  visualization?: {
    sliderType?: string;
    iconKey?: string;
    grouping?: string;
    groupPosition?: number;
    bodyMapPosition?: { organ?: string; x?: number; y?: number };
  };
  metadata?: {
    loincCode?: string;
    isActive?: boolean;
  };
  createdAt?: Date;
  updatedAt?: Date;
  version?: number;
}

const referenceRangeSchema = new Schema<IReferenceRange>(
  {
    gender: { type: String, enum: ['male', 'female', 'any'] },
    ageRange: { min: Number, max: Number },
    normal: { min: Number, max: Number },
    borderline: {
      low: { min: Number, max: Number },
      high: { min: Number, max: Number },
    },
    critical: { low: Number, high: Number },
    methodology: String,
  },
  { _id: false }
);

const biomarkerContentSchema = new Schema<IBiomarkerContent>(
  {
    displayName: String,
    about: String,
    tips: {
      normal: String,
      low: String,
      high: String,
    },
    whatIsIt: String,
    whyTest: String,
  },
  { _id: false }
);

const biomarkerSchema = new Schema<IBiomarker>(
  {
    biomarkerId: { type: String, required: true, unique: true },
    standardName: { type: String, required: true },
    category: String,
    aliases: { type: [String], default: [] },
    profiles: { type: [String], default: [] },
    unit: {
      primary: { type: String, required: true },
      alternatives: [String],
      conversionFactors: Schema.Types.Mixed,
    },
    referenceRanges: { type: [referenceRangeSchema], default: [] },
    content: { type: Schema.Types.Mixed, default: {} },
    visualization: {
      sliderType: String,
      iconKey: String,
      grouping: String,
      groupPosition: Number,
      bodyMapPosition: { organ: String, x: Number, y: Number },
    },
    metadata: {
      loincCode: String,
      isActive: { type: Boolean, default: true },
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    version: { type: Number, default: 1 },
  },
  { versionKey: false }
);

biomarkerSchema.index({ standardName: 1 });
biomarkerSchema.index({ aliases: 1 });
biomarkerSchema.index({ profiles: 1 });

export const Biomarker: Model<IBiomarker> =
  mongoose.models.Biomarker ?? mongoose.model<IBiomarker>('Biomarker', biomarkerSchema);
