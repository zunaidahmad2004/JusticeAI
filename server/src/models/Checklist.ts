import mongoose, { Document, Schema } from 'mongoose';

export interface ChecklistItem {
  id: string;
  task: string;
  priority: string;
  category: string;
  completed: boolean;
  notes?: string;
  updated_at?: Date;
}

export interface IChecklist extends Document {
  case_id: mongoose.Types.ObjectId;
  crime_type?: string;
  title: string;
  items: ChecklistItem[];
  progress: number;
  created_by?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ChecklistSchema = new Schema<IChecklist>(
  {
    case_id: { type: Schema.Types.ObjectId, ref: 'Case', required: true },
    crime_type: String,
    title: { type: String, required: true },
    items: [
      {
        id: String,
        task: String,
        priority: String,
        category: String,
        completed: { type: Boolean, default: false },
        notes: String,
        updated_at: Date,
      },
    ],
    progress: { type: Number, default: 0, min: 0, max: 100 },
    created_by: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

ChecklistSchema.index({ case_id: 1 });

export default mongoose.model<IChecklist>('Checklist', ChecklistSchema);
