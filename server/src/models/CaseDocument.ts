import mongoose, { Document, Schema } from 'mongoose';

export interface ICaseDocument extends Document {
  case_id: mongoose.Types.ObjectId;
  document_type: string;
  title: string;
  content?: string;
  file_url?: string;
  version: number;
  status: string;
  generated_by_ai: boolean;
  reviewed_by?: mongoose.Types.ObjectId;
  reviewed_at?: Date;
  created_by?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CaseDocumentSchema = new Schema<ICaseDocument>(
  {
    case_id: { type: Schema.Types.ObjectId, ref: 'Case', required: true },
    document_type: { type: String, required: true },
    title: { type: String, required: true },
    content: String,
    file_url: String,
    version: { type: Number, default: 1 },
    status: { type: String, enum: ['draft', 'under_review', 'approved', 'rejected'], default: 'draft' },
    generated_by_ai: { type: Boolean, default: false },
    reviewed_by: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewed_at: Date,
    created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

CaseDocumentSchema.index({ case_id: 1 });

export default mongoose.model<ICaseDocument>('CaseDocument', CaseDocumentSchema);
