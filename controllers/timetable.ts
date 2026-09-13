import type { Request, Response, NextFunction } from 'express';
import TimetableEntry from '../schemas/timetable.js';
import { sanitizeTimetableEntry } from '../utils.js';

/**
 * Controller for handling timetable-related operations.
 */
export async function getTimetableEntries(req: Request, res: Response, next: NextFunction) {
    try {
        // Fetch timetable entries from the database
        const timetableEntries = await TimetableEntry.find();
        res.status(200).json({ timetableEntries: sanitizeTimetableEntry(timetableEntries), message: 'Timetable entries fetched successfully' });
    } catch (error) {
        next(error);
    }
}

/**
 * Controller for creating a new timetable entry.
 */
export async function createTimetableEntry(req: Request, res: Response, next: NextFunction) {
    try {
        // Create a new timetable entry in the database
        const newTimetableEntry = new TimetableEntry(req.body);
        const savedTimetableEntry = await newTimetableEntry.save();
        res.status(201).json({ message: 'Timetable entry created successfully', timetableEntry: sanitizeTimetableEntry(savedTimetableEntry) });
    } catch (error) {
        next(error);
    }
}

/**
 * Controller for updating an existing timetable entry.
 */
export async function updateTimetableEntry(req: Request, res: Response, next: NextFunction) {
    try {
        // Update an existing timetable entry in the database
        const updatedTimetableEntry = await TimetableEntry.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updatedTimetableEntry) {
            return res.status(404).json({ message: 'Timetable entry not found' });
        }
        res.status(200).json({ message: 'Timetable entry updated successfully', timetableEntry: sanitizeTimetableEntry(updatedTimetableEntry) });
    } catch (error) {
        next(error);
    }
}

/**
 * Controller for deleting a timetable entry.
 */
export async function deleteTimetableEntry(req: Request, res: Response, next: NextFunction) {
    try {
        // Delete a timetable entry from the database
        const deletedTimetableEntry = await TimetableEntry.findByIdAndDelete(req.params.id);
        if (!deletedTimetableEntry) {
            return res.status(404).json({ message: 'Timetable entry not found' });
        }
        res.status(200).json({ message: 'Timetable entry deleted successfully' });
    } catch (error) {
        next(error);
    }
}