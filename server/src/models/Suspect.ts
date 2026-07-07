import mongoose, { Document, Schema } from 'mongoose';

/* ─── Sub-document interfaces ─────────────────────────────────────────────── */
export interface ICriminalRecord {
  id:            string;
  case_number:   string;
  offence:       string;
  court:         string;
  year:          string;
  outcome:       string;  // acquitted | convicted | pending | charge_dropped
  sentence?:     string;
  notes?:        string;
}

export interface ISuspectActivity {
  id:          string;
  type:        'created' | 'status_changed' | 'evidence_linked' | 'note_added' |
               'arrested' | 'released' | 'ai_analysis' | 'case_linked' | 'photo_uploaded';
  description: string;
  performed_by:string;
  createdAt:   Date;
}

export interface ISuspectDocument {
  id:           string;
  file_name:    string;
  file_url:     string;
  doc_type:     string;  // photo | fingerprint | id_proof | medical | court_order | other
  uploaded_by:  string;
  uploaded_at:  Date;
}

/* ─── Main interface ──────────────────────────────────────────────────────── */
export interface ISuspect extends Document {
  // Identity
  case_id:           mongoose.Types.ObjectId;
  full_name:         string;
  aliases:           string[];
  age?:              number;
  gender?:           string;
  nationality?:      string;
  religion?:         string;
  occupation?:       string;

  // Contact & Location
  address?:          string;
  phone?:            string;
  email?:            string;
  vehicle_numbers:   string[];

  // Identity documents
  national_id?:      string;   // Aadhaar
  pan_number?:       string;
  passport_number?:  string;
  voter_id?:         string;
  driving_license?:  string;

  // Physical description
  description?:      string;   // height, build, marks, tattoos
  photo_url?:        string;

  // Arrest & legal status
  arrest_status:     'not_arrested' | 'arrested' | 'released_on_bail' |
                     'absconding' | 'chargesheeted' | 'acquitted';
  arrest_date?:      Date;
  arresting_officer?:string;
  bail_status?:      string;
  bail_date?:        Date;
  remand_end_date?:  Date;
  court_next_date?:  Date;

  // Criminal history
  criminal_history:  ICriminalRecord[];
  has_prior_record:  boolean;

  // Linked data
  linked_evidence:   mongoose.Types.ObjectId[];
  linked_cases:      mongoose.Types.ObjectId[];

  // AI risk assessment
  risk_level?:       'low' | 'medium' | 'high' | 'critical';
  risk_summary?:     string;
  risk_indicators:   string[];
  flight_risk?:      boolean;

  // Documents (photos, fingerprints, ID proofs)
  documents:         ISuspectDocument[];

  // Investigation notes (officer-only)
  notes?:            string;
  known_associates:  string[];

  // Activity log
  activity_log:      ISuspectActivity[];

  createdAt: Date;
  updatedAt: Date;
}

/* ─── Schema definitions ─────────────────────────────────────────────────── */
const CriminalRecordSchema = new Schema({
  id: String, case_number: String, offence: String, court: String,
  year: String, outcome: String, sentence: String, notes: String,
}, { _id: false });

const ActivitySchema = new Schema({
  id: String, type: String, description: String, performed_by: String,
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const DocumentSchema = new Schema({
  id: String, file_name: String, file_url: String,
  doc_type: String, uploaded_by: String,
  uploaded_at: { type: Date, default: Date.now },
}, { _id: false });

const SuspectSchema = new Schema<ISuspect>(
  {
    case_id:           { type: Schema.Types.ObjectId, ref: 'Case', required: true, index: true },
    full_name:         { type: String, required: true, index: true },
    aliases:           [String],
    age:               Number,
    gender:            String,
    nationality:       { type: String, default: 'Indian' },
    religion:          String,
    occupation:        String,
    address:           String,
    phone:             String,
    email:             String,
    vehicle_numbers:   [String],
    national_id:       { type: String, index: true, sparse: true },
    pan_number:        String,
    passport_number:   String,
    voter_id:          String,
    driving_license:   String,
    description:       String,
    photo_url:         String,
    arrest_status:     {
      type: String,
      enum: ['not_arrested','arrested','released_on_bail','absconding','chargesheeted','acquitted'],
      default: 'not_arrested',
      index: true,
    },
    arrest_date:       Date,
    arresting_officer: String,
    bail_status:       String,
    bail_date:         Date,
    remand_end_date:   Date,
    court_next_date:   Date,
    criminal_history:  [CriminalRecordSchema],
    has_prior_record:  { type: Boolean, default: false },
    linked_evidence:   [{ type: Schema.Types.ObjectId, ref: 'Evidence' }],
    linked_cases:      [{ type: Schema.Types.ObjectId, ref: 'Case' }],
    risk_level:        { type: String, enum: ['low','medium','high','critical'] },
    risk_summary:      String,
    risk_indicators:   [String],
    flight_risk:       Boolean,
    documents:         [DocumentSchema],
    notes:             String,
    known_associates:  [String],
    activity_log:      [ActivitySchema],
  },
  { timestamps: true }
);

SuspectSchema.index({ full_name: 'text' });
SuspectSchema.index({ case_id: 1, createdAt: -1 });
SuspectSchema.index({ phone: 1, sparse: true });

export default mongoose.model<ISuspect>('Suspect', SuspectSchema);
