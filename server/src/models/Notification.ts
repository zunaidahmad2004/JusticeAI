import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  user_id: mongoose.Types.ObjectId;
  case_id?: mongoose.Types.ObjectId;
  type: string;
  title: string;
  message?: string;
  is_read: boolean;
  action_url?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    case_id: { type: Schema.Types.ObjectId, ref: 'Case' },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: String,
    is_read: { type: Boolean, default: false },
    action_url: String,
  },
  { timestamps: true }
);

NotificationSchema.index({ user_id: 1, createdAt: -1 });
NotificationSchema.index({ user_id: 1, is_read: 1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
