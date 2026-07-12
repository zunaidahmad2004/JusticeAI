import mongoose, { Document, Schema } from 'mongoose';

export interface ITrustedDevice extends Document {
  user_id:      mongoose.Types.ObjectId;
  device_token: string;         // random 64-char token stored in browser cookie/localStorage
  device_name:  string;         // "Chrome on Windows 10"
  ip_address?:  string;
  user_agent?:  string;
  last_used:    Date;
  expires_at:   Date;
  is_revoked:   boolean;
  createdAt:    Date;
}

const TrustedDeviceSchema = new Schema<ITrustedDevice>({
  user_id:      { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  device_token: { type: String, required: true, unique: true, index: true },
  device_name:  { type: String, required: true },
  ip_address:   String,
  user_agent:   String,
  last_used:    { type: Date, default: Date.now },
  expires_at:   { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  is_revoked:   { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model<ITrustedDevice>('TrustedDevice', TrustedDeviceSchema);
