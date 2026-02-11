import mongoose, { Schema, type Model } from 'mongoose';

export interface IColorScheme {
  normal: string;
  borderline: string;
  high: string;
  low: string;
  critical: string;
}

export interface IColorObj {
  colored: IColorScheme;
  greyscaled: IColorScheme;
  reportColors?: {
    patientHeader?: { heading?: string; value?: string };
    profile?: { heading?: string; background?: string };
  };
}

export interface IDoctorSignature {
  doctorId: string;
  name: string;
  designation?: string;
  registration?: string;
  signatureUrl?: string;
  assignedProfiles?: string[];
}

export interface IReportConfig {
  _id: mongoose.Types.ObjectId;
  clientId: string;

  stateData: {
    reportType?: string;
    generateCoverPage?: boolean;
    showBodySummary?: boolean;
    showSummary?: boolean;
    showRiskScore?: boolean;
    showHistorical?: boolean;
    showRecommendations?: boolean;
    showAccreditation?: boolean;
    generatePrintPdf?: boolean;
    generateVizApp?: boolean;
    enableMappingConfig?: boolean;
    enableProfileOrder?: boolean;
    enableParameterOrder?: boolean;
    curLang?: string;
    fallbackLang?: string;
    summaryType?: number;
    [key: string]: unknown;
  };

  colorObj: IColorObj;

  patientDetailsData?: {
    fieldOrder?: string[];
    customLabels?: Record<string, string>;
    dateFormat?: string;
  };

  coverPage?: {
    type?: string;
    imageUrl?: string;
    patientInfoPosition?: { x: number; y: number };
  };

  backPage?: {
    enabled?: boolean;
    pdfUrl?: string | null;
  };

  headerFooter?: {
    headerUrl?: string;
    footerUrl?: string;
    headerHeight?: string;
    footerHeight?: string;
  };

  fonts?: {
    primaryUrl?: string;
    primaryFamily?: string;
    fontSize?: string;
  };

  doctorSignatures?: IDoctorSignature[];

  createdAt?: Date;
  updatedAt?: Date;
  version?: number;
}

const colorSchemeSchema = new Schema<IColorScheme>(
  {
    normal: { type: String, default: '#0F9D58' },
    borderline: { type: String, default: '#F4B400' },
    high: { type: String, default: '#DB4437' },
    low: { type: String, default: '#DB4437' },
    critical: { type: String, default: '#C26564' },
  },
  { _id: false },
);

const reportConfigSchema = new Schema<IReportConfig>(
  {
    clientId: { type: String, required: true, unique: true },
    stateData: { type: Schema.Types.Mixed, default: {} },
    colorObj: {
      colored: { type: colorSchemeSchema, default: () => ({}) },
      greyscaled: { type: colorSchemeSchema, default: () => ({}) },
      reportColors: { type: Schema.Types.Mixed },
    },
    patientDetailsData: { type: Schema.Types.Mixed },
    coverPage: { type: Schema.Types.Mixed },
    backPage: { type: Schema.Types.Mixed },
    headerFooter: { type: Schema.Types.Mixed },
    fonts: { type: Schema.Types.Mixed },
    doctorSignatures: { type: [Schema.Types.Mixed], default: [] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    version: { type: Number, default: 1 },
  },
  { versionKey: false },
);

reportConfigSchema.index({ clientId: 1 }, { unique: true });

export const DEFAULT_COLORS: IColorObj = {
  colored: {
    normal: '#0F9D58',
    borderline: '#F4B400',
    high: '#DB4437',
    low: '#DB4437',
    critical: '#C26564',
  },
  greyscaled: {
    normal: '#D2D2D2',
    borderline: '#969696',
    high: '#111111',
    low: '#111111',
    critical: '#444444',
  },
};

export const ReportConfig: Model<IReportConfig> =
  mongoose.models.ReportConfig ?? mongoose.model<IReportConfig>('ReportConfig', reportConfigSchema);
