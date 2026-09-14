import type { Request, Response, NextFunction } from 'express';
import User from '../schemas/users.js';
import Team from '../schemas/teams.js';

export const syncTeamPointsMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 1. Extremely fast MongoDB aggregation: group users by Team and sum their points
        const teamScores = await User.aggregate([
            { $match: { teamId: { $nin: [null, ""] } } },
            { $group: { _id: "$teamId", totalPoints: { $sum: "$points" } } }
        ]);

        // 2. Prepare bulk updates for the Teams collection
        const bulkOps = teamScores.map(team => ({
            updateOne: {
                filter: { _id: team._id },
                update: { $set: { points: team.totalPoints } } // Auto-corrects the score
            }
        }));

        // 3. Execute all updates at once
        if (bulkOps.length > 0) {
            await Team.bulkWrite(bulkOps);
        }

        console.log("Team points synchronized successfully.");
        console.log(`Updated ${bulkOps.length} teams.`);

        next(); // Move on to your actual GET /teams route controller
    } catch (error) {
        console.error("Silent team sync failure:", error);
        next(); // Never crash the request, just continue even if sync fails
    }
};