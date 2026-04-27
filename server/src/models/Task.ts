import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  userId: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  timeEstimate: string;
  completed: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium',
  },
  timeEstimate: { type: String, default: '' },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
}, {
  timestamps: true,
});

export const Task = mongoose.model<ITask>('Task', TaskSchema);
