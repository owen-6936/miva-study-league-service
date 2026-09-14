import { Router } from 'express';
import { getMissions, currentMissions, createMission, deleteMission, submitTask, getMissionById } from '../controllers/missions.js';
import { adminPrivilege, authenticate, requireVerified } from '../middlewares/auth.js';

const authorized = [authenticate, requireVerified]; 

const router: Router = Router();

router.get('/current', authorized, currentMissions);
router.post('/create', authorized, adminPrivilege, createMission);
router.delete('/delete/:id', authorized, adminPrivilege, deleteMission);
router.post('/:missionId/tasks/:taskId/submit', authorized, submitTask);
router.get('/:id', authorized, getMissionById);
router.get('/', authorized, getMissions);




export default router;