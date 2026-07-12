import mongoose, { Document, Schema } from 'mongoose';

export interface IOTPCode extends Document {
  user_id:    mongoose.Types.ObjectId;
  email:      string;
  code:       string;           // 6-digit hashed OTP
  purpose:    'login_2fa' | 'email_verify' | 'password_reset';
  expires_at: Date;
  used:       boolean;
  attempts:   number;           // track brute-force
  ip_address?:string;
  createdAt:  Date;
}

const OTPCodeSchema = new Schema<IOTPCode>({
  user_id:    { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  email:      { type: String, required: true },
  code:       { type: String, required: true },   // bcrypt hash of 6-digit code
  purpose:    { type: String, enum: ['login_2fa','email_verify','password_reset'], required: true },
  expires_at: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  used:       { type: Boolean, default: false },
  attempts:   { type: Number, default: 0 },
  ip_address: String,
}, { timestamps: true });

OTPCodeSchema.index({ user_id: 1, purpose: 1 });

export default mongoose.model<IOTPCode>('OTPCode', OTPCodeSchema);
