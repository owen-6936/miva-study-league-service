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

import { logActivity } from '../utils/logger.js';

/**
 * Controller to grant a team transfer token to a specific student
 */
export const grantTransferToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        user.teamTransferTokens = (user.teamTransferTokens || 0) + 1;
        await user.save();
        
        
        await logActivity('ADMIN_ACTION', `Granted a team transfer token to ${user.name}`, { 
            userId: user._id,
            teamId: user.teamId || undefined 
        });
        
        res.status(200).json({ message: 'Transfer token granted successfully', user });
    } catch (error) {
        console.error("Failed to grant transfer token:", error);
        next(error);
    }
};
export const getUserAdminProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        if (user.teamId && user.teamId.toString() !== "") {
            try {
                await user.populate('teamId', 'name');
            } catch (_e) {
                // Ignore cast errors if teamId is invalid
                console.warn('Failed to populate teamId:', user.teamId);
            }
        }
        
        res.status(200).json({ user });
    } catch (error) {
        next(error);
    }
};

export const getUserAdminMissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const allMissions = await Mission.find();
        
        const missions = (user.userMissions || []).map(um => {
            const missionDoc = allMissions.find(m => m._id?.toString() === um.missionId.toString());
            if (!missionDoc) return null;
            
            return {
                missionId: um.missionId,
                missionTitle: missionDoc.title,
                completed: um.completed,
                tasks: missionDoc.tasks.map(t => ({
                    id: t.id,
                    title: t.title,
                    points: t.points
                })),
                taskSubmissions: um.taskSubmissions
            };
        }).filter(Boolean);

        res.status(200).json({ missions });
    } catch (error) {
        next(error);
    }
};

export const updateUserPoints = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;
        const { totalPoints } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        user.points = totalPoints;
        await user.save();
        
        await logActivity('ADMIN_ACTION', `Admin manually updated points for ${user.name} to ${totalPoints}`, { userId: user._id, teamId: user.teamId || undefined });

        res.status(200).json({ message: 'Points updated successfully', totalPoints: user.points });
    } catch (error) {
        next(error);
    }
};

export const overrideTaskPoints = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, missionId, taskId } = req.params;
        const { pointsEarned } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const userMission = user.userMissions?.find(um => um.missionId.toString() === missionId);
        if (!userMission) return res.status(404).json({ message: 'Mission progress not found' });

        const task = userMission.taskSubmissions.find(t => t.taskId === taskId);
        if (!task) return res.status(404).json({ message: 'Task submission not found' });

        const oldPoints = task.pointsEarned || 0;
        const pointDifference = pointsEarned - oldPoints;

        task.pointsEarned = pointsEarned;
        
        // Mathematically sync global points!
        user.points = (user.points || 0) + pointDifference;

        user.markModified('userMissions');
        await user.save();
        
        await logActivity('ADMIN_ACTION', `Admin manually updated task points for ${user.name} to ${pointsEarned}`, { userId: user._id, teamId: user.teamId || undefined });

        res.status(200).json({ message: 'Task points overridden successfully', pointsEarned, newTotalPoints: user.points });
    } catch (error) {
        next(error);
    }
};

export const updateTransferTokens = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;
        const { teamTransferTokens } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        user.teamTransferTokens = teamTransferTokens;
        await user.save();
        
        await logActivity('ADMIN_ACTION', `Admin updated transfer tokens for ${user.name} to ${teamTransferTokens}`, { userId: user._id, teamId: user.teamId || undefined });

        res.status(200).json({ message: 'Tokens updated successfully', teamTransferTokens: user.teamTransferTokens });
    } catch (error) {
        next(error);
    }
};

export const bulkUpdateTokens = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { teamTransferTokens } = req.body;

        await User.updateMany({ role: 'student' }, { $set: { teamTransferTokens } });
        
        await logActivity('ADMIN_ACTION', `Admin performed a bulk token reset. All students now have ${teamTransferTokens} tokens.`, {});

        res.status(200).json({ message: 'Bulk token update successful' });
    } catch (error) {
        next(error);
    }
};

export const getMissionParticipants = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { missionId } = req.params;

        const mission = await Mission.findById(missionId);
        if (!mission) return res.status(404).json({ message: 'Mission not found' });

        const users = await User.find({ 'userMissions.missionId': missionId as string });
        
        for (const user of users) {
            if (user.teamId && user.teamId.toString() !== "") {
                try {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    await (user as any).populate('teamId', 'name');
                } catch (_e) {
                    console.warn('Failed to populate teamId for user:', user._id);
                }
            }
        }

        const participants = users.map(user => {
            const um = user.userMissions?.find(m => m.missionId.toString() === missionId);
            if (!um) return null;

            // Simply sum the actual points they earned from grading their tasks!
            const score = um.taskSubmissions.reduce((acc, task) => acc + (task.pointsEarned || 0), 0);

            return {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    team: user.teamId ? (user.teamId as any).name : null,
                    globalPoints: user.points || 0
                },
                completed: um.completed,
                score,
                taskSubmissionsCount: um.taskSubmissions.length,
                completedAt: um.completedAt
            };
        }).filter((p): p is NonNullable<typeof p> => p !== null);

        // Sort: First to complete at the top. Those who haven't completed go to the bottom.
        participants.sort((a, b) => {
            if (a.completed && b.completed) {
                // Both completed: sort by earliest completion time
                const timeA = a.completedAt ? new Date(a.completedAt).getTime() : Infinity;
                const timeB = b.completedAt ? new Date(b.completedAt).getTime() : Infinity;
                return timeA - timeB;
            } else if (a.completed) {
                return -1; // a comes first
            } else if (b.completed) {
                return 1; // b comes first
            } else {
                // Neither completed: sort by who has submitted the most tasks, then by name
                if (b.taskSubmissionsCount !== a.taskSubmissionsCount) {
                    return b.taskSubmissionsCount - a.taskSubmissionsCount;
                }
                return a.user.name.localeCompare(b.user.name);
            }
        });

        res.status(200).json({
            missionName: mission.title,
            participants
        });
    } catch (error) {
        next(error);
    }
};
