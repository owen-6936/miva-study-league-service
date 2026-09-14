import { Router } from 'express';
import { getMissions, currentMissions, createMission, deleteMission, submitTask, getMissionById, getSubmissionsQueue, gradeTaskSubmission, updateMission } from '../controllers/missions.js';
import { adminPrivilege, authenticate, requireVerified } from '../middlewares/auth.js';

const authorized = [authenticate, requireVerified]; 

const router: Router = Router();

router.get('/current', authorized, currentMissions);
router.post('/create', authorized, adminPrivilege, createMission);
router.put('/:id', authorized, adminPrivilege, updateMission);
router.delete('/delete/:id', authorized, adminPrivilege, deleteMission);
router.post('/:missionId/tasks/:taskId/submit', authorized, submitTask);
router.get('/submissions', authorized, adminPrivilege, getSubmissionsQueue);
router.post('/submissions/:id/grade/:taskId', authorized, adminPrivilege, gradeTaskSubmission);
router.get('/:id', authorized, getMissionById);
router.get('/', authorized, getMissions);




export default router;