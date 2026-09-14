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