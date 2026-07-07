import mongoose, { Document, Schema } from 'mongoose';

export interface ITimelineEvent extends Document {
  case_id: mongoose.Types.ObjectId;
  event_type: string;
  title: string;
  description?: string;
  event_date: Date;
  performed_by?: mongoose.Types.ObjectId;
  related_entity_type?: string;
  related_entity_id?: mongoose.Types.ObjectId;
  attachments: Record<string, unknown>[];
  is_milestone: boolean;
  createdAt: Date;
}

const TimelineEventSchema = new Schema<ITimelineEvent>(
  {
    case_id: { type: Schema.Types.ObjectId, ref: 'Case', required: true },
    event_type: { type: String, required: true },
    title: { type: String, required: true },
    description: String,
    event_date: { type: Date, required: true, default: Date.now },
    performed_by: { type: Schema.Types.ObjectId, ref: 'User' },
    related_entity_type: String,
    related_entity_id: { type: Schema.Types.ObjectId },
    attachments: [{ type: Schema.Types.Mixed }],
    is_milestone: { type: Boolean, default: false },
  },
  { timestamps: true }
);

TimelineEventSchema.index({ case_id: 1, event_date: 1 });

export default mongoose.model<ITimelineEvent>('TimelineEvent', TimelineEventSchema);
