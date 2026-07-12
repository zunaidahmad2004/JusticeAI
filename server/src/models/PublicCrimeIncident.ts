import mongoose, { Document, Schema } from 'mongoose';

export interface IPublicCrimeIncident extends Document {
  // Source metadata
  source:       'gdelt' | 'gnews' | 'newsapi' | 'rss';
  source_url:   string;
  headline:     string;
  published_at: Date;
  fetched_at:   Date;

  // AI-extracted fields
  crime_type:   string;   // Murder, Theft, Assault, Cyber Crime, Fraud, Kidnapping, Drugs, Women Safety, Other
  city:         string;
  state:        string;
  address:      string;
  summary:      string;
  severity:     'high' | 'medium' | 'low';

  // Geocoding
  latitude?:    number;
  longitude?:   number;
  geocoded:     boolean;

  // Dedup hash
  url_hash:     string;

  createdAt: Date;
}

const PublicCrimeIncidentSchema = new Schema<IPublicCrimeIncident>({
  source:       { type: String, enum: ['gdelt','gnews','newsapi','rss'], required: true },
  source_url:   { type: String, required: true },
  headline:     { type: String, required: true },
  published_at: { type: Date,   required: true, index: true },
  fetched_at:   { type: Date,   default: Date.now },

  crime_type:   { type: String, default: 'Other', index: true },
  city:         { type: String, default: '' },
  state:        { type: String, default: '' },
  address:      { type: String, default: '' },
  summary:      { type: String, default: '' },
  severity:     { type: String, enum: ['high','medium','low'], default: 'medium' },

  latitude:     { type: Number },
  longitude:    { type: Number },
  geocoded:     { type: Boolean, default: false },

  url_hash:     { type: String, required: true, unique: true, index: true },
}, { timestamps: true });

// TTL — auto-delete incidents older than 45 days
PublicCrimeIncidentSchema.index({ published_at: 1 }, { expireAfterSeconds: 45 * 24 * 3600 });
PublicCrimeIncidentSchema.index({ latitude: 1, longitude: 1 });
PublicCrimeIncidentSchema.index({ crime_type: 1, published_at: -1 });

export default mongoose.model<IPublicCrimeIncident>('PublicCrimeIncident', PublicCrimeIncidentSchema);
