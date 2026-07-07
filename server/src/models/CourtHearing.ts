import mongoose, { Document, Schema } from 'mongoose';

export interface ICourtHearing extends Document {
  case_id:      mongoose.Types.ObjectId;
  title:        string;
  court_name:   string;
  court_number?: string;
  judge_name?:  string;
  hearing_date: Date;
  hearing_time?: string;
  hearing_type: 'bail' | 'framing_of_charges' | 'evidence' | 'argument' | 'judgment' | 'other';
  status:       'scheduled' | 'completed' | 'adjourned' | 'cancelled';
  result?:      string;
  next_date?:   Date;
  notes?:       string;
  reminder_sent: boolean;
  created_by:   mongoose.Types.ObjectId;
  createdAt:    Date;
  updatedAt:    Date;
}

const CourtHearingSchema = new Schema<ICourtHearing>(
  {
    case_id:     { type: Schema.Types.ObjectId, ref: 'Case', required: true, index: true },
    title:       { type: String, required: true },
    court_name:  { type: String, required: true },
    court_number:String,
    judge_name:  String,
    hearing_date:{ type: Date, required: true, index: true },
    hearing_time:String,
    hearing_type:{ type: String, enum: ['bail','framing_of_charges','evidence','argument','judgment','other'], default: 'other' },
    status:      { type: String, enum: ['scheduled','completed','adjourned','cancelled'], default: 'scheduled' },
    result:      String,
    next_date:   Date,
    notes:       String,
    reminder_sent:{ type: Boolean, default: false },
    created_by:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

CourtHearingSchema.index({ case_id: 1, hearing_date: 1 });

export default mongoose.model<ICourtHearing>('CourtHearing', CourtHearingSchema);
