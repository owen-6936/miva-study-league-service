import { Router } from 'express';
import { getActivities } from '../controllers/activities.js';
import { authenticate, requireVerified } from '../middlewares/auth.js';

const router: Router = Router();

router.get('/', authenticate, requireVerified, getActivities);

export default router;