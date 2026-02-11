import mongoose, { Schema, type Model } from 'mongoose';

export interface IReport {
  _id: mongoose.Types.ObjectId;
  reportId: string;
  userId: mongoose.Types.ObjectId | null;
  clientId: string | null;
  patientName: string;
  labNo: string | null;
  testCount: number;
  profileCount: number;
  insightCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  pdfUrl: string | null;
  generatedAt: Date | null;
  createdAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    reportId: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    clientId: { type: String, default: null },
    patientName: { type: String, default: '' },
    labNo: { type: String, default: null },
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
  },
  { versionKey: false },
);

reportSchema.index({ createdAt: -1 });
reportSchema.index({ status: 1 });
reportSchema.index({ userId: 1 });

export const Report: Model<IReport> =
  mongoose.models.Report ?? mongoose.model<IReport>('Report', reportSchema);
