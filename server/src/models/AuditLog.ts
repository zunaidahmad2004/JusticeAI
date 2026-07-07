import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  user_id?: mongoose.Types.ObjectId;
  action: string;
  resource_type?: string;
  resource_id?: mongoose.Types.ObjectId;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    resource_type: String,
    resource_id: { type: Schema.Types.ObjectId },
    old_values: { type: Schema.Types.Mixed },
    new_values: { type: Schema.Types.Mixed },
    ip_address: String,
    user_agent: String,
  },
  { timestamps: true }
);

AuditLogSchema.index({ user_id: 1, createdAt: -1 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
