import { model, Schema, Types } from "mongoose";

export interface IAnnouncement {
  id: Types.ObjectId;      // (or _id from MongoDB)
  title: string;   // The header of the announcement
  content: string; // The main body text
  date?: string;   // (Optional) ISO date string
  type?: string;   // (Optional) 'info', 'alert', 'warning' etc.
}

const AnnouncementSchema = new Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    date: { type: String },
    type: { type: String }
});

const Announcements = model<IAnnouncement>('Announcements', AnnouncementSchema);

export default Announcements;