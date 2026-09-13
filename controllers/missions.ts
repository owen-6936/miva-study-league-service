import Mission from '../schemas/missions.js';
import { sanitizeMission } from '../utils.js';
import type { Request, Response } from 'express';
import { getUserPastMissions, getUserCompletedMissions } from '../utils.js';
import type { IUser } from '../schemas/users.js';
import type User from '../schemas/users.js';

/**
 * Controller function for fetching all missions.
 */
export async function getMissions(req: Request, res: Response) {
    try {
        const missions = await Mission.find().sort({ createdAt: -1 });
        res.status(200).json({missions: sanitizeMission(missions), message: 'Missions fetched successfully'});
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch missions', error });
    }
}

/**
 * Controller function for creating a new mission.
 */
export async function createMission(req: Request, res: Response) {
    try {
        const { title, description, deadline, courseId, pointsPerTask, tasksTotal, completionBonus } = req.body;

        const missionData = { title, description, deadline, courseId, pointsPerTask, tasksTotal, completionBonus };

        // Validate that all required fields are present
        const missionDataReq = Object.fromEntries(Object.entries(missionData).filter(([_, v]) => v != null));
        if (Object.values(missionDataReq).some(value => value === undefined || value === null)) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const newMission = new Mission(missionData);

        await newMission.save();

        return res.status(201).json({ message: 'Mission created successfully', mission: sanitizeMission(newMission) });
    } catch (error) {
        console.error('Error creating mission:', error);
        return res.status(500).json({ message: 'Error creating mission', error });
    }
}

/**
 * Controller function for deleting a mission by ID.
 */
export async function deleteMission(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const deletedMission = await Mission.findByIdAndDelete(id);
        if (!deletedMission) {
            return res.status(404).json({ message: 'Mission not found' });
        }
        return res.status(200).json({ message: 'Mission deleted successfully', mission: sanitizeMission(deletedMission) });
    } catch (error) {
        return res.status(500).json({ message: 'Error deleting mission', error });
    }
}

/**
 * Controller function for fetching a user's past and completed missions.
 */
export async function pastMissions(req: Request, res: Response) {
    const user = (req as Request & { user: typeof User & IUser }).user; 
    try {
        const missions = await Mission.find();
        const pastMissions = getUserPastMissions(user, missions);
        const completedMissions = getUserCompletedMissions(user, missions);

        res.status(200).json({pastMissions: sanitizeMission(pastMissions), completedMissions: sanitizeMission(completedMissions), message: 'Past & Completed missions fetched successfully'});
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch past missions', error });
    }
}

export async function currentMissions(req: Request, res: Response) {
    try {
        const now = new Date();
        const missions = await Mission.find({ deadline: { $gte: now } }).sort({ createdAt: -1 });
        res.status(200).json({missions: sanitizeMission(missions), message: 'Current missions fetched successfully'});
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch current missions', error });
    }
}