import { Schema, model } from 'mongoose';

// 1. Define the interface for a SINGLE activity
export interface IActivity {
    id: string;
    text: string;
    type: number;
    createdAt?: Date;
}

// 2. Define the helper type for an array of activities
export type IActivities = IActivity[];

// 3. Define the Schema as a SINGLE object (remove the square brackets)
const ActivitySchema = new Schema<IActivity>({
    id: { type: String, required: true },
    text: { type: String, required: true },
    type: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

// 4. Create the Model using the single schema
const Activities = model<IActivity>('Activities', ActivitySchema);

export default Activities;
