import { Router } from 'express';
import {users, me, stats, transferTeam, analytics} from '../controllers/users.js';
import { pastMissions, myCurrentMissions } from '../controllers/missions.js';
import { authenticate, requireVerified, adminPrivilege } from '../middlewares/auth.js';

const router: Router = Router();

/* GET users listing. */
router.get('/', authenticate, requireVerified, adminPrivilege, users);
router.get('/me', authenticate, me);
router.get('/me/stats', authenticate, requireVerified, stats);
router.get('/me/analytics', authenticate, requireVerified, analytics);
router.get('/me/missions/past', authenticate, requireVerified, pastMissions);
router.get('/me/missions/current', authenticate, requireVerified, myCurrentMissions);
router.post('/transfer-team', authenticate, requireVerified, transferTeam);

export default router;