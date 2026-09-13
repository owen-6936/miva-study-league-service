import { model, Schema } from 'mongoose';

export interface IMission {
    _id?: Schema.Types.ObjectId;
    id?: Schema.Types.ObjectId;
    title: string;
    courseId: string;
    description: string;
    pointsPerTask: number;
    tasksTotal: number;
    completionBonus: number;
    createdAt?: Date;
    deadline: Date;
}

const MissionSchema = new Schema({
    _id: { type: Schema.Types.ObjectId, auto: true },
    title: { type: String, required: true },
    courseId: { type: String, required: true },
    description: { type: String, required: true },
    pointsPerTask: { type: Number, required: true },
    tasksTotal: { type: Number, required: true, default: 1 },
    completionBonus: { type: Number, required: true, default: 0 },
    createdAt: { type: Date, default: Date.now },
    deadline: { type: Date, required: true }
});

const Mission = model<IMission>('Mission', MissionSchema);

export default Mission;