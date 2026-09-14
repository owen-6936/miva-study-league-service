import { Router } from 'express';
import { teams, seedTeams, joinTeam, getTeam, editTeam, createTeam, deleteTeam } from '../controllers/teams.js';
import { authenticate, requireVerified, adminPrivilege } from '../middlewares/auth.js';
import { syncTeamPointsMiddleware } from '../middlewares/missions.js';
const authorize = [authenticate, requireVerified];
const adminAuthorize = [...authorize, adminPrivilege];

const router: Router = Router();

router.get('/', syncTeamPointsMiddleware, authorize, teams)
router.get('/:teamId', authorize, getTeam);
router.post('/seed', adminAuthorize, seedTeams);
router.post('/:teamId/join', authorize, joinTeam);
router.post('/create', adminAuthorize, createTeam);
router.put('/update/:teamId', adminAuthorize, editTeam);
router.delete('/drop/:teamId', adminAuthorize, deleteTeam);

export default router;