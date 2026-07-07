import mongoose, { Document, Schema } from 'mongoose';

export interface ILegalProvision extends Document {
  act_name: string;
  section: string;
  title: string;
  description?: string;
  plain_language?: string;
  typical_evidence: string[];
  related_sections: string[];
  offense_category?: string;
  punishment?: string;
  is_bailable?: boolean;
  is_cognizable?: boolean;
  keywords: string[];
  createdAt: Date;
}

const LegalProvisionSchema = new Schema<ILegalProvision>(
  {
    act_name: { type: String, required: true },
    section: { type: String, required: true },
    title: { type: String, required: true },
    description: String,
    plain_language: String,
    typical_evidence: [String],
    related_sections: [String],
    offense_category: String,
    punishment: String,
    is_bailable: Boolean,
    is_cognizable: Boolean,
    keywords: [String],
  },
  { timestamps: true }
);

LegalProvisionSchema.index({ act_name: 'text', title: 'text', description: 'text', keywords: 'text' });
LegalProvisionSchema.index({ section: 1, act_name: 1 });

export default mongoose.model<ILegalProvision>('LegalProvision', LegalProvisionSchema);
