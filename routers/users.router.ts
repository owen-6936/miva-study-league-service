import { Router } from 'express';
import {users, me, stats} from '../controllers/users.js';
import { pastMissions } from '../controllers/missions.js';
import { authenticate, requireVerified, adminPrivilege } from '../middlewares/auth.js';

const router: Router = Router();

/* GET users listing. */
router.get('/', authenticate, requireVerified, adminPrivilege, users);
router.get('/me', authenticate, me);
router.get('/me/stats', authenticate, requireVerified, stats);
router.get('/me/missions', authenticate, requireVerified, pastMissions);


export default router;