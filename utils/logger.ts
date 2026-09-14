import { Activities, type IActivity } from '../schemas/activities.js';
import type { Types } from 'mongoose';

interface ActivityMetadata {
    userId?: Types.ObjectId | string | undefined | null;
    teamId?: Types.ObjectId | string | undefined | null;
    missionId?: Types.ObjectId | string | undefined | null;
}

export const logActivity = async (type: IActivity['type'], message: string, metadata?: ActivityMetadata) => {
    try {
        const payload: Record<string, unknown> = { type, message };
        if (metadata?.userId) payload.userId = metadata.userId;
        if (metadata?.teamId) payload.teamId = metadata.teamId;
        if (metadata?.missionId) payload.missionId = metadata.missionId;
        
        // Fire and forget (no await needed in the calling controller)
        await Activities.create(payload);
    } catch (err) {
        console.error("Failed to log activity:", err);
    }
};