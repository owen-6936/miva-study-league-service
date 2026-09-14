import mongoose, { Schema, Document } from 'mongoose';

export interface IActivity extends Document {
    type: 'USER_REGISTERED' | 'TEAM_JOINED' | 'MISSION_PUBLISHED' | 'TASK_SUBMITTED' | 'ADMIN_ACTION' | 'MISSION_COMPLETED' | 'MISSION_UPDATED';
    message: string;
    createdAt: Date;
}

const ActivitySchema = new Schema({
    type: { type: String, required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

export const Activities = mongoose.model<IActivity>('Activity', ActivitySchema);