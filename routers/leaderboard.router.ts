import { Router } from 'express';
import { getLeaderboard } from '../controllers/leaderboard.js';
import { authenticate, requireVerified } from '../middlewares/auth.js';
import { syncTeamPointsMiddleware } from '../middlewares/missions.js';

const router: Router = Router();

router.get('/', authenticate, requireVerified, syncTeamPointsMiddleware, getLeaderboard)

export default router;