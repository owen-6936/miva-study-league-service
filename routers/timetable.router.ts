import { Router } from 'express';
import { getTimetableEntries, createTimetableEntry, updateTimetableEntry, deleteTimetableEntry } from '../controllers/timetable.js';
import { authenticate, requireVerified, adminPrivilege } from '../middlewares/auth.js';
const authorized = [authenticate, requireVerified];
const authorizedAdmin = [...authorized, adminPrivilege];
const router: Router = Router();

router.get('/', authorized, getTimetableEntries);
router.post('/', authorizedAdmin, createTimetableEntry);
router.put('/:id', authorizedAdmin, updateTimetableEntry);
router.delete('/:id', authorizedAdmin, deleteTimetableEntry);


export default router;