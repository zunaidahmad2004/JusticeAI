import mongoose, { Document, Schema } from 'mongoose';

export interface IStatement {
  id:            string;
  content:       string;
  statement_date:Date;
  recorded_by:   string;
  location?:     string;
  ai_summary?:   string;
  createdAt:     Date;
}

export interface IInterview {
  id:           string;
  date:         Date;
  officer_name: string;
  location?:    string;
  notes?:       string;
  createdAt:    Date;
}

export interface IWitnessActivity {
  id:          string;
  type:        'statement_added' | 'interview_conducted' | 'status_changed' |
               'document_uploaded' | 'ai_analysis' | 'protection_updated' | 'created';
  description: string;
  performed_by:string;
  createdAt:   Date;
}

export interface IWitness extends Document {
  case_id:                 mongoose.Types.ObjectId;
  full_name:               string;
  alias?:                  string;
  age?:                    number;
  gender?:                 string;
  address?:                string;
  phone?:                  string;
  email?:                  string;
  occupation?:             string;
  witness_type:            'eyewitness' | 'expert' | 'informant' | 'character' | 'hostile' | 'other';
  relationship_to_case?:  string;
  statements:              IStatement[];
  interview_history:       IInterview[];
  court_appearance_status: 'pending' | 'appeared' | 'not_appeared' | 'exempted' | 'yet_to_be_summoned';
  protection_required:     boolean;
  protection_status?:      'requested' | 'granted' | 'denied' | 'not_required';
  documents:               Array<{ id: string; file_name: string; file_url: string; uploaded_at: Date; uploaded_by: string }>;
  statement_summary?:      string;
  activity_log:            IWitnessActivity[];
  notes?:                  string;
  is_hostile:              boolean;
  createdAt:               Date;
  updatedAt:               Date;
}

const StatementSchema = new Schema({
  id:             { type: String, required: true },
  content:        { type: String, required: true },
  statement_date: { type: Date, default: Date.now },
  recorded_by:    String,
  location:       String,
  ai_summary:     String,
  createdAt:      { type: Date, default: Date.now },
}, { _id: false });

const InterviewSchema = new Schema({
  id:           { type: String, required: true },
  date:         { type: Date, required: true },
  officer_name: String,
  location:     String,
  notes:        String,
  createdAt:    { type: Date, default: Date.now },
}, { _id: false });

const ActivitySchema = new Schema({
  id:          { type: String, required: true },
  type:        String,
  description: String,
  performed_by:String,
  createdAt:   { type: Date, default: Date.now },
}, { _id: false });

const WitnessSchema = new Schema<IWitness>(
  {
    case_id:                { type: Schema.Types.ObjectId, ref: 'Case', required: true, index: true },
    full_name:              { type: String, required: true, index: true },
    alias:                  String,
    age:                    Number,
    gender:                 String,
    address:                String,
    phone:                  String,
    email:                  String,
    occupation:             String,
    witness_type:           { type: String, enum: ['eyewitness','expert','informant','character','hostile','other'], default: 'eyewitness' },
    relationship_to_case:   String,
    statements:             [StatementSchema],
    interview_history:      [InterviewSchema],
    court_appearance_status:{ type: String, enum: ['pending','appeared','not_appeared','exempted','yet_to_be_summoned'], default: 'pending' },
    protection_required:    { type: Boolean, default: false },
    protection_status:      { type: String, enum: ['requested','granted','denied','not_required'] },
    documents:              [{
      id:          String,
      file_name:   String,
      file_url:    String,
      uploaded_at: Date,
      uploaded_by: String,
    }],
    statement_summary:      String,
    activity_log:           [ActivitySchema],
    notes:                  String,
    is_hostile:             { type: Boolean, default: false },
  },
  { timestamps: true }
);

WitnessSchema.index({ case_id: 1, createdAt: -1 });

export default mongoose.model<IWitness>('Witness', WitnessSchema);
