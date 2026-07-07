import mongoose, { Document, Schema } from 'mongoose';

export interface ICase extends Document {
  case_number: string;
  title: string;
  description?: string;
  status: string;
  crime_type?: string;
  incident_date?: Date;
  incident_location?: string;
  fir_number?: string;
  fir_date?: Date;
  police_station?: string;
  assigned_io?: mongoose.Types.ObjectId;
  assigned_sho?: mongoose.Types.ObjectId;
  prosecutor_id?: mongoose.Types.ObjectId;
  priority: string;
  tags: string[];
  ai_summary?: string;
  ai_extracted_facts?: Record<string, unknown>;
  created_by?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CaseSchema = new Schema<ICase>(
  {
    case_number: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: String,
    status: {
      type: String,
      enum: ['open', 'under_investigation', 'chargesheet_filed', 'closed', 'archived'],
      default: 'open',
    },
    crime_type: String,
    incident_date: Date,
    incident_location: String,
    fir_number: String,
    fir_date: Date,
    police_station: String,
    assigned_io: { type: Schema.Types.ObjectId, ref: 'User' },
    assigned_sho: { type: Schema.Types.ObjectId, ref: 'User' },
    prosecutor_id: { type: Schema.Types.ObjectId, ref: 'User' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    tags: [String],
    ai_summary: String,
    ai_extracted_facts: { type: Schema.Types.Mixed },
    created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

CaseSchema.index({ title: 'text', description: 'text', case_number: 'text' });
CaseSchema.index({ status: 1 });
CaseSchema.index({ assigned_io: 1 });

export default mongoose.model<ICase>('Case', CaseSchema);
