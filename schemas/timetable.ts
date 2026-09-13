import mongoose from 'mongoose';

export interface ITimetableEntry {
    id?: mongoose.Types.ObjectId;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  date?: string; // Optional specific date (YYYY-MM-DD)
  startTime: string; // "09:00"
  endTime: string;   // "11:00"
  courseCode: string;
  title: string;
  type: 'Lecture' | 'Tutorial' | 'Lab' | 'Study Session' | 'Other';
  instructor?: string;
  location?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const timetableSchema = new mongoose.Schema({
  day: { 
    type: String, 
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  date: { type: String }, // Optional specific date (YYYY-MM-DD)
  startTime: { type: String, required: true }, // "09:00"
  endTime: { type: String, required: true },   // "11:00"
  courseCode: { type: String, required: true },
  title: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['Lecture', 'Tutorial', 'Lab', 'Study Session', 'Other']
  },
  instructor: { type: String, default: "" },
  location: { type: String, default: "" }
}, { timestamps: true });

const TimetableEntry = mongoose.model<ITimetableEntry>('TimetableEntry', timetableSchema);
export default TimetableEntry;