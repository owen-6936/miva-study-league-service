import { Router } from 'express';
import { getAdminStats, getAdminActivities, grantTransferToken } from '../controllers/admin.js';
import { adminPrivilege, authenticate, requireVerified } from '../middlewares/auth.js';
const adminAuthorized  = [authenticate, requireVerified, adminPrivilege]

const router: Router = Router();
router.get('/stats', adminAuthorized, getAdminStats);
router.get('/activities', adminAuthorized, getAdminActivities);
router.post('/users/:id/grant-token', adminAuthorized, grantTransferToken);

export default router;
