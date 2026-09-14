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
    // Inside your IUser schema:
    userMissions?: {
        missionId: Types.ObjectId;
        
        // Instead of just a number, store the actual answers they submit!
        taskSubmissions: {
            taskId: string;     // Matches the task ID from the Mission
            answer: string;     // The URL, the essay text, or the File URL they submitted
            graded: boolean;    // Has the admin reviewed it?
            pointsEarned: number; 
        }[];
        
        completed: boolean;     // Did they finish the whole mission?
        completedAt?: Date | null;      // Useful to check if they get the "First Blood" speed bonus!
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
    taskSubmissions: [{
        taskId: { type: String, required: true },
        answer: { type: String, required: true },
        graded: { type: Boolean, default: false },
        pointsEarned: { type: Number, default: 0 }
    }],
    completed: { type: Boolean, default: false },
    completedAt: { type: Date || null, default: null }
  }]
});

const User = model<IUser>('User', userSchema);

export default User;