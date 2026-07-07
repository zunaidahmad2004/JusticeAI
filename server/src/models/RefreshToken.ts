import mongoose, { Document, Schema } from 'mongoose';

export interface IRefreshToken extends Document {
  user_id: mongoose.Types.ObjectId;
  token: string;
  expires_at: Date;
  createdAt: Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true },
    expires_at: { type: Date, required: true },
  },
  { timestamps: true }
);

// Auto-expire documents
RefreshTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);
