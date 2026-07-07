import mongoose, { Document, Schema } from 'mongoose';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface IAIChatSession extends Document {
  case_id?: mongoose.Types.ObjectId;
  user_id: mongoose.Types.ObjectId;
  title?: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const AIChatSessionSchema = new Schema<IAIChatSession>(
  {
    case_id: { type: Schema.Types.ObjectId, ref: 'Case' },
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: String,
    messages: [
      {
        role: { type: String, enum: ['user', 'assistant'], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

AIChatSessionSchema.index({ user_id: 1, updatedAt: -1 });

export default mongoose.model<IAIChatSession>('AIChatSession', AIChatSessionSchema);
