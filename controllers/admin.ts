import type { Request, Response, NextFunction } from 'express';
import User from '../schemas/users.js';
import Team from '../schemas/teams.js';
import Mission from '../schemas/missions.js';
import { Activities } from '../schemas/activities.js';

/**
 * Controller to fetch system-wide statistics and week-over-week trends
 * for the Admin Dashboard overview.
 */
export const getAdminStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        // 1. Raw Core Counts
        const totalUsers = await User.countDocuments({ role: 'student' });
        const activeTeams = await Team.countDocuments();
        
        // Count missions that haven't expired yet
        const activeMissions = await Mission.countDocuments({ deadline: { $gt: now } });

        // Count total task submissions across all users
        const submissionResult = await User.aggregate([
            { $match: { role: 'student' } },
            { $project: { numSubmissions: { $size: { $ifNull: ["$userMissions", []] } } } },
            { $group: { _id: null, total: { $sum: "$numSubmissions" } } }
        ]);
        const totalSubmissions = submissionResult.length > 0 ? submissionResult[0].total : 0;

        // 2. Trend Calculations (Week over Week)
        // User Growth Trend
        const usersLast7Days = await User.countDocuments({ 
            role: 'student', 
            createdAt: { $gte: sevenDaysAgo } 
        });
        const usersPrev7Days = await User.countDocuments({ 
            role: 'student', 
            createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } 
        });

        let userTrend = 0;
        if (usersPrev7Days === 0) {
            userTrend = usersLast7Days > 0 ? 100 : 0;
        } else {
            userTrend = Math.round(((usersLast7Days - usersPrev7Days) / usersPrev7Days) * 100);
        }

        // Submission Growth Trend
        // (Assumes `userMissions` pushes a `completedAt` or `createdAt` timestamp when a student submits)
        const recentSubsResult = await User.aggregate([
            { $match: { role: 'student' } },
            { $unwind: "$userMissions" },
            { $match: { "userMissions.completedAt": { $gte: sevenDaysAgo } } },
            { $count: "count" }
        ]);
        const subsLast7Days = recentSubsResult.length > 0 ? recentSubsResult[0].count : 0;

        const prevSubsResult = await User.aggregate([
            { $match: { role: 'student' } },
            { $unwind: "$userMissions" },
            { $match: { "userMissions.completedAt": { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } } },
            { $count: "count" }
        ]);
        const subsPrev7Days = prevSubsResult.length > 0 ? prevSubsResult[0].count : 0;

        let submissionTrend = 0;
        if (subsPrev7Days === 0) {
            submissionTrend = subsLast7Days > 0 ? 100 : 0;
        } else {
            submissionTrend = Math.round(((subsLast7Days - subsPrev7Days) / subsPrev7Days) * 100);
        }

        // 3. Return JSON
        res.status(200).json({
            totalUsers,
            activeTeams,
            activeMissions,
            totalSubmissions,
            userTrend,
            submissionTrend
        });

    } catch (error) {
        console.error("Failed to aggregate admin stats:", error);
        next(error);
    }
};

/**
 * Controller function for fetching recent admin activities.
 */
export const getAdminActivities = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Fetch the 15 most recent activities
        const recentActivities = await Activities.find()
            .sort({ createdAt: -1 })
            .limit(15);
        // Map them to the format the frontend AdminDashboard expects
        const activities = recentActivities.map(act => {
            const diffSeconds = Math.floor((new Date().getTime() - new Date(act.createdAt).getTime()) / 1000);
            
            let timeStr = 'Just now';
            if (diffSeconds > 86400) timeStr = `${Math.floor(diffSeconds / 86400)}d ago`;
            else if (diffSeconds > 3600) timeStr = `${Math.floor(diffSeconds / 3600)}h ago`;
            else if (diffSeconds > 60) timeStr = `${Math.floor(diffSeconds / 60)}m ago`;
            return {
                text: act.message,
                time: timeStr
            };
        });
        res.status(200).json({ activities });
    } catch (error) {
        console.error("Failed to fetch admin activities:", error);
        next(error);
    }
};