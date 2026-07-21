import mongoose, { Document, Schema } from 'mongoose';

interface CustodyEntry {
  timestamp: Date;
  action: string;
  notes?: string;
  officer: string;
  officer_id: mongoose.Types.ObjectId;
}

export interface IEvidence extends Document {
  case_id: mongoose.Types.ObjectId;
  evidence_number: string;
  title: string;
  description?: string;
  evidence_type: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  ocr_text?: string;
  ai_summary?: string;
  metadata?: Record<string, unknown>;
  tags: string[];
  chain_of_custody: CustodyEntry[];
  collected_by?: mongoose.Types.ObjectId;
  collected_at?: Date;
  location_found?: string;
  is_verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EvidenceSchema = new Schema<IEvidence>(
  {
    case_id: { type: Schema.Types.ObjectId, ref: 'Case', required: true },
    evidence_number: { type: String, required: true },
    title: { type: String, required: true },
    description: String,
    evidence_type: {
      type: String,
      enum: ['image', 'video', 'audio', 'document', 'physical', 'digital', 'forensic'],
      required: true,
    },
    file_url: String,
    file_name: String,
    file_size: Number,
    mime_type: String,
    ocr_text: String,
    ai_summary: String,
    metadata: { type: Schema.Types.Mixed },
    tags: [String],
    chain_of_custody: [
      {
        timestamp: { type: Date, default: Date.now },
        action: String,
        notes: String,
        officer: String,
        officer_id: { type: Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    collected_by: { type: Schema.Types.ObjectId, ref: 'User' },
    collected_at: Date,
    location_found: String,
    is_verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

EvidenceSchema.index({ case_id: 1 });
EvidenceSchema.index({ is_verified: 1 });                    // dashboard unverified count
EvidenceSchema.index({ case_id: 1, is_verified: 1 });        // case-scoped unverified
EvidenceSchema.index({ case_id: 1, evidence_type: 1 });      // type filter per case
EvidenceSchema.index({ case_id: 1, createdAt: -1 });         // recent evidence per case

export default mongoose.model<IEvidence>('Evidence', EvidenceSchema);
