import mongoose, { Document, Schema } from 'mongoose';

export interface ICaseLegalProvision extends Document {
  case_id: mongoose.Types.ObjectId;
  provision_id: mongoose.Types.ObjectId;
  confidence_score: number;
  ai_reasoning?: string;
  status: string;
  reviewed_by?: mongoose.Types.ObjectId;
  reviewed_at?: Date;
  createdAt: Date;
}

const CaseLegalProvisionSchema = new Schema<ICaseLegalProvision>(
  {
    case_id: { type: Schema.Types.ObjectId, ref: 'Case', required: true },
    provision_id: { type: Schema.Types.ObjectId, ref: 'LegalProvision', required: true },
    confidence_score: { type: Number, default: 0.5, min: 0, max: 1 },
    ai_reasoning: String,
    status: { type: String, enum: ['suggested', 'accepted', 'rejected'], default: 'suggested' },
    reviewed_by: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewed_at: Date,
  },
  { timestamps: true }
);

CaseLegalProvisionSchema.index({ case_id: 1 });

export default mongoose.model<ICaseLegalProvision>('CaseLegalProvision', CaseLegalProvisionSchema);
