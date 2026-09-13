import { Schema, model } from 'mongoose';
import { Types } from 'mongoose';

export interface IUser {
    id?: Types.ObjectId;
    _id: Types.ObjectId;
    name?: string;
    email: string;
    password?: string;
    refreshToken?: string;
    __v?: number;
    matricNumber?: string;
    role: 'student' | 'admin';
    team: 'Alpha' | 'Beta' | 'Gamma' | 'Delta' | 'Omega' | 'Sigma' | 'Zeta' | null;
    teamId: string | null;
    createdAt?: Date;
    verified?: boolean;
    verificationToken?: string;
    points?: number;
    userMissions?: {
        missionId: Types.ObjectId;
        tasksCompleted: number;
    }[];
    teamTransferTokens?: number;
}

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  matricNumber: { type: String, required: true, unique: true },
  role: { type: String, enum: ['student', 'admin'], required: true, default: 'student' },
  team: { type: String, enum: ['Alpha', 'Beta', 'Gamma', 'Delta', 'Omega', 'Sigma', 'Zeta', null], default: null },
  teamId: { type: String, default: null, ref: 'Team' },
  createdAt: { type: Date, default: Date.now },
  refreshToken: { type: String, default: null },
  points: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  verificationToken: { type: String, default: null },
  userMissions: [{
  missionId: { type: Schema.Types.ObjectId, ref: 'Mission' },
  tasksCompleted: { type: Number, default: 0 },
  teamTransferTokens: { type: Number, default: 2 }
}]
});

const User = model<IUser>('User', userSchema);

export default User;