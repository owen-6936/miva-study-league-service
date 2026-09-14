import mongoose, { Schema, Document } from 'mongoose';

export interface IActivity extends Document {
    type: 'USER_REGISTERED' | 'TEAM_JOINED' | 'MISSION_PUBLISHED' | 'TASK_SUBMITTED' | 'ADMIN_ACTION' | 'MISSION_COMPLETED' | 'MISSION_UPDATED' | 'TASK_GRADED' | 'ANNOUNCEMENT_CREATED' | 'TIMETABLE_UPDATED';
    message: string;
    userId?: mongoose.Types.ObjectId;
    teamId?: mongoose.Types.ObjectId;
    missionId?: mongoose.Types.ObjectId;
    createdAt: Date;
}

const ActivitySchema = new Schema({
    type: { type: String, required: true },
    message: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team' },
    missionId: { type: Schema.Types.ObjectId, ref: 'Mission' },
    createdAt: { type: Date, default: Date.now }
});

export const Activities = mongoose.model<IActivity>('Activity', ActivitySchema);