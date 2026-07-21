import mongoose, { Document, Schema } from 'mongoose';

export interface ICase extends Document {
  case_number: string;
  title: string;
  description?: string;
  status: string;
  crime_type?: string;

  // Incident details
  incident_date?: Date;
  date_of_incident?: Date;         // alias kept for compatibility

  // Location — full structured address
  incident_location?: string;      // free-text (legacy)
  location?: string;               // display string
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;

  // Coordinates — populated by geocoding service
  latitude?: number;
  longitude?: number;
  geocoded_at?: Date;              // when coordinates were last resolved

  // FIR details
  fir_number?: string;
  fir_date?: Date;

  // Assigned personnel
  police_station?: string;
  station?: string;
  io_name?: string;                // denormalised for map queries
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
    title:       { type: String, required: true },
    description: String,
    status: {
      type: String,
      enum: ['open','under_investigation','chargesheet_filed','closed','archived'],
      default: 'open',
    },
    crime_type: String,

    // Dates
    incident_date:    Date,
    date_of_incident: Date,

    // Location
    incident_location:String,
    location:         String,
    address:          String,
    city:             String,
    state:            String,
    pincode:          String,

    // Coordinates
    latitude:         { type: Number, index: true },
    longitude:        { type: Number, index: true },
    geocoded_at:      Date,

    // FIR
    fir_number: String,
    fir_date:   Date,

    // Personnel
    police_station: String,
    station:        String,
    io_name:        String,
    assigned_io:    { type: Schema.Types.ObjectId, ref: 'User' },
    assigned_sho:   { type: Schema.Types.ObjectId, ref: 'User' },
    prosecutor_id:  { type: Schema.Types.ObjectId, ref: 'User' },

    priority: { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
    tags:     [String],
    ai_summary:          String,
    ai_extracted_facts:  { type: Schema.Types.Mixed },
    created_by:          { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

CaseSchema.index({ title: 'text', description: 'text', case_number: 'text', fir_number: 'text' });
CaseSchema.index({ status: 1 });
CaseSchema.index({ priority: 1 });
CaseSchema.index({ assigned_io: 1 });
CaseSchema.index({ latitude: 1, longitude: 1 });
// Compound indexes for dashboard filter patterns (non-admin user queries)
CaseSchema.index({ assigned_io: 1,   status: 1, updatedAt: -1 });
CaseSchema.index({ assigned_sho: 1,  status: 1, updatedAt: -1 });
CaseSchema.index({ prosecutor_id: 1, status: 1, updatedAt: -1 });
CaseSchema.index({ created_by: 1,    status: 1, updatedAt: -1 });
// Weekly chart aggregation — date range scans
CaseSchema.index({ createdAt: -1 });
CaseSchema.index({ status: 1, updatedAt: -1 });
CaseSchema.index({ priority: 1, status: 1 });                  // priority filter + status

export default mongoose.model<ICase>('Case', CaseSchema);
