import type { IUser } from "../schemas/users.js";
import {type Request, type Response, type NextFunction} from 'express';
import User from '../schemas/users.js';
import { sanitizeUser } from '../utils.js';
import Team from '../schemas/teams.js';

export const users = async (req: Request, res: Response) => {
    // Fetch all users from the database
    const allUsers = await User.find();
    const sanitizedUsers = sanitizeUser(allUsers);

    res.status(200).json({ users: sanitizedUsers, message: 'Users retrieved successfully' });
};

/**
 * Get the currently authenticated user's information
 */
export async function me(req: Request, res: Response, next: NextFunction) {
    try {
        if (!(req as Request & { user?: unknown }).user) {
            return res.status(401).json({ message: 'Unauthorized access' });
        }

        const user = (req as Request & { user?: InstanceType<typeof User> }).user;

        // Sanitize the user object to remove sensitive fields before sending it in the response
        const userResponse = sanitizeUser(user as InstanceType<typeof User>);
        return res.status(200).json({ user: userResponse, message: 'User information retrieved successfully' });
    } catch (error) {
        next(error);
    }
}

/**
 * Get the statistics for the currently authenticated user
 */
export async function stats(req: Request, res: Response, next: NextFunction) {
    try {
        if (!(req as Request & { user?: InstanceType<typeof User> }).user) {
            return res.status(401).json({ message: 'Unauthorized access' });
        }

        const user = (req as Request & { user: InstanceType<typeof User> }).user;

        // Check if the user is part of a team before fetching team details
        if (!user.teamId) return res.status(400).json({ message: 'User is not part of any team' });

        // Fetch the user's team details from the database
        const teams = await Team.find().sort({ score: -1 });

        // Find the user's team rank based on the sorted list of teams
        const userTeamRank = teams.findIndex(team => team.id === user.teamId?.toString()) + 1;

        // Example statistics calculation (replace with actual logic)
        const stats = {
            teamRank: userTeamRank,
            personalPoints: user.points || 0,
            weekProgress: 0
        };

        return res.status(200).json({ stats, message: 'User statistics retrieved successfully' });
    } catch (error) {
        next(error);
    }
}

import { logActivity } from '../utils/logger.js';

/**
 * Controller for handling team transfers using a transfer token
 */
export async function transferTeam(req: Request, res: Response, next: NextFunction) {
    try {
        const { newTeamId } = req.body;
        
        const user = (req as Request & { user: InstanceType<typeof User> }).user;
        
        if (!newTeamId) {
            return res.status(400).json({ message: 'newTeamId is required' });
        }
        
        if (!user.teamTransferTokens || user.teamTransferTokens <= 0) {
            return res.status(403).json({ message: 'No transfer tokens available' });
        }
        
        const newTeam = await Team.findById(newTeamId);
        if (!newTeam) {
            return res.status(404).json({ message: 'New team not found' });
        }
        
        if (newTeam.members.length >= newTeam.maxMembers) {
            return res.status(400).json({ message: 'The selected team is full' });
        }
        
        let oldTeamName = 'None';
        if (user.teamId) {
            const oldTeam = await Team.findById(user.teamId);
            if (oldTeam) {
                oldTeamName = oldTeam.name;
                oldTeam.members = oldTeam.members.filter(id => id.toString() !== user._id.toString());
                
                // Remove captain status if they were captain
                if (oldTeam.captainId === user._id.toString()) {
                    oldTeam.captainId = '';
                }
                await oldTeam.save();
            }
        }
        
        if (!newTeam.members.includes(user._id.toString())) {
            newTeam.members.push(user._id.toString());
        }
        await newTeam.save();
        
        user.teamId = newTeam._id;
        user.team = newTeam.name as IUser["team"]; 
        user.teamTransferTokens -= 1;
        await user.save();
        
        await logActivity('TEAM_JOINED', `${user.name} used a transfer token to move from ${oldTeamName} to ${newTeam.name}`, { userId: user._id, teamId: newTeam._id });
        
        return res.status(200).json({ user: sanitizeUser(user), message: 'Successfully transferred to new team!' });
    } catch (error) {
        next(error);
    }
}
export const analytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as Request & { user: typeof User & IUser }).user;
        const allMissions = await import('../schemas/missions.js').then(m => m.default.find());
        
        // Sort user missions chronologically by when they submitted/completed
        const sortedMissions = [...(user.userMissions || [])].sort((a, b) => {
            const timeA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
            const timeB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
            return timeA - timeB;
        });

        const timeline = [];
        let cumulativeXp = 0;

        for (const um of sortedMissions) {
            const missionDoc = allMissions.find(m => m._id?.toString() === um.missionId.toString());
            if (!missionDoc) continue;

            const tasksXp = um.taskSubmissions.reduce((acc, t) => acc + (t.pointsEarned || 0), 0);
            const completionXp = um.completed ? missionDoc.basePoints : 0; // Using basePoints here as a safe default for XP earned at completion

            cumulativeXp += tasksXp + completionXp;

            // Optional: if the user got First Blood, we could try to calculate it, but the base XP is good enough for a visual trajectory!
            timeline.push({
                date: missionDoc.title,
                xp: cumulativeXp
            });
        }

        // Always push a "0" starting point if empty
        if (timeline.length === 0) {
            timeline.push({ date: "Start", xp: 0 });
        }

        res.status(200).json({ timeline });
    } catch (error) {
        next(error);
    }
};
