import type { Request, Response, NextFunction } from 'express';
import User from '../schemas/users.js';
import Team from '../schemas/teams.js';
import Mission from '../schemas/missions.js';
import { sanitizeMission, injectFirstBlood } from '../utils.js';

export const getHallOfFame = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 1. Top 3 Players
        const topUsers = await User.find({ role: 'student' }).sort({ points: -1 }).limit(3).populate('teamId', 'name');
        const topPlayers = topUsers.map(u => ({
            id: u._id,
            name: u.name,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            team: u.teamId ? (u.teamId as any).name : null,
            points: u.points || 0
        }));

        // 2. Top 3 Teams
        const topTeamDocs = await Team.find().sort({ points: -1 }).limit(3);
        const topTeams = topTeamDocs.map(t => ({
            name: t.name,
            points: t.points || 0
        }));

        // 3. Recent Champions
        const missions = await Mission.find().sort({ createdAt: -1 });
        const sanitizedMissions = sanitizeMission(missions) as any[];
        const missionsWithBlood = await injectFirstBlood(sanitizedMissions);
        
        const recentChampions = missionsWithBlood
            .filter((m: any) => m.firstBlood)
            .map((m: any) => ({
                missionTitle: m.title,
                playerName: m.firstBlood.name,
                team: m.firstBlood.team,
                completedAt: m.firstBlood.completedAt
            }))
            .sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
            .slice(0, 5); // 5 recent champions

        res.status(200).json({ topPlayers, topTeams, recentChampions });
    } catch (error) {
        next(error);
    }
};
