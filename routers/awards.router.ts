import { Router } from 'express';
import { getHallOfFame } from '../controllers/awards.js';
import { authenticate, requireVerified } from '../middlewares/auth.js';
import { syncTeamPointsMiddleware } from '../middlewares/missions.js';

const router: Router = Router();

// Run syncTeamPointsMiddleware to ensure Top Teams are mathematically perfect!
router.get('/hall-of-fame', authenticate, requireVerified, syncTeamPointsMiddleware, getHallOfFame);

export default router;
