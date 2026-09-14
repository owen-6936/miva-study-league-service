import type { Request, Response } from "express";
import Announcements from "../schemas/announcements.js";
import { sanitizeAnnouncement } from "../utils.js";

/**
 * Retrieves all announcements from the database, sorted by date in descending order.
 * This is used to display the latest news and updates to all users.
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 */
export async function getAnnouncements(req: Request, res: Response){
    const announcements = await Announcements.find().sort({ date: -1 });
    res.status(200).json({ announcements: sanitizeAnnouncement(announcements), message: 'Announcements fetched successfully' });
}

/**
 * Creates a new announcement to be broadcasted to users.
 * Automatically defaults the date to now and the type to 'info' if not provided.
 * 
 * @param req - Express Request object containing title, content, date, and type
 * @param res - Express Response object
 */
import { logActivity } from '../utils/logger.js';
import type { IUser } from '../schemas/users.js';
import type User from '../schemas/users.js';

export async function createAnnouncement(req: Request, res: Response){
    const { title, content, date = new Date().toISOString(), type = 'info' } = req.body;
    // Validate the input data
    if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required' });
    }
    try {
        const newAnnouncement = await Announcements.create({ title, content, date, type });
        const admin = (req as Request & { user?: typeof User & IUser }).user;
        await logActivity('ANNOUNCEMENT_CREATED', `New announcement published: "${title}"`, { userId: admin?._id });
        res.status(201).json({ announcement: sanitizeAnnouncement(newAnnouncement), message: 'Announcement created successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create announcement', error });
    }
}

/**
 * Deletes an announcement by its ID.
 * 
 * @param req - Express Request object containing the announcement ID in params
 * @param res - Express Response object
 */
export async function deleteAnnouncement(req: Request, res: Response){
    const { id } = req.params;
    try {
        const deletedAnnouncement = await Announcements.findByIdAndDelete(id);
        if (!deletedAnnouncement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }
        res.status(200).json({ announcement: sanitizeAnnouncement(deletedAnnouncement), message: 'Announcement deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete announcement', error });
    }
}