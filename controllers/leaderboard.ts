import type { Request, Response } from 'express';
import Team from '../schemas/teams.js';
import User from '../schemas/users.js';
import type { ILeaderboard } from '../schemas/leaderboard.js';
import { sanitizeTeam, sanitizeUser, type SanitizedTeam, type SanitizedUser } from '../utils.js';

export async function getLeaderboard(req: Request, res: Response) {
    try {
        // Implement the logic to fetch and return the leaderboard data
        const teams = await Team.find().sort({ points: -1 });
        const topUsers = await User.find().sort({ points: -1 }).limit(10);

        const sanitizedTeams= sanitizeTeam(teams) as SanitizedTeam[];
        const sanitizedTopUsers = sanitizeUser(topUsers) as SanitizedUser[];

        const leaderboard: ILeaderboard = {
            teams: sanitizedTeams,
            topUsers: sanitizedTopUsers
        };
        return res.status(200).json({ leaderboard, message: 'Leaderboard fetched successfully' });
    } catch (_error) {
        return res.status(500).json({ message: 'Error fetching leaderboard' });
    }
}