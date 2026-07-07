import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password_hash: string;
  full_name: string;
  badge_number?: string;
  role: string;
  department?: string;
  station?: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  two_factor_enabled: boolean;
  two_factor_secret?: string;
  last_login?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    full_name: { type: String, required: true },
    badge_number: String,
    role: {
      type: String,
      enum: [
        'admin', 'super_admin', 'police_officer', 'investigating_officer',
        'sho', 'crime_branch', 'prosecutor', 'legal_advisor',
        'law_student', 'judicial_researcher', 'trainer',
      ],
      default: 'police_officer',
    },
    department: String,
    station: String,
    phone: String,
    avatar_url: String,
    is_active: { type: Boolean, default: true },
    two_factor_enabled: { type: Boolean, default: false },
    two_factor_secret: String,
    last_login: Date,
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
