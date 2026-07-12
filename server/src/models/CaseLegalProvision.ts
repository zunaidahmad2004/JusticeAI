import mongoose, { Document, Schema } from 'mongoose';

export interface ICaseLegalProvision extends Document {
  case_id:           mongoose.Types.ObjectId;
  provision_id:      mongoose.Types.ObjectId;
  confidence_score:  number;
  ai_reasoning?:     string;
  why_applicable?:   string;
  required_evidence: string[];
  investigation_notes?:string;
  status:            'suggested' | 'accepted' | 'rejected';
  reviewed_by?:      mongoose.Types.ObjectId;
  reviewed_at?:      Date;
  review_notes?:     string;
  analysis_run_id?:  string; // groups provisions from the same AI analysis run
  createdAt:         Date;
  updatedAt:         Date;
}

const CaseLegalProvisionSchema = new Schema<ICaseLegalProvision>(
  {
    case_id:           { type: Schema.Types.ObjectId, ref: 'Case', required: true, index: true },
    provision_id:      { type: Schema.Types.ObjectId, ref: 'LegalProvision', required: true },
    confidence_score:  { type: Number, default: 0.5, min: 0, max: 1 },
    ai_reasoning:      String,
    why_applicable:    String,
    required_evidence: [String],
    investigation_notes: String,
    status:            { type: String, enum: ['suggested','accepted','rejected'], default: 'suggested' },
    reviewed_by:       { type: Schema.Types.ObjectId, ref: 'User' },
    reviewed_at:       Date,
    review_notes:      String,
    analysis_run_id:   String,
  },
  { timestamps: true }
);

CaseLegalProvisionSchema.index({ case_id: 1, status: 1 });
CaseLegalProvisionSchema.index({ case_id: 1, analysis_run_id: 1 });

export default mongoose.model<ICaseLegalProvision>('CaseLegalProvision', CaseLegalProvisionSchema);
