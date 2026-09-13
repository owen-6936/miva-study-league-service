import Season from "../schemas/seasons.js";
import type { Request, Response, NextFunction } from "express";
import { sanitizeSeason } from "../utils.js";

/**
 * Controller functions for managing seasons.
 */
export async function getAllSeasons(req: Request, res: Response, next: NextFunction) {
  try {
    const seasons = await Season.find();
    res.json({ seasons: seasons.map(season => sanitizeSeason(season)), message: "Seasons retrieved successfully" });
  } catch (error) {
    next(error);
  }
}

/**
 * Creates a new season.
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export async function createSeason(req: Request, res: Response, next: NextFunction) {
  try {
    const { seasonNumber, academicStartDate, totalWeeks, isActive = false } = req.body;
    if (!seasonNumber || !academicStartDate || !totalWeeks) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const newSeason = new Season({ seasonNumber, academicStartDate, totalWeeks, isActive });
    await newSeason.save();
    res.status(201).json({ season: sanitizeSeason(newSeason) });
  } catch (error) {
    next(error);
  }
}

/**
 * Updates an existing season by its ID.
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export async function updateSeason(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { seasonNumber, academicStartDate, totalWeeks, isActive = false } = req.body;
    if (!seasonNumber || !academicStartDate || !totalWeeks ) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const updatedSeason = await Season.findByIdAndUpdate(
      id,
      { seasonNumber, academicStartDate, totalWeeks, isActive },
      { new: true }
    );
    if (!updatedSeason) {
      return res.status(404).json({ message: "Season not found" });
    }
    res.json({ season: sanitizeSeason(updatedSeason) });
  } catch (error) {
    next(error);
  }
}

/**
 * Deletes a season by its ID.
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export async function deleteSeason(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const deletedSeason = await Season.findByIdAndDelete(id);
    if (!deletedSeason) {
      return res.status(404).json({ message: "Season not found" });
    }
    res.json({ message: "Season deleted successfully" });
  } catch (error) {
    next(error);
  }
}