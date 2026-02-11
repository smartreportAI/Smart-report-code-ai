import mongoose, { Schema, type Model } from 'mongoose';

/** Doc 03-style input summary for audit trail */
export interface IReportInputSummary {
  testCount: number;
  profileCount: number;
  abnormalCount: number;
  jsonUrl?: string | null;
}

/** Doc 03-style output metadata for audit trail */
export interface IReportOutputSummary {
  reportType?: string;
  language?: string;
  pageCount?: number;
  digitalPdfUrl?: string | null;
  printPdfUrl?: string | null;
  vizAppUrl?: string | null;
  fileSizeBytes?: number | null;
}

/** Doc 03-style performance metrics */
export interface IReportPerformance {
  totalDurationMs: number;
  steps?: {
    configFetch?: number;
    inputParse?: number;
    mapping?: number;
    htmlRender?: number;
    pdfGenerate?: number;
    s3Upload?: number;
  };
}

/** Doc 03-style dispatch status (reserved for webhook) */
export interface IReportDispatch {
  type?: string;
  status?: string;
  attempts?: number;
  deliveredAt?: Date | null;
}

export interface IReport {
  _id: mongoose.Types.ObjectId;
  reportId: string;
  userId: mongoose.Types.ObjectId | null;
  clientId: string | null;
  patientName: string;
  labNo: string | null;
  workOrderId?: string | null;
  testCount: number;
  profileCount: number;
  insightCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  pdfUrl: string | null;
  generatedAt: Date | null;
  createdAt: Date;
  /** Doc 03 input summary */
  input?: IReportInputSummary;
  /** Doc 03 output metadata */
  output?: IReportOutputSummary;
  /** Doc 03 performance metrics */
  performance?: IReportPerformance;
  /** Doc 03 dispatch status */
  dispatch?: IReportDispatch;
}

const reportInputSummarySchema = new Schema(
  {
    testCount: { type: Number, default: 0 },
    profileCount: { type: Number, default: 0 },
    abnormalCount: { type: Number, default: 0 },
    jsonUrl: { type: String, default: null },
  },
  { _id: false }
);

const reportOutputSummarySchema = new Schema(
  {
    reportType: String,
    language: String,
    pageCount: Number,
    digitalPdfUrl: { type: String, default: null },
    printPdfUrl: { type: String, default: null },
    vizAppUrl: { type: String, default: null },
    fileSizeBytes: { type: Number, default: null },
  },
  { _id: false }
);

const reportPerformanceSchema = new Schema(
  {
    totalDurationMs: { type: Number, default: 0 },
    steps: {
      configFetch: Number,
      inputParse: Number,
      mapping: Number,
      htmlRender: Number,
      pdfGenerate: Number,
      s3Upload: Number,
    },
  },
  { _id: false }
);

const reportDispatchSchema = new Schema(
  {
    type: String,
    status: String,
    attempts: Number,
    deliveredAt: { type: Date, default: null },
  },
  { _id: false }
);

const reportSchema = new Schema<IReport>(
  {
    reportId: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    clientId: { type: String, default: null },
    patientName: { type: String, default: '' },
    labNo: { type: String, default: null },
    workOrderId: { type: String, default: null },
    testCount: { type: Number, default: 0 },
    profileCount: { type: Number, default: 0 },
    insightCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    pdfUrl: { type: String, default: null },
    generatedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
    input: reportInputSummarySchema,
    output: reportOutputSummarySchema,
    performance: reportPerformanceSchema,
    dispatch: reportDispatchSchema,
  },
  { versionKey: false },
);

reportSchema.index({ createdAt: -1 });
reportSchema.index({ status: 1 });
reportSchema.index({ userId: 1 });

export const Report: Model<IReport> =
  mongoose.models.Report ?? mongoose.model<IReport>('Report', reportSchema);
