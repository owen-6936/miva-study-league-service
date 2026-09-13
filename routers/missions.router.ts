import { Router } from 'express';
import { getMissions, currentMissions, createMission, deleteMission } from '../controllers/missions.js';
import { adminPrivilege, authenticate, requireVerified } from '../middlewares/auth.js';

const authorized = [authenticate, requireVerified]; 

const router: Router = Router();

router.get('/', authorized, getMissions);
router.get('/current', authorized, currentMissions);
router.post('/create', authorized, adminPrivilege, createMission);
router.delete('/delete/:id', authorized, adminPrivilege, deleteMission);




export default router;