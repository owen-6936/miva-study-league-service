import { Router } from 'express';
import { getLeaderboard } from '../controllers/leaderboard.js';
import { authenticate, requireVerified } from '../middlewares/auth.js';

const router: Router = Router();

router.get('/', authenticate, requireVerified, getLeaderboard)

export default router;