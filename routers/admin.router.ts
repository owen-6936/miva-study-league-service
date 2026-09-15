import { Router } from 'express';
import { getAdminStats, getAdminActivities, grantTransferToken, getUserAdminProfile, getUserAdminMissions, updateUserPoints, overrideTaskPoints, updateTransferTokens, bulkUpdateTokens, getMissionParticipants } from '../controllers/admin.js';
import { adminPrivilege, authenticate, requireVerified } from '../middlewares/auth.js';
const adminAuthorized  = [authenticate, requireVerified, adminPrivilege]

const router: Router = Router();
router.get('/stats', adminAuthorized, getAdminStats);
router.get('/activities', adminAuthorized, getAdminActivities);
router.post('/users/:id/grant-token', adminAuthorized, grantTransferToken);
router.get('/users/:userId', adminAuthorized, getUserAdminProfile);
router.get('/users/:userId/missions', adminAuthorized, getUserAdminMissions);
router.patch('/users/:userId/points', adminAuthorized, updateUserPoints);
router.patch('/users/:userId/missions/:missionId/tasks/:taskId', adminAuthorized, overrideTaskPoints);
router.patch('/users/:userId/tokens', adminAuthorized, updateTransferTokens);
router.post('/users/bulk-tokens', adminAuthorized, bulkUpdateTokens);
router.get('/missions/:missionId/participants', adminAuthorized, getMissionParticipants);

export default router;
