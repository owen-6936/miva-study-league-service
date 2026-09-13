import Activities from '../schemas/activities.js';
import type { Request, Response } from 'express';

export async function getActivities(req: Request, res: Response) {
    try {
        const activities = await Activities.find();
        res.status(200).json({activities, messages:'Activities fetched successfully'});
    } catch (error) {
        res.status(500).json({ message: 'Error fetching activities', error });
    }
}