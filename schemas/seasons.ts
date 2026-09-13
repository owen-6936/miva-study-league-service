import { Schema, model, Types } from "mongoose";

export interface ISeason {
  id?: Types.ObjectId;
  seasonNumber: number;
  academicStartDate: Date;
  totalWeeks: number;
  isActive: boolean;
}

const seasonSchema = new Schema({
  seasonNumber: { type: Number, default: 1 },
  academicStartDate: { type: Date, required: true },
  totalWeeks: { type: Number, default: 12 },
  isActive: { type: Boolean, default: true }
});

const Season = model<ISeason>('Season', seasonSchema);

export default Season;