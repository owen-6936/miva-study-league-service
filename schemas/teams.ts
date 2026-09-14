import mongoose, { Schema, Document } from 'mongoose';

export interface ITeam extends Omit<Document, 'id'> {
    id: 'alpha' | 'beta' | 'gamma' | 'delta' | 'omega' | 'sigma' | 'zeta' | string;
  name: string;
  captainId: string; // User ID
  color: string;
  emoji: string;
  points: number;
  members: string[]; // Array of user IDs
  maxMembers: number;
}

const TeamSchema: Schema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    captainId: { type: String, default: '', ref: 'User' },
    color: { type: String, required: true },
    emoji: { type: String, required: true },
    points: { type: Number, required: true },
    // Array of user IDs representing team members
    // Validate that the length of the members array does not exceed maxMembers
    members: [{ type: Schema.Types.ObjectId, ref: 'User', required: true, validate: {
        validator: function(): boolean {
            return this.members.length <= this.maxMembers;
        },
        message: 'Number of members exceeds maxMembers'
    }}],
    maxMembers: { type: Number, required: true },
  },
  { timestamps: true }
);

const Team = mongoose.model<ITeam>('Team', TeamSchema);
export default Team;