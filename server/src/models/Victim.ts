import mongoose, { Document, Schema } from 'mongoose';

export interface IVictim extends Document {
  case_id: mongoose.Types.ObjectId;
  full_name: string;
  age?: number;
  gender?: string;
  address?: string;
  phone?: string;
  email?: string;
  injury_description?: string;
  medical_records: Record<string, unknown>[];
  statements: Record<string, unknown>[];
  compensation_status?: string;
  protection_requests: Record<string, unknown>[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VictimSchema = new Schema<IVictim>(
  {
    case_id: { type: Schema.Types.ObjectId, ref: 'Case', required: true },
    full_name: { type: String, required: true },
    age: Number,
    gender: String,
    address: String,
    phone: String,
    email: String,
    injury_description: String,
    medical_records: [{ type: Schema.Types.Mixed }],
    statements: [{ type: Schema.Types.Mixed }],
    compensation_status: String,
    protection_requests: [{ type: Schema.Types.Mixed }],
    notes: String,
  },
  { timestamps: true }
);

VictimSchema.index({ case_id: 1 });

export default mongoose.model<IVictim>('Victim', VictimSchema);
