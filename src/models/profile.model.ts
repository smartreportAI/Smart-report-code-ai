import mongoose, { Schema, type Model } from 'mongoose';

export interface IProfileContent {
  about?: string;
  tips?: { normal?: string; abnormal?: string };
  description?: string;
  header?: Record<string, string>;
  text?: Record<string, string>;
}

export interface IProfile {
  _id: mongoose.Types.ObjectId;
  profileId: string;
  displayName: Record<string, string>;
  category?: string;
  sortOrder: number;
  biomarkers: string[];
  content: Record<string, IProfileContent>;
  bodySummary?: {
    organName?: string;
    svgIconKey?: string;
    position?: { x: number; y: number };
    displayInBodyMap?: boolean;
  };
  riskScore?: {
    enabled: boolean;
    calculatorType?: string | null;
  };
  subGroups?: Array<{ name: string; biomarkers: string[] }>;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  version?: number;
}

const profileContentSchema = new Schema<IProfileContent>(
  {
    about: String,
    tips: { normal: String, abnormal: String },
    description: String,
    header: Schema.Types.Mixed,
    text: Schema.Types.Mixed,
  },
  { _id: false }
);

const profileSchema = new Schema<IProfile>(
  {
    profileId: { type: String, required: true, unique: true },
    displayName: { type: Schema.Types.Mixed, default: {} },
    category: String,
    sortOrder: { type: Number, default: 0 },
    biomarkers: { type: [String], default: [] },
    content: { type: Schema.Types.Mixed, default: {} },
    bodySummary: {
      organName: String,
      svgIconKey: String,
      position: { x: Number, y: Number },
      displayInBodyMap: { type: Boolean, default: true },
    },
    riskScore: {
      enabled: { type: Boolean, default: false },
      calculatorType: String,
    },
    subGroups: [
      {
        name: String,
        biomarkers: [String],
      },
    ],
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    version: { type: Number, default: 1 },
  },
  { versionKey: false }
);

profileSchema.index({ sortOrder: 1 });

export const Profile: Model<IProfile> =
  mongoose.models.Profile ?? mongoose.model<IProfile>('Profile', profileSchema);
