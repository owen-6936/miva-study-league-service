import { Activities, type IActivity } from '../schemas/activities.js';

export const logActivity = async (type: IActivity   ['type'], message: string) => {
    try {
        // Fire and forget (no await needed in the calling controller)
        await Activities.create({ type, message });
    } catch (err) {
        console.error("Failed to log activity:", err);
    }
};