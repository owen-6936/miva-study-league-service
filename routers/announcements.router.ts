import { Router } from 'express';
import { createAnnouncement, deleteAnnouncement, getAnnouncements } from '../controllers/announcements.js';
import { authenticate, requireVerified, adminPrivilege } from '../middlewares/auth.js';

const authorized = [authenticate, requireVerified];
const authorizedAdmin = [...authorized, adminPrivilege];

const router: Router = Router();

router.get('/', authorized, getAnnouncements);
router.post('/', authorizedAdmin, createAnnouncement);
router.delete('/:id', authorizedAdmin, deleteAnnouncement);

export default router;