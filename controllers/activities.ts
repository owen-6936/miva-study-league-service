import type { Request, Response, NextFunction } from 'express';
import { Activities } from '../schemas/activities.js';

export const getActivities = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Query the same collection, but EXCLUDE admin-only logs!
        const rawActivities = await Activities.find({ type: { $ne: 'ADMIN_ACTION' } })
            .sort({ createdAt: -1 })
            .limit(15);

        // Map the backend data to what the Student Dashboard expects
        const activities = rawActivities.map(act => {
            // Determine the frontend icon based on the backend event type
            let frontendType = 'other'; // Defaults to a blue Star icon
            if (act.type === 'TASK_SUBMITTED' || act.type === 'MISSION_PUBLISHED') {
                frontendType = 'mission'; // Yellow Zap icon
            } else if (act.type === 'TEAM_JOINED' || act.type === 'USER_REGISTERED') {
                frontendType = 'join'; // Green Shield icon
            }

            return {
                id: act._id,
                type: frontendType,
                message: act.message, // Your frontend now supports this natively!
                createdAt: act.createdAt
            };
        });

        res.status(200).json({ activities });
    } catch (error) {
        console.error("Failed to fetch student activities:", error);
        next(error);
    }
};